const STORAGE_KEY = "habit-tracker-data";
const WEEKS_TO_SHOW = 18;
const DEFAULT_WEEKLY_GOAL = 5;

const appEl = document.querySelector(".app");
const listEl = document.getElementById("habits-list");
const inputEl = document.getElementById("habit-input");
const addBtn = document.getElementById("add-btn");
const template = document.getElementById("habit-template");

const searchInputEl = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search");
const noResultsEl = document.getElementById("no-results");
const noResultsQueryEl = document.getElementById("no-results-query");

const modalEl = document.getElementById("goal-modal");
const modalHabitNameEl = document.getElementById("modal-habit-name");
const goalSelectorEl = document.getElementById("goal-selector");
const modalCancelBtn = document.getElementById("modal-cancel");
const modalSaveBtn = document.getElementById("modal-save");

let habits = loadHabits();
let searchQuery = "";
let modalMode = null; // "create" | "edit"
let modalHabitId = null;
let modalPendingName = "";
let modalSelectedGoal = DEFAULT_WEEKLY_GOAL;

function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((h) => ({
      ...h,
      dates: new Set(h.dates),
      weeklyGoal: h.weeklyGoal || DEFAULT_WEEKLY_GOAL,
    }));
  } catch {
    return [];
  }
}

function saveHabits() {
  const serializable = habits.map((h) => ({ ...h, dates: Array.from(h.dates) }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function calcStreaks(dates) {
  let current = 0;
  let cursor = 0;
  if (!dates.has(todayISO())) cursor = 1;
  while (dates.has(isoDaysAgo(cursor))) {
    current++;
    cursor++;
  }

  let best = 0;
  let run = 0;
  const sorted = Array.from(dates).sort();
  let prev = null;
  for (const dateStr of sorted) {
    if (prev) {
      const diff = (new Date(dateStr) - new Date(prev)) / 86400000;
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = dateStr;
  }
  best = Math.max(best, current);

  return { current, best };
}

function calcWeekProgress(dates) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay();
  const daysSinceMonday = dow === 0 ? 6 : dow - 1;

  let count = 0;
  for (let i = 0; i <= daysSinceMonday; i++) {
    if (dates.has(isoDaysAgo(i))) count++;
  }
  return count;
}

function levelFor(count) {
  if (count <= 0) return 0;
  return 4;
}

function renderHeatmap(container, dates) {
  container.innerHTML = "";
  const totalDays = WEEKS_TO_SHOW * 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDow = today.getDay();
  const start = new Date(today);
  // Arrancamos en el domingo de hace WEEKS_TO_SHOW-1 semanas: así cada columna
  // es una semana completa y cada fila un día fijo, igual que getDay().
  start.setDate(start.getDate() - todayDow - (WEEKS_TO_SHOW - 1) * 7);

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const cell = document.createElement("div");
    cell.className = "heatmap-cell";
    if (d > today) {
      cell.classList.add("future");
    } else {
      const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const done = dates.has(iso);
      cell.dataset.level = levelFor(done ? 1 : 0);
      cell.title = `${iso}${done ? " ✓" : ""}`;
    }
    container.appendChild(cell);
  }
}

// Quita acentos y pasa a minúsculas para comparar sin importar cómo se escriba.
const DIACRITICS = /[̀-ͯ]/g;

function normalize(str) {
  return str.normalize("NFD").replace(DIACRITICS, "").toLowerCase();
}

// Devuelve null si no hay coincidencia. Score más alto = mejor coincidencia.
// 3 = empieza con la búsqueda, 2 = la contiene (%like%), 1 = letras en orden (similitud).
function scoreMatch(name, query) {
  const q = normalize(query.trim());
  if (!q) return { score: 0, index: -1 };

  const n = normalize(name);
  const idx = n.indexOf(q);
  if (idx === 0) return { score: 3, index: 0 };
  if (idx > 0) return { score: 2, index: idx };

  // Coincidencia por subsecuencia: "crr" encuentra "Correr".
  let qi = 0;
  for (let i = 0; i < n.length && qi < q.length; i++) {
    if (n[i] === q[qi]) qi++;
  }
  return qi === q.length ? { score: 1, index: -1 } : null;
}

function renderHabitName(el, name, match) {
  el.textContent = "";
  const q = normalize(searchQuery.trim());

  // Solo resaltamos coincidencias contiguas, y si normalizar no corrió los índices.
  if (!q || !match || match.index < 0 || normalize(name).length !== name.length) {
    el.textContent = name;
    return;
  }

  const end = match.index + q.length;
  el.append(
    document.createTextNode(name.slice(0, match.index)),
    Object.assign(document.createElement("mark"), { textContent: name.slice(match.index, end) }),
    document.createTextNode(name.slice(end))
  );
}

function renderHabits() {
  listEl.innerHTML = "";
  appEl.classList.toggle("empty", habits.length === 0);

  const matches = [];
  for (const habit of habits) {
    const match = scoreMatch(habit.name, searchQuery);
    if (match) matches.push({ habit, match });
  }

  // Con búsqueda activa, las mejores coincidencias primero.
  if (searchQuery.trim()) {
    matches.sort((a, b) => b.match.score - a.match.score);
  }

  const noHits = Boolean(searchQuery.trim()) && matches.length === 0;
  noResultsEl.classList.toggle("hidden", !noHits);
  noResultsQueryEl.textContent = `"${searchQuery.trim()}"`;

  for (const { habit, match } of matches) {
    const node = template.content.cloneNode(true);
    const card = node.querySelector(".habit-card");
    card.dataset.id = habit.id;
    renderHabitName(node.querySelector(".habit-name"), habit.name, match);

    const { current, best } = calcStreaks(habit.dates);
    node.querySelector(".streak-count").textContent = current;
    node.querySelector(".best-count").textContent = best;

    const weekProgress = calcWeekProgress(habit.dates);
    node.querySelector(".weekly-progress").textContent = weekProgress;
    node.querySelector(".weekly-goal-value").textContent = habit.weeklyGoal;
    const weeklyGoalBtn = node.querySelector(".weekly-goal-btn");
    weeklyGoalBtn.classList.toggle("met", weekProgress >= habit.weeklyGoal);
    weeklyGoalBtn.addEventListener("click", () => openGoalModal("edit", habit.id));

    const todayBtn = node.querySelector(".today-btn");
    const doneToday = habit.dates.has(todayISO());
    todayBtn.classList.toggle("done", doneToday);
    todayBtn.textContent = doneToday ? "✓" : "";

    todayBtn.addEventListener("click", () => toggleToday(habit.id));
    node.querySelector(".delete-btn").addEventListener("click", () => deleteHabit(habit.id));

    renderHeatmap(node.querySelector(".heatmap"), habit.dates);

    listEl.appendChild(node);
  }
}

function requestAddHabit() {
  const name = inputEl.value.trim();
  if (!name) return;
  openGoalModal("create", null, name);
}

function openGoalModal(mode, habitId, name) {
  modalMode = mode;
  modalHabitId = habitId;

  if (mode === "edit") {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    modalPendingName = habit.name;
    modalSelectedGoal = habit.weeklyGoal;
  } else {
    modalPendingName = name;
    modalSelectedGoal = DEFAULT_WEEKLY_GOAL;
  }

  modalHabitNameEl.textContent = modalPendingName;
  updateGoalSelectorUI();
  modalEl.classList.remove("hidden");
  // No enfocamos Guardar: si el modal se abrió con Enter, la repetición de esa
  // misma tecla cae sobre el botón ya enfocado y confirma sin que el modal
  // llegue a verse. Enfocamos el día seleccionado, donde activar es idempotente.
  const diaSeleccionado = goalSelectorEl.querySelector(".goal-day.selected");
  (diaSeleccionado || goalSelectorEl.firstElementChild).focus();
}

function closeGoalModal() {
  modalEl.classList.add("hidden");
  modalMode = null;
  modalHabitId = null;
}

function updateGoalSelectorUI() {
  const buttons = goalSelectorEl.querySelectorAll(".goal-day");
  buttons.forEach((btn) => {
    btn.classList.toggle("selected", Number(btn.dataset.value) === modalSelectedGoal);
  });
}

function confirmGoalModal() {
  if (modalMode === "create") {
    habits.push({
      id: crypto.randomUUID(),
      name: modalPendingName,
      dates: new Set(),
      weeklyGoal: modalSelectedGoal,
    });
    inputEl.value = "";
    // Si había una búsqueda activa, el hábito nuevo quedaría oculto.
    searchQuery = "";
    searchInputEl.value = "";
    clearSearchBtn.classList.add("hidden");
  } else if (modalMode === "edit") {
    const habit = habits.find((h) => h.id === modalHabitId);
    if (habit) habit.weeklyGoal = modalSelectedGoal;
  }
  saveHabits();
  renderHabits();
  closeGoalModal();
}

function toggleToday(id) {
  const habit = habits.find((h) => h.id === id);
  if (!habit) return;
  const today = todayISO();
  if (habit.dates.has(today)) {
    habit.dates.delete(today);
  } else {
    habit.dates.add(today);
  }
  saveHabits();
  renderHabits();
}

function deleteHabit(id) {
  habits = habits.filter((h) => h.id !== id);
  saveHabits();
  renderHabits();
}

addBtn.addEventListener("click", requestAddHabit);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") requestAddHabit();
});

searchInputEl.addEventListener("input", () => {
  searchQuery = searchInputEl.value;
  clearSearchBtn.classList.toggle("hidden", !searchQuery);
  renderHabits();
});

function clearSearch() {
  searchQuery = "";
  searchInputEl.value = "";
  clearSearchBtn.classList.add("hidden");
  renderHabits();
  searchInputEl.focus();
}

clearSearchBtn.addEventListener("click", clearSearch);

goalSelectorEl.querySelectorAll(".goal-day").forEach((btn) => {
  btn.addEventListener("click", () => {
    modalSelectedGoal = Number(btn.dataset.value);
    updateGoalSelectorUI();
  });
});

modalSaveBtn.addEventListener("click", confirmGoalModal);
modalCancelBtn.addEventListener("click", closeGoalModal);
modalEl.addEventListener("click", (e) => {
  if (e.target === modalEl) closeGoalModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!modalEl.classList.contains("hidden")) {
    closeGoalModal();
  } else if (searchQuery) {
    clearSearch();
  }
});

renderHabits();
