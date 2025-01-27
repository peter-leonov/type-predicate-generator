#!/usr/bin/env bash

echo "to update unit tests that might require manual fixing run with --unitTests"

set -eux -o pipefail

# (
#   cd ../../generator
#   npm run build
# )

npm i --no-audit

npx type-predicate-generator --help

for test in src/tests/*; do
  echo "running $test"
  rm -rf "${test}/types_guards.ts" "${test}/types_guards.min.js" "${test}/status.ts" "${test}/stdout.txt" "${test}/stderr.txt"

  if npx type-predicate-generator "$@" "${test}/types.ts" 1>"${test}/stdout.txt" 2>"${test}/stderr.txt"; then
    echo "$?" > "${test}/status.ts"
  else
    echo "$?" > "${test}/status.ts"
  fi
  
  if test -f "${test}/types_guards.ts"; then
  npx esbuild --bundle --outfile="${test}/types_guards.min.js" --minify "${test}/types_guards.ts"
  fi
done

npm run typecheck
CI=true npm test
npx prettier -w .
git diff --exit-code
