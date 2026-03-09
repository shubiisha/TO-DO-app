import { setupAuth } from "./auth.js";
import { loadTodos, addTodo, toggleTodo, deleteTodo } from "./todos.js";
import { auth } from "./firebase.js";

const input = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");

function renderTodos(todos) {
  taskList.innerHTML = "";

  todos.forEach((todo) => {
    const li = document.createElement("li");
    if (todo.completed) li.classList.add("completed");
    li.dataset.date = todo.date;
    li.dataset.type = getTaskCategory(todo.date);

    const leftDiv = document.createElement("div");
    leftDiv.className = "task-left";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed || false;

    checkbox.addEventListener("change", async () => {
      li.classList.toggle("completed", checkbox.checked);
      await toggleTodo(todo.id, checkbox.checked);

      updateTodayProgress();
      updateDailySummary();
    });

    const span = document.createElement("span");
    span.textContent = `${todo.text} (⏱️ ${formatDateToDDMMYYYY(todo.date)})`;

    leftDiv.appendChild(checkbox);
    leftDiv.appendChild(span);

    // 👉 DELETE BUTTON
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "DELETE";
    deleteBtn.className = "delete-btn";
    deleteBtn.onclick = async () => {
      const user = auth.currentUser;
      if (!user) return;

      await deleteTodo(todo.id);

      const todos = await loadTodos(user.uid);
      renderTodos(todos);
    };

    li.appendChild(leftDiv);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });

  updateTodayProgress();
  updateDailySummary();
}
function renderTasks(tasks) {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.textContent = task.text;
    taskList.appendChild(li);
  });
}
/* CATEGORY BASED ON DATE */
function getTaskCategory(date) {
  const today = new Date();
  const selected = new Date(date);
  today.setHours(0, 0, 0, 0);
  selected.setHours(0, 0, 0, 0);

  const diff = (selected - today) / 86400000;
  if (diff === 0) return "day";
  if (diff > 0 && diff <= 7) return "week";
  return "month";
}

/* FORMAT DATE */
function formatDateToDDMMYYYY(reminderDate) {
  if (!reminderDate) return "";
  const [year, month, day] = reminderDate.split("-");
  return `${day}-${month}-${year}`;
}

/* ADD TASK */
async function addTask() {
  const taskInput = document.getElementById("taskInput");
  const reminderDate = document.getElementById("reminderDate").value;
  const errorMsg = document.getElementById("errorMsg");

  const taskText = taskInput.value.trim();

  if (!taskText) {
    errorMsg.textContent = "Please enter a task.";
    return;
  }

  if (!reminderDate) {
    errorMsg.textContent = "Please select a date.";
    return;
  }

  const formattedDate = formatDateToDDMMYYYY(reminderDate);
  const category = getTaskCategory(reminderDate);

  const reminderTime = new Date(reminderDate).getTime();
  const now = Date.now();
  const delay = reminderTime - now;

  if (delay > 0 && Notification.permission === "granted") {
    setTimeout(() => showNotification(taskText), delay);
  }

  const selectedDate = new Date(reminderDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    errorMsg.textContent = "You cannot add tasks for past dates.";
    return;
  }

  errorMsg.textContent = "";

  const user = auth.currentUser;
  console.log("User:", user);

  if (!user) {
    alert("Please login first");
    return;
  }

  console.log("Adding todo:", taskText);
  await addTodo(user.uid, taskText, reminderDate);

  const todos = await loadTodos(user.uid);
  renderTodos(todos);
  errorMsg.style.color = "green";
  errorMsg.textContent = "Task added successfully! ✅";
  setTimeout(() => {
    errorMsg.textContent = "";
  }, 3000);
  input.value = "";
  document.getElementById("reminderDate").value = "";
}
const historyDateInput = document.getElementById("historyDate");
const historyTasksContainer = document.getElementById("historyTasks");

historyDateInput.addEventListener("change", () => {
  const selectedDate = historyDateInput.value; // YYYY-MM-DD
  displayTasksForDate(selectedDate);
});

/* FILTER TASKS */
function filterTasks(type) {
  document.querySelectorAll("#taskList li").forEach((task) => {
    task.style.display =
      type === "all" || task.dataset.type === type ? "flex" : "none";
  });
}

/* SETTINGS */
function toggleSettings() {
  const panel = document.getElementById("settingsPanel");
  panel.style.display = panel.style.display === "block" ? "none" : "block";
}

/* THEME */
function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light",
  );
}

/* NOTIFICATIONS */
function toggleNotification() {
  const enabled = document.getElementById("notifyToggle").checked;
  localStorage.setItem("notifications", enabled);
  alert(enabled ? "Notifications Enabled 🔔" : "Notifications Disabled 🔕");
}

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
}

function showNotification(taskText) {
  if (Notification.permission === "granted") {
    new Notification("⏰ Task Reminder", {
      body: taskText,
      icon: "https://cdn-icons-png.flaticon.com/512/1827/1827392.png",
    });
  }
}

function updateDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  document.getElementById("currentDate").textContent =
    `${day}/${month}/${year}`;
}

updateDate(); // Run immediately

// Check every minute in case the date changes
setInterval(updateDate, 60000);

function updateDailySummary() {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const tasks = document.querySelectorAll("#taskList li");

  let totalToday = 0;
  let completedToday = 0;

  tasks.forEach((task) => {
    if (task.dataset.date === today) {
      // match stored format
      totalToday++;
      if (task.classList.contains("completed")) {
        completedToday++;
      }
    }
  });

  let message = "";

  if (totalToday === 0) {
    message = "No tasks scheduled for today.";
  } else if (completedToday === totalToday) {
    message = `All ${totalToday} tasks completed today 🎉`;
  } else {
    message = `You completed ${completedToday} of ${totalToday} tasks today`;
  }

  document.getElementById("dailySummary").textContent = message;
}

function updateTodayProgress() {
  const today = new Date().toISOString().split("T")[0];
  const tasks = document.querySelectorAll("#taskList li");

  let total = 0;
  let completed = 0;

  tasks.forEach((task) => {
    if (task.dataset.date === today) {
      total++;
      if (task.classList.contains("completed")) completed++;
    }
  });

  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("progressPercent").textContent = `${percent}%`;

  const fill = document.getElementById("progressFill");
  if (fill) fill.style.width = `${percent}%`;
}
const historyModal = document.getElementById("historyModal");
const historyBtn = document.getElementById("historyBtn");
const closeHistory = document.getElementById("closeHistory");

// Open modal
historyBtn.onclick = () => {
  historyModal.style.display = "block";
  historyTasksContainer.innerHTML = ""; // clear previous
  historyDateInput.value = ""; // reset date
};

// Close modal
closeHistory.onclick = () => {
  historyModal.style.display = "none";
};

// Close if clicking outside modal
window.onclick = (event) => {
  if (event.target === historyModal) {
    historyModal.style.display = "none";
  }
};

// Function to display tasks
async function displayTasksForDate(date) {
  historyTasksContainer.innerHTML = "";
  if (!date) return;

  const user = auth.currentUser;
  if (!user) return;

  const todos = await loadTodos(user.uid);
  const tasksForDate = todos.filter((task) => task.date === date);

  if (tasksForDate.length === 0) {
    historyTasksContainer.textContent = "No tasks for this date.";
    return;
  }

  tasksForDate.forEach((task) => {
    const li = document.createElement("li");
    li.textContent = task.text;

    const statusSpan = document.createElement("span");
    statusSpan.textContent = task.completed ? "✅ Done" : "⏳ Pending";
    li.appendChild(statusSpan);

    historyTasksContainer.appendChild(li);
  });
}
/* ON LOAD */
window.onload = function () {
  setupAuth(async (uid) => {
    const todos = await loadTodos(uid);
    renderTodos(todos);
  });

  requestNotificationPermission();
};

window.addTask = addTask;
window.filterTasks = (type) => {
  document.querySelectorAll("#taskList li").forEach((li) => {
    li.style.display = type === li.dataset.type ? "flex" : "none";
  });
};
window.toggleSettings = toggleSettings;
window.toggleTheme = toggleTheme;
window.toggleNotification = toggleNotification;
window.renderTodos = renderTodos;
