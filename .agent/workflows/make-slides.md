---
description: Create an animated slide presentation from source material using Agree Slide
---

1. Read `AGENTS.md` and `docs/AUTHORING.md`.
2. Read the user's script and source documents. Identify the audience, objective, required languages, contract documents and signing links. Do not invent missing contract terms.
3. Write `content/project.json` using `content/demo.project.json` and `src/content/project.ts` as the format reference. Use established layout patterns.
4. Reuse `public/illustrations/catalog.json`. Download approved designer-created illustrations only if stock does not fit. Record original URLs and licenses. Never draw SVG substitutes.
5. Prepare concise screen copy and separate neutral business narration in the requested languages. Generate the audio files with `scripts/narration.py` when the configured service is available.
6. Run `npm run content:compile`, `npm run build`, and playback checks. Check element sequencing, pause, documents, narration and landscape mobile layout.
7. Start `npm run dev` on the user's local checkout. Report the actual presentation path and any missing facts or unavailable audio. Do not give the user a cloud-local localhost URL.
