# Reel — RUNWAY AI: da ideia ao vídeo cinematográfico

**v3 (atual):** motion design 100% vetorial, sem imagens nem legendas. Fundo branco com tons de azul e texto cinético sincronizado palavra por palavra com a narração (`render.html`). A versão anterior, com imagens, ficou em `render_v2_images.html`.

Final: `out/runway-ai-reel-sfelipe0c.mp4`. Vertical 9:16, 1080×1920, 30 fps, about 60 s, H.264 + AAC.

## What was produced and with which tool

| Element | Source |
|---|---|
| Narration (PT-BR) | ElevenLabs `eleven_v4`, existing library voice "Jerri – Warm, Conversational" (`XMies1moPVDGdidVT4IX`). No cloning, no new voice. |
| Word-level sync | ElevenLabs forced alignment → `words.json` (drives the subtitles and scene timing) |
| Droplet, car and landscape frames | **Runway Gen-4 Image** (9:16, 1080p) via ElevenLabs Flows |
| Instrumental | ElevenLabs Music v2.5, original, instrumental, 60 s |
| Motion design, typography, UI diagrams, subtitles, grain, watermark | `render.html` (Canvas 2D), rendered frame by frame with `render.js` (Playwright → ffmpeg) |
| SFX + mix | `sound.py`: synthesized original SFX, music ducked under the voice, loudnorm −14 LUFS |

## Rebuild

```
node render.js /tmp/video.mp4 0 60
python3 sound.py .
ffmpeg -i /tmp/video.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest out/runway-ai-reel-sfelipe0c.mp4
```

## Pending items (blocked on the current account)

1. **Runway video shots.** Runway video models (Gen-4.5) need a paid ElevenLabs plan. For now the shots are Runway Gen-4 stills with camera movement added in the edit, and the video says so on screen. To swap them in, export 9:16 MP4s and replace `cover(IMG.x …)` with `<video>` frames:
   - S03: `A single water droplet falls in slow motion onto a glossy black surface, crown splash and concentric ripples, cool blue rim light, smooth forward dolly, extreme macro, shallow depth of field.` (Gen-4.5, 5 s)
   - S04 (image-to-video from `assets/car.png`): `The camera slowly orbits from the front headlight toward the driver's side of the stationary car while soft reflections move across its surface.`
   - S01 landscape (image-to-video from `assets/land.png`): `Low clouds roll slowly over the mountain ridges, camera holds still.`
2. **Official Runway logo.** The official logo couldn't be downloaded from this environment, so the name appears in plain type. Drop the official file at `assets/logo.png` and the renderer will use it automatically.
3. **Driver's-side still** (`assets/car_side.png`). This frame hit the free plan's daily image limit. The node is ready in the ElevenLabs flow. If the file exists, the renderer crossfades into it during the orbit.
