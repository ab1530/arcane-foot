#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${CI_REGISTRY_IMAGE:-}" || -z "${CI_COMMIT_SHA:-}" ]]; then
  echo "[deploy-staging] Missing CI registry variables" >&2
  exit 1
fi

if [[ -z "${STAGING_KUBE_CONFIG:-}" ]]; then
  echo "[deploy-staging] STAGING_KUBE_CONFIG is required" >&2
  exit 1
fi

# Login to GitLab container registry
if [[ -n "${CI_REGISTRY_USER:-}" && -n "${CI_REGISTRY_PASSWORD:-}" ]]; then
  echo "[deploy-staging] Logging into container registry"
  echo "$CI_REGISTRY_PASSWORD" | docker login "$CI_REGISTRY" -u "$CI_REGISTRY_USER" --password-stdin
fi

echo "[deploy-staging] Building backend image"
docker build -f Dockerfile.backend -t "$CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA" .

echo "[deploy-staging] Building web image"
docker build -f Dockerfile.web -t "$CI_REGISTRY_IMAGE/web:$CI_COMMIT_SHA" .

echo "[deploy-staging] Pushing backend image"
docker push "$CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA"

echo "[deploy-staging] Pushing web image"
docker push "$CI_REGISTRY_IMAGE/web:$CI_COMMIT_SHA"

# Deploy using kubectl
mkdir -p ~/.kube
echo "$STAGING_KUBE_CONFIG" | base64 -d > ~/.kube/config

kubectl set image deployment/arcane-backend arcane-backend="$CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA"
kubectl set image deployment/arcane-web arcane-web="$CI_REGISTRY_IMAGE/web:$CI_COMMIT_SHA"
kubectl rollout status deployment/arcane-backend
kubectl rollout status deployment/arcane-web

echo "[deploy-staging] Deployment finished"
