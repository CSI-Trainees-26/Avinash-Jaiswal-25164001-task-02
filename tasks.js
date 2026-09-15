
const KEY = "fitsphere_tasks";

// Load tasks from localStorage
let tasks = JSON.parse(localStorage.getItem(KEY) || "[]");

const $ = (s) => document.querySelector(s);
const save = () =>
  localStorage.setItem(KEY, JSON.stringify(tasks));

const pendingList = $("#pendingList");
const completedList = $("#completedList");
const modal = $("#taskModal");
const form = $("#taskForm");

const today = new Date().toISOString().slice(0, 10);

// Escape user input before displaying it as HTML
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

// Render pending and completed tasks
function render() {
  pendingList.innerHTML = "";
  completedList.innerHTML = "";

  tasks.forEach((t) => {
    const el = document.createElement("article");

    el.className = "task-card";
    el.draggable = true;
    el.dataset.id = t.id;

    el.innerHTML = `
      <div class="task-top">
        <h3>${esc(t.title)}</h3>
        <span class="badge ${String(t.priority).toLowerCase()}">
          ${esc(t.priority)}
        </span>
      </div>

      <p>${esc(t.description || "No description added.")}</p>

      <div class="badges">
        <span class="badge">${esc(t.category)}</span>

        <span class="badge">
          ${t.dueDate ? "Due " + esc(t.dueDate) : "No due date"}
        </span>

        ${
          t.pomodorosCompleted
            ? `<span class="badge">
                ${t.pomodorosCompleted} focus
              </span>`
            : ""
        }
      </div>

      <div class="task-actions">
        <button class="edit">Edit</button>

        <button class="complete">
          ${t.completed ? "⏳ Pending" : "✔️ Complete"}
        </button>

        <button class="delete">Delete</button>
      </div>
    `;

    el.querySelector(".edit").onclick = () => openEdit(t);
    el.querySelector(".complete").onclick = () => toggle(t.id);
    el.querySelector(".delete").onclick = () => remove(t.id);

    // Store task ID for drag-and-drop
    el.addEventListener("dragstart", (e) =>
      e.dataTransfer.setData("text/plain", String(t.id)),
    );

    (t.completed ? completedList : pendingList).appendChild(el);
  });

  updateStats();
}

// Update task counters and completion progress
function updateStats() {
  const done = tasks.filter((t) => t.completed).length;
  const pending = tasks.length - done;
  const p = tasks.length
    ? Math.round((done / tasks.length) * 100)
    : 0;

  $("#totalTasks").textContent = tasks.length;
  $("#completedTasks").textContent = done;
  $("#pendingTasks").textContent = pending;
  $("#taskPercent").textContent = p + "%";

  $("#pendingCount").textContent = pending;
  $("#completedCount").textContent = done;

  $("#progressText").textContent =
    `${done} of ${tasks.length} complete`;

  $("#progressFill").style.width = p + "%";
}

// Toggle a task between pending and completed
function toggle(id) {
  const t = tasks.find((x) => x.id == id);

  if (t) {
    t.completed = !t.completed;
  }

  save();
  render();
}

// Delete a task
function remove(id) {
  if (confirm("Delete this task?")) {
    tasks = tasks.filter((t) => t.id != id);

    save();
    render();
  }
}

// Open the edit modal with existing task data
function openEdit(t) {
  $("#modalTitle").textContent = "Edit task";
  $("#editId").value = t.id;
  $("#taskTitle").value = t.title;
  $("#taskDescription").value = t.description || "";
  $("#taskCategory").value = t.category;
  $("#taskPriority").value = t.priority;
  $("#taskDueDate").value = t.dueDate || "";

  modal.classList.remove("hidden");
}

// Open the modal for creating a new task
function openNew() {
  $("#modalTitle").textContent = "Add new task";

  form.reset();
  $("#editId").value = "";

  modal.classList.remove("hidden");
}

// Close the task modal
function close() {
  modal.classList.add("hidden");
}

$("#openTaskModal").onclick = openNew;
$("#closeTaskModal").onclick = close;
$("#cancelTask").onclick = close;

modal.onclick = (e) => {
  if (e.target === modal) {
    close();
  }
};

// Save a new task or update an existing task
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = $("#editId").value;

  const data = {
    title: $("#taskTitle").value.trim(),
    description: $("#taskDescription").value.trim(),
    category: $("#taskCategory").value,
    priority: $("#taskPriority").value,
    dueDate: $("#taskDueDate").value,
  };

  if (!data.title) return;

  if (id) {
    Object.assign(
      tasks.find((t) => t.id == id),
      data,
    );
  } else {
    tasks.unshift({
      id: Date.now(),
      ...data,
      completed: false,
      createdAt: new Date().toISOString(),
      pomodorosCompleted: 0,
    });
  }

  save();
  render();
  close();
});

// Enable drag-and-drop between pending and completed columns
[pendingList, completedList].forEach((zone) => {
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.parentElement.classList.add("drag-over");
  });

  zone.addEventListener("dragleave", () => {
    zone.parentElement.classList.remove("drag-over");
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();

    zone.parentElement.classList.remove("drag-over");

    const id = e.dataTransfer.getData("text/plain");
    const t = tasks.find((x) => x.id == id);

    if (t) {
      t.completed = zone === completedList;

      save();
      render();
    }
  });
});

// Display saved tasks when the page loads
render();

