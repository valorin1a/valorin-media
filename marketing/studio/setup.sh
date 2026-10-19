#!/usr/bin/env bash
# Rebuild the Valorin studio environment in a fresh workspace.
# Needs: python3, node/npm, ffmpeg, Chromium for Playwright (preinstalled in Claude's workspace).
set -e
cd "$(dirname "$0")"
pip install -q --break-system-packages kokoro-onnx soundfile playwright
mkdir -p assets/fonts /tmp/kokoro
[ -f /tmp/kokoro/kokoro.onnx ] || curl -sSL -o /tmp/kokoro/kokoro.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx
[ -f /tmp/kokoro/voices.bin ]  || curl -sSL -o /tmp/kokoro/voices.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
if [ ! -f assets/fonts/roboto-latin-400-normal.woff2 ]; then
  T=$(mktemp -d); (cd $T && npm init -y >/dev/null && npm i -s @fontsource/roboto-condensed@5.0.14 @fontsource/roboto@5.0.13 >/dev/null)
  cp $T/node_modules/@fontsource/roboto-condensed/files/roboto-condensed-latin-{400,700,800}-normal.woff2 assets/fonts/
  cp $T/node_modules/@fontsource/roboto/files/roboto-latin-{400,500,700}-normal.woff2 assets/fonts/
fi
[ -f assets/logo.png ] || echo "MISSING assets/logo.png: attach the Valorin logo lockup (V mark + VALORIN + Finance | Tax | Advisory) as a transparent PNG."
echo "Ready. Run: python3 build.py posts/<id>.json"
