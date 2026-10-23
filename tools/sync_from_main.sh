#!/usr/bin/env bash
# Copy data.json + menus.json from the main BamBoozle app into v2, bump SW cache, push.
set -euo pipefail
MAIN=${MAIN:-/workspace/vegas-hh-app}
V2=$(cd "$(dirname "$0")/.." && pwd)
cd "$V2"
cp "$MAIN/data.json" data.json
cp "$MAIN/menus.json" menus.json
python3 -c 'import json;json.load(open("data.json"));json.load(open("menus.json"))'
if git diff --quiet -- data.json menus.json; then echo "v2: no data changes"; exit 0; fi
V="bbv2-$(cat data.json menus.json | sha1sum | cut -c1-10)"
sed -i -E "s/var C='[^']*'/var C='$V'/" sw.js
[ -f /workspace/v2test.mjs ] && node /workspace/v2test.mjs || true
git add data.json menus.json sw.js
git commit -m "Sync data from main app ($(date +%F))"
git push origin main
echo "v2 pushed: $(git rev-parse --short HEAD)"
