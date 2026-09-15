
// LocalStorage keys
const CAL = "fitsphere_calories";
const SLP = "fitsphere_sleep";
const STP = "fitsphere_steps";
const WO = "fitsphere_workouts";

// Shortcut for document.querySelector()
const $ = (s) => document.querySelector(s);

// Today's date in YYYY-MM-DD format
const today = new Date().toISOString().slice(0, 10);

// Load saved data from localStorage
let cal = JSON.parse(localStorage.getItem(CAL) || "{}");
let slp = JSON.parse(localStorage.getItem(SLP) || "{}");
let stp = JSON.parse(localStorage.getItem(STP) || "{}");
let workouts = JSON.parse(localStorage.getItem(WO) || "[]");

// Saves all fitness data to localStorage
const save = () => {
  localStorage.setItem(CAL, JSON.stringify(cal));
  localStorage.setItem(SLP, JSON.stringify(slp));
  localStorage.setItem(STP, JSON.stringify(stp));
  localStorage.setItem(WO, JSON.stringify(workouts));
};

// Updates Calories, Steps and Sleep cards
function updateFitnessCards() {
  const c = cal[today] || 0;
  const s = stp[today] || 0;
  const sl = slp[today] || 0;

  $("#calorieValue").textContent = c.toLocaleString();
  $("#stepValue").textContent = s.toLocaleString();
  $("#sleepValue").textContent = sl;
}

// Updates the fitness cards, form values and workout list
function render() {
  const c = cal[today] || 0;
  const s = stp[today] || 0;
  const sl = slp[today] || 0;

  // Update today's fitness cards
  updateFitnessCards();

  // Show saved values inside the form
  $("#calories").value = c || "";
  $("#steps").value = s || "";
  $("#sleep").value = sl || "";

  // Display today's workouts
  $("#workoutLog").innerHTML =
    workouts
      .filter((w) => w.date === today)
      .map(
        (w) =>
          `<div class="workout-item">
            <b>${w.activity}</b>

            <span>
              ${w.duration} min${w.distance ? ` · ${w.distance} km` : ""}
            </span>

            <div class="workout-actions">
              ${
                w.completed
                  ? `<strong>✔️ Completed</strong>`
                  : `<button class="complete-workout-btn" data-id="${w.id}">
                      Complete
                    </button>`
              }

              <button class="remove-workout-btn" data-id="${w.id}">
                Remove
              </button>
            </div>
          </div>`
      )
      .join("") ||
    `<div class="workout-item">
      <span>No workout logged today.</span>
    </div>`;

  renderWorkoutProgress();
}

// Handles the Fitness Log form
$("#fitnessForm").addEventListener("submit", (e) => {
  e.preventDefault();

  cal[today] = Number($("#calories").value) || 0;
  stp[today] = Number($("#steps").value) || 0;
  slp[today] = Number($("#sleep").value) || 0;

  save();

  // Update cards immediately after saving
  updateFitnessCards();

  render();

  alert("Today's fitness stats saved.");
});

// Handles the Add Workout form
$("#workoutForm").addEventListener("submit", (e) => {
  e.preventDefault();

  workouts.unshift({
    id: Date.now(),
    date: today,
    activity: $("#activity").value,
    duration: Number($("#duration").value) || 0,
    distance: Number($("#distance").value) || 0,
    completed: false,
  });

  save();
  $("#workoutForm").reset();
  render();
});

// Handles Complete and Remove buttons
$("#workoutLog").addEventListener("click", (e) => {
  const id = Number(e.target.dataset.id);

  // Complete workout
  if (e.target.classList.contains("complete-workout-btn")) {
    const workout = workouts.find((w) => w.id === id);

    if (workout) {
      workout.completed = true;

      save();
      render();
    }
  }

  // Remove workout
  if (e.target.classList.contains("remove-workout-btn")) {
    workouts = workouts.filter((w) => w.id !== id);

    save();
    render();
  }
});

// Returns the last 7 days, including today
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
// Updates the bar chart based on completed workouts
function renderWorkoutProgress() {
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  $("#sleepBars").innerHTML = week()
    .map((date, index) => {
      const dayWorkouts = workouts.filter(
        (w) => w.date === date
      );

      const completed = dayWorkouts.filter(
        (w) => w.completed === true
      ).length;

      const total = dayWorkouts.length;

      const p = total > 0
        ? (completed / total) * 100
        : 0;

      const isToday = date === today;

      return `
        <div class="sleep-col ${isToday ? "today" : ""}">
          <div class="sleep-bg">
            <i style="height:${Math.max(p, 3)}%"></i>
          </div>

          <b>${completed}/${total}</b>

          <span>${names[index]}</span>
        </div>
      `;
    })
    .join("");
}

// Load saved data and display it when the page opens
render();

// To reload daily
setInterval(() => {
  const newDate = new Date().toISOString().slice(0, 10);

  if (newDate !== currentDate) {
    location.reload();
  }
}, 60000);
// To reload weekly
render();

let currentWeek = week()[0];

setInterval(() => {
  const newWeek = week()[0];

  if (newWeek !== currentWeek) {
    location.reload();
  }
}, 60000);