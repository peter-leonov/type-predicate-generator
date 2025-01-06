#!/usr/bin/env bash

set -eux -o pipefail

(
  cd generator
  npm i
  npm run ci
)

(
  cd tests/integration
  npm i
  npm run ci
)

git diff --exit-code

set +x
echo "✅ Ci run is successfull"
