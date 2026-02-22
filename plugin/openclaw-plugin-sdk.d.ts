/**
 * Stub type declarations for openclaw/plugin-sdk.
 * The real module is provided by the OpenClaw installation at runtime.
 * This file allows TypeScript to compile in CI without OpenClaw present.
 */
declare module "openclaw/plugin-sdk" {
  export interface OpenClawPluginApi {
    id: string;
    name: string;
    version?: string;
    description?: string;
    source: string;
    config: Record<string, unknown>;
    pluginConfig?: Record<string, unknown>;
    runtime: {
      channel: {
        whatsapp: {
          sendMessageWhatsApp: (
            to: string,
            body: string,
            options: { verbose: boolean },
          ) => Promise<{ messageId: string; toJid: string }>;
        };
      };
    };
    logger: {
      debug?: (message: string) => void;
      info: (message: string) => void;
      warn: (message: string) => void;
      error: (message: string) => void;
    };
    registerHttpRoute: (params: {
      path: string;
      handler: (
        req: import("node:http").IncomingMessage,
        res: import("node:http").ServerResponse,
      ) => Promise<void>;
    }) => void;
  }
}
