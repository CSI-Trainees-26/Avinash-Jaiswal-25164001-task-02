// Returns today's date in YYYY-MM-DD format.
const todayKey = () => new Date().toISOString().slice(0, 10);

const read = (k, f) =>
  JSON.parse(localStorage.getItem(k) || JSON.stringify(f));

const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const tasks = () => read("fitsphere_tasks", []);
const habits = () => read("fitsphere_habits", []);
const water = () => read("fitsphere_water", {});
const calories = () => read("fitsphere_calories", {});
const sleep = () => read("fitsphere_sleep", {});
const sessions = () => read("fitsphere_pomodoro_sessions", []);

const key = todayKey();

// DATE DISPLAY

const fmtDate = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

document.getElementById("fullDate").textContent = fmtDate.format(new Date());

document.getElementById("todayLabel").textContent = new Intl.DateTimeFormat(
  undefined,
  {
    month: "long",
    day: "numeric",
  },
)
  .format(new Date())
  .toUpperCase();

// DASHBOARD STATISTICS

function refreshStats() {
  const ts = tasks();
  const hs = habits();

  const doneTasks = ts.filter((t) => t.completed).length;
  const doneHabits = hs.filter((h) => h.history?.[key]).length;

  const totalDone = doneTasks + doneHabits;
  const total = ts.length + hs.length;
  const pct = total ? Math.round((totalDone / total) * 100) : 0;

  document.getElementById("taskMetric").textContent =
    `${doneTasks} / ${ts.length}`;

  document.getElementById("taskMetricSub").textContent =
    `${ts.length ? Math.round((doneTasks / ts.length) * 100) : 0}% complete`;

  document.getElementById("habitMetric").textContent =
    `${doneHabits} / ${hs.length}`;

  document.getElementById("habitMetricSub").textContent =
    `${hs.length ? Math.round((doneHabits / hs.length) * 100) : 0}% complete`;

  document.getElementById("waterMetric").textContent =
    `${water()[key] || 0} ml`;

  document.getElementById("calorieMetric").textContent =
    `${calories()[key] || 0} kcal`;

  document.getElementById("dailyPercent").textContent = `${pct}%`;

  document.getElementById("dailyRing").style.background =
    `conic-gradient(#6a5ce0 ${pct * 3.6}deg, #ececf1 ${pct * 3.6}deg)`;

  document.getElementById("doneCount").textContent = totalDone;

  document.getElementById("remainingCount").textContent = Math.max(
    total - totalDone,
    0,
  );

  document.getElementById("pomodoroCount").textContent = sessions().filter(
    (s) => s.date === key,
  ).length;

  document.getElementById("progressHeadline").textContent =
    pct >= 80
      ? "Excellent day."
      : pct >= 50
        ? "You're building momentum."
        : "Let's get started.";

  document.getElementById("progressDescription").textContent =
    pct >= 80
      ? "Strong consistency today — keep the streak alive."
      : "Every completed action moves your daily score forward.";

  const sh = sleep()[key] || 0;

  document.getElementById("sleepMetric").textContent =
    `${Math.floor(sh)}h ${Math.round((sh % 1) * 60)}m`;

  const sp = Math.min((sh / 8) * 100, 100);

  document.getElementById("sleepBar").style.width = sp + "%";
  document.getElementById("sleepScore").textContent = Math.round(sp) + "%";

  renderWeek();
  renderTaskSelect();
}

// WEEK CALCULATION

function weekKeys() {
  const d = new Date();

  // Converts Sunday=0 to Monday=0.
  const day = (d.getDay() + 6) % 7;

  d.setDate(d.getDate() - day);

  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);

    x.setDate(d.getDate() + i);

    return x.toISOString().slice(0, 10);
  });
}

// WEEKLY PROGRESS CHART

function renderWeek() {
  const ts = tasks();
  const hs = habits();

  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  document.getElementById("weeklyBars").innerHTML = weekKeys()
    .map((k, i) => {
      const td = ts.filter(
        (t) => t.createdAt?.slice(0, 10) === k,
      ).length;

      const tc = ts.filter(
        (t) => t.completed && t.createdAt?.slice(0, 10) === k,
      ).length;

      const hc = hs.filter((h) => h.history?.[k]).length;

      const total = td + hs.length;

      const score = total
        ? Math.round(((tc + hc) / total) * 100)
        : 0;

      return `
        <div class="week-col">
          <div class="bar-wrap">
            <div
              class="week-bar"
              style="height:${Math.max(score, 4)}%"
            ></div>
          </div>
          <b>${score}%</b>
          <span>${names[i]}</span>
        </div>
      `;
    })
    .join("");
}

// POMODORO TASK DROPDOWN

function renderTaskSelect() {
  const s = document.getElementById("pomodoroTask");
  const old = s.value;

  s.innerHTML =
    `<option value="">Choose a task to focus on…</option>` +
    tasks()
      .filter((t) => !t.completed)
      .map((t) => `<option value="${t.id}">${t.title}</option>`)
      .join("");

  if (old) {
    s.value = old;
  }

  document.getElementById("timerTaskLabel").textContent = s.value
    ? tasks().find((t) => String(t.id) === s.value)?.title ||
      "Selected task"
    : "No task selected";
}

document
  .getElementById("pomodoroTask")
  .addEventListener("change", (e) => {
    document.getElementById("timerTaskLabel").textContent = e.target.value
      ? tasks().find((t) => String(t.id) === e.target.value)?.title ||
        "Selected task"
      : "No task selected";
  });

// MOTIVATIONAL QUOTES

const fallbackQuotes = [
  ["Small steps every day create remarkable change.", "Anonymous"],
  [
    "Discipline is choosing what you want most over what you want now.",
    "Abraham Lincoln",
  ],
  ["Your future is built by what you do today.", "Robert Kiyosaki"],
  [
    "Consistency turns ordinary effort into extraordinary results.",
    "Anonymous",
  ],
];

const quoteKey = "fitsphere_current_quote";

let currentQuote = read(quoteKey, null);

function displayQuote() {
  if (!currentQuote) {
    return;
  }

  document.getElementById("quoteText").textContent =
    `“${currentQuote.text}”`;

  document.getElementById("quoteAuthor").textContent =
    `— ${currentQuote.author}`;
}

async function loadQuote() {
  document.getElementById("quoteText").textContent =
    "Finding your next dose of motivation…";

  try {
    const r = await fetch("https://dummyjson.com/quotes/random");

    if (!r.ok) {
      throw new Error();
    }

    const q = await r.json();

    currentQuote = {
      text: q.quote,
      author: q.author,
      date: todayKey(),
    };
  } catch (e) {
    // Use a local quote if the API is unavailable.
    const q =
      fallbackQuotes[
        Math.floor(Math.random() * fallbackQuotes.length)
      ];

    currentQuote = {
      text: q[0],
      author: q[1],
      date: todayKey(),
    };
  }

  save(quoteKey, currentQuote);
  displayQuote();
}

// Change quote when the refresh button is pressed.
document
  .getElementById("refreshQuote")
  .addEventListener("click", loadQuote);

// Save the currently displayed quote.
document.getElementById("saveQuote").addEventListener("click", () => {
  if (!currentQuote) {
    return;
  }

  const saved = read("fitsphere_saved_quotes", []);

  if (!saved.some((q) => q.text === currentQuote.text)) {
    saved.unshift({
      ...currentQuote,
      id: Date.now(),
      savedAt: new Date().toISOString(),
    });

    save("fitsphere_saved_quotes", saved);

    alert("Quote saved.");
  } else {
    alert("This quote is already saved.");
  }
});

// POMODORO TIMER

let seconds = 1500;
let timer = null;

function paintTimer() {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");

  document.getElementById("timerDisplay").textContent = `${m}:${s}`;
}

document.getElementById("timerStart").addEventListener("click", () => {
  if (timer) {
    clearInterval(timer);
    timer = null;

    document.getElementById("timerStart").textContent = "Start";

    return;
  }

  document.getElementById("timerStart").textContent = "Pause";

  timer = setInterval(() => {
    seconds--;

    paintTimer();

    if (seconds <= 0) {
      clearInterval(timer);
      timer = null;

      seconds = 1500;
      paintTimer();

      const id = document.getElementById("pomodoroTask").value;
      const ss = sessions();

      ss.push({
        id: Date.now(),
        date: key,
        taskId: id,
      });

      save("fitsphere_pomodoro_sessions", ss);

      if (id) {
        const arr = tasks();
        const t = arr.find((x) => String(x.id) === id);

        if (t) {
          t.pomodorosCompleted = (t.pomodorosCompleted || 0) + 1;

          save("fitsphere_tasks", arr);
        }
      }

      alert("Pomodoro complete! Great focus session.");

      refreshStats();

      document.getElementById("timerStart").textContent = "Start";
    }
  }, 1000);
});

document.getElementById("timerReset").addEventListener("click", () => {
  if (timer) {
    clearInterval(timer);
  }

  timer = null;
  seconds = 1500;

  paintTimer();

  document.getElementById("timerStart").textContent = "Start";
});

// INITIAL PAGE LOAD

paintTimer();
refreshStats();

if (!currentQuote || currentQuote.date !== todayKey()) {
  loadQuote();
} else {
  displayQuote();
}
