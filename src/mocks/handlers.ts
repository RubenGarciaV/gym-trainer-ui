import { http, HttpResponse } from "msw";

interface AuthRequest {
  email?: string;
  name?: string;
  password?: string;
  newPassword?: string;
  currentPassword?: string;
  revokeOtherSessions?: boolean;
}

interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RoutineExerciseRequest {
  exerciseId: string;
  position: number;
  sets: Array<{
    setNumber: number;
    reps: number;
    weightKg?: number | null;
  }>;
  restSeconds: number;
}

interface RoutineRequest {
  name: string;
  exercises?: RoutineExerciseRequest[];
}

interface MockRoutineSet {
  id: string;
  setNumber: number;
  reps: number;
  weightKg: number | null;
}

interface MockRoutineExercise
  extends Omit<RoutineExerciseRequest, "sets"> {
  id: string;
  sets: MockRoutineSet[];
  exercise: MockExercise;
}

interface MockRoutine {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  exercises: MockRoutineExercise[];
}

interface MockExercise {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  muscleGroups: string[];
  createdAt: string;
  updatedAt: string;
}

interface MockWorkoutSet {
  id: string;
  setNumber: number;
  reps: number;
  weightKg: number | null;
}

interface MockWorkoutExercise {
  id: string;
  exerciseId: string | null;
  exerciseName: string;
  position: number;
  restSeconds: number | null;
  sets: MockWorkoutSet[];
}

interface MockWorkout {
  id: string;
  userId: string;
  name: string;
  startedAt: string | null;
  completedAt: string;
  notes: string | null;
  exercises: MockWorkoutExercise[];
}

interface MockWeightEntry {
  id: string;
  userId: string;
  weightKg: number;
  measuredAt: string;
  createdAt: string;
}

const now = new Date();
const timestampDaysAgo = (daysAgo: number, hour: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const users = new Map<string, MockUser>();
const demoUser: MockUser = {
  id: "demo-user",
  name: "Usuario demo",
  email: "demo@gymtrainer.local",
  password: "password123",
  emailVerified: false,
  image: null,
  createdAt: timestampDaysAgo(60, 9),
  updatedAt: timestampDaysAgo(60, 9),
};
users.set(demoUser.email, demoUser);

const exerciseCatalog: MockExercise[] = [
  {
    id: "exercise-bench-press",
    slug: "press-banca",
    name: "Press de banca",
    description: null,
    muscleGroups: ["CHEST"],
  },
  {
    id: "exercise-incline-press",
    slug: "press-banca-inclinado",
    name: "Press de banca inclinado",
    description: null,
    muscleGroups: ["CHEST"],
  },
  {
    id: "exercise-push-up",
    slug: "flexiones",
    name: "Flexiones",
    description: null,
    muscleGroups: ["CHEST"],
  },
  {
    id: "exercise-pull-up",
    slug: "dominadas",
    name: "Dominadas",
    description: null,
    muscleGroups: ["BACK"],
  },
  {
    id: "exercise-row",
    slug: "remo-barra",
    name: "Remo con barra",
    description: null,
    muscleGroups: ["BACK"],
  },
  {
    id: "exercise-squat",
    slug: "sentadilla",
    name: "Sentadilla con barra",
    description: null,
    muscleGroups: ["LEGS"],
  },
  {
    id: "exercise-deadlift",
    slug: "peso-muerto-rumano",
    name: "Peso muerto rumano",
    description: null,
    muscleGroups: ["BACK", "LEGS"],
  },
  {
    id: "exercise-overhead-press",
    slug: "press-militar",
    name: "Press militar",
    description: null,
    muscleGroups: ["SHOULDERS"],
  },
].map((exercise) => ({
  ...exercise,
  createdAt: timestampDaysAgo(60, 9),
  updatedAt: timestampDaysAgo(60, 9),
}));

const weightEntries: MockWeightEntry[] = [
  { day: 35, weight: 82.4 },
  { day: 28, weight: 81.9 },
  { day: 21, weight: 81.2 },
  { day: 14, weight: 80.8 },
  { day: 7, weight: 80.3 },
  { day: 1, weight: 79.9 },
].map(({ day, weight }) => ({
  id: `demo-weight-${day}`,
  userId: demoUser.id,
  weightKg: weight,
  measuredAt: timestampDaysAgo(day, 8),
  createdAt: timestampDaysAgo(day, 8),
}));

const workoutTemplates = [
  { day: 27, duration: 52, name: "Tren superior" },
  { day: 23, duration: 46, name: "Pierna" },
  { day: 19, duration: 61, name: "Full body" },
  { day: 15, duration: 48, name: "Pecho y tríceps" },
  { day: 11, duration: 57, name: "Espalda y bíceps" },
  { day: 6, duration: 43, name: "Pierna" },
  { day: 1, duration: 55, name: "Full body" },
];

const workouts: MockWorkout[] = workoutTemplates.map(
  ({ day, duration, name }, index) => {
    const completedAt = timestampDaysAgo(day, 19);
    const startedAt = new Date(
      new Date(completedAt).getTime() - duration * 60_000,
    ).toISOString();
    const exercise = exerciseCatalog[index % exerciseCatalog.length];

    return {
      id: `demo-workout-${index + 1}`,
      userId: demoUser.id,
      name,
      startedAt,
      completedAt,
      notes: null,
      exercises: [
        {
          id: `demo-workout-exercise-${index + 1}`,
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          position: 0,
          restSeconds: 90,
          sets: [
            {
              id: `demo-workout-set-${index + 1}-1`,
              setNumber: 1,
              reps: 10,
              weightKg: 40 + index * 2.5,
            },
            {
              id: `demo-workout-set-${index + 1}-2`,
              setNumber: 2,
              reps: 8,
              weightKg: 42.5 + index * 2.5,
            },
          ],
        },
      ],
    };
  },
);

const routines: MockRoutine[] = [];

const jsonError = (message: string, status: number) =>
  HttpResponse.json({ message }, { status });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseRoutineExercises = (
  values: unknown,
):
  | { exercises: MockRoutineExercise[] }
  | { error: string } => {
  if (!Array.isArray(values) || values.length > 100) {
    return { error: "Indica una lista de ejercicios válida." };
  }

  const parsedExercises: MockRoutineExercise[] = [];
  const positions = new Set<number>();
  for (const [position, value] of values.entries()) {
    if (
      !isRecord(value) ||
      typeof value.exerciseId !== "string" ||
      typeof value.position !== "number" ||
      !Number.isInteger(value.position) ||
      value.position < 0 ||
      value.position > 1000 ||
      !Array.isArray(value.sets) ||
      value.sets.length < 1 ||
      value.sets.length > 100 ||
      typeof value.restSeconds !== "number" ||
      !Number.isInteger(value.restSeconds) ||
      value.restSeconds < 0 ||
      value.restSeconds > 3600
    ) {
      return { error: "Los datos de uno de los ejercicios no son válidos." };
    }

    if (positions.has(value.position)) {
      return { error: "Las posiciones de los ejercicios deben ser únicas." };
    }
    positions.add(value.position);

    const exercise = exerciseCatalog.find(
      (candidate) => candidate.id === value.exerciseId,
    );
    if (!exercise) return { error: "El ejercicio no existe." };

    const routineSets: MockRoutineSet[] = [];
    const setNumbers = new Set<number>();
    for (const set of value.sets) {
      if (
        !isRecord(set) ||
        typeof set.setNumber !== "number" ||
        !Number.isInteger(set.setNumber) ||
        set.setNumber < 1 ||
        set.setNumber > 100 ||
        typeof set.reps !== "number" ||
        !Number.isInteger(set.reps) ||
        set.reps < 1 ||
        set.reps > 1000 ||
        (set.weightKg !== undefined &&
          set.weightKg !== null &&
          (typeof set.weightKg !== "number" ||
            !Number.isFinite(set.weightKg) ||
            set.weightKg < 0 ||
            set.weightKg > 99999.99))
      ) {
        return { error: "Los datos de una de las series no son válidos." };
      }
      if (setNumbers.has(set.setNumber)) {
        return { error: "Los números de serie deben ser únicos." };
      }
      setNumbers.add(set.setNumber);
      routineSets.push({
        id: crypto.randomUUID(),
        setNumber: set.setNumber,
        reps: set.reps,
        weightKg: typeof set.weightKg === "number" ? set.weightKg : null,
      });
    }

    parsedExercises.push({
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      position: value.position ?? position,
      sets: routineSets.sort((a, b) => a.setNumber - b.setNumber),
      restSeconds: value.restSeconds,
      exercise,
    });
  }

  return { exercises: parsedExercises };
};

const isAuthRequest = (value: unknown): value is AuthRequest =>
  isRecord(value);

const getActiveUser = (request: Request) => {
  const serializedSession = request.headers.get("X-Mock-Session");
  if (!serializedSession) return null;

  try {
    const value: unknown = JSON.parse(decodeURIComponent(serializedSession));
    if (
      !isRecord(value) ||
      !isRecord(value.user) ||
      typeof value.user.id !== "string" ||
      typeof value.user.name !== "string" ||
      typeof value.user.email !== "string" ||
      typeof value.password !== "string"
    ) {
      return null;
    }

    const user: MockUser = {
      id: value.user.id,
      name: value.user.name,
      email: value.user.email,
      password: value.password,
      emailVerified:
        typeof value.user.emailVerified === "boolean"
          ? value.user.emailVerified
          : false,
      image: typeof value.user.image === "string" ? value.user.image : null,
      createdAt:
        typeof value.user.createdAt === "string"
          ? value.user.createdAt
          : new Date().toISOString(),
      updatedAt:
        typeof value.user.updatedAt === "string"
          ? value.user.updatedAt
          : new Date().toISOString(),
    };
    users.set(user.email, user);
    return user;
  } catch {
    return null;
  }
};

const requireActiveUser = (request: Request) => {
  const user = getActiveUser(request);
  return user
    ? { user, response: null }
    : {
        user: null,
        response: HttpResponse.json(
          {
            error: {
              code: "UNAUTHORIZED",
              message: "A valid session is required.",
            },
          },
          { status: 401 },
        ),
      };
};

const publicUser = ({
  password: _password,
  ...user
}: MockUser): Omit<MockUser, "password"> => user;

const getAuthSession = (user: MockUser) => ({
  session: {
    id: `mock-session-${user.id}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    userId: user.id,
  },
  user: publicUser(user),
});

export const handlers = [
  http.post("*/api/auth/sign-up/email", async ({ request }) => {
    const body: unknown = await request.json();

    if (
      !isAuthRequest(body) ||
      typeof body.name !== "string" ||
      !body.name.trim() ||
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      return jsonError("Completa todos los campos correctamente.", 400);
    }

    if (body.password.length < 8) {
      return jsonError("La contraseña debe tener al menos 8 caracteres.", 400);
    }

    const email = body.email.trim().toLowerCase();
    if (users.has(email)) {
      return jsonError("Ya existe una cuenta con ese correo electrónico.", 422);
    }

    const timestamp = new Date().toISOString();
    const user: MockUser = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      email,
      password: body.password,
      emailVerified: false,
      image: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    users.set(email, user);

    return HttpResponse.json({
      token: `mock-session-${user.id}`,
      user: publicUser(user),
    });
  }),

  http.post("*/api/auth/sign-in/email", async ({ request }) => {
    const body: unknown = await request.json();
    if (
      !isAuthRequest(body) ||
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      return jsonError("Correo electrónico o contraseña no válidos.", 401);
    }

    const user = users.get(body.email.trim().toLowerCase());
    if (!user || user.password !== body.password) {
      return jsonError("Correo electrónico o contraseña no válidos.", 401);
    }

    return HttpResponse.json({
      token: `mock-session-${user.id}`,
      user: publicUser(user),
    });
  }),

  http.get("*/api/auth/get-session", ({ request }) => {
    const user = getActiveUser(request);
    return HttpResponse.json(user ? getAuthSession(user) : null);
  }),

  http.post("*/api/auth/sign-out", ({ request }) => {
    const { response } = requireActiveUser(request);
    if (response) return response;

    return HttpResponse.json({ success: true });
  }),

  http.post("*/api/auth/update-user", async ({ request }) => {
    const { user, response } = requireActiveUser(request);
    if (response) return response;

    const body: unknown = await request.json();
    if (!isAuthRequest(body) || typeof body.name !== "string" || !body.name.trim()) {
      return jsonError("El nombre es obligatorio.", 400);
    }

    const updatedUser = {
      ...user,
      name: body.name.trim(),
      updatedAt: new Date().toISOString(),
    };
    users.set(updatedUser.email, updatedUser);
    return HttpResponse.json({ status: true });
  }),

  http.post("*/api/auth/change-password", async ({ request }) => {
    const { user, response } = requireActiveUser(request);
    if (response) return response;

    const body: unknown = await request.json();
    if (
      !isAuthRequest(body) ||
      typeof body.currentPassword !== "string" ||
      typeof body.newPassword !== "string"
    ) {
      return jsonError("Completa la contraseña actual y la nueva.", 400);
    }
    if (body.currentPassword !== user.password) {
      return jsonError("La contraseña actual no es correcta.", 400);
    }
    if (body.newPassword.length < 8) {
      return jsonError("La contraseña debe tener al menos 8 caracteres.", 400);
    }

    const updatedUser = {
      ...user,
      password: body.newPassword,
      updatedAt: new Date().toISOString(),
    };
    users.set(updatedUser.email, updatedUser);
    return HttpResponse.json({
      token: `mock-session-${user.id}`,
      user: publicUser(updatedUser),
    });
  }),

  http.get("*/api/v1/exercises", ({ request }) => {
    const { response } = requireActiveUser(request);
    if (response) return response;

    const url = new URL(request.url);
    const muscleGroup = url.searchParams.get("muscleGroup");
    const query = url.searchParams.get("q")?.toLocaleLowerCase();
    const filtered = exerciseCatalog.filter(
      (exercise) =>
        (!muscleGroup || exercise.muscleGroups.includes(muscleGroup)) &&
        (!query || exercise.name.toLocaleLowerCase().includes(query)),
    );
    return HttpResponse.json(filtered);
  }),

  http.get("*/api/v1/weight-entries", ({ request }) => {
    const { user, response } = requireActiveUser(request);
    if (response) return response;

    return HttpResponse.json(
      weightEntries
        .filter((entry) => entry.userId === user.id)
        .sort(
          (a, b) =>
            new Date(b.measuredAt).getTime() -
            new Date(a.measuredAt).getTime(),
        ),
    );
  }),

  http.post("*/api/v1/weight-entries", async ({ request }) => {
    const { user, response } = requireActiveUser(request);
    if (response) return response;

    const body: unknown = await request.json();
    if (
      !isRecord(body) ||
      typeof body.weightKg !== "number" ||
      body.weightKg < 1 ||
      body.weightKg > 999.99
    ) {
      return jsonError("El peso debe estar entre 1 y 999.99 kg.", 400);
    }

    const measuredAt =
      typeof body.measuredAt === "string"
        ? body.measuredAt
        : new Date().toISOString();
    const entry: MockWeightEntry = {
      id: crypto.randomUUID(),
      userId: user.id,
      weightKg: body.weightKg,
      measuredAt,
      createdAt: new Date().toISOString(),
    };
    weightEntries.push(entry);
    return HttpResponse.json(entry, { status: 201 });
  }),

  http.get("*/api/v1/workouts", ({ request }) => {
    const { user, response } = requireActiveUser(request);
    if (response) return response;

    return HttpResponse.json(
      workouts
        .filter((workout) => workout.userId === user.id)
        .sort(
          (a, b) =>
            new Date(b.completedAt).getTime() -
            new Date(a.completedAt).getTime(),
        ),
    );
  }),

  http.get("*/api/v1/routines", ({ request }) => {
    const { user, response } = requireActiveUser(request);
    if (response) return response;

    return HttpResponse.json(
      routines
        .filter((routine) => routine.userId === user.id)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() -
            new Date(a.updatedAt).getTime(),
        ),
    );
  }),

  http.post("*/api/v1/routines", async ({ request }) => {
    const { user, response } = requireActiveUser(request);
    if (response) return response;

    const body: unknown = await request.json();
    if (
      !isRecord(body) ||
      typeof body.name !== "string" ||
      !body.name.trim() ||
      body.name.trim().length > 100 ||
      !Array.isArray(body.exercises)
    ) {
      return jsonError("Indica un nombre y una lista de ejercicios.", 400);
    }

    const parsedExercises = parseRoutineExercises(body.exercises);
    if ("error" in parsedExercises) {
      return jsonError(parsedExercises.error, 400);
    }

    const timestamp = new Date().toISOString();
    const routine: MockRoutine = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: body.name.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
      exercises: parsedExercises.exercises,
    };
    routines.push(routine);
    return HttpResponse.json(routine, { status: 201 });
  }),

  http.patch("*/api/v1/routines/:id", async ({ request, params }) => {
    const { user, response } = requireActiveUser(request);
    if (response) return response;

    const routine = routines.find(
      (item) => item.id === params.id && item.userId === user.id,
    );
    if (!routine) return jsonError("La rutina no existe.", 404);

    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return jsonError("Indica los cambios de la rutina.", 400);
    }
    if (
      body.name !== undefined &&
      (typeof body.name !== "string" ||
        !body.name.trim() ||
        body.name.trim().length > 100)
    ) {
      return jsonError("El nombre de la rutina no es válido.", 400);
    }
    if (body.name === undefined && body.exercises === undefined) {
      return jsonError("Indica al menos un campo para actualizar.", 400);
    }

    let updatedExercises = routine.exercises;
    if (body.exercises !== undefined) {
      const parsedExercises = parseRoutineExercises(body.exercises);
      if ("error" in parsedExercises) {
        return jsonError(parsedExercises.error, 400);
      }
      updatedExercises = parsedExercises.exercises;
    }

    const updatedRoutine: MockRoutine = {
      ...routine,
      ...(typeof body.name === "string" && { name: body.name.trim() }),
      exercises: updatedExercises,
      updatedAt: new Date().toISOString(),
    };
    routines[routines.indexOf(routine)] = updatedRoutine;
    return HttpResponse.json(updatedRoutine);
  }),

  http.delete("*/api/v1/routines/:id", ({ request, params }) => {
    const { user, response } = requireActiveUser(request);
    if (response) return response;

    const routineIndex = routines.findIndex(
      (routine) => routine.id === params.id && routine.userId === user.id,
    );
    if (routineIndex === -1) return jsonError("La rutina no existe.", 404);

    routines.splice(routineIndex, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
