import { Router, type IRouter } from "express";
import QRCode from "qrcode";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import {
  CreatePollBody,
  GetActivePollQueryParams,
  ReplacePlayersBody,
  SubmitVoteBody,
  UpdatePollStatusBody,
} from "@workspace/api-zod";
import {
  db,
  playersTable,
  pollsTable,
  votesTable,
} from "@workspace/db";
import { requireAdmin, requireUser, type StaffUser } from "../lib/auth";
import { canOpenPoll, closesAt, validateRoster } from "../lib/poll-rules";

const router: IRouter = Router();
const iso = (date: Date | null) => date?.toISOString() ?? null;

function idParam(value: string | string[] | undefined) {
  const id = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function expirePolls() {
  const now = new Date();
  await db.update(pollsTable).set({ status: "CLOSED", closedAt: now })
    .where(and(eq(pollsTable.status, "OPEN"), sql`${pollsTable.closesAt} <= ${now}`));
}

async function pollSummary(pollId: number) {
  const [row] = await db.select({
    id: pollsTable.id,
    title: pollsTable.title,
    fixture: pollsTable.fixture,
    venue: pollsTable.venue,
    status: pollsTable.status,
    createdAt: pollsTable.createdAt,
    openedAt: pollsTable.openedAt,
    closesAt: pollsTable.closesAt,
    closedAt: pollsTable.closedAt,
    playerCount: sql<number>`count(distinct ${playersTable.id})::int`,
    voteCount: sql<number>`count(distinct ${votesTable.id})::int`,
  }).from(pollsTable)
    .leftJoin(playersTable, eq(playersTable.pollId, pollsTable.id))
    .leftJoin(votesTable, eq(votesTable.pollId, pollsTable.id))
    .where(eq(pollsTable.id, pollId))
    .groupBy(pollsTable.id);
  if (!row) return null;
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    openedAt: iso(row.openedAt),
    closesAt: iso(row.closesAt),
    closedAt: iso(row.closedAt),
  };
}

async function pollDetail(pollId: number) {
  const poll = await pollSummary(pollId);
  if (!poll) return null;
  const players = await db.select().from(playersTable)
    .where(eq(playersTable.pollId, pollId)).orderBy(asc(playersTable.name));
  return { ...poll, players };
}

async function assertPollAccess(pollId: number, user: StaffUser) {
  const [poll] = await db.select().from(pollsTable).where(eq(pollsTable.id, pollId)).limit(1);
  return poll && (user.role === "ADMIN" || poll.status === "OPEN" || poll.status === "DRAFT") ? poll : null;
}

router.get("/public/active-poll", async (req, res): Promise<void> => {
  await expirePolls();
  const query = GetActivePollQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid device identifier" });
    return;
  }
  const [poll] = await db.select().from(pollsTable).where(eq(pollsTable.status, "OPEN")).limit(1);
  if (!poll || !poll.openedAt || !poll.closesAt) {
    res.json(null);
    return;
  }
  const players = await db.select().from(playersTable)
    .where(eq(playersTable.pollId, poll.id)).orderBy(asc(playersTable.name));
  let currentPlayerId: number | null = null;
  if (query.data.deviceId) {
    const [vote] = await db.select({ playerId: votesTable.playerId }).from(votesTable)
      .where(and(eq(votesTable.pollId, poll.id), eq(votesTable.deviceId, query.data.deviceId))).limit(1);
    currentPlayerId = vote?.playerId ?? null;
  }
  res.json({
    id: poll.id,
    title: poll.title,
    fixture: poll.fixture,
    openedAt: poll.openedAt.toISOString(),
    closesAt: poll.closesAt.toISOString(),
    players,
    currentPlayerId,
  });
});

router.post("/public/polls/:pollId/votes", async (req, res): Promise<void> => {
  await expirePolls();
  const pollId = idParam(req.params.pollId);
  const body = SubmitVoteBody.safeParse(req.body);
  if (!pollId || !body.success) {
    res.status(400).json({ error: body.success ? "Invalid poll" : body.error.issues[0]?.message });
    return;
  }
  const [poll] = await db.select().from(pollsTable).where(eq(pollsTable.id, pollId)).limit(1);
  if (!poll || poll.status !== "OPEN" || !poll.closesAt || poll.closesAt <= new Date()) {
    res.status(409).json({ error: "This poll is closed" });
    return;
  }
  const [player] = await db.select({ id: playersTable.id }).from(playersTable)
    .where(and(eq(playersTable.id, body.data.playerId), eq(playersTable.pollId, pollId))).limit(1);
  if (!player) {
    res.status(400).json({ error: "Selected player is not in this poll" });
    return;
  }
  const now = new Date();
  const [vote] = await db.insert(votesTable).values({
    pollId,
    playerId: player.id,
    deviceId: body.data.deviceId,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: [votesTable.pollId, votesTable.deviceId],
    set: { playerId: player.id, updatedAt: now },
  }).returning();
  res.json({ pollId, playerId: vote.playerId, recordedAt: vote.updatedAt.toISOString() });
});

router.use("/polls", requireUser);

router.get("/polls", requireAdmin, async (_req, res): Promise<void> => {
  await expirePolls();
  const ids = await db.select({ id: pollsTable.id }).from(pollsTable).orderBy(desc(pollsTable.createdAt));
  res.json((await Promise.all(ids.map(({ id }) => pollSummary(id)))).filter(Boolean));
});

router.post("/polls", requireAdmin, async (req, res): Promise<void> => {
  const body = CreatePollBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.issues[0]?.message });
    return;
  }
  const [poll] = await db.insert(pollsTable).values({
    title: body.data.title.trim(),
    fixture: body.data.fixture.trim(),
    venue: body.data.venue?.trim() || null,
    createdBy: (res.locals.user as StaffUser).id,
  }).returning();
  res.status(201).json(await pollDetail(poll.id));
});

router.get("/polls/current", async (_req, res): Promise<void> => {
  await expirePolls();
  const [poll] = await db.select({ id: pollsTable.id }).from(pollsTable)
    .where(inArray(pollsTable.status, ["OPEN", "DRAFT"]))
    .orderBy(sql`case when ${pollsTable.status} = 'OPEN' then 0 else 1 end`, desc(pollsTable.createdAt)).limit(1);
  res.json(poll ? await pollDetail(poll.id) : null);
});

router.get("/polls/:pollId", async (req, res): Promise<void> => {
  await expirePolls();
  const id = idParam(req.params.pollId);
  if (!id || !(await assertPollAccess(id, res.locals.user as StaffUser))) {
    res.status(404).json({ error: "Poll not found" });
    return;
  }
  res.json(await pollDetail(id));
});

router.put("/polls/:pollId/players", async (req, res): Promise<void> => {
  const id = idParam(req.params.pollId);
  const body = ReplacePlayersBody.safeParse(req.body);
  if (!id || !body.success) {
    res.status(422).json({ error: body.success ? "Invalid poll" : body.error.issues[0]?.message });
    return;
  }
  const poll = await assertPollAccess(id, res.locals.user as StaffUser);
  if (!poll || poll.status === "CLOSED") {
    res.status(403).json({ error: "Roster cannot be changed for this poll" });
    return;
  }
  const rosterError = validateRoster(body.data.players);
  if (rosterError) {
    res.status(422).json({ error: rosterError });
    return;
  }
  const [{ value: voteCount }] = await db.select({ value: count() }).from(votesTable).where(eq(votesTable.pollId, id));
  if (voteCount > 0) {
    res.status(409).json({ error: "Roster cannot be replaced after voting begins" });
    return;
  }
  await db.transaction(async (tx) => {
    await tx.delete(playersTable).where(eq(playersTable.pollId, id));
    await tx.insert(playersTable).values(body.data.players.map((player) => ({
      pollId: id,
      name: player.name.trim(),
      squadNumber: player.squadNumber.trim(),
      position: player.position?.trim() || null,
      team: player.team?.trim() || null,
    })));
  });
  res.json(await pollDetail(id));
});

router.patch("/polls/:pollId/status", requireAdmin, async (req, res): Promise<void> => {
  await expirePolls();
  const id = idParam(req.params.pollId);
  const body = UpdatePollStatusBody.safeParse(req.body);
  if (!id || !body.success) {
    res.status(400).json({ error: "Invalid status request" });
    return;
  }
  const detail = await pollDetail(id);
  if (!detail) {
    res.status(404).json({ error: "Poll not found" });
    return;
  }
  if (body.data.status === "OPEN") {
    const [active] = await db.select({ id: pollsTable.id }).from(pollsTable)
      .where(and(eq(pollsTable.status, "OPEN"), sql`${pollsTable.id} <> ${id}`)).limit(1);
    const openError = canOpenPoll(detail.players.length, Boolean(active));
    if (openError) {
      res.status(409).json({ error: openError });
      return;
    }
    const openedAt = new Date();
    try {
      await db.update(pollsTable).set({
        status: "OPEN",
        openedAt,
        closesAt: closesAt(openedAt),
        closedAt: null,
      }).where(eq(pollsTable.id, id));
    } catch {
      res.status(409).json({ error: "Another poll is already open" });
      return;
    }
  } else {
    await db.update(pollsTable).set({ status: "CLOSED", closedAt: new Date() }).where(eq(pollsTable.id, id));
  }
  res.json(await pollDetail(id));
});

router.get("/polls/:pollId/results", async (req, res): Promise<void> => {
  await expirePolls();
  const id = idParam(req.params.pollId);
  if (!id || !(await assertPollAccess(id, res.locals.user as StaffUser))) {
    res.status(404).json({ error: "Poll not found" });
    return;
  }
  const poll = await pollSummary(id);
  const rows = await db.select({
    playerId: playersTable.id,
    playerName: playersTable.name,
    squadNumber: playersTable.squadNumber,
    votes: sql<number>`count(${votesTable.id})::int`,
  }).from(playersTable).leftJoin(votesTable, eq(votesTable.playerId, playersTable.id))
    .where(eq(playersTable.pollId, id))
    .groupBy(playersTable.id).orderBy(desc(sql`count(${votesTable.id})`), asc(playersTable.name));
  const totalVotes = rows.reduce((sum, row) => sum + row.votes, 0);
  res.json({
    poll,
    totalVotes,
    results: rows.map((row) => ({ ...row, percentage: totalVotes ? (row.votes / totalVotes) * 100 : 0 })),
  });
});

router.get("/polls/:pollId/qr", async (req, res): Promise<void> => {
  const id = idParam(req.params.pollId);
  if (!id || !(await assertPollAccess(id, res.locals.user as StaffUser))) {
    res.status(404).json({ error: "Poll not found" });
    return;
  }
  const protocol = req.get("x-forwarded-proto")?.split(",")[0] || req.protocol;
  const host = req.get("x-forwarded-host")?.split(",")[0] || req.get("host");
  const png = await QRCode.toBuffer(`${protocol}://${host}/?poll=${id}`, {
    type: "png", width: 1024, margin: 2, errorCorrectionLevel: "H",
    color: { dark: "#101817", light: "#ffffff" },
  });
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", `attachment; filename="voters-block-poll-${id}.png"`);
  res.send(png);
});

export default router;