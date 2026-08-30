import { ref } from 'vue'

export interface SerialOptions {
  baudRate: number
  dataBits: 7 | 8
  stopBits: 1 | 2
  parity: 'none' | 'even' | 'odd'
  flowControl: 'none' | 'hardware'
  bufferSize: number
}

export interface PortInfo {
  usbVendorId?: number
  usbProductId?: number
  serialNumber?: string
  path?: string
}

interface RequestPortOptions {
  filters?: Array<{ usbVendorId?: number }>
}

declare global {
  interface Navigator {
    serial?: {
      requestPort(options?: RequestPortOptions): Promise<SerialPort>
    }
  }

  interface SerialOptions {
    baudRate: number
    dataBits: 7 | 8
    stopBits: 1 | 2
    parity: 'none' | 'even' | 'odd'
    flowControl: 'none' | 'hardware'
    bufferSize: number
  }

  interface SerialPort extends EventTarget {
    readonly readable: ReadableStream<Uint8Array> | null
    readonly writable: WritableStream<Uint8Array> | null
    readonly info: PortInfo
    open(options: SerialOptions): Promise<void>
    close(): Promise<void>
  }
}

let _port: SerialPort | null = null
let _writer: WritableStreamDefaultWriter<Uint8Array> | null = null
let _reader: ReadableStreamDefaultReader<Uint8Array> | null = null
let _abortController: AbortController | null = null
let _onReceiveCallback: ((data: Uint8Array) => void) | null = null
const _isConnected = ref(false)

export function isSupported(): boolean {
  if (typeof navigator === 'undefined') return false
  return typeof (navigator as unknown as { serial?: unknown }).serial !== 'undefined'
}

export function isConnected(): boolean {
  return _isConnected.value
}

export function getPortInfo(): PortInfo | undefined {
  return _port?.info
}

export function getPortName(): string {
  if (!_port) return 'Unknown'

  let info: PortInfo | undefined
  try {
    info = _port.info
  } catch {
    return 'Serial Port'
  }

  if (!info) return 'Serial Port'

  const parts: string[] = []

  // serialNumber
  if (info.serialNumber) {
    parts.push(`SN:${info.serialNumber}`)
  }

  // VID/PID
  if (info.usbVendorId || info.usbProductId) {
    const vid = info.usbVendorId?.toString(16).toUpperCase().padStart(4, '0') ?? '----'
    const pid = info.usbProductId?.toString(16).toUpperCase().padStart(4, '0') ?? '----'
    parts.push(`VID:${vid} PID:${pid}`)
  }

  // path - coba ekstrak device name
  if (info.path) {
    // Linux: /dev/ttyUSB0, /dev/ttyACM0
    const ttyMatch = info.path.match(/\/dev\/(ttyUSB\d+|ttyACM\d+)/)
    if (ttyMatch?.[1]) {
      parts.push(ttyMatch[1])
    }
    // Windows: \\.\COM4
    const comMatch = info.path.match(/\\\.\\COM(\d+)/i)
    if (comMatch?.[1]) {
      parts.push(`COM${comMatch[1]}`)
    }
  }

  return parts.length > 0 ? parts.join(' ') : 'Serial Port'
}

export async function openPort(opts: SerialOptions): Promise<void> {
  if (!isSupported()) throw new Error('Web Serial API not supported in this browser')

  const port = await (navigator as unknown as { serial?: { requestPort(options?: RequestPortOptions): Promise<SerialPort> } }).serial!.requestPort({})
  try {
    await port.open({
      baudRate: opts.baudRate,
      dataBits: opts.dataBits,
      stopBits: opts.stopBits,
      parity: opts.parity,
      flowControl: opts.flowControl,
      bufferSize: opts.bufferSize
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (_port) {
      _port = null
      _isConnected.value = false
    }
    throw new Error(`Failed to open port: ${msg}`, { cause: e })
  }

  try {
    _port = port
    _isConnected.value = true
    _writer = _port.writable!.getWriter()
    startReading()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    _port = null
    _isConnected.value = false
    throw new Error(`Failed to initialize port: ${msg}`, { cause: e })
  }
}

export async function closePort(): Promise<void> {
  _abortController?.abort()
  _abortController = null

  if (_reader) {
    try {
      await _reader.cancel()
    } catch { /* ignore */ }
    _reader = null
  }

  if (_writer) {
    try {
      await _writer.close()
    } catch { /* ignore */ }
    _writer = null
  }

  if (_port) {
    const p = _port
    _port = null
    try {
      await p.close()
    } catch { /* ignore */ }
  }

  _isConnected.value = false
}

export function setOnReceive(cb: ((data: Uint8Array) => void) | null): void {
  _onReceiveCallback = cb
}

function startReading(): void {
  if (!_port?.readable) return
  _abortController = new AbortController()
  _reader = _port.readable.getReader()

  void (async () => {
    try {
      while (true) {
        const { done, value } = await _reader.read()
        if (done) break
        if (value && _onReceiveCallback) {
          _onReceiveCallback(value)
        }
      }
    } catch {
      // abort or disconnect — expected
    }
  })()
}

export function send(data: string, hexMode: boolean, delimiter: 'none' | 'newline' | 'carriage-return' | 'both' = 'none'): void {
  if (!_port?.writable || !_writer) return

  let bytes: Uint8Array
  if (hexMode) {
    const cleaned = data.replace(/[^0-9a-fA-F]/g, '')
    const nums: number[] = []
    for (let i = 0; i < cleaned.length; i += 2) {
      if (i + 1 < cleaned.length) {
        nums.push(parseInt(cleaned.substring(i, i + 2), 16))
      }
    }
    bytes = new Uint8Array(nums)
  } else {
    bytes = new TextEncoder().encode(data)
  }

  if (delimiter === 'newline') bytes = new Uint8Array([...bytes, 0x0A])
  else if (delimiter === 'carriage-return') bytes = new Uint8Array([...bytes, 0x0D])
  else if (delimiter === 'both') bytes = new Uint8Array([...bytes, 0x0D, 0x0A])

  _writer.write(bytes).catch(() => {})
}

export function formatHex(data: Uint8Array, upper = true): string {
  return Array.from(data)
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(upper ? ' ' : ' ')
}

export function formatText(data: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(data)
}
