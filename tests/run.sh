#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
python3 "$DIR/build-runner.py" >/dev/null
PAGE="runner.html"; WAIT=${WAIT:-500}
[ "$1" = "balance" ] && PAGE="balance.html"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT="$(mktemp)"
("$CHROME" --headless=new --disable-gpu --allow-file-access-from-files --window-size=1440,900 --virtual-time-budget=3000 --dump-dom "file://$DIR/$PAGE" 2>/dev/null > "$OUT") &
PID=$!
for i in $(seq 1 $WAIT); do sleep 1; grep -q 'id="results"' "$OUT" && break; done
{ kill $PID; wait $PID; } 2>/dev/null; pkill -f "headless=new.*$PAGE" 2>/dev/null
python3 - "$OUT" <<'PY'
import sys, re, html
t = open(sys.argv[1]).read()
m = re.search(r'<pre id="results">(.*?)</pre>', t, re.S)
print(html.unescape(m.group(1)) if m else 'No results - the page did not finish (increase WAIT=).')
e = re.search(r'<div id="err"[^>]*>([^<]+)', t)
if e and e.group(1).strip(): print('PAGE ERROR:', html.unescape(e.group(1)))
fails = len(re.findall(r'^(FAIL|ERROR)', html.unescape(m.group(1)) if m else 'ERROR', re.M))
sys.exit(1 if fails else 0)
PY
