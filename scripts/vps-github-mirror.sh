#!/usr/bin/env bash

set -euo pipefail

repository="${1:-/www/git/homeowner-report-system.git}"

git --git-dir="$repository" push github main --tags
