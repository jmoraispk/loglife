# Daily Process Template

## Purpose
Turn one raw daily note or one pasted audio/transcript into a clean, structured daily summary for Loglife.

## Use
Use this template on:
- one raw daily note
- or one pasted voice transcript
- or one mixed raw capture for a single day

## Output rules
- Use only the information in the provided input.
- Do not invent events, times, tasks, emotions, or decisions.
- If something is unclear, say `Not clearly stated`.
- Keep the output concise and structured.
- Do not include template explanations, instructions, purpose, inputs, notes, or commentary in the final output.
- Do not mention Note Companion, templates, or processing steps in the output.
- Do not add hashtags unless they already exist in the source.
- Write the final result in clean markdown only.

## Required output format

# Daily Processed Note

## Today Log
- List the concrete things that happened, were explored, were tested, were discussed, or were decided.
- Keep each bullet short and factual.

## Key Points
- List the most important findings, decisions, constraints, or uncertainties from the note.
- Focus on what matters for future work.

## Open Questions
- List unanswered questions or unclear parts that need follow-up.
- If there are none, write:
- None stated.

## Tomorrow Priority
- Write 1 to 3 bullets for the clearest next actions based only on the note.
- If no next action is stated or strongly implied, write:
- Not clearly stated.

## Short Summary
- Write a short paragraph summarizing the day faithfully.
- Keep it neutral and practical.

## Extraction rules
- Prefer concrete actions over vague reflections.
- If the note includes both ideas and actions, separate them clearly.
- Preserve uncertainty where uncertainty exists.
- Do not convert uncertainty into decisions.
- If the input is very small, still follow the same structure.

## Process now
Read the provided input and return only the final formatted note using the exact structure above.