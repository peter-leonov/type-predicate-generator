#!/usr/bin/env bash

set -eux -o pipefail

./ci.sh

(
  cd generator
  npm publish
)

(
  cd playground
  npm run build
)

# give NPM some time to propagate the change
sleep 5

(
  cd tests/e2e
  ./test.sh
)
