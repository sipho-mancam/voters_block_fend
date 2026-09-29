#!/bin/bash
set -euo pipefail
pnpm install --frozen-lockfile

# Only sync the database when the merged commit changes its schema.
if git rev-parse HEAD^ >/dev/null 2>&1 &&
   ! git diff --quiet HEAD^ HEAD -- lib/db/src/schema lib/db/drizzle.config.ts; then
  pnpm --filter @workspace/db run push
fi
