#!/usr/bin/env bash

# Drowse Lab ローカルビルド用スクリプト
#
# 必要なもの:
#   - Ruby 3.0以上
#   - Bundler（未導入の場合: gem install bundler）
#
# 使い方:
#   ./local-build.sh          # サイトを _site/ にビルド
#   ./local-build.sh build    # 上と同じ
#   ./local-build.sh serve    # 自動更新付きローカルサーバーを起動
#   ./local-build.sh --help   # ヘルプを表示
#
# serveで起動した場合のURL:
#   http://127.0.0.1:4000/Drowse-Lab/
#
# Rubyの依存パッケージは初回実行時に vendor/bundle/ へ自動で
# インストールされます。vendor/bundle/ と生成先の _site/ は
# .gitignore に登録されているため、Gitには追加されません。

# エラー、未定義変数、パイプ途中の失敗を検知したら直ちに終了します。
set -euo pipefail

# どのディレクトリから実行しても、プロジェクトルートで処理します。
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# gemをシステム領域ではなくプロジェクト内へインストールします。
export BUNDLE_PATH="${BUNDLE_PATH:-$SCRIPT_DIR/vendor/bundle}"

# macOSの古いシステムRubyより、HomebrewのRubyを優先します。
if command -v brew >/dev/null 2>&1; then
  BREW_RUBY_PREFIX="$(brew --prefix ruby 2>/dev/null || true)"
  if [[ -x "$BREW_RUBY_PREFIX/bin/ruby" ]]; then
    export PATH="$BREW_RUBY_PREFIX/bin:$PATH"
  fi
fi

usage() {
  printf '%s\n' \
    'Usage: ./local-build.sh [build|serve]' \
    '' \
    '  build  Build the site into _site/ (default)' \
    '  serve  Build and serve at http://127.0.0.1:4000/Drowse-Lab/'
}

# 引数がない場合は通常のビルドを実行します。
command_name="${1:-build}"

case "$command_name" in
  build|serve)
    ;;
  -h|--help|help)
    usage
    exit 0
    ;;
  *)
    printf 'Unknown command: %s\n\n' "$command_name" >&2
    usage >&2
    exit 2
    ;;
esac

# 必要なコマンドとRubyのバージョンを事前に確認します。
if ! command -v ruby >/dev/null 2>&1; then
  printf '%s\n' 'Ruby is required. Install Ruby and run this script again.' >&2
  exit 1
fi

if ! ruby -e 'exit RUBY_VERSION.to_f >= 3.0 ? 0 : 1'; then
  printf '%s\n' \
    "Ruby 3.0 or newer is required (current: $(ruby -v))." \
    'On macOS with Homebrew, install it with: brew install ruby' >&2
  exit 1
fi

if ! command -v bundle >/dev/null 2>&1; then
  printf '%s\n' 'Bundler is required. Install it with: gem install bundler' >&2
  exit 1
fi

# 不足しているgemがある場合だけbundle installを実行します。
if ! bundle check >/dev/null 2>&1; then
  printf '%s\n' 'Installing Ruby dependencies into vendor/bundle...'
  bundle install
fi

# serveではファイル変更の自動検知とブラウザの自動更新を有効にします。
if [[ "$command_name" == 'serve' ]]; then
  printf '%s\n' 'Starting Drowse Lab at http://127.0.0.1:4000/Drowse-Lab/'
  exec bundle exec jekyll serve --livereload --host 127.0.0.1
fi

# buildでは公開用ファイルを _site/ に生成します。
printf '%s\n' 'Building Drowse Lab...'
bundle exec jekyll build
printf '%s\n' "Build complete: $SCRIPT_DIR/_site"
