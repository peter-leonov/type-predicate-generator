#!/usr/bin/env bash

set -eux -o pipefail

(
  cd generator
  npm i --no-audit
  npm run ci
)

(
  cd tests/integration
  ./ci.sh
)

git diff --exit-code

set +x
echo "✅ CI run is successfull"
