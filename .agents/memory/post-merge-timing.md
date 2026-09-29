---
name: Post-merge setup timing
description: Why post-merge setup needs substantial timeout headroom even with an unchanged lockfile.
---

An up-to-date pnpm lockfile does not guarantee a quick post-merge install. After a task merge, pnpm may relink hundreds of workspace dependencies; one observed run took about 34 seconds even though no packages were downloaded.

**Why:** A 20-second setup limit killed the process after it reported "Already up to date," obscuring that dependency relinking still had work to do.

**How to apply:** Keep generous timeout headroom for post-merge setup. Investigate the entire script before blaming the last visible log line for a timeout; avoid unrelated database synchronization on frontend-only merges.