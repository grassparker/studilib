
export interface User {
  id: string;
  username: string;
  email: string;
  coins: number;
  avatar: string;
  status: 'online' | 'studying' | 'break' | 'offline';
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
  name: string;
  price: number;
  icon: string;
  type: 'furniture' | 'decor' | 'structure';
  position: { x: number; y: number };
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
