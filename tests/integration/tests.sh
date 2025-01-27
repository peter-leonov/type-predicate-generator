#!/usr/bin/env bash

set -eux -o pipefail

for test in src/tests/*; do
  echo "running $test"
  rm -rf "${test}/types_guards.ts"
  npx type-predicate-generator "$@" "${test}/types.ts" 1>"${test}/stdout.txt" 2>"${test}/stderr.txt"
  npx esbuild --bundle --outfile="${test}/types_guards.min.js" --minify "${test}/types_guards.ts"
  npx prettier -w "${test}"
done

