# syntax=docker/dockerfile:1
ARG NODE_VERSION=22.13.1

FROM node:${NODE_VERSION}-slim

# Set working directory
WORKDIR /apps/web

# Install system deps needed for Node + Next
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
 && rm -rf /var/lib/apt/lists/*

# Copy package manifests first (for cache)
COPY package.json package-lock.json ./

# Install deps
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the source
COPY . .

# Expose Next.js dev port
EXPOSE 3000

# Development runtime
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]
