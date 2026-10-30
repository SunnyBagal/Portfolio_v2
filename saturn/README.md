# Saturn

A 3D portfolio: Saturn is me, its rings hold my story, and the moon holds a campaign pitch. Drag to orbit, click a glowing rock, and the camera flies to it while a side panel opens.

```sh
npm install
npm run dev          # http://localhost:5173  (add ?fps for a frame-rate readout)
npm run build        # type-check + production build
npm run screenshots  # build, then Playwright screenshots into screenshots/
```

Playwright needs its browser once: `npx playwright install chromium`.

## Editing the copy

Everything on screen comes from `src/content.ts`. Anything wrapped in `PLACEHOLDER('…')` renders with a dashed underline until you replace it. Each story's `rawDictation` field is what the panel's "Raw dictation" toggle shows.

## Layout

| Path | What it does |
| --- | --- |
| `src/content.ts` | All copy, typed |
| `src/main.ts` | Renderer, scene assembly, view state, picking, render loop |
| `src/camera-rig.ts` | Camera fly-to with hand-written easing (cuts under reduced motion) |
| `src/intents.ts` | Text → navigation intent, shared by voice and typed input |
| `src/scene/` | Planet, rings (InstancedMesh), moon, starfield, procedural textures, shaders |
| `src/ui/` | Story panel, command bar (Web Speech API), rich-text rendering |
| `scripts/screenshots.mjs` | Screenshots + fps measurement |

Stack: Vite, TypeScript, three.js 0.186.1 (OrbitControls, CSS2DRenderer). No UI framework, no texture files.
