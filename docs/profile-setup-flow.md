Yaddai – Setup Profile Flow (Dev Notes)

Screens implemented under `app/(main)/profile/setup/page.tsx` with global state in `app/context/profile-setup.tsx`. The Upload page (`app/(upload)/upload/page.tsx`) auto-imports the generated mock animation when the user is redirected from the setup flow.

Sketches
- Place your sketch images in `public/images/sketches/` (create if missing).
- Suggested filenames: `step-1.jpg`, `step-2.jpg`, `step-3.jpg`, `step-4.jpg`.
- They are optional and not required by the UI; they are for documentation/reference.

Behavior summary
- Step 1: Upload/take selfie, enter prompt, tap "GPT mini" (local enhancer) and "Go Banana" to generate up to 3 tinted attempts. Select one and continue.
- Step 2: Record 5s selfie via camera with countdown or upload a short video. Continue once present.
- Step 3: Tap "Generate Animation" to simulate a 4s job; then auto-redirect to `/upload` with the mock video preloaded for posting.

Future integration notes
- Replace the local prompt enhancer with the real API when available.
- Replace the canvas tint generator with your chosen image model (Nano Banana / SD / etc.) and store results.
- Replace the mock animation with a real service call and persist to storage.
