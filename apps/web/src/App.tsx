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
type AnimationKind =
  | "press"
  | "pull"
  | "row"
  | "fly"
  | "legs"
  | "curl"
  | "extension"
  | "plank"
  | "raise"
  | "twist"
  | "walk";

type Exercise = {
  id: string;
  name: string;
  group: string;
  equipment: string;
  focus: FocusTag;
  animation: AnimationKind;
  mediaUrl?: string;
};

type SetLog = {
  completed: boolean;
  weight: string;
  reps: string;
};

type WorkoutExercise = {
  exerciseId: string;
  sets: number;
  reps: string;
  rest: string;
  cue: string;
  completed: boolean;
  setLogs: SetLog[];
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
  trainingDays: number;
  averageSteps: number;
  weightKg: number;
  wakeupTime: string;
  proteinTarget: string;
  days: Record<DayKey, WorkoutDay>;
  notes: string;
};

type ActiveWorkout = {
  day: DayKey;
  startedAt: number;
  currentExerciseIndex: number;
  currentSetIndex: number;
  heartRate: number | null;
  fullscreen: boolean;
};

const STORAGE_KEY = "gym-planner-3day-state-v2";

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
  {
    id: "chest-press",
    name: "Chest Press",
    group: "Chest",
    equipment: "Machine",
    focus: "Shape",
    animation: "press",
    mediaUrl:
      "https://www.verywellfit.com/thmb/0rLZAXCUilV8s2YPQu0DlxBcKAg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/3498292-GettyImages-1201544432-c0f8195580a64fed94c42a852fe87547.jpg"
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    group: "Back",
    equipment: "Cable",
    focus: "Shape",
    animation: "pull",
    mediaUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/1268.gif"
  },
  {
    id: "shoulder-press",
    name: "Shoulder Press",
    group: "Shoulders",
    equipment: "Machine",
    focus: "Strength",
    animation: "press",
    mediaUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/876.gif"
  },
  {
    id: "supported-row",
    name: "Supported Row",
    group: "Back",
    equipment: "Machine",
    focus: "Shape",
    animation: "row"
  },
  {
    id: "pec-fly",
    name: "Pec Fly",
    group: "Chest",
    equipment: "Machine",
    focus: "Shape",
    animation: "fly",
    mediaUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/172.gif"
  },
  {
    id: "leg-press",
    name: "Leg Press",
    group: "Quads",
    equipment: "Machine",
    focus: "Strength",
    animation: "legs",
    mediaUrl: "https://www.verywellfit.com/thmb/0_4BPwSszzrmzmuVkQjwvYPYHXs=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/50-3498610-Leg-Press-GIF-7e720a89577d456db0bcb5dab2bd5d5f.gif"
  },
  {
    id: "leg-extension",
    name: "Leg Extension",
    group: "Quads",
    equipment: "Machine",
    focus: "Shape",
    animation: "extension",
    mediaUrl: "https://www.verywellfit.com/thmb/lWAu_mpx2iLvRU1YbBkmYqSTcsg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/44-3498573-Leg-Extension-GIF-369e8d86622b4313b74baf12a03afc46.gif"
  },
  {
    id: "leg-curl",
    name: "Leg Curl",
    group: "Hamstrings",
    equipment: "Machine",
    focus: "Shape",
    animation: "legs",
    mediaUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/161.gif"
  },
  { id: "plank", name: "Plank", group: "Core", equipment: "Bodyweight", focus: "Core", animation: "plank" },
  { id: "leg-raises", name: "Leg Raises", group: "Core", equipment: "Bodyweight", focus: "Core", animation: "raise" },
  {
    id: "russian-twists",
    name: "Russian Twists",
    group: "Core",
    equipment: "Bodyweight",
    focus: "Core",
    animation: "twist",
    mediaUrl:
      "https://app-media.fitbod.me/v2/114/images/angles/1.jpg"
  },
  {
    id: "db-curl",
    name: "Dumbbell Bicep Curl",
    group: "Biceps",
    equipment: "Dumbbell",
    focus: "Shape",
    animation: "curl",
    mediaUrl: "https://cdn.jefit.com/assets/img/exercises/gifs/116.gif"
  },
  {
    id: "tricep-overhead",
    name: "Tricep Overhead Extension",
    group: "Triceps",
    equipment: "Dumbbell",
    focus: "Shape",
    animation: "extension"
  },
  {
    id: "lateral-raise",
    name: "Lateral Raise",
    group: "Shoulders",
    equipment: "Dumbbell",
    focus: "Shape",
    animation: "raise",
    mediaUrl: "https://cdn.muscleandstrength.com/sites/default/files/dumbbell-lateral-raise.jpg"
  },
  {
    id: "treadmill",
    name: "Treadmill Walk",
    group: "Cardio",
    equipment: "Treadmill",
    focus: "Recovery",
    animation: "walk"
  }
];

const makeSetLogs = (sets: number, reps: string): SetLog[] =>
  Array.from({ length: sets }, () => ({
    completed: false,
    weight: "",
    reps
  }));

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
  completed: false,
  setLogs: makeSetLogs(sets, reps)
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

function cloneWorkoutDay(day: WorkoutDay): WorkoutDay {
  return {
    ...day,
    exercises: day.exercises.map((exercise) => ({
      ...exercise,
      setLogs: exercise.setLogs.map((setLog) => ({ ...setLog }))
    }))
  };
}

function buildPlanForTrainingDays(trainingDays: number): Record<DayKey, WorkoutDay> {
  const restDay = (label: string, subtitle: string, duration: string): WorkoutDay => ({
    label,
    subtitle,
    duration,
    dayType: "rest",
    exercises: []
  });

  const upperTwo = cloneWorkoutDay({
    label: "Upper 2",
    subtitle: "Back width + shoulders + arms",
    duration: "45-55 min",
    dayType: "train",
    exercises: [
      createExercise("lat-pulldown", 3, "10-12", "45-60 sec", "Pull to upper chest with control."),
      createExercise("supported-row", 3, "10-12", "45-60 sec", "Drive elbows back, pause at the end."),
      createExercise("shoulder-press", 3, "10", "45-60 sec", "Do not arch your back."),
      createExercise("db-curl", 3, "12", "45-60 sec", "Control both the lift and the lowering."),
      createExercise("lateral-raise", 3, "12", "45-60 sec", "Raise with elbows leading.")
    ]
  });

  const lowerTwo = cloneWorkoutDay({
    label: "Lower 2",
    subtitle: "Legs + core + machine focus",
    duration: "45-55 min",
    dayType: "train",
    exercises: [
      createExercise("leg-press", 3, "12", "45-60 sec", "Full range, no bouncing."),
      createExercise("leg-extension", 3, "12", "45-60 sec", "Pause at the top each rep."),
      createExercise("leg-curl", 3, "12", "45-60 sec", "Control the return."),
      createExercise("plank", 3, "30-45 sec", "30 sec", "Brace and keep hips level."),
      createExercise("leg-raises", 3, "12", "30 sec", "Do not swing.")
    ]
  });

  if (trainingDays <= 2) {
    return {
      Monday: cloneWorkoutDay(defaultPlan.Monday),
      Tuesday: restDay("Recovery Day", "Steps, stretch, recover", "13.5k steps"),
      Wednesday: restDay("Recovery Day", "Walk, mobility, reset", "13.5k steps"),
      Thursday: cloneWorkoutDay(defaultPlan.Wednesday),
      Friday: restDay("Recovery Day", "Walk, mobility, reset", "13.5k steps"),
      Saturday: restDay("Weekend Recovery", "Light activity only", "Walk + mobility"),
      Sunday: restDay("Weekend Recovery", "Light activity only", "Walk + mobility")
    };
  }

  if (trainingDays === 3) {
    return Object.fromEntries(dayOrder.map((day) => [day, cloneWorkoutDay(defaultPlan[day])])) as Record<DayKey, WorkoutDay>;
  }

  if (trainingDays === 4) {
    return {
      Monday: cloneWorkoutDay(defaultPlan.Monday),
      Tuesday: cloneWorkoutDay(defaultPlan.Wednesday),
      Wednesday: restDay("Recovery Day", "Walk, mobility, reset", "13.5k steps"),
      Thursday: upperTwo,
      Friday: cloneWorkoutDay(defaultPlan.Friday),
      Saturday: restDay("Weekend Recovery", "Light activity only", "Walk + mobility"),
      Sunday: restDay("Weekend Recovery", "Light activity only", "Walk + mobility")
    };
  }

  return {
    Monday: cloneWorkoutDay(defaultPlan.Monday),
    Tuesday: cloneWorkoutDay(defaultPlan.Wednesday),
    Wednesday: upperTwo,
    Thursday: restDay("Recovery Day", "Walk, mobility, reset", "13.5k steps"),
    Friday: lowerTwo,
    Saturday: cloneWorkoutDay(defaultPlan.Friday),
    Sunday: restDay("Weekend Recovery", "Light activity only", "Walk + mobility")
  };
}

const createPlanner = (): PlannerState => ({
  athlete: "Saika",
  goal: "Build muscle",
  trainingDays: 3,
  averageSteps: 13500,
  weightKg: 72,
  wakeupTime: "3:30 AM",
  proteinTarget: "90-120g",
  days: buildPlanForTrainingDays(3),
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

function restToSeconds(rest: string) {
  const minuteMatch = rest.match(/(\d+)\s*min/i);
  const secondMatch = rest.match(/(\d+)\s*sec/i);

  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  const seconds = secondMatch ? Number(secondMatch[1]) : 0;

  return minutes * 60 + seconds;
}

function ExerciseDemo({ exercise }: { exercise: Exercise }) {
  if (exercise.mediaUrl) {
    return (
      <div className="exercise-media">
        <img
          className="exercise-media__image"
          src={exercise.mediaUrl}
          alt={`${exercise.name} tutorial`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <span>tutorial</span>
      </div>
    );
  }

  return (
    <div className={`exercise-demo exercise-demo--${exercise.animation}`} aria-hidden="true">
      <div className="exercise-demo__stage">
        <div className="exercise-demo__machine" />
        <div className="exercise-demo__track" />
        <div className="exercise-demo__body" />
        <div className="exercise-demo__limb exercise-demo__limb--left" />
        <div className="exercise-demo__limb exercise-demo__limb--right" />
        <div className="exercise-demo__weight" />
      </div>
      <span>{exercise.animation}</span>
    </div>
  );
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
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(planner));
  }, [planner]);

  useEffect(() => {
    if (!activeWorkout) {
      setElapsedSeconds(0);
      return;
    }

    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeWorkout.startedAt) / 1000)));
    };

    updateElapsed();
    const intervalId = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(intervalId);
  }, [activeWorkout]);

  useEffect(() => {
    if (restRemaining <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRestRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [restRemaining]);

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
  const activeSessionWorkout = activeWorkout ? planner.days[activeWorkout.day] : null;
  const activeExercise =
    activeWorkout && activeSessionWorkout ? activeSessionWorkout.exercises[activeWorkout.currentExerciseIndex] : null;
  const activeExerciseDetails = activeExercise ? getExercise(activeExercise.exerciseId) : null;
  const activeSet = activeWorkout && activeExercise ? activeExercise.setLogs[activeWorkout.currentSetIndex] : null;
  const estimatedCalories = useMemo(() => {
    if (!activeWorkout) {
      return 0;
    }

    const minutes = elapsedSeconds / 60;
    const baseMet = 4.8;
    const hrBoost = activeWorkout.heartRate ? Math.max(0, (activeWorkout.heartRate - 90) * 0.018) : 0;
    return Math.round(((baseMet + hrBoost) * 3.5 * planner.weightKg * minutes) / 200);
  }, [activeWorkout, elapsedSeconds, planner.weightKg]);
  const formattedElapsed = new Date(elapsedSeconds * 1000).toISOString().slice(11, 19);
  const formattedRest = new Date(restRemaining * 1000).toISOString().slice(14, 19);

  const setPlannerExercise = (
    day: DayKey,
    exerciseIndex: number,
    updater: (exercise: WorkoutExercise) => WorkoutExercise
  ) => {
    setPlanner((current) => ({
      ...current,
      days: {
        ...current.days,
        [day]: {
          ...current.days[day],
          exercises: current.days[day].exercises.map((exercise, index) =>
            index === exerciseIndex ? updater(exercise) : exercise
          )
        }
      }
    }));
  };

  const toggleExercise = (day: DayKey, index: number) => {
    setPlannerExercise(day, index, (exercise) => ({
      ...exercise,
      completed: !exercise.completed
    }));
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

  const startWorkout = (day: DayKey) => {
    const workout = planner.days[day];
    if (workout.dayType !== "train" || workout.exercises.length === 0) {
      return;
    }

    setSelectedDay(day);
    setRestRemaining(0);
    setActiveWorkout({
      day,
      startedAt: Date.now(),
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      heartRate: null,
      fullscreen: window.innerWidth < 800
    });
  };

  const finishWorkout = () => {
    setActiveWorkout(null);
    setRestRemaining(0);
  };

  const updateSetField = (
    day: DayKey,
    exerciseIndex: number,
    setIndex: number,
    field: "weight" | "reps",
    value: string
  ) => {
    setPlannerExercise(day, exerciseIndex, (exercise) => ({
      ...exercise,
      setLogs: exercise.setLogs.map((setLog, index) =>
        index === setIndex ? { ...setLog, [field]: value } : setLog
      )
    }));
  };

  const runnerClassName = `workout-runner ${activeWorkout?.fullscreen ? "workout-runner--fullscreen" : ""}`;

  const applyAiWorkoutUpdate = () => {
    setPlanner((current) => ({
      ...current,
      days: buildPlanForTrainingDays(current.trainingDays),
      notes: `AI updated your week for ${current.trainingDays} training days. Keep steps high, progress weights slowly, and use recovery days to stay fresh.`
    }));
    setActiveWorkout(null);
    setRestRemaining(0);
    setSelectedDay("Monday");
  };

  const completeCurrentSet = () => {
    if (!activeWorkout || !activeExercise) {
      return;
    }

    const { day, currentExerciseIndex, currentSetIndex } = activeWorkout;
    const nextRest = restToSeconds(activeExercise.rest);

    setPlannerExercise(day, currentExerciseIndex, (exercise) => {
      const setLogs = exercise.setLogs.map((setLog, index) =>
        index === currentSetIndex ? { ...setLog, completed: true } : setLog
      );
      const allDone = setLogs.every((setLog) => setLog.completed);

      return {
        ...exercise,
        setLogs,
        completed: allDone
      };
    });

    if (currentSetIndex < activeExercise.setLogs.length - 1) {
      setActiveWorkout((current) =>
        current
          ? {
              ...current,
              currentSetIndex: current.currentSetIndex + 1
            }
          : null
      );
      setRestRemaining(nextRest);
      return;
    }

    const workout = planner.days[day];
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setActiveWorkout((current) =>
        current
          ? {
              ...current,
              currentExerciseIndex: current.currentExerciseIndex + 1,
              currentSetIndex: 0
            }
          : null
      );
      setRestRemaining(nextRest);
      return;
    }

    finishWorkout();
  };

  const goToPreviousExercise = () => {
    if (!activeWorkout) {
      return;
    }

    if (activeWorkout.currentSetIndex > 0) {
      setActiveWorkout((current) =>
        current
          ? {
              ...current,
              currentSetIndex: current.currentSetIndex - 1
            }
          : null
      );
      return;
    }

    if (activeWorkout.currentExerciseIndex === 0) {
      return;
    }

    const previousExercise = planner.days[activeWorkout.day].exercises[activeWorkout.currentExerciseIndex - 1];
    setActiveWorkout((current) =>
      current
        ? {
            ...current,
            currentExerciseIndex: current.currentExerciseIndex - 1,
            currentSetIndex: Math.max(0, previousExercise.setLogs.length - 1)
          }
        : null
    );
  };

  const toggleFullscreenMode = () => {
    setActiveWorkout((current) => (current ? { ...current, fullscreen: !current.fullscreen } : null));
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
              Training days
              <select
                value={planner.trainingDays}
                onChange={(event) =>
                  setPlanner((current) => ({ ...current, trainingDays: Number(event.target.value) }))
                }
              >
                {[2, 3, 4, 5].map((days) => (
                  <option key={days} value={days}>
                    {days} days / week
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
              Weight (kg)
              <input
                value={planner.weightKg}
                onChange={(event) =>
                  setPlanner((current) => ({
                    ...current,
                    weightKg: Number(event.target.value.replace(/\D/g, "")) || 0
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

          <div className="profile-actions">
            <button type="button" className="chip-button chip-button--active" onClick={applyAiWorkoutUpdate}>
              AI update workouts
            </button>
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

          <div className="ai-note">
            AirPods heart rate is not available to a static web app. This app supports manual live heart-rate input and
            estimated calories during a workout.
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
            <div className="session-actions">
              <span className="pill">{selectedWorkout.duration}</span>
              {selectedWorkout.dayType === "train" ? (
                <button type="button" className="chip-button chip-button--active" onClick={() => startWorkout(selectedDay)}>
                  Start this workout
                </button>
              ) : null}
            </div>
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

          {activeWorkout && activeWorkout.day === selectedDay ? (
            <section className={runnerClassName}>
              <div className="workout-runner__topbar">
                <div className="workout-runner__stats">
                  <article className="runner-card">
                    <span>Workout time</span>
                    <strong>{formattedElapsed}</strong>
                  </article>
                  <article className="runner-card">
                    <span>Estimated calories</span>
                    <strong>{estimatedCalories}</strong>
                  </article>
                  <article className="runner-card">
                    <span>Exercise</span>
                    <strong>
                      {activeWorkout.currentExerciseIndex + 1}/{selectedWorkout.exercises.length}
                    </strong>
                  </article>
                  <article className={`runner-card ${restRemaining > 0 ? "runner-card--rest" : ""}`}>
                    <span>Rest timer</span>
                    <strong>{restRemaining > 0 ? formattedRest : "Ready"}</strong>
                  </article>
                </div>

                <div className="workout-runner__meta-actions">
                  <button type="button" className="chip-button" onClick={toggleFullscreenMode}>
                    {activeWorkout.fullscreen ? "Exit fullscreen" : "Fullscreen mode"}
                  </button>
                  <button type="button" className="chip-button" onClick={() => setRestRemaining(0)}>
                    Skip rest
                  </button>
                </div>
              </div>

              <div className="workout-runner__focus">
                {activeExerciseDetails ? <ExerciseDemo exercise={activeExerciseDetails} /> : null}

                <div className="workout-runner__copy">
                  <p className="eyebrow">Now doing</p>
                  <h3>{activeExerciseDetails?.name ?? "Exercise"}</h3>
                  <p>{activeExercise?.cue}</p>
                  <p className="workout-runner__set-progress">
                    Set {activeWorkout.currentSetIndex + 1} of {activeExercise?.setLogs.length ?? 0}
                  </p>
                </div>

                <label>
                  Live heart rate
                  <input
                    value={activeWorkout.heartRate ?? ""}
                    inputMode="numeric"
                    placeholder="Enter bpm"
                    onChange={(event) =>
                      setActiveWorkout((current) =>
                        current
                          ? {
                              ...current,
                              heartRate: event.target.value === "" ? null : Number(event.target.value)
                            }
                          : null
                      )
                    }
                  />
                </label>
              </div>

              {activeExercise ? (
                <div className="set-logger">
                  <div className="set-logger__head">
                    <h3>Set-by-set logging</h3>
                    <span>Enter actual weight and reps as you go</span>
                  </div>

                  <div className="set-logger__grid">
                    {activeExercise.setLogs.map((setLog, index) => (
                      <article
                        key={`${activeExercise.exerciseId}-set-${index}`}
                        className={`set-card ${index === activeWorkout.currentSetIndex ? "set-card--active" : ""} ${
                          setLog.completed ? "set-card--done" : ""
                        }`}
                      >
                        <div className="set-card__title">
                          <strong>Set {index + 1}</strong>
                          <span>{setLog.completed ? "Done" : "Pending"}</span>
                        </div>

                        <label>
                          Weight
                          <input
                            value={setLog.weight}
                            placeholder="kg"
                            onChange={(event) =>
                              updateSetField(
                                activeWorkout.day,
                                activeWorkout.currentExerciseIndex,
                                index,
                                "weight",
                                event.target.value
                              )
                            }
                          />
                        </label>

                        <label>
                          Reps
                          <input
                            value={setLog.reps}
                            placeholder="reps"
                            onChange={(event) =>
                              updateSetField(
                                activeWorkout.day,
                                activeWorkout.currentExerciseIndex,
                                index,
                                "reps",
                                event.target.value
                              )
                            }
                          />
                        </label>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="workout-runner__actions">
                <button type="button" className="chip-button" onClick={goToPreviousExercise}>
                  Previous
                </button>
                <button type="button" className="chip-button chip-button--active" onClick={completeCurrentSet}>
                  {activeExercise && activeWorkout.currentSetIndex === activeExercise.setLogs.length - 1
                    ? activeWorkout.currentExerciseIndex === selectedWorkout.exercises.length - 1
                      ? "Finish workout"
                      : "Complete exercise"
                    : "Complete set"}
                </button>
                <button type="button" className="chip-button" onClick={finishWorkout}>
                  End session
                </button>
              </div>
            </section>
          ) : null}

          {selectedWorkout.dayType === "train" ? (
            <div className="exercise-list">
              {selectedWorkout.exercises.map((entry, index) => {
                const exercise = getExercise(entry.exerciseId);

                return (
                  <article key={`${entry.exerciseId}-${index}`} className="exercise-card">
                    {exercise ? <ExerciseDemo exercise={exercise} /> : null}

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
                <ExerciseDemo exercise={exercise} />
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
