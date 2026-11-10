# Younes' Dorf als Container: Spielserver samt Spieldateien.
# Bauen:   docker build -t dorf .
# Starten: docker run -d -p 8787:8787 -e DORF_PASSWORD=… -e DORF_OWNER_TOKEN=… -v dorf-data:/app/server/data dorf
FROM node:22-alpine

# su-exec: vom Root-Start auf den Benutzer "node" wechseln (siehe server/docker-entrypoint.sh)
RUN apk add --no-cache su-exec

WORKDIR /app
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev

COPY index.html ./
COPY css ./css
COPY js ./js
COPY server ./server

# Im Container muss der Server auf allen Adressen lauschen; der Proxy davor regelt den Zugang.
ENV HOST=0.0.0.0
ENV PORT=8787
ENV DORF_DATA=/app/server/data/db.json
RUN mkdir -p /app/server/data && chown -R node:node /app/server
VOLUME ["/app/server/data"]
EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s CMD wget -q -O - http://127.0.0.1:8787/healthz || exit 1

WORKDIR /app/server
ENTRYPOINT ["/app/server/docker-entrypoint.sh"]
