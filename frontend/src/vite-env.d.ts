/// <reference types="vite/client" />

declare const __CLAW_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
