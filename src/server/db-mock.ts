// In-memory mock Prisma client for local UI testing only.
// Implements the subset of Prisma API used by the app. Data resets on restart.
// NOT for production — use real PostgreSQL via docker-compose.

type ID = string;
const uid = (p = "c"): string => p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

interface Row { id: ID; [k: string]: any }

function table<T extends Row>(relations?: Record<string, { model: string; fk: string; many?: boolean }>) {
  const rows = new Map<ID, T>();
  const rel = relations ?? {};
  const applyInclude = (row: T, include: any, allTables: any): T => {
    if (!include) return row;
    const out: any = { ...row };
    for (const [k, v] of Object.entries(include)) {
      const r = rel[k];
      if (!r) continue;
      const t = allTables[r.model].rows;
      if (r.many) {
        out[k] = [...t.values()].filter((x: any) => x[r.fk] === (row as any).id);
        // nested include
        if (v && typeof v === "object" && (v as any).include) {
          out[k] = out[k].map((x: any) => applyInclude(x, (v as any).include, allTables));
        }
        if (v && typeof v === "object" && (v as any).take) {
          out[k] = out[k].slice(0, (v as any).take);
        }
        if (v && typeof v === "object" && (v as any).orderBy) {
          out[k] = order(out[k], (v as any).orderBy);
        }
      } else {
        out[k] = [...t.values()].find((x: any) => x.id === (row as any)[r.fk]) ?? null;
        if (v && typeof v === "object" && (v as any).include) {
          out[k] = applyInclude(out[k], (v as any).include, allTables);
        }
      }
    }
    return out;
  };
  return {
    rows,
    findUnique: async (args: any, allTables?: any): Promise<T | null> => {
      const key = Object.keys(args.where)[0];
      const row = [...rows.values()].find((r) => r[key] === args.where[key]) ?? null;
      return row ? applyInclude(row, args.include, allTables ?? { Setting: { rows } }) : null;
    },
    findFirst: async (args: any = {}, allTables?: any): Promise<T | null> => {
      let list = [...rows.values()];
      if (args.where) list = filterWhere(list, args.where);
      if (args.orderBy) list = order(list, args.orderBy);
      if (args.take) list = list.slice(0, args.take);
      const row = list[0] ?? null;
      return row ? applyInclude(row, args.include, allTables ?? { rows }) : null;
    },
    findMany: async (args: any = {}, allTables?: any): Promise<T[]> => {
      let list = [...rows.values()];
      if (args.where) list = filterWhere(list, args.where);
      if (args.orderBy) list = order(list, args.orderBy);
      if (args.take) list = list.slice(0, args.take);
      return list.map((r) => applyInclude(r, args.include, allTables ?? { rows }));
    },
    create: async (args: any, allTables?: any): Promise<T> => {
      const data = args.data;
      const row: any = { id: uid(), ...data };
      // nested create (relations create)
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === "object" && (v as any).create && rel[k]) {
          const child = await allTables[rel[k].model].create({ data: (v as any).create }, allTables);
          if (!rel[k].many) row[rel[k].fk] = child.id;
        }
      }
      rows.set(row.id, row);
      return applyInclude(row, args.include, allTables ?? { rows });
    },
    update: async (args: any, allTables?: any): Promise<T> => {
      const key = Object.keys(args.where)[0];
      const id = [...rows.values()].find((r) => r[key] === args.where[key])?.id;
      if (!id) throw new Error("record not found");
      rows.set(id, { ...rows.get(id)!, ...args.data });
      return applyInclude(rows.get(id)!, args.include, allTables ?? { rows });
    },
    upsert: async (args: any, allTables?: any): Promise<T> => {
      const key = Object.keys(args.where)[0];
      const existing = [...rows.values()].find((r) => r[key] === args.where[key]);
      if (existing) {
        rows.set(existing.id, { ...existing, ...(args.update.update ?? args.update) });
        return applyInclude(rows.get(existing.id)!, args.include, allTables ?? { rows });
      }
      const row: any = { id: uid(), ...args.create };
      rows.set(row.id, row);
      return applyInclude(row, args.include, allTables ?? { rows });
    },
    delete: async (args: any): Promise<T> => {
      const key = Object.keys(args.where)[0];
      const id = [...rows.values()].find((r) => r[key] === args.where[key])?.id;
      if (!id) throw new Error("not found");
      const row = rows.get(id)!;
      rows.delete(id);
      return row;
    },
    deleteMany: async (args: any = {}): Promise<{ count: number }> => {
      let list = [...rows.values()];
      if (args.where) list = filterWhere(list, args.where);
      list.forEach((r) => rows.delete(r.id));
      return { count: list.length };
    },
    count: async (args: any = {}): Promise<number> => {
      let list = [...rows.values()];
      if (args.where) list = filterWhere(list, args.where);
      return list.length;
    },
    aggregate: async (args: any = {}): Promise<any> => {
      let list = [...rows.values()];
      if (args.where) list = filterWhere(list, args.where);
      const sum = (k: string) => list.reduce((s, r) => s + (Number(r[k]) || 0), 0);
      const out: any = { _sum: {}, _count: list.length };
      if (args._sum) for (const k of Object.keys(args._sum)) out._sum[k] = sum(k);
      return out;
    },
  };
}

function filterWhere(list: any[], where: any): any[] {
  if (!where) return list;
  return list.filter((r) => {
    for (const [k, cond] of Object.entries(where)) {
      if (k === "OR") return (cond as any[]).some((c) => filterWhere([r], c).length);
      if (k === "AND") return (cond as any[]).every((c) => filterWhere([r], c).length);
      if (typeof cond === "object" && cond !== null) {
        if ("equals" in cond && r[k] !== (cond as any).equals) return false;
        if ("contains" in cond && !String(r[k] ?? "").toLowerCase().includes(String((cond as any).contains).toLowerCase())) return false;
        if ("gt" in cond && !(r[k] > (cond as any).gt)) return false;
        if ("gte" in cond && !(r[k] >= (cond as any).gte)) return false;
        if ("lt" in cond && !(r[k] < (cond as any).lt)) return false;
        if ("lte" in cond && !(r[k] <= (cond as any).lte)) return false;
        if ("in" in cond && !(cond as any).in.includes(r[k])) return false;
      } else if (r[k] !== cond) return false;
    }
    return true;
  });
}

function order(list: any[], orderBy: any): any[] {
  const key = Object.keys(orderBy)[0];
  const dir = orderBy[key];
  return list.sort((a, b) => (a[key] > b[key] ? (dir === "desc" ? -1 : 1) : a[key] < b[key] ? (dir === "desc" ? 1 : -1) : 0));
}

// Decimal shim — store numbers, expose toNumber/toString
class D {
  v: number;
  constructor(v: any) { this.v = typeof v === "object" && v?.toNumber ? v.toNumber() : Number(v); }
  toNumber() { return this.v; }
  toString() { return String(this.v); }
  add(o: any) { return new D(this.v + (o?.toNumber?.() ?? Number(o))); }
  mul(o: any) { return new D(this.v * (o?.toNumber?.() ?? Number(o))); }
  div(o: any) { return new D(this.v / (o?.toNumber?.() ?? Number(o))); }
  sub(o: any) { return new D(this.v - (o?.toNumber?.() ?? Number(o))); }
  static max(a: any, b: any) { const x = a?.toNumber?.() ?? Number(a); const y = b?.toNumber?.() ?? Number(b); return new D(Math.max(x, y)); }
  static min(a: any, b: any) { const x = a?.toNumber?.() ?? Number(a); const y = b?.toNumber?.() ?? Number(b); return new D(Math.min(x, y)); }
}

export async function createMockPrisma(): Promise<any> {
  // Persist all settings to a JSON file so the app survives Next.js module reloads
  // in dev mode. Full DB state is still in-memory (resets on restart) except settings.
  const SETTINGS_FILE = ".mock-settings.json";
  const SESSIONS_FILE = ".mock-sessions.json";
  const USERS_FILE = ".mock-users.json";
  const fsMod = await import("fs");
  const tables: Record<string, ReturnType<typeof table>> = {
    setting: table(),
    user: table({
      discord: { model: "discordAccount", fk: "userId" },
      discordAccount: { model: "discordAccount", fk: "userId" },
      minecraft: { model: "minecraftAccount", fk: "userId" },
      minecraftAccount: { model: "minecraftAccount", fk: "userId" },
      adminUser: { model: "adminUser", fk: "userId" },
      sessions: { model: "session", fk: "userId", many: true },
      orders: { model: "order", fk: "userId", many: true },
      rewardClaims: { model: "rewardClaim", fk: "userId", many: true },
      mediaApps: { model: "mediaApplication", fk: "userId", many: true },
      tickets: { model: "ticket", fk: "userId", many: true },
      deliveryJobs: { model: "deliveryJob", fk: "userId", many: true },
      couponUsages: { model: "couponUsage", fk: "userId", many: true },
      auditLogs: { model: "auditLog", fk: "actorId", many: true },
    }),
    session: table({ user: { model: "user", fk: "userId" } }),
    discordAccount: table({ user: { model: "user", fk: "userId" } }),
    minecraftAccount: table({ user: { model: "user", fk: "userId" } }),
    adminUser: table({ user: { model: "user", fk: "userId" } }),
    serverMode: table({
      products: { model: "product", fk: "modeId", many: true },
      instances: { model: "serverInstance", fk: "modeId", many: true },
      coupons: { model: "coupon", fk: "modeId", many: true },
    }),
    serverInstance: table({ mode: { model: "serverMode", fk: "modeId" }, history: { model: "uptimeRecord", fk: "instanceId", many: true } }),
    uptimeRecord: table({ instance: { model: "serverInstance", fk: "instanceId" } }),
    category: table({ products: { model: "product", fk: "categoryId", many: true } }),
    product: table({ mode: { model: "serverMode", fk: "modeId" }, category: { model: "category", fk: "categoryId" }, orderItems: { model: "orderItem", fk: "productId", many: true }, coupons: { model: "coupon", fk: "productId", many: true } }),
    order: table({ user: { model: "user", fk: "userId" }, items: { model: "orderItem", fk: "orderId", many: true }, payments: { model: "payment", fk: "orderId", many: true }, deliveries: { model: "deliveryJob", fk: "orderId", many: true }, coupon: { model: "coupon", fk: "couponId" } }),
    orderItem: table({ order: { model: "order", fk: "orderId" }, product: { model: "product", fk: "productId" } }),
    payment: table({ order: { model: "order", fk: "orderId" } }),
    deliveryJob: table({ order: { model: "order", fk: "orderId" }, user: { model: "user", fk: "userId" } }),
    reward: table({ claims: { model: "rewardClaim", fk: "rewardId", many: true } }),
    rewardClaim: table({ user: { model: "user", fk: "userId" }, reward: { model: "reward", fk: "rewardId" } }),
    mediaApplication: table({ user: { model: "user", fk: "userId" } }),
    ticket: table({ user: { model: "user", fk: "userId" }, messages: { model: "ticketMessage", fk: "ticketId", many: true } }),
    ticketMessage: table({ ticket: { model: "ticket", fk: "ticketId" } }),
    coupon: table({ modes: { model: "serverMode", fk: "couponId", many: true }, products: { model: "product", fk: "couponId", many: true }, orders: { model: "order", fk: "couponId", many: true }, usages: { model: "couponUsage", fk: "couponId", many: true } }),
    couponUsage: table({ coupon: { model: "coupon", fk: "couponId" }, user: { model: "user", fk: "userId" } }),
    auditLog: table({ actor: { model: "user", fk: "actorId" } }),
  };
  const allTables = tables;

  // wrap each table method to pass allTables for include resolution
  for (const [name, t] of Object.entries(tables)) {
    for (const fn of ["findUnique", "findFirst", "findMany", "create", "update", "upsert"] as const) {
      const orig = (t as any)[fn];
      (t as any)[fn] = (args: any) => orig(args, allTables);
    }
  }

  // persist settings to JSON so they survive dev reloads
  try {
    if (fsMod.existsSync(SETTINGS_FILE)) {
      const saved = JSON.parse(fsMod.readFileSync(SETTINGS_FILE, "utf-8"));
      for (const s of saved) (tables.setting as any).rows.set(s.key, s);
    }
  } catch {}

  const saveSettings = () => {
    try {
      fsMod.writeFileSync(SETTINGS_FILE, JSON.stringify([...(tables.setting as any).rows.values()]));
    } catch {}
  };
  const origSettingUpsert = (tables.setting as any).upsert;
  (tables.setting as any).upsert = async (args: any) => {
    const r = await origSettingUpsert(args, allTables);
    saveSettings();
    return r;
  };
  const origSettingCreate = (tables.setting as any).create;
  (tables.setting as any).create = async (args: any) => {
    const r = await origSettingCreate(args, allTables);
    saveSettings();
    return r;
  };

  // Persist sessions + user/admin to JSON so login survives dev reloads
  try {
    if (fsMod.existsSync(SESSIONS_FILE)) {
      for (const s of JSON.parse(fsMod.readFileSync(SESSIONS_FILE, "utf-8"))) (tables.session as any).rows.set(s.token, s);
    }
    if (fsMod.existsSync(USERS_FILE)) {
      const data = JSON.parse(fsMod.readFileSync(USERS_FILE, "utf-8"));
      for (const u of data.users ?? []) (tables.user as any).rows.set(u.id, u);
      for (const a of data.admins ?? []) (tables.adminUser as any).rows.set(a.id, a);
    }
  } catch {}

  const saveAuth = () => {
    try {
      fsMod.writeFileSync(SESSIONS_FILE, JSON.stringify([...(tables.session as any).rows.values()]));
      fsMod.writeFileSync(USERS_FILE, JSON.stringify({
        users: [...(tables.user as any).rows.values()],
        admins: [...(tables.adminUser as any).rows.values()],
      }));
    } catch {}
  };
  for (const fn of ["create", "update", "upsert", "delete", "deleteMany"] as const) {
    const o1 = (tables.session as any)[fn];
    (tables.session as any)[fn] = async (args: any) => { const r = await o1(args, allTables); saveAuth(); return r; };
    const o2 = (tables.user as any)[fn];
    (tables.user as any)[fn] = async (args: any) => { const r = await o2(args, allTables); saveAuth(); return r; };
    const o3 = (tables.adminUser as any)[fn];
    (tables.adminUser as any)[fn] = async (args: any) => { const r = await o3(args, allTables); saveAuth(); return r; };
  }
  const origSettingUpdate = (tables.setting as any).update;
  (tables.setting as any).update = async (args: any) => {
    const r = await origSettingUpdate(args, allTables);
    saveSettings();
    return r;
  };

  const proxy = new Proxy({} as any, {
    get: (_t, prop) => {
      if (prop === "$transaction") return async (fn: any) => fn(proxy);
      if (typeof prop === "string" && tables[prop]) return tables[prop];
      return undefined;
    },
  });
  return proxy;
}

export const Decimal = D;
