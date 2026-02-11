# LogLife Website

The marketing and dashboard website for LogLife — chat-native AI journaling that turns your daily conversations into a timeline of your life.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Auth**: Clerk

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
│   ├── features/       # Features page
│   ├── dashboard/      # User dashboard
│   ├── login/          # Login page
│   ├── signup/         # Signup page
│   └── api/            # API routes
├── public/             # Static assets (logos, images)
└── ...
```

## Branding

- **Primary Color (Emerald)**: `#10b981` — used for CTAs, accents
- **Background**: Dark slate (`#0f172a`)
- **Theme**: Dark mode with emerald highlights
