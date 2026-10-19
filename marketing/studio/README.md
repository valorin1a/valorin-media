# Valorin studio

One post file (posts/<id>.json) → feed card 1080×1350, vertical poster 1080×1920, narrated video 1080×1920 (about 45–60 s), and .srt captions.

1. `bash setup.sh` (installs the voice model and fonts)
2. Copy posts/einv-phase2-deadline.json, edit the content, keep the structure
3. `python3 build.py posts/<id>.json` (add `--card-only` for a quick card check). The video takes about 6 minutes.

The brand frame (header logo, series label, footer tagline and contacts) is fixed in build.py. Only post files change.
Rules: project file 06_Content_Production_Spec.md. Legal rules: knowledge pack, section 5a.
