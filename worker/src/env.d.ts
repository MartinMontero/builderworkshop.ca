// Minimal shim for the Workers runtime module so `tsc --noEmit` can check the
// Worker without pulling in @cloudflare/workers-types. Wrangler's bundler
// resolves the real module at deploy time.
declare module 'cloudflare:workers' {
  export class DurableObject {
    ctx: {
      storage: {
        get(key: string): Promise<unknown>;
        put(key: string, value: unknown): Promise<void>;
        setAlarm(time: number | Date): Promise<void>;
        deleteAll(): Promise<void>;
      };
      id: { name?: string };
    };
    env: unknown;
    constructor(ctx: unknown, env: unknown);
  }
}
