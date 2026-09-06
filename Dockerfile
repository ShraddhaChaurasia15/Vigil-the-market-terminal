# Production Dockerfile for Vigil
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy root and package definitions
COPY package.json ./
COPY client/package*.json client/
COPY server/package*.json server/

# Install dependencies
RUN cd client && npm install
RUN cd server && npm install

# Copy source codes
COPY client client/
COPY server server/

# Build client and server
RUN cd client && npm run build
RUN cd server && npm run build

# Final lightweight runner
FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY package.json ./
COPY server/package*.json server/
RUN cd server && npm install --omit=dev

COPY --from=builder /app/client/dist /app/client/dist
COPY --from=builder /app/server/dist /app/server/dist

EXPOSE 5000

CMD ["node", "server/dist/index.js"]
