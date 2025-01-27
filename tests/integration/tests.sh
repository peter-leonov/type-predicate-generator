#!/usr/bin/env bash

set -eux -o pipefail

npx type-predicate-generator "$@" src/tests/*/types.ts
