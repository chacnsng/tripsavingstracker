# TripTrack - Group Travel Savings Tracker

A gamified web application for tracking group travel savings with full financial transparency.

## Features

- 🎯 Trip management with target dates and savings goals
- 👥 Multi-user support with role-based access (Admin/Joiner)
- 📊 Visual progress tracking with rising avatars
- 🎉 Confetti celebrations on goal completion
- ⏰ Countdown timers to trip dates
- 🌙 Dark mode support
- 📥 CSV export for financial data
- 📝 Complete savings history logging

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Database & Auth)
- Vercel (Deployment)

## Setup

### Prerequisites
- Node.js 18+ and npm
- A Supabase account (free tier works)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up Supabase:**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Once your project is ready, go to the SQL Editor
   - Copy and paste the contents of `supabase/schema.sql` and run it
   - This will create all necessary tables, indexes, and policies
   - (Optional) Run `scripts/init-admin.sql` to create your first admin user

3. **Configure environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Get your Supabase URL and anon key from your project settings (Settings → API)
   - Update `.env.local` with your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

4. **Run development server:**
```bash
npm run dev
```

5. **Access the application:**
   - Open [http://localhost:3000](http://localhost:3000)
   - You'll be redirected to the dashboard
   - If no admin user exists, create one via the Admin Panel

## Usage

### Admin Features
- Create and manage trips
- Create and manage users
- Assign users to trips
- Update savings amounts for any user
- Export financial data to CSV
- View complete savings history

### Joiner Features
- View trips you're assigned to
- See your savings progress
- View other members' progress (read-only)
- Track countdown to trip date

## Deployment

### Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Click Deploy

3. **Post-deployment:**
   - Run the database schema in your Supabase project if you haven't already
   - Create your first admin user through the Admin Panel or SQL script

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel
│   ├── dashboard/         # Main dashboard
│   ├── trips/             # Trip detail pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ProgressAvatar.tsx # Gamified progress visualization
│   ├── CountdownTimer.tsx # Trip countdown
│   ├── TripCard.tsx       # Trip card component
│   └── ThemeProvider.tsx  # Dark mode provider
├── lib/                   # Utilities
│   └── supabase.ts        # Supabase client & types
├── supabase/              # Database schema
│   └── schema.sql         # Complete database schema
└── scripts/               # Setup scripts
    └── init-admin.sql     # Initial admin user script
```

## Features in Detail

### Gamified Progress Tracking
- Each user has a vertical progress lane
- Avatar rises as savings increase
- Visual milestones at 25%, 50%, 75%, and 100%
- Confetti animation when goal is reached

### Financial Transparency
- All savings visible to all trip members
- Complete change history with timestamps
- CSV export for record-keeping
- No silent overwrites - all changes logged

### Dark Mode
- Toggle between light and dark themes
- Preference saved in localStorage
- Smooth transitions between themes

