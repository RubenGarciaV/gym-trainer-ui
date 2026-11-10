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

  const clearWorkout = useCallback(() => {
    setActiveWorkout(null);
  }, []);

  return (
    <WorkoutProgressContext.Provider
      value={{
        activeWorkout,
        startWorkout,
        updateWorkoutProgress,
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
