FROM node:20-bullseye

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    postgresql-client \
    ca-certificates \
    git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
