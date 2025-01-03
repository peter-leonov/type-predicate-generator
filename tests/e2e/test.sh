#!/usr/bin/env bash

set -eux -o pipefail

rm -rf test_project
mkdir test_project
cp types.ts guards.test.ts test_project

cd test_project
npm init -y
npm i -D vitest typescript type-predicate-generator
npx type-predicate-generator ./types.ts > guards.ts
CI=1 npx vitest
npx tsc --init
npx tsc --strict

set +x
echo "✅ e2e test run successfully"
