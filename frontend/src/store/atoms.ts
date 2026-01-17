import { atom } from 'recoil';
import { AuthState, Contest, User } from '../types';
import { getAuth } from '../lib/auth';

const { token, user } = getAuth();

export const authState = atom<AuthState>({
  key: 'authState',
  default: {
    token,
    user,
    isAuthenticated: !!token,
  },
});

export const activeContestsState = atom<Contest[]>({
  key: 'activeContestsState',
  default: [],
});

export const finishedContestsState = atom<Contest[]>({
  key: 'finishedContestsState',
  default: [],
});

export const currentContestState = atom<Contest | null>({
  key: 'currentContestState',
  default: null,
});

export const loadingState = atom<boolean>({
  key: 'loadingState',
  default: false,
});
