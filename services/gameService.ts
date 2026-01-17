import { useEffect, useState, useCallback, useRef } from 'react';
import { GameMessage, GameState, GamePhase, Player } from '../types';

const CHANNEL_NAME = 'quiz_buzz_channel_v1';

export const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * HOOK: useHostGame
 * Logic for the central computer (Host)
 */
export const useHostGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.LOBBY,
    currentCard: null,
    buzzedPlayerId: null,
    buzzedPlayerName: null,
    timer: 10,
    players: [],
  });

  const channelRef = useRef<BroadcastChannel | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Broadcast state helper
  const broadcastState = useCallback((state: GameState) => {
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'STATE_UPDATE',
        payload: state
      } as GameMessage);
    }
  }, []);

  // Update state and broadcast
  const updateState = useCallback((newState: Partial<GameState>) => {
    setGameState(prev => {
      const updated = { ...prev, ...newState };
      broadcastState(updated);
      return updated;
    });
  }, [broadcastState]);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const msg = event.data as GameMessage;

      if (msg.type === 'JOIN') {
        const newPlayer = msg.payload as Player;
        setGameState(prev => {
          const exists = prev.players.find(p => p.id === newPlayer.id);
          if (exists) return prev;
          
          const updated = { ...prev, players: [...prev.players, newPlayer] };
          // Need to broadcast immediately so the new player gets the state
          setTimeout(() => channel.postMessage({ type: 'STATE_UPDATE', payload: updated }), 50);
          return updated;
        });
      }

      if (msg.type === 'BUZZ') {
        setGameState(current => {
          // Ignore if already buzzed or not in active phase
          if (current.phase !== GamePhase.QUESTION_ACTIVE && current.phase !== GamePhase.BUZZED) return current;
          if (current.buzzedPlayerId) return current; // Someone beat them to it

          // Winner!
          const buzzPlayer = msg.payload as Player;
          const newState = {
            ...current,
            phase: GamePhase.BUZZED,
            buzzedPlayerId: buzzPlayer.id,
            buzzedPlayerName: buzzPlayer.name,
            timer: 10
          };
          
          broadcastState(newState);
          startTimer();
          return newState;
        });
      }
    };

    // Initial broadcast to sync anyone listening
    broadcastState(gameState);

    return () => {
      channel.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.timer <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          
          // Time is up! Unlock buzzers
          const resetState = {
            ...prev,
            buzzedPlayerId: null,
            buzzedPlayerName: null,
            timer: 10,
            phase: GamePhase.QUESTION_ACTIVE // Go back to allowing buzzing
          };
          broadcastState(resetState);
          return resetState;
        }
        
        const newState = { ...prev, timer: prev.timer - 1 };
        broadcastState(newState);
        return newState;
      });
    }, 1000);
  };

  const setQuestion = (card: any) => {
    if (timerRef.current) clearInterval(timerRef.current);
    updateState({
      currentCard: card,
      phase: GamePhase.QUESTION_ACTIVE,
      buzzedPlayerId: null,
      buzzedPlayerName: null,
      timer: 10
    });
  };

  const resetRound = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    updateState({
      buzzedPlayerId: null,
      buzzedPlayerName: null,
      timer: 10,
      phase: GamePhase.QUESTION_ACTIVE
    });
  };

  return { gameState, setQuestion, resetRound };
};


/**
 * HOOK: usePlayerGame
 * Logic for the participants (Mobile devices)
 */
export const usePlayerGame = (playerProfile: Player | null) => {
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.LOBBY,
    currentCard: null,
    buzzedPlayerId: null,
    buzzedPlayerName: null,
    timer: 10,
    players: [],
  });
  
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (!playerProfile) return;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    // Announce presence
    channel.postMessage({ type: 'JOIN', payload: playerProfile });

    channel.onmessage = (event) => {
      const msg = event.data as GameMessage;
      if (msg.type === 'STATE_UPDATE') {
        setGameState(msg.payload);
      }
    };

    return () => {
      channel.close();
    };
  }, [playerProfile]);

  const buzz = useCallback(() => {
    if (gameState.phase !== GamePhase.QUESTION_ACTIVE || gameState.buzzedPlayerId) return;
    
    channelRef.current?.postMessage({
      type: 'BUZZ',
      payload: playerProfile
    });
  }, [gameState, playerProfile]);

  return { gameState, buzz };
};