FROM node:20-bullseye

ENV DEBIAN_FRONTEND=noninteractive
ENV NPM_CONFIG_CACHE=/cache/npm
ENV PLAYWRIGHT_BROWSERS_PATH=/cache/ms-playwright

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    jq \
    postgresql-client \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
