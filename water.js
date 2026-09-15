const KEY = "fitsphere_water";
const LOG = "fitsphere_water_log";

let water = JSON.parse(localStorage.getItem(KEY) || "{}");
let logs = JSON.parse(localStorage.getItem(LOG) || "{}");

const goal = 2500;
const today = new Date().toISOString().slice(0, 10);

const $ = (s) => document.querySelector(s);

const save = () => {
  localStorage.setItem(KEY, JSON.stringify(water));
  localStorage.setItem(LOG, JSON.stringify(logs));
};

// Display today's date
$("#datePill").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
}).format(new Date());

// Update today's water progress and weekly chart
function render() {
  const amount = water[today] || 0;
  const p = Math.min((amount / goal) * 100, 100);

  $("#waterAmount").textContent = amount;

  $("#waterGoalText").textContent =
    `${Math.round((amount / goal) * 100)}% of ${goal} ml goal`;

  $("#waterFill").style.width = p + "%";

  renderBars();
  renderLog();
}

// Add water intake and save it for today's date
function add(ml) {
  water[today] = (water[today] || 0) + ml;

  logs[today] = logs[today] || [];

  logs[today].unshift({
    ml,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });

  save();
  render();
}

// Quick-add water buttons
document
  .querySelectorAll(".quick-add button[data-ml]")
  .forEach((b) => (b.onclick = () => add(Number(b.dataset.ml))));

// Add a custom water amount
$("#customAdd").onclick = () => {
  const v = Number(
    prompt("How many millilitres did you drink?"),
  );

  if (v > 0) {
    add(Math.round(v));
  }
};

// Reset today's water intake
$("#resetWater").onclick = () => {
  if (confirm("Reset today's water intake?")) {
    delete water[today];
    delete logs[today];

    save();
    render();
  }
};

// Clear today's drink history
$("#clearLog").onclick = () => {
  delete logs[today];

  save();
  render();
};

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

// Render weekly water bars
function renderBars() {
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  $("#waterBars").innerHTML = week()
    .map((k, index) => {
      const amt = water[k] || 0;
      const p = Math.min((amt / goal) * 100, 100);
      const isToday = k === today;

      return `
        <div class="water-col ${isToday ? "today" : ""}">
          <div class="bar-bg">
            <i style="height:${Math.max(p, 3)}%"></i>
          </div>

          <b>
            ${amt >= 1000 ? (amt / 1000).toFixed(1) + "L" : amt + "ml"}
          </b>

          <span>${names[index]}</span>
        </div>
      `;
    })
    .join("");
}

// Render today's drink history
function renderLog() {
  $("#drinkLog").innerHTML =
    (logs[today] || [])
      .map(
        (x) =>
          `<div class="drink">
            <b>+${x.ml} ml</b>
            <span>${x.time}</span>
          </div>`,
      )
      .join("") ||
    `<div class="drink">
      <span>No drinks logged yet.</span>
      <span>Start with 250 ml.</span>
    </div>`;
}

render();

