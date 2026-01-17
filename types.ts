export enum GamePhase {
  LOBBY = 'LOBBY',
  QUESTION_ACTIVE = 'QUESTION_ACTIVE',
  BUZZED = 'BUZZED',
}

export interface Player {
  id: string;
  name: string;
}

export interface QuestionCard {
  type: 'question' | 'task';
  text: string;
  answer?: string;
}

export interface GameState {
  phase: GamePhase;
  currentCard: QuestionCard | null;
  buzzedPlayerId: string | null;
  buzzedPlayerName: string | null;
  timer: number;
  players: Player[];
}

export interface GameMessage {
  type: 'JOIN' | 'STATE_UPDATE' | 'BUZZ' | 'RESET_BUZZ';
  payload?: any;
}