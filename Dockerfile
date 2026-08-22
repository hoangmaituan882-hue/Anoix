# CloudBase CloudRun build file (repo root — required for console Git deploys).
# Builds the anoix-api Express service.
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY server ./server

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/index.js"]
