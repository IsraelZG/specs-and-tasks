export {};

declare global {
  interface Window {
    __bancada: {
      reset(): Promise<void>;
    };
  }
}
