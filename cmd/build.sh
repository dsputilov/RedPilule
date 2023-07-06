#!/usr/bin/env bash

DIR="$(dirname "${BASH_SOURCE[0]}")"
DIR="$(realpath "${DIR}/../")"

rollup -c "${DIR}/rollup.config.js"
