#!/usr/bin/env bash

set -eux -o pipefail

(
  cd generator
  npm i
  npm run ci
)

ls

(
  cd tests/integration
  npm i
  npm run ci
)
