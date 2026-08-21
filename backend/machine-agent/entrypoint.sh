#!/bin/sh
# Runs as root only long enough to fix ownership of the mounted Fly Volume
# (which comes up root-owned on first attach) before dropping to the
# non-root `agent` user for the actual daemon and every bot subprocess it
# spawns. ponytail: `su`, not gosu/tini -- one extra package for what a
# stdlib tool already does.
set -e

mkdir -p /workspace/bots /workspace/shared /workspace/state
chown -R agent:agent /workspace

# Virtual display so bots can open a real GUI on a headless VM, and so the
# agent's /screen endpoint (`import -display :99`) has something to
# capture. Xvfb/fluxbox restart in a loop if they crash -- without that, a
# dead Xvfb leaves a stale X11 socket that `import` hangs against forever
# instead of failing fast, and there's no recovery until the whole Machine
# restarts. ponytail: a shell while-loop, not a real process supervisor
# (no backoff, no crash-loop detection) -- fine for two processes.
exec su -s /bin/sh agent -c "
  ( while true; do rm -f /tmp/.X99-lock /tmp/.X11-unix/X99; Xvfb :99 -screen 0 1280x800x24 -nolisten tcp; sleep 1; done ) &
  sleep 1
  ( while true; do DISPLAY=:99 fluxbox; sleep 1; done ) &
  cd /app && exec uvicorn agent:app --host 0.0.0.0 --port 8080
"
