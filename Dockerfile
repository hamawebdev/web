# -----------------------------
# DEV STAGE
# -----------------------------
FROM node:24-bookworm-slim AS dev
WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y bash curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Turbo, npm, tsx globally
RUN npm install -g turbo npm tsx

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Dev command
CMD ["npm", "run", "dev"]

# -----------------------------
# BUILDER STAGE
# -----------------------------
FROM node:24-bookworm-slim AS builder
WORKDIR /app

# Accept build args
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_NAME

# Set ENV vars for build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_TELEMETRY_DISABLED=1

# Install global tools
RUN npm install -g turbo npm

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build the app
RUN npm run build

# -----------------------------
# PRODUCTION STAGE
# -----------------------------
FROM node:24-bookworm-slim AS prod
WORKDIR /app

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy built app from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

# Expose the port
EXPOSE 3000

# Start the production server using the standalone server
CMD ["node", "server.js"]