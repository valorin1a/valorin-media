#!/usr/bin/env bash
# Set up the premium brand-card and video toolkit in a fresh workspace.
# Needs python3, node/npm, ffmpeg and the preinstalled Chromium headless shell.
set -e
cd "$(dirname "$0")"
npm install --silent
pip install -q --break-system-packages kokoro-onnx soundfile numpy
mkdir -p /tmp/kokoro posts
[ -f /tmp/kokoro/kokoro.onnx ] || curl -sSL -o /tmp/kokoro/kokoro.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx
[ -f /tmp/kokoro/voices.bin ]  || curl -sSL -o /tmp/kokoro/voices.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
echo "Ready. Cards: node render.js posts/<id>.json <out.png> [feed|pinterest|landscape|wide]. Video: node video.js posts/<id>.json <out.mp4> <captions.srt>"
