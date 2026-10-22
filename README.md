# FlowTouch 2.1

Gesture control for Windows. A spatial glass landing page and a separate, downloadable Studio window powered by WebView2. The website offers the download; camera recognition and OS input belong to the desktop workspace.

## Run on Windows

Download `public/downloads/FlowTouch-Studio-Windows.zip`, extract the **entire folder**, and run `FlowTouch Studio.exe`. Python is bundled. Windows 10/11, .NET Framework 4.6.2+ and Microsoft Edge WebView2 Runtime are required. Close previous FlowTouch versions first. Connect the camera and explicitly enable commands. Escape pauses input and releases held keys globally.

The public `/studio/` route redirects to the download section. The native app hosts its own private local workspace at `127.0.0.1:8765`. It sends mouse and keyboard input to the active application and launches configured `.exe` files without a shell. Protected/elevated windows and games may reject injected input. No application can promise control of every protected program.

The portable release uses an unpacked directory, no UPX and no one-file self-extractor. **It is not Authenticode-signed yet.** This does not establish antivirus safety or guarantee removal of SmartScreen warnings. A trusted publisher certificate or Store distribution is still needed. Never disable Windows security to run this app. Compare the ZIP against `SHA256SUMS.txt`.

## Gesture library

126 recognizable patterns: **12 poses, 4 swipes, 110 ordered two-pose sequences**. These are not 126 distinct finger positions. Pick the corresponding recognition mode. Sequences consist of two held poses within 2.2 seconds. Open palm is always the pause gesture.

Choose an application profile, click any pattern, and assign a key/chord, mouse action, website or local executable. Profiles are stored on the device and support JSON import/export. Built-in profiles: Everyday, Creative, Geometry Dash. Add profiles for other applications.

Game mode uses pose transitions instead of the standard 800 ms hold. A pinch maps to Space hold in Geometry Dash; a fist taps Space. Keep Studio running while the target application is active. The dedicated WebView2 host disables background timer/renderer throttling for the live camera. Key release is enforced on lost tracking, pause, camera stop and the companion's input watchdog. Camera and hardware determine latency; this is not a guarantee of competitive game performance. Real camera gestures and each target game require user testing; a sample-photo check is not a live-camera test.

## Movement agent

OpenRouter, Ollama Cloud and local Ollama are supported in the desktop app's agent settings. Enter the provider, model and API key locally. Keys are encrypted with Windows DPAPI in `%LOCALAPPDATA%/FlowTouch/agent-settings.json`, outside the repository and website. No credentials are shipped in the executable. Other installations require their own key.

The optional agent receives **gesture IDs and confidence summaries**, never video or camera frames, at most once every 8 seconds. It describes movements and tracking quality. Deterministic local mappings perform OS input without waiting for the LLM; model text cannot run commands. The built-in offline observer is rule-based, not an LLM. Cloud failures explicitly fall back to that observer. OpenRouter `openrouter/free` still has provider quotas and availability limits. Local Ollama needs no key.

## Sound and graphics

The sound panel has separate opt-in controls for mechanical typing/click sounds and a quiet ambient pad, with independent volumes. No global key hook is used for typing sounds: only input inside FlowTouch triggers them. Password fields are excluded. Audio stops when the page is closed; ambience suspends while the document is hidden. Nothing autoplays.

The hero uses an ImageGen-cleaned high-resolution cutout derived from the user's reference. **It is not a rigged 3D copy of the hand.** Pointer tilt animates the graphic; individual finger articulation needs the source mesh or a newly generated, verified model. The actual Three.js room has perspective grid geometry, soft cube shadows, depth fog and opt-in rain. Motion and Remotion Player drive UI transitions and the explanatory input animation. Reduced motion and offscreen rendering are respected.

## Development and release

```sh
npm ci
npm run dev
npm test
python -m unittest discover -s tests -p "test_*.py"
npm run build
python -m pip install -r companion/requirements.txt
python scripts/build_desktop.py
npm run build
```

The final web rebuild includes the portable ZIP download. Vercel uses `vercel.json`; GitHub Pages uses `.github/workflows/deploy.yml` with `/FlowTouch/` as its base. Production source destination: `GX85/FlowTouch`. Landing and Studio have separate HTML entry points so their CSS is bundled independently.

Vite / Tailwind CSS / Motion / Three.js / MediaPipe / React / Remotion Player / pywebview. Original prototype hand mesh (unused on the new landing): WebXR Input Profiles, MIT (`public/models/HAND-LICENSE.md`). Fonts: SIL OFL. MediaPipe: Apache 2.0. Tripo and Higgsfield asset generation was unavailable at zero relevant credits; Mobbin requires a paid plan and Base44 needs reauthentication. No paid calls to those services were made.
