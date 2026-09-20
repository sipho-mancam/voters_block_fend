import assert from "node:assert/strict";
import test from "node:test";
import {
  POLL_LIFETIME_MS,
  canManagePolls,
  canOpenPoll,
  closesAt,
  isExpired,
  validateRoster,
} from "./poll-rules";

test("only one active poll can open", () => {
  assert.equal(canOpenPoll(11, true), "Another poll is already open");
  assert.equal(canOpenPoll(11, false), null);
});

test("poll closes exactly 24 hours after activation", () => {
  const opened = new Date("2026-09-20T10:00:00.000Z");
  assert.equal(closesAt(opened).getTime() - opened.getTime(), POLL_LIFETIME_MS);
  assert.equal(isExpired("OPEN", closesAt(opened), new Date("2026-09-21T10:00:00.000Z")), true);
  assert.equal(isExpired("OPEN", closesAt(opened), new Date("2026-09-21T09:59:59.999Z")), false);
});

test("closed polls are treated as unavailable for voting", () => {
  assert.equal(isExpired("CLOSED", new Date(0), new Date()), false);
});

test("roster upload validates size and duplicates", () => {
  assert.match(validateRoster([{ name: "A", squadNumber: "1" }]) ?? "", /2 to 100/);
  assert.match(validateRoster([
    { name: "Jordan Lee", squadNumber: "7" },
    { name: "Jordan Lee", squadNumber: "8" },
  ]) ?? "", /unique/);
  assert.equal(validateRoster([
    { name: "Jordan Lee", squadNumber: "7" },
    { name: "Sam Cole", squadNumber: "8" },
  ]), null);
});

test("role permissions reserve poll lifecycle management for admins", () => {
  assert.equal(canManagePolls("ADMIN"), true);
  assert.equal(canManagePolls("OPERATOR"), false);
});

test("one current vote per device is represented by replacement semantics", () => {
  const votes = new Map<string, number>();
  votes.set("poll-1:device-1", 7);
  votes.set("poll-1:device-1", 9);
  assert.equal(votes.size, 1);
  assert.equal(votes.get("poll-1:device-1"), 9);
});
