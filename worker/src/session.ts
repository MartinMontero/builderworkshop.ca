// One Durable Object per visitor session, holding query history. SQLite-backed
// (new_sqlite_classes migration). Sessions expire themselves: every write arms
// a 24h alarm; the alarm wipes storage, and an empty object ceases to exist.

import { DurableObject } from 'cloudflare:workers';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_TURNS = 50;

export interface SessionTurn {
  ts: string;
  queryClass: string;
  keys: string[];
}

export class Session extends DurableObject {
  async append(turn: SessionTurn): Promise<void> {
    const turns = ((await this.ctx.storage.get('turns')) as SessionTurn[] | undefined) ?? [];
    turns.push(turn);
    await this.ctx.storage.put('turns', turns.slice(-MAX_TURNS));
    // sliding expiry — reset the alarm on every write
    await this.ctx.storage.setAlarm(Date.now() + SESSION_TTL_MS);
  }

  async history(): Promise<SessionTurn[]> {
    return ((await this.ctx.storage.get('turns')) as SessionTurn[] | undefined) ?? [];
  }

  async alarm(): Promise<void> {
    // deleteAll() also clears the alarm at current compatibility dates; with
    // empty storage the object evaporates and stops billing.
    await this.ctx.storage.deleteAll();
  }
}
