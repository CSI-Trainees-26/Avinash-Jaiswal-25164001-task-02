// LocalStorage setup
const KEY = "fitsphere_habits";

let habits = JSON.parse(localStorage.getItem(KEY) || "[]");

const $ = (s) => document.querySelector(s);

const save = () =>
  localStorage.setItem(KEY, JSON.stringify(habits));

const today = () => new Date().toISOString().slice(0, 10);

const grid = $("#habitGrid");

// Prevent unsafe HTML from being inserted
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

// Calculate the current consecutive-day streak
function streak(h) {
  let n = 0;
  let d = new Date();

  while (true) {
    const k = d.toISOString().slice(0, 10);

    if (h.history?.[k]) {
      n++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return n;
}

// Display habits based on the selected filter
function render(filter = "All") {
  grid.innerHTML = "";

  const shown = habits.filter(
    (h) => filter === "All" || h.category === filter,
  );

  shown.forEach((h) => {
    const el = document.createElement("article");

    el.className = "habit-card";

    // Create the last 14 days from oldest to newest
    const keys = [];

    for (let i = 0; i < 14; i++) {
      const d = new Date();

      d.setDate(d.getDate() + i);

      keys.push(d.toISOString().slice(0, 10));
    }
    
    el.innerHTML = `
      <div class="habit-top">
        <span class="habit-icon">
          ${
            h.category === "Mental Wellness"
              ? "🧘"
              : h.category === "Cardio"
                ? "🫀"
                : h.category === "Fitness"
                  ? "🏋️"
                  : "💪"
          }
        </span>

        <span class="cat">${esc(h.category)}</span>
      </div>

      <h3>${esc(h.name)}</h3>

      <p>
        ${esc(
          h.description ||
            "Build this habit one day at a time.",
        )}
      </p>

      <div class="days">
        ${keys
          .map(
            (k) => `
              <span
                class="day ${h.history?.[k] ? "done" : ""} ${
                  k === today() ? "today" : ""
                }"
                title="${k}"
              ></span>
            `,
          )
          .join("")}
      </div>

      <div class="streak">
        🔥 ${streak(h)} day current streak
      </div>

      <div class="habit-actions">
        <button class="done">
          ${
            h.history?.[today()]
              ? "✔️ Completed today"
              : "Mark today complete"
          }
        </button>

        <button class="edit">Edit</button>

        <button class="delete">Delete</button>
      </div>
    `;

    // Mark today's habit as complete/incomplete
    el.querySelector(".done").onclick = () => {
      h.history = h.history || {};
      h.history[today()] = !h.history[today()];

      save();
      render(filter);
      updateOverview();
    };

    // Open the edit modal
    el.querySelector(".edit").onclick = () => openEdit(h);

    // Delete the selected habit
    el.querySelector(".delete").onclick = () => {
      if (confirm("Delete this habit?")) {
        habits = habits.filter((x) => x.id !== h.id);

        save();
        render(filter);
        updateOverview();
      }
    };

    grid.appendChild(el);
  });
}

// Update habit statistics
function updateOverview() {
  const done = habits.filter(
    (h) => h.history?.[today()],
  ).length;

  const p = habits.length
    ? Math.round((done / habits.length) * 100)
    : 0;

  $("#todayPercent").textContent = p + "%";
  $("#todayLine").style.width = p + "%";
  $("#habitCount").textContent = habits.length;

  $("#bestStreak").textContent =
    (habits.length ? Math.max(...habits.map(streak)) : 0) +
    " days";

  renderHeatmap();
}

// Create the 12-week habit completion heatmap
function renderHeatmap() {
  const box = $("#heatmap");

  box.innerHTML = "";

  const weeks = 12;

  // Create 12 columns starting from today
  for (let w = 0; w < weeks; w++) {
    const col = document.createElement("div");

    col.className = "heat-week";

    // Fill each column from top to bottom
    for (let d = 0; d < 7; d++) {
      const date = new Date();

      date.setDate(date.getDate() + w * 7 + d);

      const k = date.toISOString().slice(0, 10);

      const count = habits.filter(
        (h) => h.history?.[k],
      ).length;

      const cell = document.createElement("span");

      cell.className =
        "heat-cell " +
        (count === 0
          ? ""
          : count <= 1
            ? "l1"
            : count <= 2
              ? "l2"
              : count <= 3
                ? "l3"
                : "l4");

      cell.title = `${k}: ${count} habit${
        count === 1 ? "" : "s"
      } completed`;

      col.appendChild(cell);
    }
// Add each week from left to right
    box.appendChild(col);
  }
}

// Open the edit habit modal
function openEdit(h) {
  $("#habitModalTitle").textContent = "Edit habit";
  $("#habitId").value = h.id;
  $("#habitName").value = h.name;
  $("#habitDescription").value = h.description || "";
  $("#habitCategory").value = h.category;

  $("#habitModal").classList.remove("hidden");
}

// Open the create habit modal
function openNew() {
  $("#habitModalTitle").textContent = "Create habit";

  $("#habitForm").reset();

  $("#habitId").value = "";

  $("#habitModal").classList.remove("hidden");
}

// Close the habit modal
function close() {
  $("#habitModal").classList.add("hidden");
}

$("#addHabit").onclick = openNew;
$("#closeHabit").onclick = close;
$("#cancelHabit").onclick = close;

// Handle creating and editing habits
$("#habitForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const id = $("#habitId").value;

  const data = {
    name: $("#habitName").value.trim(),
    description: $("#habitDescription").value.trim(),
    category: $("#habitCategory").value,
  };

  if (id) {
    Object.assign(
      habits.find((h) => h.id == id),
      data,
    );
  } else {
    habits.unshift({
      id: Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
      history: {},
    });
  }

  save();
  render();
  updateOverview();
  close();
});

// Handle habit category filters
document.querySelectorAll(".filter-btn").forEach(
  (b) =>
    (b.onclick = () => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((x) =>
          x.classList.remove("active"),
        );

      b.classList.add("active");

      render(b.dataset.filter);
    }),
);

// Create default habits when none exist
if (!habits.length) {
  habits = [
    {
      id: 1,
      name: "1K steps",
      description: "Walk at least one thousand steps.",
      category: "Fitness",
      createdAt: new Date().toISOString(),
      history: {},
    },
    {
      id: 2,
      name: "5 km run",
      description: "Complete a steady cardio run.",
      category: "Cardio",
      createdAt: new Date().toISOString(),
      history: {},
    },
    {
      id: 3,
      name: "10 min meditation",
      description: "A short mindful reset.",
      category: "Mental Wellness",
      createdAt: new Date().toISOString(),
      history: {},
    },
  ];

  save();
}

// Initial page load
render();
updateOverview();

// Automatically refresh when a new day starts
let currentDate = today();

setInterval(() => {
  if (today() !== currentDate) {
    location.reload();
  }
}, 60000);

