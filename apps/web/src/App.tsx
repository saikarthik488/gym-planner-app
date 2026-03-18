import { useEffect, useMemo, useState } from "react";

type DayKey =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

type Goal = "Build muscle" | "Lose fat" | "Get stronger" | "Stay consistent";
type Split = "Push Pull Legs" | "Upper Lower" | "Full Body";

type Exercise = {
  id: string;
  name: string;
  group: string;
  equipment: string;
  focus: string;
};

type WorkoutExercise = {
  exerciseId: string;
  sets: number;
  reps: string;
  rest: string;
  rpe: string;
  notes: string;
  completed: boolean;
};

type WorkoutDay = {
  label: string;
  theme: string;
  duration: string;
  exercises: WorkoutExercise[];
};

type PlannerState = {
  athlete: string;
  goal: Goal;
  split: Split;
  days: Record<DayKey, WorkoutDay | null>;
  notes: string;
};

const STORAGE_KEY = "gymverse-planner-state";

const dayOrder: DayKey[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const library: Exercise[] = [
  { id: "bench", name: "Barbell Bench Press", group: "Chest", equipment: "Barbell", focus: "Strength" },
  { id: "incline-db", name: "Incline Dumbbell Press", group: "Chest", equipment: "Dumbbell", focus: "Hypertrophy" },
  { id: "dip", name: "Weighted Dips", group: "Chest", equipment: "Bodyweight", focus: "Strength" },
  { id: "ohp", name: "Standing Overhead Press", group: "Shoulders", equipment: "Barbell", focus: "Strength" },
  { id: "lateral", name: "Cable Lateral Raise", group: "Shoulders", equipment: "Cable", focus: "Pump" },
  { id: "rope-pushdown", name: "Rope Pushdown", group: "Triceps", equipment: "Cable", focus: "Isolation" },
  { id: "pullup", name: "Weighted Pull-Up", group: "Back", equipment: "Bodyweight", focus: "Strength" },
  { id: "barbell-row", name: "Barbell Row", group: "Back", equipment: "Barbell", focus: "Strength" },
  { id: "lat-pulldown", name: "Lat Pulldown", group: "Back", equipment: "Cable", focus: "Hypertrophy" },
  { id: "face-pull", name: "Face Pull", group: "Rear Delts", equipment: "Cable", focus: "Isolation" },
  { id: "curl", name: "EZ Bar Curl", group: "Biceps", equipment: "Barbell", focus: "Isolation" },
  { id: "hammer", name: "Hammer Curl", group: "Biceps", equipment: "Dumbbell", focus: "Hypertrophy" },
  { id: "squat", name: "Back Squat", group: "Quads", equipment: "Barbell", focus: "Strength" },
  { id: "rdl", name: "Romanian Deadlift", group: "Hamstrings", equipment: "Barbell", focus: "Strength" },
  { id: "leg-press", name: "Leg Press", group: "Quads", equipment: "Machine", focus: "Hypertrophy" },
  { id: "leg-curl", name: "Seated Leg Curl", group: "Hamstrings", equipment: "Machine", focus: "Isolation" },
  { id: "calf", name: "Standing Calf Raise", group: "Calves", equipment: "Machine", focus: "Isolation" },
  { id: "deadlift", name: "Trap Bar Deadlift", group: "Posterior Chain", equipment: "Barbell", focus: "Strength" }
];

const createExercise = (
  exerciseId: string,
  sets: number,
  reps: string,
  rest: string,
  rpe: string,
  notes = ""
): WorkoutExercise => ({
  exerciseId,
  sets,
  reps,
  rest,
  rpe,
  notes,
  completed: false
});

const templates: Record<Split, Partial<Record<DayKey, WorkoutDay>>> = {
  "Push Pull Legs": {
    Monday: {
      label: "Push A",
      theme: "Chest, shoulders, triceps",
      duration: "65 min",
      exercises: [
        createExercise("bench", 4, "6-8", "2 min", "8"),
        createExercise("incline-db", 3, "8-10", "90 sec", "8"),
        createExercise("ohp", 4, "5-8", "2 min", "8"),
        createExercise("lateral", 4, "12-15", "60 sec", "9"),
        createExercise("rope-pushdown", 3, "12-15", "60 sec", "9")
      ]
    },
    Tuesday: {
      label: "Pull A",
      theme: "Lats, upper back, biceps",
      duration: "70 min",
      exercises: [
        createExercise("pullup", 4, "5-8", "2 min", "8"),
        createExercise("barbell-row", 4, "6-8", "2 min", "8"),
        createExercise("lat-pulldown", 3, "10-12", "75 sec", "9"),
        createExercise("face-pull", 3, "12-15", "45 sec", "9"),
        createExercise("curl", 3, "10-12", "60 sec", "9")
      ]
    },
    Thursday: {
      label: "Legs",
      theme: "Quads, hamstrings, glutes",
      duration: "75 min",
      exercises: [
        createExercise("squat", 4, "5-8", "2-3 min", "8"),
        createExercise("rdl", 4, "6-8", "2 min", "8"),
        createExercise("leg-press", 3, "10-12", "90 sec", "9"),
        createExercise("leg-curl", 3, "12-15", "60 sec", "9"),
        createExercise("calf", 4, "12-20", "45 sec", "9")
      ]
    },
    Friday: {
      label: "Push B",
      theme: "Upper push volume",
      duration: "60 min",
      exercises: [
        createExercise("dip", 4, "6-10", "2 min", "8"),
        createExercise("incline-db", 3, "10-12", "75 sec", "9"),
        createExercise("lateral", 4, "15-20", "45 sec", "9"),
        createExercise("rope-pushdown", 4, "12-15", "45 sec", "9")
      ]
    },
    Saturday: {
      label: "Pull B",
      theme: "Back density and arms",
      duration: "55 min",
      exercises: [
        createExercise("barbell-row", 4, "6-8", "2 min", "8"),
        createExercise("lat-pulldown", 3, "8-12", "75 sec", "9"),
        createExercise("hammer", 3, "10-12", "60 sec", "9"),
        createExercise("face-pull", 3, "15-20", "45 sec", "9")
      ]
    }
  },
  "Upper Lower": {
    Monday: {
      label: "Upper A",
      theme: "Heavy upper body",
      duration: "70 min",
      exercises: [
        createExercise("bench", 4, "5-8", "2 min", "8"),
        createExercise("pullup", 4, "5-8", "2 min", "8"),
        createExercise("ohp", 3, "6-8", "90 sec", "8"),
        createExercise("barbell-row", 3, "6-8", "90 sec", "8"),
        createExercise("curl", 3, "10-12", "60 sec", "9")
      ]
    },
    Tuesday: {
      label: "Lower A",
      theme: "Squat dominant",
      duration: "75 min",
      exercises: [
        createExercise("squat", 4, "5-8", "2-3 min", "8"),
        createExercise("leg-press", 3, "10-12", "90 sec", "9"),
        createExercise("leg-curl", 3, "12-15", "60 sec", "9"),
        createExercise("calf", 4, "12-20", "45 sec", "9")
      ]
    },
    Thursday: {
      label: "Upper B",
      theme: "Volume upper body",
      duration: "65 min",
      exercises: [
        createExercise("incline-db", 4, "8-10", "90 sec", "8"),
        createExercise("lat-pulldown", 4, "8-12", "75 sec", "9"),
        createExercise("lateral", 4, "12-15", "45 sec", "9"),
        createExercise("rope-pushdown", 3, "12-15", "45 sec", "9"),
        createExercise("hammer", 3, "10-12", "60 sec", "9")
      ]
    },
    Friday: {
      label: "Lower B",
      theme: "Hinge dominant",
      duration: "70 min",
      exercises: [
        createExercise("deadlift", 4, "3-5", "2-3 min", "8"),
        createExercise("rdl", 3, "6-8", "2 min", "8"),
        createExercise("leg-press", 3, "10-12", "90 sec", "9"),
        createExercise("calf", 4, "12-20", "45 sec", "9")
      ]
    }
  },
  "Full Body": {
    Monday: {
      label: "Full Body A",
      theme: "Squat, press, pull",
      duration: "60 min",
      exercises: [
        createExercise("squat", 4, "5-8", "2 min", "8"),
        createExercise("bench", 4, "5-8", "2 min", "8"),
        createExercise("barbell-row", 4, "6-8", "90 sec", "8"),
        createExercise("lateral", 3, "12-15", "45 sec", "9")
      ]
    },
    Wednesday: {
      label: "Full Body B",
      theme: "Hinge, incline, vertical pull",
      duration: "60 min",
      exercises: [
        createExercise("rdl", 4, "6-8", "2 min", "8"),
        createExercise("incline-db", 4, "8-10", "90 sec", "8"),
        createExercise("pullup", 4, "5-8", "2 min", "8"),
        createExercise("curl", 3, "10-12", "60 sec", "9")
      ]
    },
    Friday: {
      label: "Full Body C",
      theme: "Leg drive and accessories",
      duration: "55 min",
      exercises: [
        createExercise("leg-press", 4, "10-12", "90 sec", "9"),
        createExercise("ohp", 4, "6-8", "90 sec", "8"),
        createExercise("lat-pulldown", 4, "8-12", "75 sec", "9"),
        createExercise("rope-pushdown", 3, "12-15", "45 sec", "9")
      ]
    }
  }
};

const createPlanner = (split: Split): PlannerState => ({
  athlete: "Saika",
  goal: "Build muscle",
  split,
  days: dayOrder.reduce<Record<DayKey, WorkoutDay | null>>((acc, day) => {
    const workout = templates[split][day];
    acc[day] = workout
      ? {
          ...workout,
          exercises: workout.exercises.map((exercise) => ({ ...exercise }))
        }
      : null;
    return acc;
  }, {} as Record<DayKey, WorkoutDay | null>),
  notes:
    "Focus on 1-2 reps in reserve for compounds, add load when you hit the top of the rep range across all sets."
});

const parseStoredState = (): PlannerState | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as PlannerState;
  } catch {
    return null;
  }
};

const today = new Intl.DateTimeFormat("en-AU", { weekday: "long" }).format(new Date()) as DayKey;

function getExercise(exerciseId: string) {
  return library.find((exercise) => exercise.id === exerciseId);
}

export default function App() {
  const [planner, setPlanner] = useState<PlannerState>(() => parseStoredState() ?? createPlanner("Push Pull Legs"));
  const [selectedDay, setSelectedDay] = useState<DayKey>(today);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("All");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(planner));
  }, [planner]);

  const selectedWorkout = planner.days[selectedDay];

  const groups = useMemo(() => ["All", ...new Set(library.map((exercise) => exercise.group))], []);

  const filteredLibrary = useMemo(
    () =>
      library.filter((exercise) => {
        const matchesGroup = groupFilter === "All" || exercise.group === groupFilter;
        const matchesQuery =
          query.trim() === "" ||
          exercise.name.toLowerCase().includes(query.toLowerCase()) ||
          exercise.focus.toLowerCase().includes(query.toLowerCase());

        return matchesGroup && matchesQuery;
      }),
    [groupFilter, query]
  );

  const weeklySets = useMemo(
    () =>
      dayOrder.reduce((total, day) => {
        const workout = planner.days[day];
        if (!workout) {
          return total;
        }

        return total + workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
      }, 0),
    [planner.days]
  );

  const completionRate = useMemo(() => {
    const exercises = dayOrder.flatMap((day) => planner.days[day]?.exercises ?? []);
    if (exercises.length === 0) {
      return 0;
    }

    const completed = exercises.filter((exercise) => exercise.completed).length;
    return Math.round((completed / exercises.length) * 100);
  }, [planner.days]);

  const activeDays = dayOrder.filter((day) => planner.days[day]).length;

  const toggleExercise = (day: DayKey, index: number) => {
    setPlanner((current) => {
      const workout = current.days[day];
      if (!workout) {
        return current;
      }

      const exercises = workout.exercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index ? { ...exercise, completed: !exercise.completed } : exercise
      );

      return {
        ...current,
        days: {
          ...current.days,
          [day]: { ...workout, exercises }
        }
      };
    });
  };

  const applyTemplate = (split: Split) => {
    setPlanner((current) => ({
      ...createPlanner(split),
      athlete: current.athlete,
      goal: current.goal,
      notes: current.notes
    }));
  };

  const addExerciseToDay = (exerciseId: string) => {
    setPlanner((current) => {
      const workout = current.days[selectedDay];
      if (!workout) {
        return {
          ...current,
          days: {
            ...current.days,
            [selectedDay]: {
              label: `${selectedDay} Session`,
              theme: "Custom workout",
              duration: "55 min",
              exercises: [createExercise(exerciseId, 3, "8-12", "60 sec", "8")]
            }
          }
        };
      }

      return {
        ...current,
        days: {
          ...current.days,
          [selectedDay]: {
            ...workout,
            exercises: [...workout.exercises, createExercise(exerciseId, 3, "8-12", "60 sec", "8")]
          }
        }
      };
    });
  };

  const updateWorkoutField = (day: DayKey, field: "label" | "theme" | "duration", value: string) => {
    setPlanner((current) => {
      const workout = current.days[day];
      if (!workout) {
        return current;
      }

      return {
        ...current,
        days: {
          ...current.days,
          [day]: { ...workout, [field]: value }
        }
      };
    });
  };

  return (
    <main className="planner-app">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Gym planner</p>
          <h1>Build your week like a serious training block.</h1>
          <p className="hero-text">
            Static, frontend-only, and GitHub-ready. Your split, exercises, notes, and completed sets all persist in
            local storage.
          </p>
          <div className="hero-actions">
            {(["Push Pull Legs", "Upper Lower", "Full Body"] as Split[]).map((split) => (
              <button
                key={split}
                type="button"
                className={`chip-button ${planner.split === split ? "chip-button--active" : ""}`}
                onClick={() => applyTemplate(split)}
              >
                {split}
              </button>
            ))}
          </div>
        </div>

        <div className="hero-stack">
          <article className="metric-card">
            <span>Weekly sets</span>
            <strong>{weeklySets}</strong>
            <small>Across {activeDays} training days</small>
          </article>
          <article className="metric-card">
            <span>Completion</span>
            <strong>{completionRate}%</strong>
            <small>Track each exercise as you finish it</small>
          </article>
          <article className="metric-card metric-card--accent">
            <span>Today</span>
            <strong>{selectedWorkout?.label ?? "Recovery"}</strong>
            <small>{selectedWorkout?.duration ?? "Mobility / walk / reset"}</small>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel panel--profile">
          <div className="section-head">
            <div>
              <p className="eyebrow">Athlete profile</p>
              <h2>Plan settings</h2>
            </div>
          </div>

          <div className="profile-grid">
            <label>
              Athlete name
              <input
                value={planner.athlete}
                onChange={(event) => setPlanner((current) => ({ ...current, athlete: event.target.value }))}
                placeholder="Your name"
              />
            </label>
            <label>
              Primary goal
              <select
                value={planner.goal}
                onChange={(event) =>
                  setPlanner((current) => ({ ...current, goal: event.target.value as Goal }))
                }
              >
                {(["Build muscle", "Lose fat", "Get stronger", "Stay consistent"] as Goal[]).map((goal) => (
                  <option key={goal} value={goal}>
                    {goal}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Coaching notes
            <textarea
              rows={4}
              value={planner.notes}
              onChange={(event) => setPlanner((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>
        </article>

        <article className="panel panel--week">
          <div className="section-head">
            <div>
              <p className="eyebrow">Weekly split</p>
              <h2>{planner.split}</h2>
            </div>
          </div>

          <div className="day-tabs">
            {dayOrder.map((day) => {
              const workout = planner.days[day];
              return (
                <button
                  key={day}
                  type="button"
                  className={`day-tab ${selectedDay === day ? "day-tab--active" : ""}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <span>{day.slice(0, 3)}</span>
                  <strong>{workout?.label ?? "Rest"}</strong>
                </button>
              );
            })}
          </div>
        </article>

        <article className="panel panel--session">
          <div className="section-head">
            <div>
              <p className="eyebrow">Session builder</p>
              <h2>{selectedDay}</h2>
            </div>
            <span className="pill">{selectedWorkout?.duration ?? "Recovery day"}</span>
          </div>

          {selectedWorkout ? (
            <>
              <div className="session-meta">
                <label>
                  Workout name
                  <input
                    value={selectedWorkout.label}
                    onChange={(event) => updateWorkoutField(selectedDay, "label", event.target.value)}
                  />
                </label>
                <label>
                  Focus
                  <input
                    value={selectedWorkout.theme}
                    onChange={(event) => updateWorkoutField(selectedDay, "theme", event.target.value)}
                  />
                </label>
                <label>
                  Duration
                  <input
                    value={selectedWorkout.duration}
                    onChange={(event) => updateWorkoutField(selectedDay, "duration", event.target.value)}
                  />
                </label>
              </div>

              <div className="exercise-list">
                {selectedWorkout.exercises.map((entry, index) => {
                  const exercise = getExercise(entry.exerciseId);

                  return (
                    <article key={`${entry.exerciseId}-${index}`} className="exercise-card">
                      <button
                        type="button"
                        className={`check-toggle ${entry.completed ? "check-toggle--done" : ""}`}
                        onClick={() => toggleExercise(selectedDay, index)}
                        aria-label={`Toggle ${exercise?.name ?? "exercise"} completed`}
                      >
                        {entry.completed ? "Done" : "Mark"}
                      </button>

                      <div className="exercise-copy">
                        <div className="exercise-topline">
                          <h3>{exercise?.name ?? "Exercise"}</h3>
                          <span>{exercise?.group ?? "Custom"}</span>
                        </div>
                        <p>{selectedWorkout.theme}</p>
                      </div>

                      <dl className="exercise-stats">
                        <div>
                          <dt>Sets</dt>
                          <dd>{entry.sets}</dd>
                        </div>
                        <div>
                          <dt>Reps</dt>
                          <dd>{entry.reps}</dd>
                        </div>
                        <div>
                          <dt>Rest</dt>
                          <dd>{entry.rest}</dd>
                        </div>
                        <div>
                          <dt>RPE</dt>
                          <dd>{entry.rpe}</dd>
                        </div>
                      </dl>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>Recovery / rest day</h3>
              <p>Add an exercise from the library if you want to turn this into a custom session.</p>
            </div>
          )}
        </article>

        <article className="panel panel--library">
          <div className="section-head">
            <div>
              <p className="eyebrow">Exercise library</p>
              <h2>Add movements</h2>
            </div>
          </div>

          <div className="library-toolbar">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercise" />
            <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <div className="library-grid">
            {filteredLibrary.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                className="library-card"
                onClick={() => addExerciseToDay(exercise.id)}
              >
                <span className="library-group">{exercise.group}</span>
                <strong>{exercise.name}</strong>
                <small>
                  {exercise.equipment} / {exercise.focus}
                </small>
              </button>
            ))}
          </div>
        </article>

        <article className="panel panel--summary">
          <div className="section-head">
            <div>
              <p className="eyebrow">Progress view</p>
              <h2>Weekly snapshot</h2>
            </div>
          </div>

          <div className="summary-stack">
            <div className="summary-row">
              <span>Active split days</span>
              <strong>{activeDays}</strong>
            </div>
            <div className="summary-row">
              <span>Primary goal</span>
              <strong>{planner.goal}</strong>
            </div>
            <div className="summary-row">
              <span>Current athlete</span>
              <strong>{planner.athlete || "Unnamed"}</strong>
            </div>
            <div className="summary-row">
              <span>Stored locally</span>
              <strong>Yes</strong>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
