# VM image for one user's persistent Fly Machine: the machine agent daemon
# plus whatever the bots it launches need at runtime. Debian-based
# (python:3.12-slim), non-root `agent` user for the daemon and every bot
# process. State that must survive a Machine restart/replace lives on the
# Fly Volume mounted at /workspace, never on this image's own filesystem.

FROM python:3.12-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       git curl ca-certificates \
       xvfb fluxbox imagemagick \
       firefox-esr \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -m -u 1000 -s /bin/sh agent

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agent.py entrypoint.sh ./
RUN chmod +x entrypoint.sh

ENV WORKSPACE_ROOT=/workspace
EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
