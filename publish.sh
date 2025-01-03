#!/usr/bin/env bash

set -eux -o pipefail

./ci.sh

(
  cd generator
  npm publish
)
