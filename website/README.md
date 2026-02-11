# AutoClaw Website

The marketing and dashboard website for AutoClaw - one-click deployment for OpenClaw agents.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript

## Getting Started

```bash
# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the website.

## Project Structure

```
website/
├── app/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (theme, etc.)
│   ├── hero/           # Homepage hero section
│   ├── blog/           # Blog page
│   ├── pricing/        # Pricing page
│   ├── login/          # Login page
│   ├── signup/         # Signup page
│   └── api/            # API routes
├── public/             # Static assets (logos, images)
└── ...
```

## Branding

- **Primary Color (Red)**: `#ef4444` - used for CTAs, accents
- **Secondary Color (Teal)**: `#14b8a6` - used for highlights
- **Background**: Dark slate (`#0a0a0a` / `#0f172a`)

Based on OpenClaw's visual identity.
