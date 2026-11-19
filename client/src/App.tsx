import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Wifi, WifiOff } from "lucide-react";
import { socket } from "./lib/socket";
import {
  PublicRoomState,
  Question,
  ReconnectMatchState,
  RevealPayload,
  StoredSession,
} from "./types";
import { LandingScreen } from "./components/LandingScreen";
import { JoinForm } from "./components/JoinForm";
import { HostDashboard } from "./components/HostDashboard";
import { QuizScreen } from "./components/QuizScreen";
import { WaitingRoom } from "./components/WaitingRoom";
import { ClueTeaser } from "./components/ClueTeaser";
import { RevealScreen } from "./components/RevealScreen";

const SESSION_KEY = "sparkmatch_session_v1";

function parseJoinCodeFromUrl(): string | null {
  const match = window.location.pathname.match(/^\/join\/([a-zA-Z0-9]{1,8})\/?$/);
  return match ? match[1].toUpperCase() : null;
}

function loadStoredSession(): StoredSession | null {
  try {
    // Prefer per-tab sessionStorage first so multiple tabs on one device don't collide
    const tabRaw = window.sessionStorage.getItem(SESSION_KEY);
    if (tabRaw) {
      const parsed = JSON.parse(tabRaw) as StoredSession;
      if (parsed?.roomCode && parsed?.playerId) {
        return parsed;
      }
    }
    const localRaw = window.localStorage.getItem(SESSION_KEY);
    if (localRaw) {
      const parsed = JSON.parse(localRaw) as StoredSession;
      if (parsed?.roomCode && parsed?.playerId) {
        // Don't hijack an explicit /join/:code guest link with a saved host session from another tab
        const joinFromUrl = parseJoinCodeFromUrl();
        if (joinFromUrl && parsed.hostToken) {
          return null;
        }
        return parsed;
      }
    }
  } catch {
    // Ignore corrupt storage
  }
  return null;
}

function saveStoredSession(session: StoredSession | null): void {
  try {
    if (!session) {
      window.sessionStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(SESSION_KEY);
    } else {
      const serialized = JSON.stringify(session);
      window.sessionStorage.setItem(SESSION_KEY, serialized);
      window.localStorage.setItem(SESSION_KEY, serialized);
    }
  } catch {
    // Ignore storage failures
  }
}

export default function App() {
  const [routeMode, setRouteMode] = useState<"landing" | "join">(() =>
    parseJoinCodeFromUrl() ? "join" : "landing"
  );
  const [urlJoinCode, setUrlJoinCode] = useState<string>(
    () => parseJoinCodeFromUrl() ?? ""
  );

  const [session, setSession] = useState<StoredSession | null>(null);
  const [roomState, setRoomState] = useState<PublicRoomState | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [partnerClues, setPartnerClues] = useState<string[]>([]);
  const [revealPayload, setRevealPayload] = useState<RevealPayload | null>(null);
  const [hostShowingPlayerView, setHostShowingPlayerView] = useState(false);

  const [connected, setConnected] = useState<boolean>(socket.connected);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState<boolean>(() => {
    const saved = loadStoredSession();
    const joinFromUrl = parseJoinCodeFromUrl();
    // Only auto-reconnect if we have a saved session matching the current URL (or on root /)
    return Boolean(
      saved && (!joinFromUrl || joinFromUrl === saved.roomCode.toUpperCase())
    );
  });

  const clearSession = useCallback(() => {
    saveStoredSession(null);
    setSession(null);
    setRoomState(null);
    setQuestions([]);
    setPartnerClues([]);
    setRevealPayload(null);
    setHostShowingPlayerView(false);
  }, []);

  const attemptReconnect = useCallback(
    (saved: StoredSession) => {
      setReconnecting(true);
      socket.emit(
        "session_reconnect",
        {
          roomCode: saved.roomCode,
          playerId: saved.playerId,
          hostToken: saved.hostToken,
        },
        (res: {
          ok: boolean;
          roomState?: PublicRoomState;
          questions?: Question[];
          playerMatch?: ReconnectMatchState;
          error?: string;
        }) => {
          setReconnecting(false);
          if (res?.ok && res.roomState) {
            setSession(saved);
            setRoomState(res.roomState);
            if (res.questions) setQuestions(res.questions);
            if (res.playerMatch) {
              setPartnerClues(res.playerMatch.partnerClues);
              if (res.playerMatch.revealPayload) {
                setRevealPayload(res.playerMatch.revealPayload);
              }
            }
            setError(null);
          } else {
            clearSession();
          }
        }
      );
    },
    [clearSession]
  );

  // Listen to browser navigation (back/forward)
  useEffect(() => {
    const onPopState = () => {
      const code = parseJoinCodeFromUrl();
      if (code) {
        setUrlJoinCode(code);
        setRouteMode("join");
      } else {
        setUrlJoinCode("");
        setRouteMode("landing");
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Core Socket.IO lifecycle + event listeners
  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
      const saved = loadStoredSession();
      const joinCode = parseJoinCodeFromUrl();
      if (saved && (!joinCode || joinCode === saved.roomCode.toUpperCase())) {
        attemptReconnect(saved);
      } else {
        setReconnecting(false);
      }
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleRoomState = (nextState: PublicRoomState) => {
      setRoomState(nextState);
      if (nextState.phase === "LOBBY") {
        setPartnerClues([]);
        setRevealPayload(null);
        setHostShowingPlayerView(false);
      }
    };

    const handleQuizStarted = (payload: { questions: Question[] }) => {
      setQuestions(payload.questions);
    };

    const handleClueReceived = (payload: { partnerClues: string[] }) => {
      setPartnerClues(payload.partnerClues);
    };

    const handleRevealStarted = (payload: RevealPayload) => {
      setRevealPayload(payload);
    };

    const handleKicked = (payload: { reason?: string }) => {
      clearSession();
      setError(payload?.reason ?? "You were removed from the room.");
      window.history.replaceState({}, "", "/");
      setRouteMode("landing");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room_state_updated", handleRoomState);
    socket.on("quiz_started", handleQuizStarted);
    socket.on("clue_received", handleClueReceived);
    socket.on("reveal_started", handleRevealStarted);
    socket.on("player_kicked", handleKicked);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room_state_updated", handleRoomState);
      socket.off("quiz_started", handleQuizStarted);
      socket.off("clue_received", handleClueReceived);
      socket.off("reveal_started", handleRevealStarted);
      socket.off("player_kicked", handleKicked);
    };
  }, [attemptReconnect, clearSession]);

  // --- Client -> Server actions ---

  const handleCreateRoom = async (params: {
    hostName: string;
    avatar: string;
    spottingClue: string;
    hostParticipates: boolean;
  }) => {
    setError(null);
    return new Promise<void>((resolve) => {
      socket.emit(
        "create_room",
        params,
        (res: {
          ok?: boolean;
          roomCode?: string;
          playerId?: string;
          hostToken?: string;
          roomState?: PublicRoomState;
          error?: string;
        }) => {
          if (res?.ok && res.roomCode && res.playerId && res.hostToken) {
            const nextSession: StoredSession = {
              roomCode: res.roomCode,
              playerId: res.playerId,
              hostToken: res.hostToken,
            };
            saveStoredSession(nextSession);
            setSession(nextSession);
            if (res.roomState) setRoomState(res.roomState);
          } else {
            setError(res?.error ?? "Could not create room.");
          }
          resolve();
        }
      );
    });
  };

  const handleJoinRoom = async (params: {
    roomCode: string;
    name: string;
    avatar: string;
    spottingClue: string;
  }) => {
    setError(null);
    return new Promise<void>((resolve) => {
      socket.emit(
        "join_room",
        params,
        (res: {
          ok?: boolean;
          playerId?: string;
          roomState?: PublicRoomState;
          questions?: Question[];
          error?: string;
        }) => {
          if (res?.ok && res.playerId && res.roomState) {
            const nextSession: StoredSession = {
              roomCode: res.roomState.code,
              playerId: res.playerId,
            };
            saveStoredSession(nextSession);
            setSession(nextSession);
            setRoomState(res.roomState);
            if (res.questions) setQuestions(res.questions);
          } else {
            setError(res?.error ?? "Could not join room.");
          }
          resolve();
        }
      );
    });
  };

  const emitHostAction = useCallback(
    (event: string, extra: Record<string, unknown> = {}) => {
      if (!session?.hostToken) return Promise.resolve();
      setError(null);
      return new Promise<void>((resolve) => {
        socket.emit(
          event,
          {
            roomCode: session.roomCode,
            hostToken: session.hostToken,
            ...extra,
          },
          (res: { ok?: boolean; error?: string }) => {
            if (res && !res.ok && res.error) {
              setError(res.error);
            }
            resolve();
          }
        );
      });
    },
    [session]
  );

  const handleSubmitAnswers = async (answers: Record<string, number>) => {
    if (!session) return;
    setError(null);
    return new Promise<void>((resolve) => {
      socket.emit(
        "submit_answers",
        {
          roomCode: session.roomCode,
          playerId: session.playerId,
          answers,
        },
        (res: { ok?: boolean; error?: string }) => {
          if (res && !res.ok && res.error) {
            setError(res.error);
          }
          resolve();
        }
      );
    });
  };

  const handleLeaveRoom = () => {
    clearSession();
    window.history.pushState({}, "", "/");
    setUrlJoinCode("");
    setRouteMode("landing");
    // Reconnect socket cleanly to leave server room
    socket.disconnect();
    socket.connect();
  };

  const me = roomState?.players.find((p) => p.id === session?.playerId);
  const isHost = Boolean(session?.hostToken && me?.isHost);

  const renderPlayerExperience = () => {
    if (!roomState || !session) return null;

    if (roomState.phase === "QUIZ" && !me?.quizCompleted && questions.length > 0) {
      return (
        <QuizScreen
          roomCode={roomState.code}
          questions={questions}
          onSubmitAnswers={handleSubmitAnswers}
        />
      );
    }

    if (roomState.phase === "CLUES" && partnerClues.length > 0) {
      return (
        <ClueTeaser roomCode={roomState.code} partnerClues={partnerClues} />
      );
    }

    if (roomState.phase === "REVEAL" && revealPayload) {
      return (
        <RevealScreen roomCode={roomState.code} revealPayload={revealPayload} />
      );
    }

    return (
      <WaitingRoom
        roomState={roomState}
        me={me}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  };

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Subtle connection indicator when offline */}
      {!connected && (
        <div className="bg-coral text-white text-xs font-display font-bold py-1.5 px-4 text-center flex items-center justify-center gap-1.5 border-b-2 border-ink">
          <WifiOff className="w-3.5 h-3.5" />
          Reconnecting to SparkMatch server...
        </div>
      )}

      <main className="flex-1 flex flex-col justify-center py-2">
        {reconnecting ? (
          <div className="w-full max-w-md mx-auto px-4 py-12 text-center">
            <div className="riso-card p-6 inline-flex items-center gap-3 font-display font-bold">
              <Wifi className="w-5 h-5 text-indigoParty animate-pulse" />
              Rejoining your SparkMatch room...
            </div>
          </div>
        ) : !roomState || !session ? (
          routeMode === "join" ? (
            <JoinForm
              initialRoomCode={urlJoinCode}
              onJoinRoom={handleJoinRoom}
              onBack={() => {
                setError(null);
                window.history.pushState({}, "", "/");
                setUrlJoinCode("");
                setRouteMode("landing");
              }}
              error={error}
            />
          ) : (
            <LandingScreen
              onCreateRoom={handleCreateRoom}
              onGoToJoin={() => {
                setError(null);
                setRouteMode("join");
              }}
              error={error}
            />
          )
        ) : isHost && !hostShowingPlayerView ? (
          <HostDashboard
            roomState={roomState}
            me={me}
            onToggleParticipate={(val) =>
              emitHostAction("host_toggle_participate", {
                hostParticipates: val,
              })
            }
            onAddBots={(count = 5) =>
              emitHostAction("host_add_bots", { count })
            }
            onKickPlayer={(targetPlayerId) =>
              emitHostAction("host_kick_player", { targetPlayerId })
            }
            onStartQuiz={() => emitHostAction("host_start_quiz")}
            onCalculateMatches={() => emitHostAction("host_calculate_matches")}
            onSendClues={() => emitHostAction("host_send_clues")}
            onTriggerReveal={() => emitHostAction("host_trigger_reveal")}
            onResetRoom={() => emitHostAction("host_reset_room")}
            onLeaveRoom={handleLeaveRoom}
            hasPersonalView={
              roomState.hostParticipates && roomState.phase !== "LOBBY"
            }
            onOpenMyPlayerView={() => setHostShowingPlayerView(true)}
            error={error}
          />
        ) : (
          <div>
            {isHost && (
              <div className="w-full max-w-md mx-auto px-4 pt-4">
                <button
                  type="button"
                  onClick={() => setHostShowingPlayerView(false)}
                  className="riso-btn-white text-xs min-h-[40px] py-2 px-3.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Host Deck
                </button>
              </div>
            )}
            {renderPlayerExperience()}
          </div>
        )}
      </main>
    </div>
  );
}
