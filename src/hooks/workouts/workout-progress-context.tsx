import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Routine } from "../../api/types";
import { useSession } from "../auth/session-context";

let workoutAudioContext: AudioContext | null = null;

const prepareRestBellSound = () => {
  if (!("AudioContext" in window)) {
    console.warn("Web Audio is unavailable; rest timer sound is disabled.");
    return;
  }

  workoutAudioContext ??= new AudioContext();
  if (workoutAudioContext.state === "suspended") {
    void workoutAudioContext.resume().catch((error: unknown) => {
      console.error("Could not activate the rest timer sound.", error);
    });
  }
};

const playRestBellSound = () => {
  if (!workoutAudioContext) return;
  const audioContext = workoutAudioContext;

  const play = () => {
    if (audioContext.state !== "running") return;

    const now = audioContext.currentTime;
    [
      { frequency: 587.33, volume: 0.18 },
      { frequency: 880, volume: 0.12 },
      { frequency: 1174.66, volume: 0.08 },
      { frequency: 1760, volume: 0.04 },
    ].forEach(({ frequency, volume }) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 1.4);
    });
  };

  if (audioContext.state === "running") {
    play();
  } else {
    void audioContext.resume().then(play).catch((error: unknown) => {
      console.error("Could not play the rest timer sound.", error);
    });
  }
};

export interface ActiveWorkoutProgress {
  routineId: string;
  routine: Routine | null;
  startedAt: string;
  completedSetIds: string[];
  restEndsAt: number | null;
  restSetId: string | null;
}

interface WorkoutProgressContextValue {
  activeWorkout: ActiveWorkoutProgress | null;
  startWorkout: (
    routineId: string,
    startedAt: string,
    routine?: Routine,
  ) => void;
  updateWorkoutProgress: (
    updates: Partial<
      Omit<ActiveWorkoutProgress, "routineId" | "startedAt">
    >,
  ) => void;
  prepareRestBellSound: () => void;
  clearWorkout: () => void;
}

const WorkoutProgressContext =
  createContext<WorkoutProgressContextValue | null>(null);

export const WorkoutProgressProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user } = useSession();
  const [activeWorkout, setActiveWorkout] =
    useState<ActiveWorkoutProgress | null>(null);

  useEffect(() => {
    setActiveWorkout(null);
  }, [user?.id]);

  const startWorkout = useCallback(
    (routineId: string, startedAt: string, routine?: Routine) => {
      setActiveWorkout((current) =>
        current ?? {
          routineId,
          routine: routine ?? null,
          startedAt,
          completedSetIds: [],
          restEndsAt: null,
          restSetId: null,
        },
      );
    },
    [],
  );

  const updateWorkoutProgress = useCallback(
    (
      updates: Partial<
        Omit<ActiveWorkoutProgress, "routineId" | "startedAt">
      >,
    ) => {
      setActiveWorkout((current) =>
        current ? { ...current, ...updates } : current,
      );
    },
    [],
  );

  useEffect(() => {
    const restEndsAt = activeWorkout?.restEndsAt;
    if (restEndsAt === null || restEndsAt === undefined) return;

    const timeout = window.setTimeout(() => {
      playRestBellSound();
      setActiveWorkout((current) =>
        current?.restEndsAt === restEndsAt
          ? { ...current, restEndsAt: null, restSetId: null }
          : current,
      );
    }, Math.max(0, restEndsAt - Date.now()));

    return () => window.clearTimeout(timeout);
  }, [activeWorkout?.restEndsAt]);

  const clearWorkout = useCallback(() => {
    setActiveWorkout(null);
  }, []);

  return (
    <WorkoutProgressContext.Provider
      value={{
        activeWorkout,
        startWorkout,
        updateWorkoutProgress,
        prepareRestBellSound,
        clearWorkout,
      }}
    >
      {children}
    </WorkoutProgressContext.Provider>
  );
};

export const useWorkoutProgress = () => {
  const context = useContext(WorkoutProgressContext);
  if (!context) {
    throw new Error(
      "useWorkoutProgress must be used within a WorkoutProgressProvider.",
    );
  }
  return context;
};
