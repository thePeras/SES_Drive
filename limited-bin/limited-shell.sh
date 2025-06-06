#!/bin/bash

export PATH=/app/limited-bin

cmd="$1"
shift

if [[ -x "/app/limited-bin/$cmd" ]]; then
  "/app/limited-bin/$cmd" "$@"
else
  echo "Command not allowed: $cmd"
  exit 125
fi