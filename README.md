# FitCoach - AI-Powered Fitness Tracking

A comprehensive fitness tracking application with AI coaching capabilities. Track your workouts, set goals, and get personalized training advice whether you're at home or the gym.

## Features

- **Email/Password Authentication** - Secure login with separate accounts for each user
- **Workout Tracking** - Log exercises, sets, reps, and weights
- **Benchmark Exercises** - Track progress on key lifts (Bench Press, Squat, Deadlift, Overhead Press, Barbell Row, Curls)
- **Goal Setting** - Set targets with deadlines, AI can suggest initial goals
- **Progress Dashboard** - Visualize your gains with charts and analytics
- **AI Coach** - Get personalized workout suggestions based on:
  - Recent workout history
  - Muscle group recovery status
  - Available equipment
  - Your fitness goals
- **Location-Based Workouts** - Different workouts for home vs gym with customizable equipment and duration
- **Progressive Overload** - Workouts automatically get harder over time
- **Nutrition Advice** - Pre and post-workout nutrition recommendations
- **Weekly & Coach Summaries** - Track if you're on target for your goals
- **PWA Support** - Install on your phone for app-like experience

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **PWA**: next-pwa

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works great)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd fitness_app
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `supabase/schema.sql`
3. Run the seed data from `supabase/seed.sql` to populate exercises
4. Go to **Settings > API** to get your project URL and anon key

### 3. Configure Environment

Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/             # Authenticated app routes
│   │   ├── dashboard/     # Main dashboard
│   │   ├── workouts/      # Workout logging & history
│   │   ├── goals/         # Goal management
│   │   ├── coach/         # AI workout suggestions
│   │   ├── nutrition/     # Nutrition advice
│   │   ├── reports/       # Weekly & coach summaries
│   │   └── settings/      # User settings
│   ├── api/               # API routes for AI coach
│   ├── login/             # Auth pages
│   └── signup/
├── components/
│   ├── ui/                # Reusable UI components
│   └── layout/            # Navigation & layout
├── contexts/              # React contexts (Auth)
├── lib/
│   ├── supabase/          # Supabase client config
│   └── services/          # Data services & AI coach
├── types/                 # TypeScript types
└── middleware.ts          # Auth middleware
```

## Default Equipment

### Home Setup
- Sandbag
- Kettlebell
- Rowing machine
- (Configurable in settings)

### Gym Setup
- Full gym equipment
- Barbell, dumbbells, cable machines, etc.
- (Configurable in settings)

## Default Workout Durations

- **Home**: 10-15 minutes
- **Gym**: 30-45 minutes

Both are configurable per user in settings.

## Benchmark Exercises

The app tracks these main lifts:
1. Bench Press
2. Squat
3. Deadlift
4. Overhead Press
5. Barbell Row
6. Barbell Curl

## PWA Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (3 dots)
3. Tap "Install app" or "Add to Home Screen"

### Desktop (Chrome/Edge)
1. Open the app
2. Click the install icon in the address bar
3. Click "Install"

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- AWS Amplify
- Self-hosted with `npm run build && npm start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this for personal or commercial projects.
