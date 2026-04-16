# Note Companion — review workflow (draft)

## Project goal

Explore whether the **Obsidian Note Companion** plugin can support a reliable **daily capture**, **review**, and **light planning** workflow aligned with a Loglife-style rhythm: quick raw logging first, then structured processing and reflection with low overhead.

## Current context

- **Evaluating** Note Companion as an AI-assisted layer for a **Loglife workflow**.
- Current focus is on:
  - daily processing
  - review + next-step planning
- This repo currently holds **documentation and template drafts only**.
- Initial testing has already been done with:
  - `daily_process_template.md`
  - `review_and_plan_template.md`

## Current testing status

### Tested
- `templates/daily_process_template.md`
- `templates/review_and_plan_template.md`

### Result
- Both templates are **usable in first iteration**.
- They produce structured output from short raw text inputs.
- Main remaining noise is the automatic backup link added by Note Companion.
- Output is usable, but still somewhat generic in places and should be improved through more real examples.

### Not tested yet
- `templates/weekly_summary_template.md`

## Raw vs AI-processed note separation

- **Raw notes**: first-pass capture such as voice dumps, rough bullets, pasted text, incomplete thoughts.
- **AI-processed notes**: structured summaries, extracted points, review notes, and planning notes generated after raw capture.
- **Principle**: raw input should remain preserved and separate from AI output.
- Current direction:
  - raw note = source of truth
  - processed note = structured interpretation of raw note
  - review/planning note = second-pass reflection based on processed note

## Proposed folder structure (working draft)

Illustrative only — final structure still needs real-world testing.

- `logs/raw/` — raw daily captures
- `logs/ai/` — processed daily notes and review/planning outputs
- `templates/` — Note Companion prompt templates
- `screenshots/` — optional testing evidence

Keep structure simple in first iteration. Add more nesting only if needed later.

## Daily workflow

1. Capture rough notes during the day in a raw daily note.
2. Optionally add or paste a short voice transcript into that raw note.
3. Run `daily_process_template.md` on the raw content.
4. Save the generated structured output as the processed daily note.
5. Run `review_and_plan_template.md` on the processed daily note.
6. Save the review + next actions output separately or under the processed note.
7. Keep raw and AI-generated content clearly separated.

## Weekly workflow

1. Collect multiple processed daily notes from the week.
2. Review patterns across the week:
   - themes
   - wins
   - friction points
   - carry-forward insights
3. Run `weekly_summary_template.md` once enough daily examples exist.
4. Use the weekly output to decide next-week priorities.

## Assumptions

- Obsidian and Note Companion are installed and available for testing.
- Note Companion currently allows selecting one file/template at a time.
- AI support is helpful but not required for the workflow to make sense.
- First iteration should stay simple and practical.
- Mobile, web integration, advanced automation, and visualizations are out of scope for now.

## Open questions

- Should raw and processed notes live in separate files or separate sections?
- What final naming convention should be used for daily raw and processed notes?
- Should review/planning output be appended to the processed note or saved separately?
- How well does the workflow perform on real longer notes and real audio transcripts?
- How should weekly summaries work if selection/input flow is limited?

## Findings from first tests

### Daily process template
- Works well enough for first iteration.
- Produces structured daily output.
- Main weakness: some wording becomes slightly generic.

### Review and plan template
- Works well enough for first iteration.
- Produces usable review, friction points, and next actions.
- Main weakness: may overstate or slightly generalize some points.

## Next testing steps

- [x] Test `daily_process_template.md` on a short real raw input
- [x] Test `review_and_plan_template.md` on the processed output
- [ ] Save example input/output pairs in a clean documented format
- [ ] Test with a longer real raw daily note
- [ ] Test with a real audio transcription
- [ ] Document what was accurate, too generic, or missing
- [ ] Test `weekly_summary_template.md` after collecting multiple daily examples
- [ ] Refine folder/naming structure based on actual usage