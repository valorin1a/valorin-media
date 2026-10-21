"""Audio for the Peppol Pulse video: voiceover (Piper TTS, LibriTTS voice, CC BY 4.0)
plus an original, procedurally generated corporate music bed (no third-party music).

Usage:
  python3 audio.py voice  <model.onnx> <speaker_id> <segments.json> <outdir>
      segments.json = ["text for scene 1", "text for scene 2", ...]
      writes <outdir>/seg_N.wav and <outdir>/timing.json  ({"durations":[...]} in seconds)
  python3 audio.py mix    <outdir> <total_seconds> <out.wav>
      places each seg_N.wav at the start of its scene, adds the music bed (ducked), fades out
"""
import json, os, subprocess, sys, wave
import numpy as np

SR = 44100
LEAD = 0.25   # silence before each spoken segment
TAIL = 0.45   # breathing room after each segment


def read_wav(path):
    with wave.open(path, 'rb') as w:
        sr, n, ch = w.getframerate(), w.getnframes(), w.getnchannels()
        x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    if sr != SR:  # linear resample to 44.1 kHz
        t_old = np.arange(len(x)) / sr
        t_new = np.arange(int(len(x) * SR / sr)) / SR
        x = np.interp(t_new, t_old, x).astype(np.float32)
    return x


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    stereo = np.stack([x, x], axis=1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((stereo * 32767).astype(np.int16).tobytes())


# Clarity chain, applied to the voice only: cut low rumble, reduce boxiness,
# lift consonant presence (3 kHz), and gently even out loudness so soft words are not lost.
CLARITY = ('highpass=f=90,'
           'equalizer=f=250:width_type=q:width=1:g=-2,'
           'equalizer=f=3000:width_type=q:width=1.2:g=3,'
           'acompressor=threshold=0.1:ratio=3:attack=5:release=100:makeup=1.3')


def clarify(path):
    tmp = path + '.clar.wav'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', path, '-af', CLARITY, tmp], check=True)
    os.replace(tmp, path)


# Kokoro voice, identical to the Valorin Marketing studio (marketing/studio/build.py):
# Kokoro-82M int8, voice bm_george, speed 0.85, British English, high-pass at 70 Hz.
KOKORO_CHAIN = 'highpass=f=70'


def voice_kokoro(kdir, name, speed, segfile, outdir):
    from kokoro_onnx import Kokoro
    import soundfile as sf
    k = Kokoro(os.path.join(kdir, 'kokoro.onnx'), os.path.join(kdir, 'voices.bin'))
    segs = json.load(open(segfile))
    durs = []
    for i, text in enumerate(segs):
        audio, sr = k.create(text, voice=name, speed=float(speed), lang='en-gb')
        raw = os.path.join(outdir, f'seg_{i}.raw.wav')
        out = os.path.join(outdir, f'seg_{i}.wav')
        sf.write(raw, audio, sr, subtype='PCM_16')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', KOKORO_CHAIN, '-ar', str(SR), out], check=True)
        os.remove(raw)
        durs.append(LEAD + len(read_wav(out)) / SR + TAIL)
    json.dump({'durations': durs}, open(os.path.join(outdir, 'timing.json'), 'w'))
    print(json.dumps({'durations': durs, 'total': sum(durs)}))


def voice(model, speaker, segfile, outdir):
    os.makedirs(outdir, exist_ok=True)
    if model.startswith('kokoro:'):
        name, _, speed = str(speaker).partition('@')
        return voice_kokoro(model[len('kokoro:'):], name, speed or 0.85, segfile, outdir)
    segs = json.load(open(segfile))
    durs = []
    for i, text in enumerate(segs):
        out = os.path.join(outdir, f'seg_{i}.wav')
        subprocess.run([sys.executable, '-m', 'piper', '-m', model, '-s', str(speaker),
                        '--length-scale', '1.0', '--sentence-silence', '0.15', '-f', out],
                       input=text.encode(), check=True, capture_output=True)
        clarify(out)
        durs.append(LEAD + len(read_wav(out)) / SR + TAIL)
    json.dump({'durations': durs}, open(os.path.join(outdir, 'timing.json'), 'w'))
    print(json.dumps({'durations': durs, 'total': sum(durs)}))


def note(f, dur, amp, attack=0.4, release=0.8, partials=((1, 1), (2, .35), (3, .12))):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, (dur - t) / release))
    sig = sum(a * (np.sin(2 * np.pi * f * k * t) + np.sin(2 * np.pi * f * k * 1.003 * t)) for k, a in partials)
    return amp * env * sig


def music(total):
    n = int(total * SR)
    out = np.zeros(n + SR * 3, dtype=np.float32)
    bpm, beat = 96, 60 / 96
    bar = beat * 4
    # C major progression I – V – vi – IV (frequencies of chord tones)
    chords = [[261.63, 329.63, 392.00], [246.94, 293.66, 392.00],
              [220.00, 261.63, 329.63], [220.00, 261.63, 349.23]]
    roots = [65.41, 98.00, 110.00, 87.31]
    t0, ci = 0.0, 0
    while t0 < total:
        ch = chords[ci % 4]
        s = int(t0 * SR)
        for f in ch:                                   # warm pad
            pad = note(f, bar + 0.6, 0.035, attack=0.6, release=0.9)
            out[s:s + len(pad)] += pad[:len(out) - s]
        bass = note(roots[ci % 4], bar, 0.07, attack=0.05, release=0.4, partials=((1, 1), (2, .25)))
        out[s:s + len(bass)] += bass[:len(out) - s]
        for k in range(8):                             # soft arpeggio on 8th notes
            f = ch[k % 3] * (2 if k % 4 < 2 else 4) / 2
            ps = int((t0 + k * beat / 2) * SR)
            pl = note(f * 2, 0.5, 0.03, attack=0.005, release=0.45, partials=((1, 1), (2, .2)))
            out[ps:ps + len(pl)] += pl[:len(out) - ps]
        for k in range(4):                             # gentle pulse (kick-like thump)
            ks = int((t0 + k * beat) * SR)
            kt = np.arange(int(0.18 * SR)) / SR
            kick = 0.09 * np.sin(2 * np.pi * (55 + 60 * np.exp(-kt * 30)) * kt) * np.exp(-kt * 18)
            out[ks:ks + len(kick)] += kick[:len(out) - ks]
        t0 += bar; ci += 1
    # simple room reverb via feedback delays
    for d, g in ((0.031, .25), (0.047, .2), (0.083, .15)):
        k = int(d * SR)
        out[k:] += g * out[:-k]
    out = out[:n]
    fade = int(1.5 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)
    out[:int(0.3 * SR)] *= np.linspace(0, 1, int(0.3 * SR))
    return out / (np.abs(out).max() + 1e-9)


def mix(outdir, total, outpath):
    total = float(total)
    durs = json.load(open(os.path.join(outdir, 'timing.json')))['durations']
    n = int(total * SR)
    vox = np.zeros(n, dtype=np.float32)
    start = 0.0
    for i, d in enumerate(durs):
        seg = read_wav(os.path.join(outdir, f'seg_{i}.wav'))
        s = int((start + LEAD) * SR)
        vox[s:s + len(seg)] += seg[:max(0, n - s)]
        start += d
    vox = vox / (np.abs(vox).max() + 1e-9) * 0.9
    mus = music(total)
    # duck music under speech
    env = np.convolve(np.abs(vox), np.ones(int(0.2 * SR)) / int(0.2 * SR), mode='same')
    duck = np.where(env > 0.01, 0.10, 0.22)
    duck = np.convolve(duck, np.ones(int(0.25 * SR)) / int(0.25 * SR), mode='same')
    write_wav(outpath, vox + mus * duck)
    print('saved', outpath)


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'voice':
        voice(*sys.argv[2:6])
    elif cmd == 'mix':
        mix(*sys.argv[2:5])
