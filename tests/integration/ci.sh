#!/usr/bin/env bash

set -eux -o pipefail

(
  cd ../../generator
  npm run build
)

npm i

rm -rf types_guards.ts types_guards.test.ts
npx type-predicate-generator --unitTests "./types.ts"

npx esbuild --bundle --outfile=types_guards.min.js --minify "types_guards.ts"

rm unsupported.1.txt unsupported.2.txt
npx type-predicate-generator ./unsupported.ts 1>unsupported.1.txt 2>unsupported.2.txt || true

npm run check

npx prettier -w .

git diff --exit-code
