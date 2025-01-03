#!/usr/bin/env bash

set -eux -o pipefail

rm -rf test_project
mkdir test_project
cp types.ts test_project

cd test_project
npm init -y
npm i -D type-predicate-generator
npx type-predicate-generator ./types.ts > guards.ts
