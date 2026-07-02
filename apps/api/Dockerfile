FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json apps/api/
RUN npm install

FROM deps AS build
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY --from=build /app/apps/api/dist dist
CMD ["sh", "-c", "node dist/database/migrate.js && node dist/main.js"]
