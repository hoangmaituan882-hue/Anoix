# CloudBase CloudRun build file (repo root — console Git deploys).
# Multi-stage: build the frontend, then ship it with the Express web+api service.

# ---- Stage 1: frontend build ----
FROM node:20-alpine AS web-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Stage 2: runtime ----
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev
COPY server ./server
COPY --from=web-build /app/dist ./dist

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/index.js"]
