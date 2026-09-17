export {};
declare global {
  interface Window { vezora?: { connection(): Promise<{ url: string; token: string }> } }
}
