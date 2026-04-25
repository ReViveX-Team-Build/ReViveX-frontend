declare module "*.css";

interface SerialPort {
  readonly readable: ReadableStream | null;
  readonly writable: WritableStream | null;
  open(opts: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}

interface Serial extends EventTarget {
  requestPort(): Promise<SerialPort>;
  getPorts(): Promise<SerialPort[]>;
}

interface Navigator {
  serial?: Serial;
}
