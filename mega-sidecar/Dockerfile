FROM node:20-slim

RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

RUN wget -O /tmp/megacmd.deb https://mega.nz/linux/repo/Debian_12/amd64/megacmd-Debian_12_amd64.deb && \
    apt-get update && apt-get install -y /tmp/megacmd.deb && \
    rm -f /tmp/megacmd.deb && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json server.js ./

RUN npm install --omit=dev

EXPOSE 3002

CMD ["node", "server.js"]
