#!/bin/sh
# 커밋 직전 개인정보 검사 (CLAUDE.md 5장)
# - 사진·녹음 파일이 커밋에 들어가면 막음
# - 사진을 글자(base64 데이터 주소)로 바꿔 코드에 넣은 것을 막음
# - .private-words.txt 에 적은 단어(아이 이름 등)가 들어가면 막음
# 사용: sh scripts/check-privacy.sh   (pre-commit 훅에서 자동 실행)

root=$(git rev-parse --show-toplevel) || exit 1
words="$root/.private-words.txt"
list=$(mktemp)
trap 'rm -f "$list"' EXIT

git -c core.quotePath=false diff --cached --name-only --diff-filter=ACMR > "$list"
[ -s "$list" ] || exit 0

if [ ! -s "$words" ]; then
  echo "❌ .private-words.txt 가 없거나 비어 있어요. 검사할 수 없어서 커밋을 멈춥니다."
  exit 1
fi

fail=0
while IFS= read -r f; do
  case "$f" in
    *.jpg|*.JPG|*.jpeg|*.JPEG|*.heic|*.HEIC|*.mp3|*.m4a|*.wav|*.ogg|*.webm|*.aac|*.mp4|*.mov)
      echo "❌ 사진·녹음 파일: $f"; fail=1; continue ;;
  esac
  if git show ":$f" | grep -qiE 'data:image/(jpe?g|heic|webp);base64'; then
    echo "❌ 글자로 바꿔 넣은 사진(base64): $f"; fail=1
  fi
  hit=$(git show ":$f" | grep -niF -f "$words" | head -3)
  if [ -n "$hit" ]; then
    echo "❌ 개인정보 단어: $f"; echo "$hit" | cut -c1-120; fail=1
  fi
  # 파일 이름 자체에 들어간 경우
  if printf '%s\n' "$f" | grep -qiF -f "$words"; then
    echo "❌ 파일 이름에 개인정보 단어: $f"; fail=1
  fi
done < "$list"

if [ "$fail" -ne 0 ]; then
  echo "→ 위 내용을 고친 뒤 다시 커밋해 주세요. (검사를 건너뛰지 마세요)"
  exit 1
fi
echo "✅ 개인정보 검사 통과"
