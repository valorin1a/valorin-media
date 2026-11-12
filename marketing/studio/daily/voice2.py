"""Audio for the 9:16 shorts engine (shorts.js, 6 Nov 2026).

One audio segment per spoken line, so every line can start a visual change and dialogue lines can use
a second voice. Re-uses the original music bed from audio.py (no third-party music).

  python3 voice2.py voice <lines.json> <outdir>
      lines.json = [{"text": "...", "voice": "bm_george", "speed": 0.85, "pause": 0}, ...]
      writes seg_N.wav and timing.json {"durations": [...], "speech": [...]} (seconds)
  python3 voice2.py mix <outdir> <total_seconds> <fps> <out.wav>
      writes the mix and env.json: voice loudness per video frame (0..1), for mouth movement
"""
import json, os, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio import read_wav, write_wav, music, SR  # noqa: E402

LEAD = 0.06   # silence before each line
TAIL = 0.16   # gap after each line (tighter than the 29 Oct studio: faster mobile pace)


def voice(linefile, outdir):
    from kokoro_onnx import Kokoro
    import soundfile as sf
    k = Kokoro('/tmp/kokoro/kokoro.onnx', '/tmp/kokoro/voices.bin')
    lines = json.load(open(linefile))
    durs, speech = [], []
    for i, ln in enumerate(lines):
        audio, sr = k.create(ln['text'], voice=ln.get('voice', 'bm_george'), speed=float(ln.get('speed', 0.85)), lang='en-gb')
        raw, out = os.path.join(outdir, f'seg_{i}.raw.wav'), os.path.join(outdir, f'seg_{i}.wav')
        sf.write(raw, audio, sr, subtype='PCM_16')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af',
                        'highpass=f=70,silenceremove=start_periods=1:start_threshold=-45dB,areverse,'
                        'silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', str(SR), out], check=True)
        os.remove(raw)
        s = len(read_wav(out)) / SR
        speech.append(s)
        durs.append(LEAD + s + TAIL + float(ln.get('pause', 0)))
    json.dump({'durations': durs, 'speech': speech, 'lead': LEAD}, open(os.path.join(outdir, 'timing.json'), 'w'))
    print(json.dumps({'total': round(sum(durs), 2), 'lines': len(durs)}))


def mix(outdir, total, fps, outpath):
    total, fps = float(total), int(fps)
    tm = json.load(open(os.path.join(outdir, 'timing.json')))
    n = int(total * SR)
    vox = np.zeros(n, dtype=np.float32)
    start = 0.0
    for i, d in enumerate(tm['durations']):
        seg = read_wav(os.path.join(outdir, f'seg_{i}.wav'))
        s = int((start + LEAD) * SR)
        vox[s:s + len(seg)] += seg[:max(0, n - s)]
        start += d
    vox = vox / (np.abs(vox).max() + 1e-9) * 0.9
    mus = music(total)
    env = np.convolve(np.abs(vox), np.ones(int(0.2 * SR)) / int(0.2 * SR), mode='same')
    duck = np.where(env > 0.01, 0.10, 0.22)
    duck = np.convolve(duck, np.ones(int(0.25 * SR)) / int(0.25 * SR), mode='same')
    write_wav(outpath, vox + mus * duck)
    # per-frame voice loudness for mouth movement
    hop = SR // fps
    fr = [float(np.sqrt(np.mean(vox[i:i + hop] ** 2))) for i in range(0, n, hop)]
    mx = max(fr) or 1
    json.dump([round(min(1, x / mx * 1.6), 3) for x in fr], open(os.path.join(outdir, 'env.json'), 'w'))
    print('saved', outpath)


if __name__ == '__main__':
    if sys.argv[1] == 'voice':
        voice(sys.argv[2], sys.argv[3])
    else:
        mix(*sys.argv[2:6])
