#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTEXT_FILE="$ROOT_DIR/SITE_CONTEXT.yaml"
ARCHIVE_DIR="$ROOT_DIR/~archive"

usage() {
  printf 'Usage: %s <new-context-file>\n' "$(basename "$0")"
  printf 'Archives the existing SITE_CONTEXT.yaml, then replaces it with <new-context-file>.\n'
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -ne 1 ]]; then
  usage >&2
  exit 1
fi

NEW_CONTEXT="$1"

if [[ ! -f "$NEW_CONTEXT" ]]; then
  printf 'New context file not found: %s\n' "$NEW_CONTEXT" >&2
  exit 1
fi

mkdir -p "$ARCHIVE_DIR"

if [[ -f "$CONTEXT_FILE" ]]; then
  TIMESTAMP="$(date '+%Y%m%d_%H%M%S')"
  cp "$CONTEXT_FILE" "$ARCHIVE_DIR/SITE_CONTEXT_$TIMESTAMP.yaml"
fi

cp "$NEW_CONTEXT" "$CONTEXT_FILE"
printf 'Updated %s\n' "$CONTEXT_FILE"
