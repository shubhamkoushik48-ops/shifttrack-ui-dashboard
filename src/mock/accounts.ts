/**
 * Mock account store, persisted to localStorage so registered users survive
 * page reloads (the rest of the mock DB is deterministic in-memory data).
 * Seeded with the built-in demo manager so existing credentials keep working.
 */

export interface MockAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "manager" | "admin";
  department: string;
  createdAt: string;
}

const STORAGE_KEY = "shifttrack.accounts";
const DEMO_EMAIL = "manager@shifttrack.io";

function seedAccounts(): MockAccount[] {
  return [
    {
      id: "usr_001",
      name: "Maya Okafor",
      email: DEMO_EMAIL,
      password: "shifttrack2026",
      role: "manager",
      department: "Operations",
      createdAt: new Date("2026-01-05").toISOString(),
    },
  ];
}

function load(): MockAccount[] {
  if (typeof window === "undefined") return seedAccounts();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedAccounts();
    const parsed = JSON.parse(raw) as MockAccount[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedAccounts();
    return parsed;
  } catch {
    return seedAccounts();
  }
}

function save(list: MockAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage full or blocked — in-memory only for this session
  }
}

let cache: MockAccount[] | null = null;

function all(): MockAccount[] {
  if (!cache) cache = load();
  return cache;
}

export const accounts = {
  findByEmail(email: string): MockAccount | undefined {
    const normalized = email.trim().toLowerCase();
    return all().find((a) => a.email === normalized);
  },

  create(input: {
    name: string;
    email: string;
    password: string;
    department?: string;
  }): MockAccount {
    const account: MockAccount = {
      id: `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      role: "manager",
      department: input.department ?? "Operations",
      createdAt: new Date().toISOString(),
    };
    all().push(account);
    save(all());
    return account;
  },
};
