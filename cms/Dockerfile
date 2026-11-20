# --- Build : chaîne de compilation + devDependencies ---
FROM node:22-alpine AS build
RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git

WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV NODE_ENV=production
RUN npm run build && npm prune --omit=dev

# --- Runtime : dépendances de prod uniquement, utilisateur non-root ---
FROM node:22-alpine
RUN apk add --no-cache vips

WORKDIR /opt/app
ENV NODE_ENV=production

COPY --from=build --chown=node:node /opt/app ./

USER node
EXPOSE 1337

CMD ["npm", "run", "start"]
