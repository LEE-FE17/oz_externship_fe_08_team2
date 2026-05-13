#!/usr/bin/env bash
# npm 기반 프로젝트 — pnpm 관련 파일이 남아있으면 경고합니다.

cmd=$(jq -r '.tool_input.command // empty' 2>/dev/null)

# git pull 또는 git push 가 아니면 그냥 통과
echo "$cmd" | grep -qE '^git (pull|push)( |$)' || exit 0

# pnpm 관련 파일 탐색 (node_modules 제외, 최대 3단계)
pnpm_files=$(find . -maxdepth 3 \( \
  -name "pnpm-lock.yaml" \
  -o -name ".pnpmfile.cjs" \
  -o -name "pnpm-workspace.yaml" \
\) ! -path "*/node_modules/*" 2>/dev/null | sort | tr '\n' ' ')

if [ -n "$pnpm_files" ]; then
  jq -nc --arg cmd "$cmd" --arg files "$pnpm_files" \
    '{"continue": false, "stopReason": ("⛔ pnpm 관련 파일이 남아있습니다: " + $files + "— 삭제 후 다시 시도하세요.")}'
else
  exit 0
fi
