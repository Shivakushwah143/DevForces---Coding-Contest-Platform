# DevForces - Coding Contest Platform

A full-featured coding contest platform built with React, TypeScript, and Tailwind CSS.

## Features

### User Features
- **Magic Link Authentication** - Secure email-based authentication
- **Active Contests** - Browse and participate in ongoing contests
- **Challenge Solving** - LeetCode-style split-view interface for solving problems
- **Live Leaderboard** - Real-time rankings during contests
- **Past Contests** - View completed contests and their leaderboards
- **Responsive Design** - Works on desktop, tablet, and mobile devices

### Admin Features
- **Create Contests** - Set up new coding contests with start times
- **Create Challenges** - Add new coding challenges with Notion integration
- **Link Challenges** - Associate challenges with contests in custom order

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Routing**: React Router DOM
- **State Management**: Recoil
- **Styling**: Tailwind CSS with custom color theme
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Build Tool**: Vite

## Color Theme

The application uses a professional blue and violet color scheme:

- **Primary**: Blue (#2563EB)
- **Secondary**: Violet (#7C3AED)
- **Success**: Green (#10B981)
- **Warning**: Amber (#F59E0B)
- **Error**: Red (#EF4444)

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.tsx
│   ├── Navbar.tsx
│   └── ProtectedRoute.tsx
├── pages/              # Page components
│   ├── Home.tsx
│   ├── SignIn.tsx
│   ├── Verify.tsx
│   ├── ActiveContests.tsx
│   ├── FinishedContests.tsx
│   ├── ContestDetail.tsx
│   ├── Challenge.tsx
│   ├── Leaderboard.tsx
│   └── Admin.tsx
├── lib/                # Utilities
│   ├── api.ts         # Axios client
│   └── auth.ts        # Auth utilities
├── store/             # Recoil state
│   └── atoms.ts
├── types/             # TypeScript types
│   └── index.ts
└── App.tsx            # Main app with routing
```

## API Integration

The frontend connects to a Node.js/Express backend with the following endpoints:

### User Endpoints
- `POST /user/signin` - Send magic link
- `GET /user/signin/verify` - Verify token and authenticate

### Contest Endpoints
- `GET /contest/active` - Get active contests
- `GET /contest/finished` - Get past contests
- `GET /contest/:contestId` - Get contest details
- `GET /contest/:contestId/:challengeId` - Get challenge details
- `GET /contest/leaderboard/:contestId` - Get contest leaderboard
- `POST /contest/submit/:challengeId` - Submit solution

### Admin Endpoints (Protected)
- `POST /admin/contest` - Create contest
- `POST /admin/challenge` - Create challenge
- `POST /admin/link/:challengeId/:contestId` - Link challenge to contest

## Environment Variables

Create a `.env` file with:

```
VITE_API_URL=http://localhost:4000
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

## Key Pages

### Home (`/`)
Landing page with platform overview and call-to-action.

### Sign In (`/signin`)
Email-based magic link authentication.

### Active Contests (`/contests/active`)
List of ongoing contests with time remaining.

### Contest Detail (`/contest/:id`)
View all challenges in a specific contest.

### Challenge (`/contest/:contestId/:challengeId`)
Split-view interface for solving challenges (description left, code editor right).

### Leaderboard (`/contest/:id/leaderboard`)
Rankings for a specific contest with top 3 highlighted.

### Admin Dashboard (`/admin`)
Create contests, challenges, and manage contest-challenge mappings.

## Authentication Flow

1. User enters email on `/signin`
2. Backend sends magic link email
3. User clicks link, redirected to `/signin/verify?token=...`
4. Token is verified, user is authenticated
5. JWT token stored in localStorage
6. User redirected to active contests

## Protected Routes

Routes require authentication:
- `/contests/active`
- `/contests/finished`
- `/contest/:id`
- `/contest/:id/:challengeId`
- `/contest/:id/leaderboard`

Admin-only routes:
- `/admin`

## State Management

Recoil atoms store:
- Authentication state (token, user, isAuthenticated)
- Active contests list
- Finished contests list
- Current contest details
- Loading states

## Styling Guidelines

- Uses custom Tailwind color theme
- Consistent spacing with 8px system
- Shadows: sm, md, lg
- Responsive breakpoints: sm, md, lg, xl
- Hover states and smooth transitions
- Clean, modern design aesthetic
