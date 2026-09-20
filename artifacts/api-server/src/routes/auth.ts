import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { LoginBody, LoginResponse, GetCurrentUserResponse } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import {
  clearSessionCookie,
  createSession,
  destroySession,
  requireUser,
  setSessionCookie,
  verifyPassword,
  type StaffUser,
} from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid username and password" });
    return;
  }
  const [account] = await db.select().from(usersTable)
    .where(eq(usersTable.username, parsed.data.username.trim().toLowerCase())).limit(1);
  if (!account?.active || !(await verifyPassword(parsed.data.password, account.passwordHash))) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }
  const token = await createSession(account.id);
  setSessionCookie(res, token);
  res.json(LoginResponse.parse({
    id: account.id, username: account.username, displayName: account.displayName, role: account.role,
  }));
});

router.post("/auth/logout", requireUser, async (_req, res): Promise<void> => {
  await destroySession(res.locals.sessionToken as string);
  clearSessionCookie(res);
  res.sendStatus(204);
});

router.get("/auth/me", requireUser, (_req, res): void => {
  res.json(GetCurrentUserResponse.parse(res.locals.user as StaffUser));
});

export default router;