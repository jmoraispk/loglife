## What Happens Behind the Scenes

When you send a voice note or message to LogLife, several AI processes run in the background:

1. **Speech-to-text transcription** — Your voice is converted to text (using models like Whisper)
2. **Entity extraction** — AI identifies people, places, activities, and themes in your entry
3. **Tagging and categorization** — Your entry is automatically filed and linked to your knowledge graph
4. **Highlight generation** — AI evaluates what's most important across your entries for D/W/M/Q/Y summaries
5. **Pattern analysis** — Over time, connections between your habits, mood, sleep, and outcomes emerge

Each of these steps uses AI model calls, which have real costs. Here's what that looks like in practice.

## Real-World Cost Examples

A typical LogLife user—someone who journals for 2–3 minutes daily by voice—generates roughly:

- **~500–1,000 words/day** of transcribed text
- **~5–10 AI model calls/day** for processing, tagging, and highlights
- **~1–2 longer calls/week** for weekly summaries and pattern analysis

At current API rates, this translates to approximately **$2–5/month** in raw AI costs for a typical user. Heavy users (longer entries, more queries, voice calls) might see $8–15/month.

## Why LogLife Doesn't Mark Up API Costs

Many AI products resell API access at 2–5x markup. We don't.

Our philosophy is simple: **we charge for the service, not the API**. The $19/month hosted plan includes API usage up to a reasonable limit. You're paying for:

- Hosted infrastructure (your private instance)
- Dashboard and analytics
- Life telemetry integrations
- AI highlights and summaries
- Smart reminders
- Ongoing development and support

For the self-hosted ($0) plan, you bring your own API keys and pay providers directly at their rates—with zero markup from us.

## The $19/mo Hosted Tier: What's Included

The hosted plan is designed so most users never think about costs:

- **API usage included** up to a generous daily limit
- If you consistently exceed the limit, we'll let you know (not surprise-bill you)
- **No per-message fees** — it's a flat monthly rate
- **Auto-cancel on inactivity** — if you stop using LogLife, we'll warn you and then cancel. We only want you paying if you're getting value.

## Cost Transparency

We believe in radical transparency about costs:

- **We only care about usage metadata** — not your content
- **Monthly receipts** show your usage patterns (without revealing content)
- **No hidden fees** — the subscription covers all infrastructure costs
- **Clear cancellation** — cancel anytime, all data deleted after 30 days

## Self-Hosted: The Zero-Cost Option

For those who want maximum control and minimum cost:

1. Clone the LogLife repo
2. Set up with Docker
3. Add your own API keys (OpenAI, Anthropic, Deepgram, etc.)
4. Run it on your own infrastructure

Your only costs are the API calls you make and whatever you spend on hosting. The LogLife software itself is 100% free and open source.

## Comparing the Plans

| | Self-Hosted | Hosted ($19/mo) | Unlimited ($49/mo) |
|---|---|---|---|
| AI Processing | BYO keys | Included (up to limit) | Unlimited |
| Infrastructure | You manage | We manage | We manage |
| Dashboard | Yes | Yes | Yes + Advanced |
| Support | Community | Email | Priority |
| Integrations | DIY | Included | Included + Custom |
| Privacy | Maximum | No-access-by-design | No-access-by-design |

---

*The goal is simple: you should know exactly what you're paying for, and never pay for something you're not using.*
