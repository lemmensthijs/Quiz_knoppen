import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { GameMessage, GameState, GamePhase, Player } from '../types';

// --- STAP 3: CONFIGURATIE ---
// Vervang de tekst tussen de aanhalingstekens hieronder met jouw gegevens uit Supabase.
// Laat 'process.env' weg, dat werkt vaak niet direct in de browser.

const SUPABASE_URL = 'PLAK_HIER_JOUW_SUPABASE_URL'; 
const SUPABASE_KEY = 'PLAK_HIER_JOUW_SUPABASE_ANON_KEY';

const CHANNEL_NAME = 'quiz_buzz_room_v2';

// --- CONFIG CHECK ---
// We kijken of de URL begint met 'http' en de key is ingevuld.
const isConfigured = SUPABASE_URL.startsWith('http') && !SUPABASE_KEY.includes('PLAK_HIER');

let supabaseClient: SupabaseClient | null = null;

if (isConfigured) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (err) {
    console.error("Fout bij maken Supabase client:", err);
  }
}

// --- SHARED TYPES ---
type ConnectionType = 'supabase' | 'local';

// --- HELPERS ---
export const generateId = () => Math.random().toString(36).substr(2, 9);

// --- HOOK: useHostGame ---
export const useHostGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.LOBBY,
    currentCard: null,
    buzzedPlayerId: null,
    buzzedPlayerName: null,
    timer: 10,
    players: [],
  });
  
  const [connectionType, setConnectionType] = useState<ConnectionType>(isConfigured ? 'supabase' : 'local');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<RealtimeChannel | BroadcastChannel | null>(null);

  // Broadcast functie om data naar spelers te sturen
  const broadcastState = useCallback((state: GameState) => {
    if (!channelRef.current) return;

    if (isConfigured && connectionType === 'supabase') {
      const ch = channelRef.current as RealtimeChannel;
      // Controleer of de channel echt klaar is om te verzenden
      if (ch.state === 'joined' || ch.state === 'joining') { 
         ch.send({
          type: 'broadcast',
          event: 'STATE_UPDATE',
          payload: state
        }).catch(err => console.error("Broadcast error:", err));
      }
    } else if (channelRef.current instanceof BroadcastChannel) {
      channelRef.current.postMessage({
        type: 'STATE_UPDATE',
        payload: state
      } as GameMessage);
    }
  }, [connectionType]);

  const updateState = useCallback((newState: Partial<GameState>) => {
    setGameState(prev => {
      const updated = { ...prev, ...newState };
      broadcastState(updated);
      return updated;
    });
  }, [broadcastState]);

  // Timer logica
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.timer <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          
          const resetState = {
            ...prev,
            buzzedPlayerId: null,
            buzzedPlayerName: null,
            timer: 10,
            phase: GamePhase.QUESTION_ACTIVE
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

  // --- CONNECTIE EFFECT ---
  useEffect(() => {
    let cleanUp = () => {};

    if (isConfigured && supabaseClient) {
      console.log("Starten als Host via Supabase...");
      const channel = supabaseClient.channel(CHANNEL_NAME, {
        config: {
          presence: {
            key: 'host',
          },
        },
      });
      channelRef.current = channel;

      channel
        .on('broadcast', { event: 'BUZZ' }, ({ payload }: { payload: Player }) => {
          console.log("Buzz ontvangen van:", payload.name);
          handleBuzz(payload);
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const playersList: Player[] = [];
          
          for (const key in state) {
            if (key === 'host') continue; // Host zelf niet meetellen als speler
            const presences = state[key] as any[];
            if (presences && presences.length > 0) {
              playersList.push(presences[0] as Player);
            }
          }
          setGameState(prev => ({ ...prev, players: playersList }));
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
             setTimeout(() => broadcastState(gameState), 500);
          }
        });

      cleanUp = () => {
        supabaseClient.removeChannel(channel);
      };

    } else {
      // OFFLINE MODUS
      console.log("Starten als Host via Lokaal Netwerk (Offline).");
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
            setTimeout(() => {
              channel.postMessage({ type: 'STATE_UPDATE', payload: updated });
            }, 50);
            return updated;
          });
        }
        
        if (msg.type === 'BUZZ') {
          handleBuzz(msg.payload);
        }
      };

      const heartbeat = setInterval(() => {
        channel.postMessage({ type: 'HOST_HEARTBEAT' });
      }, 3000);

      cleanUp = () => {
        channel.close();
        clearInterval(heartbeat);
      };
    }

    return () => {
      cleanUp();
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuzz = (player: Player) => {
    setGameState(current => {
      if (current.phase !== GamePhase.QUESTION_ACTIVE && current.phase !== GamePhase.BUZZED) return current;
      if (current.buzzedPlayerId) return current; 

      const newState = {
        ...current,
        phase: GamePhase.BUZZED,
        buzzedPlayerId: player.id,
        buzzedPlayerName: player.name,
        timer: 10
      };
      
      broadcastState(newState);
      startTimer();
      return newState;
    });
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

  return { gameState, setQuestion, resetRound, connectionType };
};

// --- HOOK: usePlayerGame ---
export const usePlayerGame = (playerProfile: Player | null) => {
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.LOBBY,
    currentCard: null,
    buzzedPlayerId: null,
    buzzedPlayerName: null,
    timer: 10,
    players: [],
  });
  
  const channelRef = useRef<RealtimeChannel | BroadcastChannel | null>(null);

  useEffect(() => {
    if (!playerProfile) return;
    let cleanUp = () => {};

    if (isConfigured && supabaseClient) {
      console.log("Speler verbindt met Supabase...", playerProfile.name);
      const channel = supabaseClient.channel(CHANNEL_NAME, {
        config: {
          presence: {
            key: playerProfile.id,
          },
        },
      });
      channelRef.current = channel;

      channel
        .on('broadcast', { event: 'STATE_UPDATE' }, ({ payload }: { payload: GameState }) => {
          setGameState(payload);
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await channel.track(playerProfile);
          }
        });

      cleanUp = () => {
        supabaseClient.removeChannel(channel);
      };

    } else {
      // OFFLINE MODUS
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = channel;

      channel.postMessage({ type: 'JOIN', payload: playerProfile });

      channel.onmessage = (event) => {
        const msg = event.data as any;
        if (msg.type === 'STATE_UPDATE') {
          setGameState(msg.payload);
        }
        if (msg.type === 'HOST_HEARTBEAT') {
           channel.postMessage({ type: 'JOIN', payload: playerProfile });
        }
      };

      cleanUp = () => {
        channel.close();
      };
    }

    return cleanUp;
  }, [playerProfile]);

  const buzz = useCallback(() => {
    if (gameState.phase !== GamePhase.QUESTION_ACTIVE || gameState.buzzedPlayerId) return;
    
    if (isConfigured && channelRef.current) {
      (channelRef.current as RealtimeChannel).send({
        type: 'broadcast',
        event: 'BUZZ',
        payload: playerProfile
      });
    } else if (channelRef.current) {
      (channelRef.current as BroadcastChannel).postMessage({
        type: 'BUZZ',
        payload: playerProfile
      });
    }
  }, [gameState, playerProfile]);

  return { gameState, buzz };
};