#!/usr/bin/env bash

set -eux -o pipefail

(
  cd ../../generator
  npm run build
)

npm i --no-audit

npx type-predicate-generator --help

./tests.sh
# to update unit tests that might require manual fixing:
# ./tests.sh --unitTests

npm run typecheck
CI=true npm test

npx prettier -w .

git diff --exit-code
