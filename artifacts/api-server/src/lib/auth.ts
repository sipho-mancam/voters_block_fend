import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { RequestHandler } from "express";
import { and, eq, gt, sql } from "drizzle-orm";
import { db, playersTable, pollsTable, sessionsTable, usersTable } from "@workspace/db";

const scrypt = promisify(scryptCallback);
const COOKIE = "vb_session";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export type StaffUser = {
  id: number;
  username: string;
  displayName: string;
  role: "ADMIN" | "OPERATOR";
};

function pepper(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required");
  return `${value}:${secret}`;
}

export async function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const derived = await scrypt(pepper(password), salt, 64) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [salt, storedHex] = encoded.split(":");
  if (!salt || !storedHex) return false;
  const actual = await scrypt(pepper(password), salt, 64) as Buffer;
  const stored = Buffer.from(storedHex, "hex");
  return stored.length === actual.length && timingSafeEqual(stored, actual);
}

const tokenHash = (token: string) => createHash("sha256").update(pepper(token)).digest("hex");

function readCookie(header: string | undefined) {
  const pair = header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  return pair ? decodeURIComponent(pair.slice(COOKIE.length + 1)) : null;
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  await db.insert(sessionsTable).values({
    tokenHash: tokenHash(token),
    userId,
    expiresAt: new Date(Date.now() + THIRTY_DAYS),
  });
  return token;
}

export async function destroySession(token: string | null) {
  if (token) await db.delete(sessionsTable).where(eq(sessionsTable.tokenHash, tokenHash(token)));
}

export function setSessionCookie(res: Parameters<RequestHandler>[1], token: string) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: THIRTY_DAYS,
    path: "/",
  });
}

export function clearSessionCookie(res: Parameters<RequestHandler>[1]) {
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
}

export const requireUser: RequestHandler = async (req, res, next) => {
  const token = readCookie(req.headers.cookie);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const [user] = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    displayName: usersTable.displayName,
    role: usersTable.role,
  }).from(sessionsTable)
    .innerJoin(usersTable, eq(usersTable.id, sessionsTable.userId))
    .where(and(
      eq(sessionsTable.tokenHash, tokenHash(token)),
      gt(sessionsTable.expiresAt, new Date()),
      eq(usersTable.active, true),
    ))
    .limit(1);
  if (!user) {
    clearSessionCookie(res);
    res.status(401).json({ error: "Session expired" });
    return;
  }
  res.locals.user = user satisfies StaffUser;
  res.locals.sessionToken = token;
  next();
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if ((res.locals.user as StaffUser | undefined)?.role !== "ADMIN") {
    res.status(403).json({ error: "Administrator access required" });
    return;
  }
  next();
};

export async function ensureStaffSetup() {
  const development = process.env.NODE_ENV !== "production";
  const accounts = development
    ? [
        { username: "admin", displayName: "Match Administrator", role: "ADMIN" as const, password: "AdminPass24!" },
        { username: "operator", displayName: "Live Poll Operator", role: "OPERATOR" as const, password: "OperatorPass24!" },
      ]
    : [
        {
          username: process.env.INITIAL_ADMIN_USERNAME ?? "",
          displayName: process.env.INITIAL_ADMIN_DISPLAY_NAME ?? "Voters Block Administrator",
          role: "ADMIN" as const,
          password: process.env.INITIAL_ADMIN_PASSWORD ?? "",
        },
        {
          username: process.env.INITIAL_OPERATOR_USERNAME ?? "",
          displayName: process.env.INITIAL_OPERATOR_DISPLAY_NAME ?? "Voters Block Operator",
          role: "OPERATOR" as const,
          password: process.env.INITIAL_OPERATOR_PASSWORD ?? "",
        },
      ].filter((account) => account.username && account.password);
  const [{ userCount }] = await db.select({ userCount: sql<number>`count(*)::int` }).from(usersTable);
  if (!development && userCount === 0 && !accounts.some((account) => account.role === "ADMIN")) {
    throw new Error("First run requires INITIAL_ADMIN_USERNAME and INITIAL_ADMIN_PASSWORD");
  }
  for (const account of accounts) {
    if (account.password.length < 12) {
      if (development) throw new Error("Development seed password is too short");
      throw new Error(`Initial password for ${account.role} must be at least 12 characters`);
    }
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable)
      .where(eq(usersTable.username, account.username)).limit(1);
    if (!existing) {
      await db.insert(usersTable).values({
        username: account.username,
        displayName: account.displayName,
        role: account.role,
        passwordHash: await hashPassword(account.password),
      });
    }
  }
  if (!development) return;
  const [admin] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.username, "admin")).limit(1);
  const [existingPoll] = await db.select({ id: pollsTable.id }).from(pollsTable).limit(1);
  if (admin && !existingPoll) {
    const [poll] = await db.insert(pollsTable).values({
      title: "Man of the Match",
      fixture: "Voters Block FC vs City Athletic",
      venue: "Community Stadium",
      createdBy: admin.id,
    }).returning({ id: pollsTable.id });
    await db.insert(playersTable).values([
      ["1", "Marcus Reed", "Goalkeeper"],
      ["4", "Theo Bennett", "Defender"],
      ["6", "Callum Price", "Midfielder"],
      ["8", "Noah Williams", "Midfielder"],
      ["9", "Jamie Cole", "Forward"],
      ["11", "Leo Morgan", "Forward"],
    ].map(([squadNumber, name, position]) => ({
      pollId: poll.id, squadNumber, name, position, team: "Voters Block FC",
    })));
  }
}
