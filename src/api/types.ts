export interface ApiExercise {
  id: string;
  name: string;
  description: string | null;
  muscleGroups: string[];
}

export interface WeightEntry {
  id: string;
  weightKg: number;
  measuredAt: string;
  createdAt: string;
}

export interface BodyMeasurementEntry {
  id: string;
  userId: string;
  chestCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  calfCm: number | null;
  measuredAt: string;
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  reps: number;
  weightKg: number | null;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string | null;
  exerciseName: string;
  position: number;
  restSeconds: number | null;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  name: string;
  startedAt: string | null;
  completedAt: string;
  notes: string | null;
  exercises: WorkoutExercise[];
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  position: number;
  sets: WorkoutSet[];
  restSeconds: number;
  exercise: ApiExercise;
}

export interface Routine {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  exercises: RoutineExercise[];
}

export interface WorkoutSessionProgress {
  startedAt: string;
  completedSetIds: string[];
  restEndsAt: number | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  session: {
    id: string;
    expiresAt: string;
    userId: string;
  };
  user: AuthUser;
}
