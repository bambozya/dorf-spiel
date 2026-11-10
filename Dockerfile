# Younes' Dorf als Container: Spielserver samt Spieldateien.
# Bauen:   docker build -t dorf .
# Starten: docker run -d -p 8787:8787 -e DORF_PASSWORD=… -e DORF_OWNER_TOKEN=… -v dorf-data:/app/server/data dorf
FROM node:22-alpine

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
VOLUME ["/app/server/data"]
EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s CMD wget -q -O - http://127.0.0.1:8787/healthz || exit 1

USER node
WORKDIR /app/server
CMD ["node", "index.js"]
