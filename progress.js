
const read = (k, f) =>
  JSON.parse(localStorage.getItem(k) || JSON.stringify(f));

const tasks = read("fitsphere_tasks", []);
const habits = read("fitsphere_habits", []);
const water = read("fitsphere_water", {});
const sleep = read("fitsphere_sleep", {});
const savedQuotes = read("fitsphere_saved_quotes", []);
const calories = read("fitsphere_calories", {});

const $ = (s) => document.querySelector(s);

// Returns the current week from Monday to Sunday
function week() {
  const days = [];
  const current = new Date();
  const day = current.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  for (let i = 0; i < 7; i++) {
    const d = new Date(current);

    d.setDate(current.getDate() + mondayOffset + i);
    days.push(d.toISOString().slice(0, 10));
  }

  return days;
}

const keys = week();
const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function render() {
  // Calculate task progress
  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const tp = total ? Math.round((completed / total) * 100) : 0;

  // Calculate habit progress
  const habitTotal = habits.length * 7;
  const habitDone = habits.reduce(
    (n, h) =>
      n + keys.filter((k) => h.history?.[k]).length,
    0,
  );
  const hp = habitTotal
    ? Math.round((habitDone / habitTotal) * 100)
    : 0;

  // Calculate average water intake
  const wa = Math.round(
    keys.reduce((n, k) => n + (water[k] || 0), 0) / 7,
  );
  const wp = Math.min(Math.round((wa / 2500) * 100), 100);

  // Calculate average sleep
  const sleepVals = keys.map((k) => sleep[k] || 0);
  const sleepAvg =
    sleepVals.reduce((a, b) => a + b, 0) / 7;

  // Calculate overall score
  const overall = Math.round(
    (tp +
      hp +
      wp +
      Math.min((sleepAvg / 8) * 100, 100)) /
      4,
  );

  $("#overallScore").textContent = overall + "%";

  $("#scoreRing").style.background =
    `conic-gradient(#6b5de0 ${overall * 3.6}deg, #ececf1 ${overall * 3.6}deg)`;

  $("#taskSummary").textContent = `${completed} / ${total}`;
  $("#taskGrowth").textContent = `${tp}% completed`;
  $("#taskLine").style.width = tp + "%";

  $("#habitSummary").textContent = hp + "%";
  $("#habitSub").textContent = `${habitDone} completions this week`;
  $("#habitLine").style.width = hp + "%";

  $("#waterSummary").textContent = wa + " ml";
  $("#waterLine").style.width = wp + "%";
  $("#waterLine").style.background = "#36aee3";

  renderChart(
    "taskChart",
    keys,
    (k) => {
      const created = tasks.filter(
        (t) => t.createdAt?.slice(0, 10) === k,
      ).length;

      const done = tasks.filter(
        (t) =>
          t.completed &&
          t.createdAt?.slice(0, 10) === k,
      ).length;

      return created ? (done / created) * 100 : done ? 100 : 0;
    },
    "purple",
  );

  renderChart(
    "waterChart",
    keys,
    (k) =>
      Math.min(
        ((water[k] || 0) / 2500) * 100,
        100,
      ),
    "water",
  );

  renderChart(
    "sleepChart",
    keys,
    (k) =>
      Math.min(
        ((sleep[k] || 0) / 8) * 100,
        100,
      ),
    "sleep",
  );

  // Render habit category progress
  const cats = [
    "Workout",
    "Fitness",
    "Cardio",
    "Mental Wellness",
  ];

  $("#categoryChart").innerHTML = cats
    .map((c) => {
      const list = habits.filter(
        (h) => h.category === c,
      );

      const done = list.reduce(
        (n, h) =>
          n + keys.filter((k) => h.history?.[k]).length,
        0,
      );

      const den = list.length * 7;
      const p = den
        ? Math.round((done / den) * 100)
        : 0;

      return `
        <div class="cat-row">
          <span>${c}</span>
          <div>
            <i style="width:${p}%"></i>
          </div>
          <b>${p}%</b>
        </div>
      `;
    })
    .join("");

  // Render saved quotes
  $("#quoteCount").textContent =
    `${savedQuotes.length} saved`;

  $("#savedQuotes").innerHTML =
    savedQuotes
      .map(
        (q) =>
          `<div class="quote-item">
            <div>
              <p>“${esc(q.text)}”</p>
              <small>— ${esc(q.author || "Unknown")}</small>
            </div>
            <button data-id="${q.id}">Delete</button>
          </div>`,
      )
      .join("") ||
    `<p class="muted">
      No saved quotes yet. Save one from the dashboard.
    </p>`;

  document
    .querySelectorAll(".quote-item button")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const arr = read(
            "fitsphere_saved_quotes",
            [],
          ).filter((q) => q.id != b.dataset.id);

          localStorage.setItem(
            "fitsphere_saved_quotes",
            JSON.stringify(arr),
          );

          location.reload();
        }),
    );
}

function renderChart(id, ks, fn, type) {
  $("#" + id).innerHTML = ks
    .map((k, index) => {
      const v = fn(k);
      const isToday =
        k === new Date().toISOString().slice(0, 10);

      return `
        <div class="bar-col ${type} ${isToday ? "today" : ""}">
          <div
            class="bar"
            style="height:${Math.max(v, 2)}%"
          ></div>

          <b>
            ${
              type === "water"
                ? Math.round((water[k] || 0) / 100)
                : type === "sleep"
                  ? (sleep[k] || 0) + "h"
                  : Math.round(v) + "%"
            }
          </b>

          <span>${names[index]}</span>
        </div>
      `;
    })
    .join("");
}

function esc(v) {
  return String(v ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[m],
  );
}

// Export weekly report as a JSON file
$("#exportBtn").onclick = () => {
  const report = {
    generatedAt: new Date().toISOString(),

    overallScore: $("#overallScore").textContent,

    tasks: {
      total: tasks.length,
      completed: tasks.filter(
        (t) => t.completed,
      ).length,
    },

    habits: {
      total: habits.length,
      weeklyCompletions: habits.reduce(
        (n, h) =>
          n + keys.filter((k) => h.history?.[k]).length,
        0,
      ),
    },

    waterAverageMl: Math.round(
      keys.reduce(
        (n, k) => n + (water[k] || 0),
        0,
      ) / 7,
    ),

    caloriesThisWeek: keys.reduce(
      (n, k) => n + (calories[k] || 0),
      0,
    ),

    sleepAverageHours: Number(
      (
        keys.reduce(
          (n, k) => n + (sleep[k] || 0),
          0,
        ) / 7
      ).toFixed(1),
    ),
  };

  const blob = new Blob(
    [JSON.stringify(report, null, 2)],
    {
      type: "application/json",
    },
  );

  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = "fitsphere-weekly-report.json";
  a.click();

  URL.revokeObjectURL(a.href);
};

render();

// Reload the page when a new week starts
let currentWeek = week()[0];

setInterval(() => {
  const newWeek = week()[0];

  if (newWeek !== currentWeek) {
    location.reload();
  }
}, 60000);
