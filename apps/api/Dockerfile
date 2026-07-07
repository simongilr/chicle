FROM node:22.22.3-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json apps/api/
RUN npm ci --workspace @chicle/api --include-workspace-root

FROM deps AS build
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN npm run build

FROM node:22.22.3-alpine
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY --from=build /app/apps/api/dist dist
CMD ["sh", "-c", "node dist/database/migrate.js && node dist/main.js"]
