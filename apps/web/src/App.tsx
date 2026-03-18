import { useEffect, useMemo, useState } from "react";

type DayKey =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

type Goal = "Build muscle" | "Lose fat" | "Lean out";
type FocusTag = "Strength" | "Shape" | "Recovery" | "Core";

type Exercise = {
  id: string;
  name: string;
  group: string;
  equipment: string;
  focus: FocusTag;
};

type WorkoutExercise = {
  exerciseId: string;
  sets: number;
  reps: string;
  rest: string;
  cue: string;
  completed: boolean;
};

type WorkoutDay = {
  label: string;
  subtitle: string;
  duration: string;
  dayType: "train" | "rest";
  exercises: WorkoutExercise[];
};

type PlannerState = {
  athlete: string;
  goal: Goal;
  averageSteps: number;
  wakeupTime: string;
  proteinTarget: string;
  days: Record<DayKey, WorkoutDay>;
  notes: string;
};

const STORAGE_KEY = "gym-planner-3day-state";

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
  { id: "chest-press", name: "Chest Press", group: "Chest", equipment: "Machine", focus: "Shape" },
  { id: "lat-pulldown", name: "Lat Pulldown", group: "Back", equipment: "Cable", focus: "Shape" },
  { id: "shoulder-press", name: "Shoulder Press", group: "Shoulders", equipment: "Machine", focus: "Strength" },
  { id: "supported-row", name: "Supported Row", group: "Back", equipment: "Machine", focus: "Shape" },
  { id: "pec-fly", name: "Pec Fly", group: "Chest", equipment: "Machine", focus: "Shape" },
  { id: "leg-press", name: "Leg Press", group: "Quads", equipment: "Machine", focus: "Strength" },
  { id: "leg-extension", name: "Leg Extension", group: "Quads", equipment: "Machine", focus: "Shape" },
  { id: "leg-curl", name: "Leg Curl", group: "Hamstrings", equipment: "Machine", focus: "Shape" },
  { id: "plank", name: "Plank", group: "Core", equipment: "Bodyweight", focus: "Core" },
  { id: "leg-raises", name: "Leg Raises", group: "Core", equipment: "Bodyweight", focus: "Core" },
  { id: "russian-twists", name: "Russian Twists", group: "Core", equipment: "Bodyweight", focus: "Core" },
  { id: "db-curl", name: "Dumbbell Bicep Curl", group: "Biceps", equipment: "Dumbbell", focus: "Shape" },
  {
    id: "tricep-overhead",
    name: "Tricep Overhead Extension",
    group: "Triceps",
    equipment: "Dumbbell",
    focus: "Shape"
  },
  { id: "lateral-raise", name: "Lateral Raise", group: "Shoulders", equipment: "Dumbbell", focus: "Shape" },
  { id: "treadmill", name: "Treadmill Walk", group: "Cardio", equipment: "Treadmill", focus: "Recovery" }
];

const createExercise = (
  exerciseId: string,
  sets: number,
  reps: string,
  rest: string,
  cue: string
): WorkoutExercise => ({
  exerciseId,
  sets,
  reps,
  rest,
  cue,
  completed: false
});

const defaultPlan: Record<DayKey, WorkoutDay> = {
  Monday: {
    label: "Day 1 Upper Body",
    subtitle: "Chest + back + shoulders",
    duration: "45-55 min",
    dayType: "train",
    exercises: [
      createExercise("chest-press", 3, "10-12", "45-60 sec", "Last 2 reps should feel hard."),
      createExercise("lat-pulldown", 3, "10-12", "45-60 sec", "Pull elbows down, do not yank."),
      createExercise("shoulder-press", 3, "10", "45-60 sec", "Stay controlled on the way down."),
      createExercise("supported-row", 3, "10-12", "45-60 sec", "Squeeze shoulder blades together."),
      createExercise("pec-fly", 3, "12", "45-60 sec", "Slow stretch, smooth return."),
      createExercise("treadmill", 1, "5-10 min", "0 sec", "Finish easy, do not turn it into a sprint.")
    ]
  },
  Tuesday: {
    label: "Recovery Day",
    subtitle: "Steps, stretch, recover",
    duration: "13.5k steps",
    dayType: "rest",
    exercises: []
  },
  Wednesday: {
    label: "Day 3 Lower Body",
    subtitle: "Legs + core",
    duration: "45-55 min",
    dayType: "train",
    exercises: [
      createExercise("leg-press", 3, "12", "45-60 sec", "Drive through the full foot."),
      createExercise("leg-extension", 3, "12", "45-60 sec", "Pause briefly at the top."),
      createExercise("leg-curl", 3, "12", "45-60 sec", "Control the lowering phase."),
      createExercise("plank", 3, "30-45 sec", "30 sec", "Brace like someone will punch your stomach."),
      createExercise("leg-raises", 3, "12", "30 sec", "Do not swing your hips."),
      createExercise("russian-twists", 3, "20", "30 sec", "Rotate your ribs, not just your arms.")
    ]
  },
  Thursday: {
    label: "Recovery Day",
    subtitle: "Walk, mobility, reset",
    duration: "13.5k steps",
    dayType: "rest",
    exercises: []
  },
  Friday: {
    label: "Day 5 Full Body",
    subtitle: "Best day for results",
    duration: "50-60 min",
    dayType: "train",
    exercises: [
      createExercise("chest-press", 3, "10", "45-60 sec", "Build pressure from the first rep."),
      createExercise("lat-pulldown", 3, "10", "45-60 sec", "Stay tall and smooth."),
      createExercise("leg-press", 3, "12", "45-60 sec", "Full range without bouncing."),
      createExercise("db-curl", 3, "12", "45-60 sec", "Keep elbows quiet."),
      createExercise("tricep-overhead", 3, "12", "45-60 sec", "Stretch fully behind the head."),
      createExercise("lateral-raise", 3, "12", "45-60 sec", "Lead with the elbows, not the wrists.")
    ]
  },
  Saturday: {
    label: "Weekend Recovery",
    subtitle: "Light activity only",
    duration: "Walk + mobility",
    dayType: "rest",
    exercises: []
  },
  Sunday: {
    label: "Weekend Recovery",
    subtitle: "Light activity only",
    duration: "Walk + mobility",
    dayType: "rest",
    exercises: []
  }
};

const createPlanner = (): PlannerState => ({
  athlete: "Saika",
  goal: "Build muscle",
  averageSteps: 13500,
  wakeupTime: "3:30 AM",
  proteinTarget: "90-120g",
  days: Object.fromEntries(
    dayOrder.map((day) => [
      day,
      {
        ...defaultPlan[day],
        exercises: defaultPlan[day].exercises.map((exercise) => ({ ...exercise }))
      }
    ])
  ) as Record<DayKey, WorkoutDay>,
  notes:
    "You already have the fat-loss base from daily steps. Use this plan to build shape, get stronger, and stay consistent without burning out."
});

const parseStoredState = (): PlannerState | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PlannerState) : null;
  } catch {
    return null;
  }
};

const today = new Intl.DateTimeFormat("en-AU", { weekday: "long" }).format(new Date()) as DayKey;

function getExercise(exerciseId: string) {
  return library.find((exercise) => exercise.id === exerciseId);
}

function createAiTips(planner: PlannerState, selectedDay: DayKey, completionRate: number) {
  const workout = planner.days[selectedDay];
  const isTrainingDay = workout.dayType === "train";

  return [
    {
      title: "AI read on your routine",
      body:
        planner.averageSteps >= 13000
          ? `Your average of ${planner.averageSteps.toLocaleString()} steps is already doing heavy work for fat loss. Keep gym intensity focused on muscle shape, not extra exhaustion.`
          : "Your daily movement is solid, so keep rest days active and save energy for quality lifting."
    },
    {
      title: isTrainingDay ? "Today's focus" : "Recovery focus",
      body: isTrainingDay
        ? `${workout.label} should feel challenging but controlled. Use weights that make the last 2 reps hard, rest ${workout.exercises[0]?.rest ?? "45-60 sec"}, and do not rush reps.`
        : "Treat today as active recovery. Hit your walking target, loosen up tight areas, and come back fresh for the next gym session."
    },
    {
      title: "Progress cue",
      body:
        completionRate >= 70
          ? "You are stacking consistency well. Next lever is simple progressive overload: when all sets feel clean, increase weight slightly next week."
          : "Right now the best improvement is consistency. Finish your planned sets first, then think about adding more load."
    },
    {
      title: "Nutrition reminder",
      body: `Keep meals regular and aim for ${planner.proteinTarget} protein. With your step count, skipping meals will hurt gym performance more than it helps fat loss.`
    }
  ];
}

export default function App() {
  const [planner, setPlanner] = useState<PlannerState>(() => parseStoredState() ?? createPlanner());
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
        const term = query.toLowerCase().trim();
        const matchesQuery =
          term === "" ||
          exercise.name.toLowerCase().includes(term) ||
          exercise.group.toLowerCase().includes(term) ||
          exercise.focus.toLowerCase().includes(term);

        return matchesGroup && matchesQuery;
      }),
    [groupFilter, query]
  );

  const allExercises = dayOrder.flatMap((day) => planner.days[day].exercises);
  const completedCount = allExercises.filter((exercise) => exercise.completed).length;
  const completionRate = allExercises.length === 0 ? 0 : Math.round((completedCount / allExercises.length) * 100);
  const weeklySets = allExercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const gymDays = dayOrder.filter((day) => planner.days[day].dayType === "train").length;
  const aiTips = createAiTips(planner, selectedDay, completionRate);

  const toggleExercise = (day: DayKey, index: number) => {
    setPlanner((current) => {
      const workout = current.days[day];
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

  const addExerciseToDay = (exerciseId: string) => {
    setPlanner((current) => {
      const workout = current.days[selectedDay];
      const nextExercise = createExercise(exerciseId, 3, "12", "45-60 sec", "Stay controlled and smooth.");

      return {
        ...current,
        days: {
          ...current.days,
          [selectedDay]: {
            ...workout,
            dayType: "train",
            exercises: [...workout.exercises, nextExercise]
          }
        }
      };
    });
  };

  const updateWorkoutField = (day: DayKey, field: "label" | "subtitle" | "duration", value: string) => {
    setPlanner((current) => ({
      ...current,
      days: {
        ...current.days,
        [day]: { ...current.days[day], [field]: value }
      }
    }));
  };

  return (
    <main className="planner-app">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Your 3-day plan</p>
          <h1>Walk a lot. Lift smart. Get leaner and more defined.</h1>
          <p className="hero-text">
            Built around your average {planner.averageSteps.toLocaleString()} daily steps, this plan keeps fat loss
            moving while using 3 gym days to add shape, strength, and consistency.
          </p>

          <div className="hero-points">
            <span>Day 1: Upper body</span>
            <span>Day 3: Lower body + core</span>
            <span>Day 5: Full body</span>
          </div>
        </div>

        <div className="hero-stack">
          <article className="metric-card">
            <span>Average steps</span>
            <strong>{planner.averageSteps.toLocaleString()}</strong>
            <small>Your fat-loss engine is already running daily</small>
          </article>
          <article className="metric-card">
            <span>Weekly gym days</span>
            <strong>{gymDays}</strong>
            <small>Enough to build shape without overloading recovery</small>
          </article>
          <article className="metric-card metric-card--accent">
            <span>Completion</span>
            <strong>{completionRate}%</strong>
            <small>{completedCount} of {allExercises.length} planned exercise blocks complete</small>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel panel--profile">
          <div className="section-head">
            <div>
              <p className="eyebrow">Personal setup</p>
              <h2>Plan settings</h2>
            </div>
          </div>

          <div className="profile-grid">
            <label>
              Athlete name
              <input
                value={planner.athlete}
                onChange={(event) => setPlanner((current) => ({ ...current, athlete: event.target.value }))}
              />
            </label>
            <label>
              Goal
              <select
                value={planner.goal}
                onChange={(event) => setPlanner((current) => ({ ...current, goal: event.target.value as Goal }))}
              >
                {(["Build muscle", "Lose fat", "Lean out"] as Goal[]).map((goal) => (
                  <option key={goal} value={goal}>
                    {goal}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Daily steps
              <input
                value={planner.averageSteps}
                onChange={(event) =>
                  setPlanner((current) => ({
                    ...current,
                    averageSteps: Number(event.target.value.replace(/\D/g, "")) || 0
                  }))
                }
              />
            </label>
            <label>
              Wake-up routine
              <input
                value={planner.wakeupTime}
                onChange={(event) => setPlanner((current) => ({ ...current, wakeupTime: event.target.value }))}
              />
            </label>
            <label>
              Protein target
              <input
                value={planner.proteinTarget}
                onChange={(event) => setPlanner((current) => ({ ...current, proteinTarget: event.target.value }))}
              />
            </label>
          </div>

          <label>
            Coaching note
            <textarea
              rows={4}
              value={planner.notes}
              onChange={(event) => setPlanner((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>
        </article>

        <article className="panel panel--ai">
          <div className="section-head">
            <div>
              <p className="eyebrow">AI coach</p>
              <h2>Smart guidance</h2>
            </div>
            <span className="pill">Frontend only</span>
          </div>

          <div className="ai-grid">
            {aiTips.map((tip) => (
              <article key={tip.title} className="ai-card">
                <h3>{tip.title}</h3>
                <p>{tip.body}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="panel panel--week">
          <div className="section-head">
            <div>
              <p className="eyebrow">Weekly structure</p>
              <h2>3-day split</h2>
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
                  <strong>{workout.label}</strong>
                  <small>{workout.subtitle}</small>
                </button>
              );
            })}
          </div>
        </article>

        <article className="panel panel--session">
          <div className="section-head">
            <div>
              <p className="eyebrow">{selectedWorkout.dayType === "train" ? "Gym day" : "Recovery day"}</p>
              <h2>{selectedWorkout.label}</h2>
            </div>
            <span className="pill">{selectedWorkout.duration}</span>
          </div>

          <div className="session-meta">
            <label>
              Day title
              <input
                value={selectedWorkout.label}
                onChange={(event) => updateWorkoutField(selectedDay, "label", event.target.value)}
              />
            </label>
            <label>
              Focus
              <input
                value={selectedWorkout.subtitle}
                onChange={(event) => updateWorkoutField(selectedDay, "subtitle", event.target.value)}
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

          {selectedWorkout.dayType === "train" ? (
            <div className="exercise-list">
              {selectedWorkout.exercises.map((entry, index) => {
                const exercise = getExercise(entry.exerciseId);

                return (
                  <article key={`${entry.exerciseId}-${index}`} className="exercise-card">
                    <button
                      type="button"
                      className={`check-toggle ${entry.completed ? "check-toggle--done" : ""}`}
                      onClick={() => toggleExercise(selectedDay, index)}
                    >
                      {entry.completed ? "Done" : "Mark"}
                    </button>

                    <div className="exercise-copy">
                      <div className="exercise-topline">
                        <h3>{exercise?.name ?? "Exercise"}</h3>
                        <span>{exercise?.group ?? "Custom"}</span>
                      </div>
                      <p>{entry.cue}</p>
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
                    </dl>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Active recovery is enough today</h3>
              <p>
                Hit your walking goal, stretch if you feel tight, and keep energy high for the next training day.
              </p>
            </div>
          )}
        </article>

        <article className="panel panel--library">
          <div className="section-head">
            <div>
              <p className="eyebrow">Exercise library</p>
              <h2>Add options</h2>
            </div>
          </div>

          <div className="library-toolbar">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search movement" />
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
              <p className="eyebrow">What to expect</p>
              <h2>Progress timeline</h2>
            </div>
          </div>

          <div className="summary-stack">
            <div className="summary-row">
              <span>Week 2-3</span>
              <strong>More strength and confidence</strong>
            </div>
            <div className="summary-row">
              <span>Week 4-6</span>
              <strong>Visible body changes</strong>
            </div>
            <div className="summary-row">
              <span>Week 8</span>
              <strong>Leaner, more defined look</strong>
            </div>
            <div className="summary-row">
              <span>Weekly sets</span>
              <strong>{weeklySets}</strong>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
