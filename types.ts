export enum AppMode {
  MENU = 'MENU',
  LEARN = 'LEARN',
  GAME_BULLSEYE = 'GAME_BULLSEYE',
  GAME_RUNNER = 'GAME_RUNNER',
  SUMMARY = 'SUMMARY'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface GameStats {
  score: number;
  accuracy: number;
  wpm?: number;
  mistakes: number;
}

export interface KeyConfig {
  key: string;
  finger: string; // e.g., "Left Index", "Right Pinky"
  row: number; // 0=number, 1=top, 2=home, 3=bottom
  hand: 'left' | 'right';
}

export interface RunnerObstacle {
  id: number;
  x: number;
  letter: string;
}
