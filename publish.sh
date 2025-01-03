#!/usr/bin/env bash

set -eux -o pipefail

./ci.sh

(
  cd generator
  npm publish
)

# give NPM some time to propagate the change
sleep 15

(
  cd tests/e2e
  ./test.sh
)
