import React, { useState, useMemo } from "react";
import {
  Flame, Footprints, Dumbbell, Plus, Search, TrendingUp, X,
  Check, ChevronRight, Award, Minus, Trash2, ChevronLeft
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

/* ---------------------------------------------------------------------- */
/* Palette — iron / brass / chalk, grounded in gym equipment, not SaaS    */
/* ---------------------------------------------------------------------- */
const C = {
  base: "#181614",
  surface: "#211E1B",
  surfaceRaised: "#292420",
  hairline: "#38322C",
  chalk: "#F2EDE4",
  muted: "#9C9186",
  faint: "#655C52",
  rust: "#E8542C",
  rustDim: "#5A2C1D",
  brass: "#C9A227",
  moss: "#7C8F6E",
};

const CATEGORY_COLOR = {
  Chest: "#E8542C",
  Back: "#C9A227",
  Shoulders: "#8B7355",
  Legs: "#5C7A6B",
  Arms: "#B5563C",
  Core: "#A08B5C",
  Olympic: "#9B2E2E",
  Cardio: "#5C7A94",
  Custom: "#9C9186",
};

/* ---------------------------------------------------------------------- */
/* 100-exercise library                                                   */
/* ---------------------------------------------------------------------- */
const CHEST = ["Barbell Bench Press","Incline Barbell Bench Press","Decline Barbell Bench Press","Dumbbell Bench Press","Incline Dumbbell Press","Dumbbell Flyes","Cable Crossover","Chest Dip","Push-Up","Machine Chest Press","Pec Deck","Landmine Press"];
const BACK = ["Deadlift","Sumo Deadlift","Trap Bar Deadlift","Pull-Up","Chin-Up","Lat Pulldown","Barbell Row","Pendlay Row","T-Bar Row","Seated Cable Row","Single-Arm Dumbbell Row","Face Pull","Rack Pull","Good Morning","Hyperextension"];
const SHOULDERS = ["Overhead Press","Seated Dumbbell Press","Arnold Press","Lateral Raise","Front Raise","Rear Delt Fly","Cable Lateral Raise","Upright Row","Shrugs","Push Press","Reverse Pec Deck Fly"];
const LEGS = ["Back Squat","Front Squat","Zercher Squat","Leg Press","Romanian Deadlift","Bulgarian Split Squat","Walking Lunge","Leg Extension","Leg Curl","Hip Thrust","Glute Bridge","Calf Raise","Seated Calf Raise","Hack Squat","Goblet Squat","Box Squat","Step-Up","Sumo Squat","Nordic Curl"];
const ARMS = ["Barbell Curl","Dumbbell Curl","Hammer Curl","Preacher Curl","Cable Curl","Concentration Curl","EZ-Bar Curl","Incline Dumbbell Curl","Close-Grip Bench Press","Tricep Pushdown","Skull Crusher","Overhead Tricep Extension","Weighted Dip","Tricep Kickback","Diamond Push-Up","Rope Pushdown","Wrist Curl","Reverse Curl"];
const CORE = ["Plank","Hanging Leg Raise","Cable Crunch","Ab Wheel Rollout","Russian Twist","Sit-Up","Mountain Climber","Toe Touch","Side Plank","V-Up","Cable Woodchopper"];
const OLYMPIC = ["Clean and Jerk","Snatch","Power Clean","Clean Pull","Kettlebell Swing","Farmer's Carry"];
const CARDIO = ["Running","Rowing","Cycling","Jump Rope","Stair Climber","Elliptical","Swimming","Battle Ropes"];

function buildExerciseLibrary() {
  const groups = [["Chest",CHEST],["Back",BACK],["Shoulders",SHOULDERS],["Legs",LEGS],["Arms",ARMS],["Core",CORE],["Olympic",OLYMPIC],["Cardio",CARDIO]];
  let id = 1;
  const out = [];
  groups.forEach(([category, names]) => names.forEach((name) => out.push({ id: id++, name, category })));
  return out;
}
const BASE_EXERCISES = buildExerciseLibrary();

/* ---------------------------------------------------------------------- */
/* 1RM math — three published formulas, averaged for a steadier estimate  */
/* ---------------------------------------------------------------------- */
function epley(w, r) { return w * (1 + r / 30); }
function brzycki(w, r) { return r >= 37 ? w : w * (36 / (37 - r)); }
function lombardi(w, r) { return w * Math.pow(r, 0.10); }
function estimate1RM(weight, reps) {
  if (!weight || !reps) return null;
  const e = epley(weight, reps), b = brzycki(weight, reps), l = lombardi(weight, reps);
  return { avg: (e + b + l) / 3, epley: e, brzycki: b, lombardi: l };
}

/* ---------------------------------------------------------------------- */
/* Seed history so the dashboard / chart aren't empty on first look       */
/* ---------------------------------------------------------------------- */
const SEED_LOG = [
  { id: 1, date: "2026-08-10", entries: [{ name: "Back Squat", sets: [{ weight: 60, reps: 8 }] }, { name: "Barbell Bench Press", sets: [{ weight: 50, reps: 8 }] }, { name: "Deadlift", sets: [{ weight: 90, reps: 5 }] }] },
  { id: 2, date: "2026-08-17", entries: [{ name: "Back Squat", sets: [{ weight: 65, reps: 6 }] }, { name: "Barbell Bench Press", sets: [{ weight: 52.5, reps: 6 }] }, { name: "Deadlift", sets: [{ weight: 95, reps: 5 }] }] },
  { id: 3, date: "2026-08-24", entries: [{ name: "Back Squat", sets: [{ weight: 70, reps: 5 }] }, { name: "Barbell Bench Press", sets: [{ weight: 55, reps: 5 }] }, { name: "Deadlift", sets: [{ weight: 100, reps: 4 }] }] },
  { id: 4, date: "2026-08-31", entries: [{ name: "Back Squat", sets: [{ weight: 75, reps: 5 }] }, { name: "Barbell Bench Press", sets: [{ weight: 57.5, reps: 5 }] }, { name: "Deadlift", sets: [{ weight: 105, reps: 3 }] }] },
  { id: 5, date: "2026-09-05", entries: [{ name: "Back Squat", sets: [{ weight: 80, reps: 4 }] }, { name: "Barbell Bench Press", sets: [{ weight: 60, reps: 4 }] }, { name: "Deadlift", sets: [{ weight: 110, reps: 3 }] }] },
];

function bestE1rmForEntry(entry) {
  return Math.max(...entry.sets.map((s) => estimate1RM(s.weight, s.reps).avg));
}
function historyFor(log, exerciseName) {
  return log
    .filter((w) => w.entries.some((e) => e.name === exerciseName))
    .map((w) => {
      const entry = w.entries.find((e) => e.name === exerciseName);
      return { date: w.date.slice(5), e1rm: Math.round(bestE1rmForEntry(entry)) };
    });
}

/* ---------------------------------------------------------------------- */
/* Small UI atoms                                                         */
/* ---------------------------------------------------------------------- */
function TopBar({ title }) {
  return (
    <div style={{ background: C.base }} className="px-5 pt-3 pb-2 flex items-center justify-between">
      <span style={{ color: C.chalk }} className="text-[11px] tabular-nums font-semibold">9:41</span>
      <h1 style={{ color: C.chalk, fontFamily: "'Oswald', sans-serif" }} className="text-[15px] font-medium tracking-wide uppercase">{title}</h1>
      <span style={{ color: C.chalk }} className="text-[11px] font-semibold">100%</span>
    </div>
  );
}

function StepRing({ steps, goal }) {
  const pct = Math.min(1, steps / goal);
  const r = 46, circ = 2 * Math.PI * r;
  return (
    <svg width="112" height="112" viewBox="0 0 112 112">
      <circle cx="56" cy="56" r={r} fill="none" stroke={C.hairline} strokeWidth="10" />
      <circle
        cx="56" cy="56" r={r} fill="none" stroke={C.brass} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" transform="rotate(-90 56 56)"
      />
      <text x="56" y="52" textAnchor="middle" fill={C.chalk} fontSize="20" fontWeight="700" fontFamily="'Oswald', sans-serif">{steps.toLocaleString()}</text>
      <text x="56" y="70" textAnchor="middle" fill={C.muted} fontSize="9" letterSpacing="0.5">of {goal.toLocaleString()} steps</text>
    </svg>
  );
}

function CategoryDot({ category }) {
  return <span style={{ background: CATEGORY_COLOR[category] || C.muted }} className="inline-block w-2 h-2 rounded-full shrink-0" />;
}

function PrimaryButton({ children, onClick, disabled, full }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ background: disabled ? C.hairline : C.rust, color: disabled ? C.faint : C.chalk }}
      className={`${full ? "w-full" : ""} px-4 py-2.5 rounded-md text-[13px] font-semibold flex items-center justify-center gap-1.5 active:opacity-80 transition-opacity`}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, full }) {
  return (
    <button
      onClick={onClick}
      style={{ borderColor: C.hairline, color: C.chalk }}
      className={`${full ? "w-full" : ""} px-4 py-2.5 rounded-md text-[13px] font-medium border flex items-center justify-center gap-1.5 active:opacity-70 transition-opacity`}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* Exercise picker — search, filter by category, create-if-missing        */
/* ---------------------------------------------------------------------- */
function ExercisePicker({ exercises, onAdd, onCreateCustom, onClose }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const categories = ["All", ...Object.keys(CATEGORY_COLOR).filter((c) => c !== "Custom")];
  const filtered = exercises.filter((e) =>
    (cat === "All" || e.category === cat) && e.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ background: C.base }} className="absolute inset-0 z-20 flex flex-col">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={onClose} style={{ color: C.chalk }}><ChevronLeft size={20} /></button>
        <h2 style={{ color: C.chalk, fontFamily: "'Oswald', sans-serif" }} className="text-[15px] uppercase tracking-wide font-medium">Add exercise</h2>
      </div>

      <div className="px-4 pb-2">
        <div style={{ background: C.surface, borderColor: C.hairline }} className="flex items-center gap-2 rounded-md border px-3 py-2">
          <Search size={14} color={C.muted} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 100+ exercises"
            style={{ color: C.chalk, background: "transparent" }}
            className="flex-1 text-[13px] outline-none placeholder:text-[#655C52]"
          />
        </div>
      </div>

      <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{
              background: cat === c ? C.rust : C.surface,
              color: cat === c ? C.chalk : C.muted,
              borderColor: C.hairline,
            }}
            className="shrink-0 px-3 py-1 rounded-full text-[11px] font-medium border"
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="pt-10 flex flex-col items-center gap-3 text-center">
            <p style={{ color: C.muted }} className="text-[13px]">No exercise matches "{query}".</p>
            <PrimaryButton onClick={() => { onCreateCustom(query); onClose(); }} disabled={!query.trim()}>
              <Plus size={14} /> Create "{query || "..."}"
            </PrimaryButton>
          </div>
        ) : (
          filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => { onAdd(ex); onClose(); }}
              style={{ borderColor: C.hairline }}
              className="w-full flex items-center gap-3 py-3 border-b text-left"
            >
              <CategoryDot category={ex.category} />
              <span style={{ color: C.chalk }} className="text-[13px] flex-1">{ex.name}</span>
              <span style={{ color: C.faint }} className="text-[10px] uppercase tracking-wide">{ex.category}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Today tab                                                              */
/* ---------------------------------------------------------------------- */
function TodayTab({ steps, setSteps, calories, setCalories, log, exercises }) {
  const prList = ["Back Squat", "Barbell Bench Press", "Deadlift"].map((name) => {
    const h = historyFor(log, name);
    const best = h.length ? Math.max(...h.map((p) => p.e1rm)) : null;
    return { name, best };
  }).filter((p) => p.best);

  return (
    <div className="px-4 py-4 space-y-4">
      <div style={{ background: C.surface, borderColor: C.hairline }} className="rounded-md border p-4 flex items-center gap-4">
        <StepRing steps={steps} goal={10000} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-1.5" style={{ color: C.muted }}>
            <Footprints size={13} /><span className="text-[11px]">Steps today</span>
          </div>
          <input
            type="number" value={steps}
            onChange={(e) => setSteps(Math.max(0, Number(e.target.value)))}
            style={{ background: C.surfaceRaised, color: C.chalk, borderColor: C.hairline }}
            className="w-full text-[12px] rounded border px-2 py-1.5 outline-none tabular-nums"
          />
          <p style={{ color: C.faint }} className="text-[10px] leading-snug">Manual for this preview — the real app reads this from Apple Health.</p>
        </div>
      </div>

      <div style={{ background: C.surface, borderColor: C.hairline }} className="rounded-md border p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5" style={{ color: C.muted }}>
            <Flame size={13} /><span className="text-[11px]">Calories burned today</span>
          </div>
          <span style={{ color: C.chalk, fontFamily: "'Oswald', sans-serif" }} className="text-2xl font-semibold tabular-nums">{calories}</span>
        </div>
        <input
          type="range" min="0" max="1200" value={calories}
          onChange={(e) => setCalories(Number(e.target.value))}
          className="w-full accent-current" style={{ accentColor: C.rust }}
        />
        <p style={{ color: C.faint }} className="text-[10px] mt-1 leading-snug">Manual for this preview — the real app combines Apple Health active-energy with logged sets.</p>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-2" style={{ color: C.muted }}>
          <Award size={13} /><span className="text-[11px] uppercase tracking-wide">Current estimated 1RMs</span>
        </div>
        <div style={{ background: C.surface, borderColor: C.hairline }} className="rounded-md border divide-y" >
          {prList.map((p) => (
            <div key={p.name} className="flex items-center justify-between px-4 py-3" style={{ borderColor: C.hairline }}>
              <span style={{ color: C.chalk }} className="text-[13px]">{p.name}</span>
              <span style={{ color: C.brass, fontFamily: "'Oswald', sans-serif" }} className="text-[15px] font-semibold tabular-nums">{Math.round(p.best)} kg</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Workouts tab                                                           */
/* ---------------------------------------------------------------------- */
function WorkoutsTab({ exercises, onCreateCustom, log, setLog }) {
  const [active, setActive] = useState(null); // { entries: [{name, sets:[]}] }
  const [picking, setPicking] = useState(false);

  function startWorkout() { setActive({ entries: [] }); }
  function addExercise(ex) {
    setActive((a) => ({ ...a, entries: [...a.entries, { name: ex.name, sets: [{ weight: "", reps: "" }] }] }));
  }
  function updateSet(ei, si, field, value) {
    setActive((a) => {
      const entries = a.entries.map((e, i) => i !== ei ? e : {
        ...e, sets: e.sets.map((s, j) => j !== si ? s : { ...s, [field]: value }),
      });
      return { ...a, entries };
    });
  }
  function addSet(ei) {
    setActive((a) => ({ ...a, entries: a.entries.map((e, i) => i !== ei ? e : { ...e, sets: [...e.sets, { weight: "", reps: "" }] }) }));
  }
  function removeExercise(ei) {
    setActive((a) => ({ ...a, entries: a.entries.filter((_, i) => i !== ei) }));
  }
  function finishWorkout() {
    const cleaned = active.entries
      .map((e) => ({ ...e, sets: e.sets.filter((s) => s.weight && s.reps).map((s) => ({ weight: Number(s.weight), reps: Number(s.reps) })) }))
      .filter((e) => e.sets.length);
    if (cleaned.length) {
      setLog((l) => [{ id: Date.now(), date: new Date().toISOString().slice(0, 10), entries: cleaned }, ...l]);
    }
    setActive(null);
  }

  if (active) {
    return (
      <div className="px-4 py-4 space-y-3 relative min-h-full">
        <div className="flex items-center justify-between">
          <h2 style={{ color: C.chalk, fontFamily: "'Oswald', sans-serif" }} className="text-[16px] uppercase tracking-wide font-medium">Logging workout</h2>
          <button onClick={() => setActive(null)} style={{ color: C.muted }}><X size={18} /></button>
        </div>

        {active.entries.map((entry, ei) => (
          <div key={ei} style={{ background: C.surface, borderColor: C.hairline }} className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span style={{ color: C.chalk }} className="text-[13px] font-medium">{entry.name}</span>
              <button onClick={() => removeExercise(ei)} style={{ color: C.faint }}><Trash2 size={14} /></button>
            </div>
            <div className="space-y-1.5">
              {entry.sets.map((s, si) => (
                <div key={si} className="flex items-center gap-2">
                  <span style={{ color: C.faint }} className="text-[11px] w-4">{si + 1}</span>
                  <input
                    placeholder="kg" value={s.weight} type="number"
                    onChange={(e) => updateSet(ei, si, "weight", e.target.value)}
                    style={{ background: C.surfaceRaised, color: C.chalk, borderColor: C.hairline }}
                    className="flex-1 text-[12px] rounded border px-2 py-1.5 outline-none tabular-nums"
                  />
                  <span style={{ color: C.faint }} className="text-[11px]">×</span>
                  <input
                    placeholder="reps" value={s.reps} type="number"
                    onChange={(e) => updateSet(ei, si, "reps", e.target.value)}
                    style={{ background: C.surfaceRaised, color: C.chalk, borderColor: C.hairline }}
                    className="flex-1 text-[12px] rounded border px-2 py-1.5 outline-none tabular-nums"
                  />
                </div>
              ))}
            </div>
            <button onClick={() => addSet(ei)} style={{ color: C.brass }} className="text-[11px] font-medium flex items-center gap-1">
              <Plus size={12} /> Add set
            </button>
          </div>
        ))}

        <GhostButton full onClick={() => setPicking(true)}><Plus size={14} /> Add exercise</GhostButton>
        <PrimaryButton full onClick={finishWorkout} disabled={!active.entries.length}><Check size={14} /> Finish workout</PrimaryButton>

        {picking && (
          <ExercisePicker
            exercises={exercises}
            onAdd={addExercise}
            onCreateCustom={(name) => { const ex = onCreateCustom(name); if (ex) addExercise(ex); }}
            onClose={() => setPicking(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <PrimaryButton full onClick={startWorkout}><Plus size={15} /> Start new workout</PrimaryButton>
      <div>
        <p style={{ color: C.muted }} className="text-[11px] uppercase tracking-wide mb-2">History</p>
        <div className="space-y-2">
          {log.map((w) => (
            <div key={w.id} style={{ background: C.surface, borderColor: C.hairline }} className="rounded-md border p-3">
              <p style={{ color: C.faint }} className="text-[10px] mb-1.5">{w.date}</p>
              {w.entries.map((e, i) => (
                <div key={i} className="flex items-center justify-between py-0.5">
                  <span style={{ color: C.chalk }} className="text-[12.5px]">{e.name}</span>
                  <span style={{ color: C.muted }} className="text-[11px] tabular-nums">
                    {e.sets.map((s) => `${s.weight}×${s.reps}`).join(", ")}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Exercise library tab                                                   */
/* ---------------------------------------------------------------------- */
function ExercisesTab({ exercises, onCreateCustom }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const categories = ["All", ...Object.keys(CATEGORY_COLOR)];
  const filtered = exercises.filter((e) =>
    (cat === "All" || e.category === cat) && e.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="px-4 py-4 space-y-3">
      <div style={{ background: C.surface, borderColor: C.hairline }} className="flex items-center gap-2 rounded-md border px-3 py-2">
        <Search size={14} color={C.muted} />
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${exercises.length} exercises`}
          style={{ color: C.chalk, background: "transparent" }}
          className="flex-1 text-[13px] outline-none placeholder:text-[#655C52]"
        />
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {categories.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            style={{ background: cat === c ? C.rust : C.surface, color: cat === c ? C.chalk : C.muted, borderColor: C.hairline }}
            className="shrink-0 px-3 py-1 rounded-full text-[11px] font-medium border">{c}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="pt-8 flex flex-col items-center gap-3 text-center">
          <p style={{ color: C.muted }} className="text-[13px]">No exercise matches "{query}".</p>
          <PrimaryButton onClick={() => onCreateCustom(query)} disabled={!query.trim()}>
            <Plus size={14} /> Create "{query || "..."}"
          </PrimaryButton>
        </div>
      ) : (
        <div style={{ background: C.surface, borderColor: C.hairline }} className="rounded-md border divide-y max-h-[420px] overflow-y-auto">
          {filtered.map((ex) => (
            <div key={ex.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderColor: C.hairline }}>
              <CategoryDot category={ex.category} />
              <span style={{ color: C.chalk }} className="text-[13px] flex-1">{ex.name}</span>
              <span style={{ color: C.faint }} className="text-[10px] uppercase tracking-wide">{ex.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* 1RM tracker tab                                                        */
/* ---------------------------------------------------------------------- */
function OneRepMaxTab({ exercises, log }) {
  const tracked = [...new Set(log.flatMap((w) => w.entries.map((e) => e.name)))];
  const [selected, setSelected] = useState(tracked[0] || "Back Squat");
  const [w, setW] = useState("");
  const [r, setR] = useState("");

  const history = historyFor(log, selected);
  const live = estimate1RM(Number(w), Number(r));
  const currentBest = history.length ? Math.max(...history.map((p) => p.e1rm)) : null;

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <p style={{ color: C.muted }} className="text-[11px] uppercase tracking-wide mb-1.5">Exercise</p>
        <select
          value={selected} onChange={(e) => setSelected(e.target.value)}
          style={{ background: C.surface, color: C.chalk, borderColor: C.hairline }}
          className="w-full rounded-md border px-3 py-2 text-[13px] outline-none"
        >
          {(tracked.length ? tracked : [selected]).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {history.length > 1 && (
        <div style={{ background: C.surface, borderColor: C.hairline }} className="rounded-md border p-3">
          <div className="flex items-center justify-between mb-1">
            <span style={{ color: C.muted }} className="text-[11px] flex items-center gap-1"><TrendingUp size={12} /> e1RM trend</span>
            {currentBest && <span style={{ color: C.brass, fontFamily: "'Oswald', sans-serif" }} className="text-[15px] font-semibold">{currentBest} kg</span>}
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={history} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke={C.hairline} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: C.faint, fontSize: 9 }} axisLine={{ stroke: C.hairline }} tickLine={false} />
              <YAxis tick={{ fill: C.faint, fontSize: 9 }} axisLine={false} tickLine={false} domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip contentStyle={{ background: C.surfaceRaised, border: `1px solid ${C.hairline}`, fontSize: 11, color: C.chalk }} />
              <Line type="monotone" dataKey="e1rm" stroke={C.rust} strokeWidth={2} dot={{ r: 3, fill: C.rust }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ background: C.surface, borderColor: C.hairline }} className="rounded-md border p-4 space-y-3">
        <p style={{ color: C.muted }} className="text-[11px] uppercase tracking-wide">Estimate a new attempt</p>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Weight (kg)" value={w} onChange={(e) => setW(e.target.value)}
            style={{ background: C.surfaceRaised, color: C.chalk, borderColor: C.hairline }}
            className="flex-1 text-[13px] rounded border px-3 py-2 outline-none tabular-nums" />
          <span style={{ color: C.faint }}>×</span>
          <input type="number" placeholder="Reps" value={r} onChange={(e) => setR(e.target.value)}
            style={{ background: C.surfaceRaised, color: C.chalk, borderColor: C.hairline }}
            className="flex-1 text-[13px] rounded border px-3 py-2 outline-none tabular-nums" />
        </div>

        {live ? (
          <div className="pt-1">
            <div className="flex items-baseline gap-2">
              <span style={{ color: C.chalk, fontFamily: "'Oswald', sans-serif" }} className="text-3xl font-semibold tabular-nums">{live.avg.toFixed(1)}</span>
              <span style={{ color: C.muted }} className="text-[12px]">kg estimated 1RM (avg of 3 formulas)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[["Epley", live.epley], ["Brzycki", live.brzycki], ["Lombardi", live.lombardi]].map(([label, val]) => (
                <div key={label} style={{ background: C.surfaceRaised, borderColor: C.hairline }} className="rounded border px-2 py-1.5 text-center">
                  <p style={{ color: C.faint }} className="text-[9px] uppercase tracking-wide">{label}</p>
                  <p style={{ color: C.chalk }} className="text-[13px] font-medium tabular-nums">{val.toFixed(1)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: C.faint }} className="text-[11px]">Enter a weight and rep count to see the estimate.</p>
        )}
        <p style={{ color: C.faint }} className="text-[10px] leading-snug pt-1">
          Averaging Epley, Brzycki and Lombardi smooths out the error any single formula has at low or high rep counts — this is what "as accurate as possible" means without a real 1RM attempt.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* App shell                                                              */
/* ---------------------------------------------------------------------- */
export default function WorkoutTrackerPrototype() {
  const [exercises, setExercises] = useState(BASE_EXERCISES);
  const [log, setLog] = useState(SEED_LOG);
  const [steps, setSteps] = useState(6482);
  const [calories, setCalories] = useState(410);
  const [tab, setTab] = useState("today");

  function createCustom(name) {
    if (!name.trim()) return null;
    const ex = { id: Date.now(), name: name.trim(), category: "Custom" };
    setExercises((list) => [...list, ex]);
    return ex;
  }

  const TABS = [
    { key: "today", label: "Today", icon: Flame },
    { key: "workouts", label: "Workouts", icon: Dumbbell },
    { key: "exercises", label: "Exercises", icon: Search },
    { key: "onerm", label: "1RM", icon: TrendingUp },
  ];

  return (
    <div className="w-full flex justify-center py-6" style={{ background: "transparent" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>

      <div
        style={{ background: C.base, borderColor: "#000" }}
        className="relative w-[380px] h-[780px] rounded-[2.2rem] border-[6px] overflow-hidden shadow-2xl flex flex-col"
      >
        <TopBar title={TABS.find((t) => t.key === tab).label} />

        <div className="flex-1 overflow-y-auto relative">
          {tab === "today" && <TodayTab steps={steps} setSteps={setSteps} calories={calories} setCalories={setCalories} log={log} exercises={exercises} />}
          {tab === "workouts" && <WorkoutsTab exercises={exercises} onCreateCustom={createCustom} log={log} setLog={setLog} />}
          {tab === "exercises" && <ExercisesTab exercises={exercises} onCreateCustom={createCustom} />}
          {tab === "onerm" && <OneRepMaxTab exercises={exercises} log={log} />}
        </div>

        <div style={{ background: C.surface, borderColor: C.hairline }} className="border-t flex items-stretch">
          {TABS.map((t) => {
            const Icon = t.icon;
            const activeTab = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex-1 flex flex-col items-center gap-1 py-2.5"
              >
                <Icon size={18} color={activeTab ? C.rust : C.faint} />
                <span style={{ color: activeTab ? C.chalk : C.faint }} className="text-[9px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
