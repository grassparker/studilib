
export interface User {
  id: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  coins: number;
  avatar?: string;
  status?: 'online' | 'studying' | 'break' | 'offline';
  currentTask?: string;
}

export interface Friend extends User {
  lastSeen: string;
}

export interface Goal {
  id: string;
  title: string;
  completed: boolean;
  category: 'daily' | 'weekly';
}

export interface HomeItem {
  id: string;
  itemTypeId: string;
  name: string;
  price: number;
  icon: string;
  type: 'furniture' | 'decor' | 'structure';
  position: { x: number; y: number };
  level?: number;
}

export interface StudySession {
  id: string;
  title: string;
  time: string;
  attendees: string[];
}

export enum TimerMode {
  POMODORO = 'POMODORO',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK'
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: (stats: any) => boolean;
  color: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    name: 'Initial Boot',
    description: 'Complete your first study session.',
    icon: 'fa-power-off',
    requirement: (stats) => stats.sessionCount >= 1,
    color: '#00ff00'
  },
  {
    id: 'hot_streak',
    name: 'On Fire',
    description: 'Maintain a 3-day study streak.',
    icon: 'fa-fire',
    requirement: (stats) => stats.streak >= 3,
    color: '#ff4400'
  },
  {
    id: 'deep_focus',
    name: 'Deep Diver',
    description: 'Focus for more than 100 total minutes.',
    icon: 'fa-brain',
    requirement: (stats) => stats.totalFocusMinutes >= 100,
    color: '#00ffff'
  },
  {
  id: 'capitalist',
  name: 'Wealthy Scholar',
  description: 'Amass 1,000 total coins.',
  icon: 'fa-coins',
  requirement: (stats) => stats.coins >= 1000,
  color: '#FFD700'
  }
];