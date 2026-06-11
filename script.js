import { setupAuth } from "./auth.js";
import {
  loadTodos,
  addTodo,
  toggleTodo,
  deleteTodo,
  updateTodo,
} from "./todos.js";
import { auth } from "./firebase.js";

const input = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
let currentFilter = "day";
let currentView = "day";
let allTodos = [];

function renderTodos(todos) {
  todos.sort((a, b) => new Date(a.date) - new Date(b.date));
  taskList.innerHTML = "";
  let currentDate = "";

  todos.forEach((todo) => {
    if (currentView !== "day" && todo.date !== currentDate) {
      currentDate = todo.date;

      const header = document.createElement("h3");

      header.className = "date-header";

      header.textContent = formatDateToDDMMYYYY(todo.date);

      taskList.appendChild(header);
    }
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

      await updateTodayProgress();
      await updateDailySummary();
    });

    const span = document.createElement("span");
    span.textContent = todo.text;
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

      allTodos = await loadTodos(user.uid);

      renderTodos(allTodos);
      updateTodayProgress();
      updateDailySummary();
      applyCurrentFilter();
    };
    const updateBtn = document.createElement("button");
    updateBtn.textContent = "UPDATE";
    updateBtn.className = "update-btn";

    updateBtn.onclick = async () => {
      const leftDiv = li.querySelector(".task-left");

      // Prevent multiple edit boxes
      if (leftDiv.querySelector(".editTaskInput")) return;

      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.value = todo.text;
      editInput.className = "editTaskInput";

      const editDate = document.createElement("input");
      editDate.type = "date";
      editDate.value = todo.date;
      editDate.className = "editTaskDate";

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "SAVE";

      saveBtn.onclick = async () => {
        const newText = editInput.value.trim();
        const newDate = editDate.value;

        if (!newText || !newDate) {
          alert("Please enter task and date");
          return;
        }

        await updateTodo(todo.id, newText, newDate);

        const user = auth.currentUser;
        allTodos = await loadTodos(user.uid);

        if (currentView === "calendar") {
          renderTodos(allTodos);
        } else {
          filterTasks(currentFilter);
        }

        updateTodayProgress();
        updateDailySummary();
      };

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "CANCEL";
      cancelBtn.className = "cancel-btn";

      const editContainer = document.createElement("div");
      editContainer.className = "edit-container";

      editContainer.appendChild(editInput);
      editContainer.appendChild(editDate);

      const buttonRow = document.createElement("div");
      buttonRow.className = "edit-buttons";

      buttonRow.appendChild(saveBtn);
      buttonRow.appendChild(cancelBtn);

      editContainer.appendChild(buttonRow);

      li.innerHTML = "";
      li.appendChild(editContainer);
    };

    const actions = document.createElement("div");
    actions.className = "task-actions";

    actions.appendChild(deleteBtn);
    actions.appendChild(updateBtn);

    li.appendChild(leftDiv);
    li.appendChild(actions);
    taskList.appendChild(li);
  });
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
  const reminderDateInput = document.getElementById("reminderDate");
  const errorMsg = document.getElementById("errorMsg");

  const taskText = taskInput.value.trim();
  const reminderDate = reminderDateInput.value;

  // Validation
  if (!taskText) {
    errorMsg.style.color = "red";
    errorMsg.textContent = "Please enter a task.";
    return;
  }

  if (!reminderDate) {
    errorMsg.style.color = "red";
    errorMsg.textContent = "Please select a date.";
    return;
  }

  const selectedDate = new Date(reminderDate);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    errorMsg.style.color = "red";
    errorMsg.textContent = "You cannot add tasks for past dates.";
    return;
  }

  errorMsg.textContent = "";

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first");
    return;
  }

  errorMsg.style.color = "green";
  errorMsg.textContent = "Task added successfully! ✅";

  // Save task
  try {
    await addTodo(user.uid, taskText, reminderDate);
  } catch (err) {
    console.error("Error adding task:", err);
  }

  // Schedule notification
  scheduleNotification(taskText, reminderDate);

  // Reload tasks
  allTodos = await loadTodos(user.uid);

  renderTodos(allTodos);
  updateTodayProgress();
  updateDailySummary();

  applyCurrentFilter();

  setTimeout(() => {
    errorMsg.textContent = "";
  }, 3000);

  taskInput.value = "";
}

// Notification scheduler
async function scheduleNotification(taskText, reminderDate) {
  if (!("Notification" in window)) return;

  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") return;
  }

  const reminderTime = new Date(reminderDate).getTime();
  const delay = reminderTime - Date.now();

  if (delay > 0) {
    setTimeout(() => {
      showNotification(taskText);
    }, delay);

    console.log(
      `Notification scheduled for "${taskText}" in ${Math.round(
        delay / 1000,
      )} seconds`,
    );
  }
}
const historyDateInput = document.getElementById("historyDate");
const historyTasksContainer = document.getElementById("historyTasks");

historyDateInput.addEventListener("change", () => {
  const selectedDate = historyDateInput.value; // YYYY-MM-DD
  displayTasksForDate(selectedDate);
});

/* FILTER TASKS */
function filterTasks(type) {
  currentFilter = type;
  currentView = type;

  let filtered = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(today.getDate() + diffToMonday);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  if (type === "day") {
    filtered = allTodos.filter((t) => {
      const d = new Date(t.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
  } else if (type === "week") {
    filtered = allTodos.filter((t) => {
      const d = new Date(t.date);
      return d >= startOfWeek && d <= endOfWeek;
    });
  } else if (type === "month") {
    filtered = allTodos.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    });
  }

  renderTodos(filtered);
}
function applyCurrentFilter() {
  document.querySelectorAll("#taskList li").forEach((task) => {
    task.style.display =
      currentFilter === "all" || task.dataset.type === currentFilter
        ? "flex"
        : "none";
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

// Initialize notification settings
window.addEventListener("DOMContentLoaded", async () => {
  const notifyToggle = document.getElementById("notifyToggle");

  // Default notifications to enabled for new users
  if (localStorage.getItem("notifications") === null) {
    localStorage.setItem("notifications", "true");
  }

  const notificationsEnabled = localStorage.getItem("notifications") === "true";

  notifyToggle.checked = notificationsEnabled;

  // Ask for permission if notifications are enabled
  if (
    notificationsEnabled &&
    "Notification" in window &&
    Notification.permission === "default"
  ) {
    const allowed = await requestNotificationPermission();

    if (!allowed) {
      notifyToggle.checked = false;
      localStorage.setItem("notifications", "false");
    }
  }
});

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("This browser does not support notifications.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    alert(
      "Notifications are blocked. Please enable them in your browser settings.",
    );
    return false;
  }

  const permission = await Notification.requestPermission();

  return permission === "granted";
}

async function toggleNotification() {
  const notifyToggle = document.getElementById("notifyToggle");
  const enabled = notifyToggle.checked;

  if (enabled) {
    const allowed = await requestNotificationPermission();

    if (!allowed) {
      notifyToggle.checked = false;
      localStorage.setItem("notifications", "false");
      return;
    }
  }

  localStorage.setItem("notifications", enabled ? "true" : "false");

  alert(enabled ? "Notifications Enabled 🔔" : "Notifications Disabled 🔕");
}

function showNotification(taskText) {
  const notificationsEnabled = localStorage.getItem("notifications") === "true";

  if (
    !notificationsEnabled ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  new Notification("⏰ Task Reminder", {
    body: taskText,
    icon: "https://cdn-icons-png.flaticon.com/512/1827/1827392.png",
  });
}

async function checkTodayTasks(uid) {
  const todos = await loadTodos(uid);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTasks = todos.filter((task) => {
    const taskDate = new Date(task.date); // use task.date, not reminderDate
    taskDate.setHours(0, 0, 0, 0);

    return taskDate.getTime() === today.getTime();
  });

  if (todayTasks.length > 0) {
    const taskNames = todayTasks.map((t) => t.text).join(", ");

    showNotification(`Today's Tasks: ${taskNames}`);
  }
}
/* update date */
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

async function updateDailySummary() {
  const user = auth.currentUser;
  if (!user) return;

  const todos = await loadTodos(user.uid);

  const today = new Date().toISOString().split("T")[0];

  const todayTasks = todos.filter((task) => task.date === today);

  const completedTasks = todayTasks.filter((task) => task.completed);

  let message = "";

  if (todayTasks.length === 0) {
    message = "No tasks scheduled for today.";
  } else if (completedTasks.length === todayTasks.length) {
    message = `All ${todayTasks.length} tasks completed today 🎉`;
  } else {
    message = `You completed ${completedTasks.length} of ${todayTasks.length} tasks today`;
  }

  document.getElementById("dailySummary").textContent = message;
}

async function updateTodayProgress() {
  const user = auth.currentUser;
  if (!user) return;

  const todos = await loadTodos(user.uid);

  const today = new Date().toISOString().split("T")[0];

  const todayTasks = todos.filter((task) => task.date === today);

  const completedTasks = todayTasks.filter((task) => task.completed);

  const percent =
    todayTasks.length === 0
      ? 0
      : Math.round((completedTasks.length / todayTasks.length) * 100);

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
    allTodos = await loadTodos(uid);

    renderTodos(allTodos);
    await updateTodayProgress();
    await updateDailySummary();

    // Default view = Today's Tasks
    filterTasks("day");

    // Show reminder when website opens
    await checkTodayTasks(uid);
  });

  requestNotificationPermission();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("Service Worker Registered"))
      .catch((err) =>
        console.error("Service Worker Registration Failed:", err),
      );
  }
};
flatpickr("#calendarDate", {
  inline: true,
  dateFormat: "Y-m-d",

  async onChange(selectedDates, dateStr) {
    currentView = "calendar";

    const filteredTodos = allTodos.filter((todo) => todo.date === dateStr);

    renderTodos(filteredTodos);
    updateTodayProgress();
    updateDailySummary();
  },
});

window.addTask = addTask;
window.filterTasks = filterTasks;
window.toggleSettings = toggleSettings;
window.toggleTheme = toggleTheme;
window.toggleNotification = toggleNotification;
window.renderTodos = renderTodos;
