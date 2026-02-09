declare module '*.otf' {
  const content: any;
  export default content;
}

// Polyfills y entorno web (global.* en _layout/supabase; window en web)
declare namespace NodeJS {
  interface Global {
    stream?: unknown;
    http?: unknown;
    https?: unknown;
    url?: unknown;
    crypto?: unknown;
  }
}

declare var window: Window & typeof globalThis;