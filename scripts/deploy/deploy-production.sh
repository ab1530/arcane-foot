#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${CI_REGISTRY_IMAGE:-}" || -z "${CI_COMMIT_SHA:-}" ]]; then
  echo "[deploy-production] Missing CI registry variables" >&2
  exit 1
fi

if [[ -z "${PRODUCTION_KUBE_CONFIG:-}" ]]; then
  echo "[deploy-production] PRODUCTION_KUBE_CONFIG is required" >&2
  exit 1
fi

if [[ -n "${CI_REGISTRY_USER:-}" && -n "${CI_REGISTRY_PASSWORD:-}" ]]; then
  echo "[deploy-production] Logging into container registry"
  echo "$CI_REGISTRY_PASSWORD" | docker login "$CI_REGISTRY" -u "$CI_REGISTRY_USER" --password-stdin
fi

echo "[deploy-production] Building backend image"
docker build -f Dockerfile.backend -t "$CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA" .

echo "[deploy-production] Building web image"
docker build -f Dockerfile.web -t "$CI_REGISTRY_IMAGE/web:$CI_COMMIT_SHA" .

echo "[deploy-production] Pushing backend image"
docker push "$CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA"

echo "[deploy-production] Pushing web image"
docker push "$CI_REGISTRY_IMAGE/web:$CI_COMMIT_SHA"

mkdir -p ~/.kube
echo "$PRODUCTION_KUBE_CONFIG" | base64 -d > ~/.kube/config

kubectl set image deployment/arcane-backend arcane-backend="$CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA"
kubectl set image deployment/arcane-web arcane-web="$CI_REGISTRY_IMAGE/web:$CI_COMMIT_SHA"
kubectl rollout status deployment/arcane-backend
kubectl rollout status deployment/arcane-web

echo "[deploy-production] Deployment finished"
