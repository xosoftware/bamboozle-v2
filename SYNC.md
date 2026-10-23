# Syncing v2 with the main app

v2 reuses `data.json` and `menus.json` from the main app (`/workspace/vegas-hh-app`).
After the weekly inKind sync pushes the main app (with Biv's approval), run:

    /workspace/bamboozle-v2/tools/sync_from_main.sh

It copies both files, validates JSON, exits quietly if nothing changed, otherwise bumps the
service-worker cache name in `sw.js`, runs `/workspace/v2test.mjs`, commits and pushes to
`main`. GitHub Pages redeploys https://xosoftware.github.io/bamboozle-v2/ in ~1 minute.
Override the source with `MAIN=/path ./tools/sync_from_main.sh`.
