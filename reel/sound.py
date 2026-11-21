"""Sound design + mix for the Runway reel.
Synthesises original SFX (impact, whooshes, UI ticks, water drop, riser),
ducks the ElevenLabs instrumental under the narration and writes mix.wav."""
import json, subprocess, sys
import numpy as np

SR = 48000
DUR = 60.0
VO_OFF = 0.5
N = int(SR * DUR)
rng = np.random.default_rng(7)


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def place(buf, sig, t, gain=1.0):
    i = int(t * SR)
    if i >= len(buf):
        return
    sig = sig[:len(buf) - i]
    buf[i:i + len(sig)] += sig * gain


def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(t / max(a, 1e-4), 1) * np.exp(-t / d)


def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def impact(dur=1.6):
    n = int(SR * dur); t = np.arange(n) / SR
    f = 30 + 70 * np.exp(-t * 9)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.6)
    click = rng.standard_normal(n) * np.exp(-t * 60) * .5
    return np.tanh((body + lowpass(click, 2500)) * 1.6) * .9


def whoosh(dur=.55, up=True):
    n = int(SR * dur); t = np.linspace(0, 1, n)
    noise = rng.standard_normal(n)
    shape = np.sin(np.pi * t) ** 2 if up else np.exp(-t * 5)
    # moving band: blend two lowpasses so the sweep "travels"
    lo, hi = lowpass(noise, 600), lowpass(noise, 4000) - lowpass(noise, 900)
    mix = lo * (1 - t) + hi * t
    return mix * shape * .55


def tick(freq=2400, dur=.035):
    n = int(SR * dur); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * t) * .5 + rng.standard_normal(n) * .3) * np.exp(-t * 160) * .35


def ping(freq=880, dur=.6):
    n = int(SR * dur); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * t) + .3 * np.sin(2 * np.pi * freq * 2.01 * t)) * env(n, .004, .18) * .18


def drop():
    n = int(SR * 1.2); t = np.arange(n) / SR
    f = 500 + 1400 * (1 - np.exp(-t * 40))  # rising "bloop"
    bloop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28)
    thud = np.sin(2 * np.pi * 90 * t) * np.exp(-t * 14) * .6
    splash = lowpass(rng.standard_normal(n), 5000) * np.exp(-t * 9) * .25
    s = bloop * .7 + thud + splash
    # small room tail
    tail = np.zeros(n)
    for d, g in [(.045, .35), (.09, .22), (.15, .12)]:
        k = int(d * SR); tail[k:] += s[:n - k] * g
    return (s + tail) * .6


def riser(dur=3.0):
    n = int(SR * dur); t = np.linspace(0, 1, n)
    noise = lowpass(rng.standard_normal(n), 3000) * t ** 2 * .35
    tone = np.sin(2 * np.pi * np.cumsum(180 + 260 * t ** 2) / SR) * t ** 2 * .12
    return (noise + tone) * np.minimum(1, (1 - t) * 30)


def snap():
    a = tick(600, .08) * .8; a[:2400] += tick(1800, .05) * 1.4; return a


def main(root):
    vo = load(f'{root}/vo.mp3')
    music = load(f'{root}/music.mp3')
    sfx = np.zeros(N, np.float32)
    voice = np.zeros(N, np.float32)
    place(voice, vo, VO_OFF)

    place(sfx, impact(), .15, 1.0)                       # SEM CÂMERA?
    for t in (1.55, 6.0, 17.55, 25.75, 31.15, 45.35, 51.35):
        place(sfx, whoosh(.6), t - .3, .8)               # scene transitions
    for t in (1.9, 2.55, 3.2):
        place(sfx, whoosh(.25, False), t, .7); place(sfx, impact(.5), t, .35)  # match cuts
    place(sfx, whoosh(.5), 3.85, .5)                     # COM IA type
    # Runway reveal + UI
    place(sfx, ping(660), 6.2); place(sfx, ping(990, .4), 8.5)
    for i in range(30):                                  # prompt typing in UI
        place(sfx, tick(2600 + rng.integers(-300, 300)), 13.0 + i * .04, .5)
    place(sfx, snap(), 14.3, .9)                         # Gerar
    place(sfx, ping(880), 14.5); place(sfx, ping(1320), 16.8)
    # droplet prompt typing
    nchar = 104
    for i in range(nchar):
        if i % 2 == 0:
            place(sfx, tick(2300 + rng.integers(-400, 400)), 17.9 + i * (2.4 / nchar), .45)
    place(sfx, whoosh(.7), 20.4, .7)                     # liquid transition
    place(sfx, drop(), 21.0, 1.0)
    # image -> motion
    place(sfx, ping(740), 26.0); place(sfx, whoosh(1.0), 27.4, .6); place(sfx, whoosh(1.4), 28.3, .35)
    # tip: labels
    place(sfx, impact(.8), 31.35, .4)
    for t, f in ((37.1, 880), (38.3, 990), (39.6, 1320)):
        place(sfx, ping(f), t, 1.0)
    place(sfx, whoosh(.8), 40.9, .6)
    for i, t in enumerate((41.8, 42.05, 42.3)):
        place(sfx, tick(1600 + i * 200, .05), t, .8)
    # timeline: magnetic snaps
    for t in (46.2, 46.75, 47.3):
        place(sfx, snap(), t, 1.0)
    place(sfx, whoosh(.8), 47.6, .35)
    for t in (49.15, 49.4, 49.65):
        place(sfx, tick(2000, .05), t, .8)
    # ending
    for t in (51.8, 52.2, 52.55):
        place(sfx, whoosh(.2, False), t, .5)
    place(sfx, riser(3.0), 50.6, .9)
    place(sfx, impact(2.5), 53.6, .45)
    place(sfx, ping(660, 1.5), 55.4, .8)

    # music: duck under narration (smoothed VO envelope)
    m = np.zeros(N, np.float32); m[:min(N, len(music))] = music[:N]
    e = np.abs(voice); w = int(.25 * SR)
    e = np.convolve(e, np.ones(w) / w, 'same')
    e = e / (e.max() + 1e-9)
    duck = 1 - .65 * np.clip(e * 6, 0, 1)
    duck = np.convolve(duck, np.ones(int(.15 * SR)) / int(.15 * SR), 'same')
    t = np.arange(N) / SR
    fade = np.clip((DUR - t) / 3.0, 0, 1)                # cinematic fade-out
    mix = voice * 1.0 + m * .20 * duck + sfx * .22
    mix *= np.where(t > DUR - 3, fade ** 1.5, 1)
    mix = np.tanh(mix * 1.1) / 1.1
    return mix.astype(np.float32)


if __name__ == '__main__':
    root = sys.argv[1]
    mix = main(root)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-ar', '48000', '-ac', '2', f'{root}/mix.wav'],
                   input=mix.tobytes(), check=True)
    print('ok')
