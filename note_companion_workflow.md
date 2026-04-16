# Note Companion — review workflow (draft)

## Project goal

Explore whether the **Obsidian Note Companion** plugin can support a reliable **daily capture** and **weekly reflection** practice, aligned with a Loglife-style rhythm: quick logging in the moment, then structured review and light planning without heavy overhead.

## Current context

- **Evaluating** Note Companion as the capture and optional AI-assisted layer for a **Loglife workflow** (daily notes, periodic review, continuity across weeks).
- This repo holds **documentation and templates only** while the workflow is designed and tested in a real vault.

## Raw vs AI-processed note separation

- **Raw notes**: first-pass capture (voice, quick type, paste). Minimal editing; timestamp or daily anchor as decided in the vault.
- **AI-processed notes** (when used): summaries, extractions, or rewrites produced **after** raw capture, stored or labeled so originals stay findable and auditable.
- **Principle**: never overwrite raw capture with AI output without an explicit step or location for the original.

## Proposed folder structure (vault)

Illustrative only — adjust names to match your vault.

- `Daily/` — same-day capture and scratch
- `Reviews/` — daily review pages, weekly summaries
- `Planning/` (optional) — light next-week or next-day intent
- `Reference/` (optional) — stable lists (projects, goals) if you use them

Keep depth shallow until habits stick.

## Daily workflow

1. **Capture** through the day into the day’s note or inbox (method TBD: plugin defaults vs manual).
2. **End-of-day (or next morning)**: short pass — what happened, mood/energy if tracked, one line “what matters tomorrow.”
3. **Optional**: run Note Companion on selected blocks if you want a summary or extraction; save output in a clearly named section or sibling note.

## Weekly workflow

1. **Gather**: skim daily notes for the week (and any tagged items if you use tags).
2. **Review**: themes, wins, friction, energy patterns — keep it honest and brief.
3. **Plan**: 1–3 priorities for the coming week; optional backlog triage.
4. **Optional**: weekly summary note (template in `templates/weekly_summary_template.md`).

## Assumptions

- Obsidian and Note Companion are installed; exact plugin settings are not fixed yet.
- “Loglife workflow” here means **regular logging + periodic review**, not a specific commercial product integration unless you add one later.
- AI features are **optional**; the workflow should still work with manual notes only.

## Open questions

- Where should raw vs processed content live (same note with headings vs separate notes)?
- Which Note Companion commands or flows will be standard for daily vs weekly use?
- How much automation (templates, hotkeys, Dataview) vs plain markdown?
- Retention: how long to keep scratch vs polished summaries?

## Next testing steps

- [ ] Pick one week and run the daily template every day without AI.
- [ ] Add one Note Companion step mid-week; compare friction vs plain notes.
- [ ] Complete one weekly summary using `weekly_summary_template.md`.
- [ ] Adjust folder names and templates based on what felt natural.
- [ ] Document decisions back into this file (short changelog or dated notes).
