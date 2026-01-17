export interface User {
  id: string;
  email: string;
  role: 'User' | 'Admin';
}

export interface Contest {
  id: string;
  title: string;
  startTime: string;
  contestToChallengeMapping?: ContestChallenge[];
}

export interface Challenge {
  id: string;
  title: string;
  notionDocId: string;
  maxPoints: number;
}

export interface ContestChallenge {
  id: string;
  contestId: string;
  challengeId: string;
  index: number;
  challenge: Challenge;
  contest?: Contest;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  points: number;
}

export interface Submission {
  id: string;
  submission: string;
  points: number;
  createdAt: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}
