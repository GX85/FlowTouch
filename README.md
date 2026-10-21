# FlowTouch 2.0

Gesture control for Windows. A simple white landing page, an independent `/studio/` workspace, a skinned 3D hand, and a Windows companion for system input.

## Run on Windows

Download `public/downloads/FlowTouch.exe`, close the previous version, and run it. It opens `http://127.0.0.1:8765/studio/`. Connect the camera and explicitly enable commands. Escape pauses input and releases held keys globally.

The browser site supports camera recognition and training. The Windows companion sends mouse and keyboard input to the active application and launches configured `.exe` files without a shell. Some protected or elevated windows and games can restrict injected input.

## Gesture library

126 recognizable patterns: **12 poses, 4 swipes, 110 ordered two-pose sequences**. These are not 126 distinct finger positions. Pick the corresponding recognition mode. Sequences consist of two held poses within 2.2 seconds. Open palm is always the pause gesture.

Choose an application profile, click any pattern, and assign a key/chord, mouse action, website or local executable. Profiles are stored on the device and support JSON import/export. Built-in profiles: Everyday, Creative, Geometry Dash. Add profiles for other applications.

Game mode uses pose transitions instead of the standard 800 ms hold. A pinch maps to Space hold in Geometry Dash; a fist taps Space. Keep Studio's camera running while the target application is active. Minimized or background browsers may throttle capture. Key release is enforced on lost tracking, pause, camera stop and the companion's input watchdog. Camera and hardware determine latency; this is not a guarantee of competitive game performance.

## Movement agent

OpenRouter, Ollama Cloud and local Ollama are supported in the desktop app's agent settings. Enter the provider, model and API key locally. Keys are encrypted with Windows DPAPI in `%LOCALAPPDATA%/FlowTouch/agent-settings.json`, outside the repository and website. No credentials are shipped in the executable. Other installations require their own key.

The optional agent receives **gesture IDs and confidence summaries**, never video or camera frames, at most once every 8 seconds. It describes movements and tracking quality. Deterministic local mappings perform OS input without waiting for the LLM; model text cannot run commands. The default OpenRouter model is `openrouter/free`; provider quotas and availability still apply. Local Ollama needs no key.

## Development and release

```sh
npm ci
npm run dev
npm test
python -m unittest discover -s tests -p "test_*.py"
npm run build
python scripts/build_desktop.py
npm run build
```

The final web rebuild includes the new executable download. Vercel uses `vercel.json`; GitHub Pages uses `.github/workflows/deploy.yml` with `/FlowTouch/` as its base. Select GitHub Actions in repository Pages settings. Production source destination: `GX85/FlowTouch`.

Vite / Tailwind CSS / Motion / Three.js / MediaPipe / React / Remotion Player. Hand mesh: WebXR Input Profiles, MIT (`public/models/HAND-LICENSE.md`), restored from the original prototype. Fonts: SIL OFL. MediaPipe: Apache 2.0. Robot visuals were implemented locally; no Tripo or Higgsfield generation was billed.
