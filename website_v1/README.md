# LogLife Website

The marketing and dashboard website for LogLife — chat-native AI journaling that helps you capture your life, track habits, and uncover patterns through the chat apps you already use.

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
website_v1/
├── app/
│   ├── components/     # Reusable UI components (Sidebar, Footer, etc.)
│   ├── contexts/       # React contexts (theme, etc.)
│   ├── hero/           # Homepage hero section
│   ├── blog/           # Blog pages and posts
│   ├── features/       # Features page
│   ├── pricing/        # Pricing page
│   ├── dashboard/      # User dashboard
│   ├── login/          # Login page
│   ├── signup/         # Signup page
│   └── api/            # API routes
├── public/             # Static assets (logos, images)
└── ...
```

## Branding

- **Primary Color (Emerald)**: `#10b981` — used for CTAs, accents, highlights
- **Background**: Dark slate (`#0a0a0a` / `#0f172a`)
- **Identity**: Chat-native AI journaling. "Your life, captured."
