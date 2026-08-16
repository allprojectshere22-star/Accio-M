const STORAGE_KEY = "pastel-pocket-expense-v1";
const BACKUP_VERSION = 1;
const APP_NAME = "Pastel Pocket";
const VIEW_NAMES = new Set(["overview", "insights", "savings", "entries", "settings"]);

if (crypto.randomUUID === undefined) {
  crypto.randomUUID = function() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      var r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}

const categoryColors = {
  Bills: "#dcefe8",
  Food: "#f9e18d",
  Health: "#cfe7df",
  Leisure: "#ffd38b",
  Other: "#f3eee6",
  Rent: "#b9ddd4",
  Shopping: "#fde7a9",
  Transport: "#f6d27b"
};

const defaultCategories = ["Food", "Transport", "Shopping", "Bills", "Rent", "Health", "Leisure", "Other"];

function getCategoryColor(category) {
  if (categoryColors[category]) {
    return categoryColors[category];
  }
  const colors = Object.values(categoryColors);
  const index = defaultCategories.indexOf(category) % colors.length;
  return colors[index] || "#f3eee6";
}

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthFormatter = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });
const shortDateFormatter = new Intl.DateTimeFormat("en", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});
const backupTimeFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit"
});

const elements = {
  addExpenseInline: document.querySelector("#addExpenseInline"),
  allEntries: document.querySelector("#allEntries"),
  backupStatus: document.querySelector("#backupStatus"),
  budgetMessage: document.querySelector("#budgetMessage"),
  budgetRing: document.querySelector("#budgetRing"),
  categoryForm: document.querySelector("#categoryForm"),
  categoryList: document.querySelector("#categoryList"),
  categorySheet: document.querySelector("#categorySheet"),
  categorySheetModeLabel: document.querySelector("#categorySheetModeLabel"),
  categorySheetTitle: document.querySelector("#categorySheetTitle"),
  deleteCategoryButton: document.querySelector("#deleteCategoryButton"),
  deleteGoalButton: document.querySelector("#deleteGoalButton"),
  categoryChips: document.querySelector("#categoryChips"),
  clearFilter: document.querySelector("#clearFilter"),
  closeCategorySheet: document.querySelector("#closeCategorySheet"),
  closeGoalSheet: document.querySelector("#closeGoalSheet"),
  closeSheet: document.querySelector("#closeSheet"),
  deleteExpenseButton: document.querySelector("#deleteExpenseButton"),
  entriesSortToggle: document.querySelector("#entriesSortToggle"),
  expenseForm: document.querySelector("#expenseForm"),
  expenseSheet: document.querySelector("#expenseSheet"),
  exportBackupButton: document.querySelector("#exportBackupButton"),
  focusGoals: document.querySelector("#focusGoals"),
  goalBarFill: document.querySelector("#goalBarFill"),
  goalSavedValue: document.querySelector("#goalSavedValue"),
  goalsList: document.querySelector("#goalsList"),
  goalTargetTitle: document.querySelector("#goalTargetTitle"),
  goalTargetValue: document.querySelector("#goalTargetValue"),
  heroBudgetLine: document.querySelector("#heroBudgetLine"),
  heroBudgetValue: document.querySelector("#heroBudgetValue"),
  heroDateLabel: document.querySelector("#heroDateLabel"),
  heroExpenseLine: document.querySelector("#heroExpenseLine"),
  headerDate: document.querySelector("#headerDate"),
  importBackupInput: document.querySelector("#importBackupInput"),
  installAppButton: document.querySelector("#installAppButton"),
  installStatus: document.querySelector("#installStatus"),
  goalForm: document.querySelector("#goalForm"),
  goalSheet: document.querySelector("#goalSheet"),
  goalSheetModeLabel: document.querySelector("#goalSheetModeLabel"),
  goalSheetTitle: document.querySelector("#goalSheetTitle"),
  insightList: document.querySelector("#insightList"),
  insightToggle: document.querySelector("#insightToggle"),
  jumpToEntries: document.querySelector("#jumpToEntries"),
  latestEntries: document.querySelector("#latestEntries"),
  miniCalendar: document.querySelector("#miniCalendar"),
  monthLabel: document.querySelector("#monthLabel"),
  nextMonth: document.querySelector("#nextMonth"),
  openAddExpense: document.querySelector("#openAddExpense"),
  openCategorySheet: document.querySelector("#openCategorySheet"),
  prevMonth: document.querySelector("#prevMonth"),
  quickAddTop: document.querySelector("#quickAddTop"),
  savingsRing: document.querySelector("#savingsRing"),
  savingsValue: document.querySelector("#savingsValue"),
  settingsForm: document.querySelector("#settingsForm"),
  openGoalSheet: document.querySelector("#openGoalSheet"),
  sheetBackdrop: document.querySelector("#sheetBackdrop"),
  sheetModeLabel: document.querySelector("#sheetModeLabel"),
  sheetTitle: document.querySelector("#sheetTitle"),
  spentAmount: document.querySelector("#spentAmount"),
  summaryCards: document.querySelector("#summaryCards")
};

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toISODate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function getMonthKey(dateLike) {
  const date = new Date(dateLike);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isSecureInstallContext() {
  return window.location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function createSeedExpenses() {
  const today = new Date();
  const seedDates = [-1, -2, -4, -7, -9, -12].map((offset) => toISODate(addDays(today, offset)));

  return [
    {
      id: crypto.randomUUID(),
      title: "Vegetables",
      amount: 1680,
      category: "Food",
      paymentMethod: "UPI",
      date: seedDates[0],
      note: "Weekly market"
    },
    {
      id: crypto.randomUUID(),
      title: "Cab ride",
      amount: 420,
      category: "Transport",
      paymentMethod: "Card",
      date: seedDates[1],
      note: "Return to office"
    },
    {
      id: crypto.randomUUID(),
      title: "Coffee beans",
      amount: 640,
      category: "Food",
      paymentMethod: "UPI",
      date: seedDates[2],
      note: "Monthly grocery"
    },
    {
      id: crypto.randomUUID(),
      title: "Streaming bill",
      amount: 299,
      category: "Bills",
      paymentMethod: "Card",
      date: seedDates[3],
      note: "Auto renewal"
    },
    {
      id: crypto.randomUUID(),
      title: "Rent",
      amount: 18000,
      category: "Rent",
      paymentMethod: "Bank",
      date: seedDates[4],
      note: "April payment"
    },
    {
      id: crypto.randomUUID(),
      title: "Notebook",
      amount: 350,
      category: "Shopping",
      paymentMethod: "Cash",
      date: seedDates[5],
      note: "Work notes"
    }
  ];
}

function createDefaultGoals() {
  return [
    { id: crypto.randomUUID(), name: "Emergency fund", target: 25000, saved: 12500 },
    { id: crypto.randomUUID(), name: "New bicycle", target: 18000, saved: 6200 },
    { id: crypto.randomUUID(), name: "Road trip fund", target: 30000, saved: 8400 },
    { id: crypto.randomUUID(), name: "Home renovation", target: 65000, saved: 22000 }
  ];
}

function createDefaultState() {
  return {
    expenses: createSeedExpenses(),
    filter: "All",
    goals: createDefaultGoals(),
    categories: [...defaultCategories],
    insightMode: "spends",
    selectedMonth: getMonthKey(new Date()),
    selectedDate: null,
    sortBy: "date",
    settings: {
      currency: "INR",
      monthlyBudget: 45000,
      monthlySalary: 72000,
      savingsTarget: 18000
    },
    view: "overview"
  };
}

function normalizeExpenses(expenses, fallback) {
  if (!Array.isArray(expenses)) {
    return fallback;
  }

  return expenses
    .filter((expense) => expense && typeof expense === "object")
    .map((expense) => ({
      id: typeof expense.id === "string" && expense.id ? expense.id : crypto.randomUUID(),
      title: typeof expense.title === "string" && expense.title.trim() ? expense.title.trim() : "Untitled",
      amount: Number(expense.amount) || 0,
      category: typeof expense.category === "string" && expense.category ? expense.category : "Other",
      paymentMethod:
        typeof expense.paymentMethod === "string" && expense.paymentMethod ? expense.paymentMethod : "UPI",
      date:
        typeof expense.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(expense.date)
          ? expense.date
          : toISODate(new Date()),
      note: typeof expense.note === "string" ? expense.note : ""
    }));
}

function normalizeGoals(goals, fallback) {
  if (!Array.isArray(goals)) {
    return fallback;
  }

  return goals
    .filter((goal) => goal && typeof goal === "object")
    .map((goal) => ({
      id: typeof goal.id === "string" && goal.id ? goal.id : crypto.randomUUID(),
      name: typeof goal.name === "string" && goal.name.trim() ? goal.name.trim() : "New goal",
      target: Number(goal.target) || 0,
      saved: Number(goal.saved) || 0
    }));
}

function normalizeState(saved) {
  const defaults = createDefaultState();
  const source = saved && typeof saved === "object" ? saved : {};

  return {
    expenses: normalizeExpenses(source.expenses, defaults.expenses),
    filter: typeof source.filter === "string" && source.filter ? source.filter : defaults.filter,
    goals: normalizeGoals(source.goals, defaults.goals),
    categories: Array.isArray(source.categories) && source.categories.length > 0 
      ? source.categories.filter(c => typeof c === "string" && c.trim()).map(c => c.trim())
      : defaults.categories,
    insightMode: source.insightMode === "categories" ? "categories" : defaults.insightMode,
    selectedMonth:
      typeof source.selectedMonth === "string" && /^\d{4}-\d{2}$/.test(source.selectedMonth)
        ? source.selectedMonth
        : defaults.selectedMonth,
    settings: {
      ...defaults.settings,
      ...(source.settings && typeof source.settings === "object" ? source.settings : {})
    },
    view: VIEW_NAMES.has(source.view) ? source.view : defaults.view
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizeState(JSON.parse(raw));
    }
  } catch (error) {
    console.warn("Falling back to seed data.", error);
  }

  return createDefaultState();
}

let state = loadState();
let backupStatusMessage = "Data is saved only on this device. Take a backup before clearing.";
let installStatusOverride = "";
let deferredInstallPrompt = null;

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getCurrencyFormatter() {
  const currency = state.settings.currency || "INR";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  });
}

function formatCurrency(value) {
  return getCurrencyFormatter().format(Number(value) || 0);
}

function setBackupStatus(message) {
  backupStatusMessage = message;
  if (elements.backupStatus) {
    elements.backupStatus.textContent = backupStatusMessage;
  }
}

function getInstallStatusMessage() {
  if (installStatusOverride) {
    return installStatusOverride;
  }

  if (isStandaloneMode()) {
    return "This app is installed on this device.";
  }

  if (!isSecureInstallContext()) {
    return "HTTPS needed for full install; localhost is fine for testing.";
  }

  if (deferredInstallPrompt) {
    return "Ready to install. Tap the button below to install.";
  }

  if (isIOSDevice()) {
    return "On iPhone/iPad, open the Share menu in Safari and choose 'Add to Home Screen' to install.";
  }

  return "Use your browser menu (⋮) and choose 'Install' or 'Add to Home screen' to install the app.";
}

function renderInstallState() {
  const isInstalled = isStandaloneMode();
  const canPromptInstall = Boolean(deferredInstallPrompt);

  elements.installStatus.textContent = getInstallStatusMessage();
  elements.installAppButton.hidden = false;

  if (isInstalled) {
    elements.installAppButton.disabled = true;
    elements.installAppButton.textContent = "Installed";
    return;
  }

  if (canPromptInstall) {
    elements.installAppButton.disabled = false;
    elements.installAppButton.textContent = "Install";
    return;
  }

  elements.installAppButton.disabled = true;
  elements.installAppButton.textContent = "Not available";
}

function createBackupPayload() {
  return {
    app: APP_NAME,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    state
  };
}

function exportBackup() {
  const payload = createBackupPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);

  anchor.href = url;
  anchor.download = `pastel-pocket-backup-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  setBackupStatus(`Backup downloaded at ${backupTimeFormatter.format(new Date())}. Keep this file safe before deleting the app.`);
}

function restoreBackup(file) {
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const candidate = parsed && typeof parsed === "object" && parsed.state ? parsed.state : parsed;

      if (!candidate || typeof candidate !== "object") {
        throw new Error("Invalid backup file.");
      }

      state = normalizeState(candidate);
      state.view = "settings";
      persistState();
      render();
      setBackupStatus(`Backup restored from ${file.name}. You can now use the app on this device.`);
    } catch (error) {
      console.error(error);
      setBackupStatus("Backup restore failed. Please select a valid Accio M JSON file.");
    } finally {
      elements.importBackupInput.value = "";
    }
  });
  reader.readAsText(file);
}

function getCurrentMonthExpenses() {
  return state.expenses
    .filter((expense) => getMonthKey(expense.date) === state.selectedMonth)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getFilteredExpenses() {
  const filtered = getCurrentMonthExpenses();
  if (state.filter === "All") {
    return filtered;
  }
  return filtered.filter((expense) => expense.category === state.filter);
}

function getAllExpensesSorted() {
  const expenses = [...state.expenses];
  switch (state.sortBy) {
    case "date":
      return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    case "amount":
      return expenses.sort((a, b) => Number(b.amount) - Number(a.amount));
    case "category":
      return expenses.sort((a, b) => a.category.localeCompare(b.category));
    default:
      return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
}

function getSpentTotal(expenses) {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

function getSavingsAvailable() {
  return Math.max((state.settings.monthlySalary || 0) - getSpentTotal(getCurrentMonthExpenses()), 0);
}

function setActiveView(view) {
  console.log("setActiveView called with:", view);
  state.view = view;
  persistState();

  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.dataset.view === view);
  });

  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.viewTarget === view);
  });
  console.log("View switch complete");
}

function createSummaryCards() {
  const currentMonthExpenses = getCurrentMonthExpenses();
  const spent = getSpentTotal(currentMonthExpenses);
  const budget = Number(state.settings.monthlyBudget || 0);
  const savings = getSavingsAvailable();
  const remaining = Math.max(budget - spent, 0);

  const cards = [
    {
      label: "Monthly Salary",
      value: formatCurrency(state.settings.monthlySalary),
      note: "Set in Settings"
    },
    {
      label: "Total Expenses",
      value: formatCurrency(spent),
      note: `${currentMonthExpenses.length} entries this month`
    },
    {
      label: "Budget Left",
      value: formatCurrency(remaining),
      note: budget ? `${Math.max(100 - Math.round((spent / budget) * 100), 0)}% remaining` : "Set budget in Settings"
    },
    {
      label: "Savings",
      value: formatCurrency(savings),
      note: "Salary - this month expenses"
    }
  ];

  elements.summaryCards.innerHTML = cards
    .map(
      (card) => `
        <article class="summary-card">
          <div>
            <p class="eyebrow">${card.label}</p>
            <strong>${card.value}</strong>
          </div>
          <span class="subtle-note">${card.note}</span>
        </article>
      `
    )
    .join("");
}

function renderHero() {
  const now = new Date();
  const currentMonthExpenses = getCurrentMonthExpenses();
  const spent = getSpentTotal(currentMonthExpenses);
  const budget = Number(state.settings.monthlyBudget || 0);
  const remaining = Math.max(budget - spent, 0);
  const monthDate = new Date(`${state.selectedMonth}-01`);
  const percentRemaining = budget ? Math.max(100 - Math.round((spent / budget) * 100), 0) : 0;

  elements.heroDateLabel.textContent = new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(now);

  elements.heroExpenseLine.textContent = currentMonthExpenses.length
    ? `${currentMonthExpenses.length} entries in ${monthFormatter.format(monthDate)}`
    : `Add expenses for ${monthFormatter.format(monthDate)}`;

  elements.heroBudgetValue.textContent = budget ? formatCurrency(remaining) : formatCurrency(getSavingsAvailable());
  elements.heroBudgetLine.textContent = budget
    ? `${percentRemaining}% budget left`
    : "Set budget in Settings";
}

function renderCategoryChips() {
  const categories = ["All", ...state.categories.sort()];
  elements.categoryChips.innerHTML = categories
    .map(
      (category) => `
        <button class="chip ${category === state.filter ? "active" : ""}" type="button" data-category="${category}">
          ${category}
        </button>
      `
    )
    .join("");
}

function createEntryCard(expense, container) {
  const template = document.querySelector("#entryTemplate");
  const node = template.content.firstElementChild.cloneNode(true);
  const badge = node.querySelector(".entry-badge");
  const colors = getCategoryColor(expense.category);
  badge.style.background = `linear-gradient(160deg, ${colors}, #ffffff)`;
  badge.textContent = expense.category.slice(0, 2).toUpperCase();

  node.querySelector(".entry-title").textContent = expense.title;
  const metaElement = node.querySelector(".entry-meta");
  metaElement.textContent = `${expense.category} | ${shortDateFormatter.format(new Date(expense.date))}`;
  
  // Add left margin to date when sorting by date
  if (state.sortBy === "date") {
    metaElement.style.marginLeft = "8px";
  }
  
  node.querySelector(".entry-note").textContent = expense.note || "No note";
  node.querySelector(".entry-amount").textContent = `- ${formatCurrency(expense.amount)}`;
  node.querySelector(".entry-payment").textContent = expense.paymentMethod;

  node.querySelector(".edit-button").addEventListener("click", () => openExpenseSheet(expense));
  node.querySelector(".delete-button").addEventListener("click", () => deleteExpense(expense.id));

  container.appendChild(node);
}

function renderEntries(container, expenses, emptyMessage) {
  container.innerHTML = "";

  if (!expenses.length) {
    container.innerHTML = `<p class="subtle-note">${emptyMessage}</p>`;
    return;
  }

  expenses.forEach((expense) => createEntryCard(expense, container));
}

function renderCalendar() {
  const [year, month] = state.selectedMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const totalDays = lastDay.getDate();
  const startOffset = firstDay.getDay();
  const totalCells = Math.ceil((startOffset + totalDays) / 7) * 7;
  const today = new Date();
  const isCurrentViewedMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const countByDay = getCurrentMonthExpenses().reduce((map, expense) => {
    const day = Number(String(expense.date).slice(-2));
    map.set(day, (map.get(day) || 0) + 1);
    return map;
  }, new Map());

  const labels = dayLabels
    .map(
      (day) => `
        <div class="calendar-label">${day.slice(0, 1)}</div>
      `
    )
    .join("");

  const cells = Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - startOffset + 1;
    if (dayNumber < 1 || dayNumber > totalDays) {
      return '<div class="calendar-day empty" aria-hidden="true"></div>';
    }

    const count = countByDay.get(dayNumber) || 0;
    const isActive = isCurrentViewedMonth && dayNumber === today.getDate();
    const isSelected = state.selectedDate && state.selectedDate === `${year}-${String(month).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
    return `
      <div class="calendar-day ${count ? "has-expense" : ""} ${isActive ? "active" : ""} ${isSelected ? "selected" : ""}" data-date="${year}-${String(month).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}" style="cursor: pointer;">
        <strong>${dayNumber}</strong>
        <small>${count ? `${count} ${count === 1 ? "item" : "items"}` : ""}</small>
        ${count ? '<span class="calendar-dot"></span>' : ""}
      </div>
    `;
  }).join("");

  elements.miniCalendar.innerHTML = `${labels}${cells}`;

  elements.miniCalendar.querySelectorAll(".calendar-day:not(.empty)").forEach((dayCell) => {
    dayCell.addEventListener("click", () => {
      const date = dayCell.dataset.date;
      if (state.selectedDate === date) {
        state.selectedDate = null;
      } else {
        state.selectedDate = date;
      }
      persistState();
      render();
    });
  });
}

function renderInsights() {
  let monthExpenses = getCurrentMonthExpenses();
  if (state.selectedDate) {
    monthExpenses = monthExpenses.filter((expense) => expense.date === state.selectedDate);
  }
  const spent = getSpentTotal(monthExpenses);
  const budget = Number(state.settings.monthlyBudget || 0);
  const percent = budget ? Math.min(Math.round((spent / budget) * 100), 100) : 0;

  elements.monthLabel.textContent = monthFormatter.format(new Date(`${state.selectedMonth}-01`));
  elements.spentAmount.textContent = formatCurrency(spent);
  elements.budgetRing.style.setProperty("--progress", `${percent}%`);
  elements.budgetMessage.textContent = budget
    ? `Used ${percent}% of ${formatCurrency(budget)}`
    : "Set budget in Settings";

  renderCalendar();

  document.querySelectorAll("#insightToggle button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.insightMode);
  });

  if (state.insightMode === "spends") {
    renderEntries(elements.insightList, monthExpenses, state.selectedDate ? "No expenses on this date" : "No spends this month yet");
    return;
  }

  const totalsByCategory = monthExpenses.reduce((map, expense) => {
    map.set(expense.category, (map.get(expense.category) || 0) + Number(expense.amount || 0));
    return map;
  }, new Map());

  const sortedTotals = [...totalsByCategory.entries()].sort((a, b) => b[1] - a[1]);
  elements.insightList.innerHTML = "";

  if (!sortedTotals.length) {
    elements.insightList.innerHTML = `<p class="subtle-note">No category totals this month yet</p>`;
    return;
  }

  sortedTotals.forEach(([category, amount]) => {
    const card = document.createElement("article");
    card.className = "entry-card";
    card.innerHTML = `
      <div class="entry-badge" style="background: linear-gradient(160deg, ${getCategoryColor(category)}, #ffffff)">
        ${category.slice(0, 2).toUpperCase()}
      </div>
      <div class="entry-copy">
        <strong class="entry-title">${category}</strong>
        <span class="entry-meta">${monthExpenses.filter((expense) => expense.category === category).length} items</span>
        <small class="entry-note">Total</small>
      </div>
      <div class="entry-amounts">
        <strong class="entry-amount">${formatCurrency(amount)}</strong>
      </div>
    `;
    elements.insightList.appendChild(card);
  });
}

function renderSavings() {
  const savingsAvailable = getSavingsAvailable();
  const target = Number(state.settings.savingsTarget || 0);
  const progress = target ? Math.min(Math.round((savingsAvailable / target) * 100), 100) : 0;

  elements.savingsValue.textContent = formatCurrency(savingsAvailable);
  if (elements.savingsRing) {
    elements.savingsRing.style.setProperty("--progress", `${progress}%`);
  }
  elements.goalTargetTitle.textContent = target ? `Target: ${formatCurrency(target)}` : "Set savings target";
  elements.goalSavedValue.textContent = formatCurrency(savingsAvailable);
  elements.goalTargetValue.textContent = target ? formatCurrency(target) : "No target";
  elements.goalBarFill.style.width = `${progress}%`;

  elements.goalsList.innerHTML = "";
  if (!state.goals.length) {
    elements.goalsList.innerHTML = `<p class="subtle-note">No goals yet. Tap + to add</p>`;
    return;
  }

  state.goals.forEach((goal) => {
    const ratio = goal.target ? Math.min(Math.round((goal.saved / goal.target) * 100), 100) : 0;
    const card = document.createElement("article");
    card.className = "goal-item";
    card.innerHTML = `
      <p class="eyebrow">Goal</p>
      <h3>${goal.name}</h3>
      <div class="goal-bar"><span style="width:${ratio}%"></span></div>
      <div class="goal-stats">
        <strong>${formatCurrency(goal.saved)}</strong>
        <span>${formatCurrency(goal.target)}</span>
      </div>
      <div class="entry-actions">
        <button class="tiny-button edit-button" type="button">Edit</button>
        <button class="tiny-button delete-button" type="button">Delete</button>
      </div>
    `;
    card.querySelector(".edit-button").addEventListener("click", () => openGoalSheet(goal));
    card.querySelector(".delete-button").addEventListener("click", () => deleteGoal(goal.id));
    elements.goalsList.appendChild(card);
  });
}

function syncSettingsForm() {
  elements.settingsForm.monthlyBudget.value = state.settings.monthlyBudget;
  elements.settingsForm.monthlySalary.value = state.settings.monthlySalary;
  elements.settingsForm.savingsTarget.value = state.settings.savingsTarget;
  elements.settingsForm.currency.value = state.settings.currency;
}

function renderCategories() {
  elements.categoryList.innerHTML = "";
  if (!state.categories.length) {
    elements.categoryList.innerHTML = `<p class="subtle-note">No categories yet.</p>`;
    return;
  }

  state.categories.forEach((category) => {
    const card = document.createElement("article");
    card.className = "entry-card";
    card.innerHTML = `
      <div class="entry-badge" style="background: linear-gradient(160deg, ${getCategoryColor(category)}, #ffffff)">
        ${category.slice(0, 2).toUpperCase()}
      </div>
      <div class="entry-copy">
        <strong class="entry-title">${category}</strong>
        <span class="entry-meta">Category</span>
      </div>
      <div class="entry-actions">
        <button class="tiny-button edit-button" type="button">Edit</button>
        <button class="tiny-button delete-button" type="button">Delete</button>
      </div>
    `;
    card.querySelector(".edit-button").addEventListener("click", () => openCategorySheet(category));
    card.querySelector(".delete-button").addEventListener("click", () => deleteCategory(category));
    elements.categoryList.appendChild(card);
  });
}

function updateCategorySelect() {
  const select = elements.expenseForm.category;
  select.innerHTML = state.categories
    .map((category) => `<option value="${category}">${category}</option>`)
    .join("");
}

function render() {
  elements.headerDate.textContent = new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());

  renderHero();
  createSummaryCards();
  renderCategoryChips();
  renderEntries(elements.latestEntries, getFilteredExpenses().slice(0, 5), "No entries for this filter.");
  renderEntries(elements.allEntries, getAllExpensesSorted(), "No expenses saved yet.");
  renderInsights();
  renderSavings();
  syncSettingsForm();
  renderCategories();
  updateCategorySelect();
  setBackupStatus(backupStatusMessage);
  renderInstallState();
  setActiveView(state.view);

  // Re-apply date margin after rendering
  document.querySelectorAll("#allEntries .entry-meta").forEach((metaElement) => {
    if (state.sortBy === "date") {
      metaElement.style.marginLeft = "8px";
    } else {
      metaElement.style.marginLeft = "";
    }
  });

  document.querySelectorAll("#entriesSortToggle button").forEach((button) => {
    button.classList.toggle("active", button.dataset.sort === state.sortBy);
  });
}

function syncSheetBackdrop() {
  const hasOpenSheet =
    !elements.expenseSheet.classList.contains("hidden") ||
    !elements.goalSheet.classList.contains("hidden") ||
    !elements.categorySheet.classList.contains("hidden");
  elements.sheetBackdrop.classList.toggle("hidden", !hasOpenSheet);
}

function openExpenseSheet(expense) {
  elements.goalSheet.classList.add("hidden");
  elements.goalSheet.setAttribute("aria-hidden", "true");
  elements.categorySheet.classList.add("hidden");
  elements.categorySheet.setAttribute("aria-hidden", "true");
  elements.expenseSheet.classList.remove("hidden");
  elements.expenseSheet.setAttribute("aria-hidden", "false");
  syncSheetBackdrop();

  if (expense) {
    elements.sheetModeLabel.textContent = "Edit Entry";
    elements.sheetTitle.textContent = expense.title;
    elements.deleteExpenseButton.style.visibility = "visible";
    elements.expenseForm.expenseId.value = expense.id;
    elements.expenseForm.title.value = expense.title;
    elements.expenseForm.amount.value = expense.amount;
    elements.expenseForm.date.value = expense.date;
    elements.expenseForm.category.value = expense.category;
    elements.expenseForm.paymentMethod.value = expense.paymentMethod;
    elements.expenseForm.note.value = expense.note || "";
  } else {
    elements.sheetModeLabel.textContent = "New Entry";
    elements.sheetTitle.textContent = "Add Expense";
    elements.deleteExpenseButton.style.visibility = "hidden";
    elements.expenseForm.reset();
    elements.expenseForm.expenseId.value = "";
    elements.expenseForm.date.value = toISODate(new Date());
    elements.expenseForm.category.value = "Food";
    elements.expenseForm.paymentMethod.value = "UPI";
  }
}

function closeExpenseSheet() {
  elements.expenseSheet.classList.add("hidden");
  elements.expenseSheet.setAttribute("aria-hidden", "true");
  syncSheetBackdrop();
}

function openGoalSheet(goal) {
  elements.expenseSheet.classList.add("hidden");
  elements.expenseSheet.setAttribute("aria-hidden", "true");
  elements.categorySheet.classList.add("hidden");
  elements.categorySheet.setAttribute("aria-hidden", "true");
  elements.goalSheet.classList.remove("hidden");
  elements.goalSheet.setAttribute("aria-hidden", "false");
  syncSheetBackdrop();

  if (goal) {
    elements.goalSheetModeLabel.textContent = "Edit Goal";
    elements.goalSheetTitle.textContent = goal.name;
    elements.deleteGoalButton.style.visibility = "visible";
    elements.goalForm.goalId.value = goal.id;
    elements.goalForm.name.value = goal.name;
    elements.goalForm.target.value = goal.target;
    elements.goalForm.saved.value = goal.saved;
  } else {
    elements.goalSheetModeLabel.textContent = "New Goal";
    elements.goalSheetTitle.textContent = "Add Savings Target";
    elements.deleteGoalButton.style.visibility = "hidden";
    elements.goalForm.reset();
    elements.goalForm.goalId.value = "";
    elements.goalForm.saved.value = "0";
  }
}

function closeGoalSheet() {
  elements.goalSheet.classList.add("hidden");
  elements.goalSheet.setAttribute("aria-hidden", "true");
  syncSheetBackdrop();
}

function openCategorySheet(category) {
  elements.expenseSheet.classList.add("hidden");
  elements.expenseSheet.setAttribute("aria-hidden", "true");
  elements.goalSheet.classList.add("hidden");
  elements.goalSheet.setAttribute("aria-hidden", "true");
  elements.categorySheet.classList.remove("hidden");
  elements.categorySheet.setAttribute("aria-hidden", "false");
  syncSheetBackdrop();

  if (category) {
    elements.categorySheetModeLabel.textContent = "Edit Category";
    elements.categorySheetTitle.textContent = category;
    elements.deleteCategoryButton.style.visibility = "visible";
    elements.categoryForm.categoryId.value = category;
    elements.categoryForm.name.value = category;
  } else {
    elements.categorySheetModeLabel.textContent = "New Category";
    elements.categorySheetTitle.textContent = "Add Category";
    elements.deleteCategoryButton.style.visibility = "hidden";
    elements.categoryForm.reset();
    elements.categoryForm.categoryId.value = "";
  }
}

function closeCategorySheet() {
  elements.categorySheet.classList.add("hidden");
  elements.categorySheet.setAttribute("aria-hidden", "true");
  syncSheetBackdrop();
}

function closeAllSheets() {
  elements.expenseSheet.classList.add("hidden");
  elements.expenseSheet.setAttribute("aria-hidden", "true");
  elements.goalSheet.classList.add("hidden");
  elements.goalSheet.setAttribute("aria-hidden", "true");
  elements.categorySheet.classList.add("hidden");
  elements.categorySheet.setAttribute("aria-hidden", "true");
  syncSheetBackdrop();
}

function upsertExpense(formData) {
  const id = formData.get("expenseId") || crypto.randomUUID();
  const expense = {
    id,
    title: formData.get("title").trim(),
    amount: Number(formData.get("amount")),
    category: formData.get("category"),
    paymentMethod: formData.get("paymentMethod"),
    date: formData.get("date"),
    note: formData.get("note").trim()
  };

  const existingIndex = state.expenses.findIndex((item) => item.id === id);
  if (existingIndex >= 0) {
    state.expenses[existingIndex] = expense;
  } else {
    state.expenses.unshift(expense);
  }

  persistState();
  render();
  closeExpenseSheet();
}

function upsertGoal(formData) {
  const id = formData.get("goalId") || crypto.randomUUID();
  const goal = {
    id,
    name: formData.get("name").trim(),
    target: Number(formData.get("target")) || 0,
    saved: Number(formData.get("saved")) || 0
  };

  const existingIndex = state.goals.findIndex((item) => item.id === id);
  if (existingIndex >= 0) {
    state.goals[existingIndex] = goal;
  } else {
    state.goals.unshift(goal);
  }

  persistState();
  render();
  closeGoalSheet();
}

function deleteExpense(id) {
  const expense = state.expenses.find((item) => item.id === id);
  if (!expense) {
    return;
  }

  const confirmed = window.confirm(`Delete "${expense.title}"?`);
  if (!confirmed) {
    return;
  }

  state.expenses = state.expenses.filter((item) => item.id !== id);
  persistState();
  render();
  closeExpenseSheet();
}

function deleteGoal(id) {
  const goal = state.goals.find((item) => item.id === id);
  if (!goal) {
    return;
  }

  const confirmed = window.confirm(`Delete "${goal.name}"?`);
  if (!confirmed) {
    return;
  }

  state.goals = state.goals.filter((item) => item.id !== id);
  persistState();
  render();
  closeGoalSheet();
}

function upsertCategory(formData) {
  const id = formData.get("categoryId");
  const name = formData.get("name").trim();

  if (!name) {
    return;
  }

  if (id) {
    const index = state.categories.indexOf(id);
    if (index >= 0) {
      state.categories[index] = name;
    }
  } else {
    state.categories.push(name);
  }

  persistState();
  render();
  closeCategorySheet();
}

function deleteCategory(category) {
  const confirmed = window.confirm(`Delete "${category}"? This will not affect existing expenses.`);
  if (!confirmed) {
    return;
  }

  state.categories = state.categories.filter((c) => c !== category);
  persistState();
  render();
  closeCategorySheet();
}

document.querySelectorAll("[data-view-target]").forEach((button) => {
  button.addEventListener("click", () => {
    console.log("Nav button clicked, target:", button.dataset.viewTarget);
    setActiveView(button.dataset.viewTarget);
  });
});

if (elements.openAddExpense) elements.openAddExpense.addEventListener("click", () => openExpenseSheet());
if (elements.addExpenseInline) elements.addExpenseInline.addEventListener("click", () => openExpenseSheet());

if (elements.openGoalSheet) elements.openGoalSheet.addEventListener("click", () => openGoalSheet());
if (elements.openGoalSheetInline) elements.openGoalSheetInline.addEventListener("click", () => openGoalSheet());
if (elements.openCategorySheet) elements.openCategorySheet.addEventListener("click", () => openCategorySheet());
if (elements.closeSheet) elements.closeSheet.addEventListener("click", closeExpenseSheet);
if (elements.closeGoalSheet) elements.closeGoalSheet.addEventListener("click", closeGoalSheet);
if (elements.closeCategorySheet) elements.closeCategorySheet.addEventListener("click", closeCategorySheet);
if (elements.deleteGoalButton) elements.deleteGoalButton.addEventListener("click", () => {
  const goalId = elements.goalForm.goalId.value;
  if (goalId) {
    deleteGoal(goalId);
  }
});
if (elements.deleteCategoryButton) elements.deleteCategoryButton.addEventListener("click", () => {
  const categoryId = elements.categoryForm.categoryId.value;
  if (categoryId) {
    deleteCategory(categoryId);
  }
});
if (elements.exportBackupButton) elements.exportBackupButton.addEventListener("click", exportBackup);
if (elements.importBackupInput) elements.importBackupInput.addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  const confirmed = window.confirm("Restore this backup and replace current data?");
  if (!confirmed) {
    elements.importBackupInput.value = "";
    return;
  }

  restoreBackup(file);
});
if (elements.installAppButton) elements.installAppButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    renderInstallState();
    return;
  }

  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installStatusOverride =
    outcome === "accepted"
      ? "Install accepted. Complete browser prompt to add to home screen."
      : "Install prompt declined. You can install later in browser.";
  renderInstallState();
});
if (elements.sheetBackdrop) elements.sheetBackdrop.addEventListener("click", closeAllSheets);
if (elements.jumpToEntries) elements.jumpToEntries.addEventListener("click", () => setActiveView("entries"));
if (elements.quickAddTop) elements.quickAddTop.addEventListener("click", () => setActiveView("settings"));
if (elements.focusGoals) elements.focusGoals.addEventListener("click", () => setActiveView("settings"));
if (elements.clearFilter) elements.clearFilter.addEventListener("click", () => {
  state.filter = "All";
  persistState();
  render();
});

if (elements.categoryChips) elements.categoryChips.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) {
    return;
  }
  state.filter = button.dataset.category;
  persistState();
  render();
});

if (elements.expenseForm) elements.expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  upsertExpense(new FormData(elements.expenseForm));
});

if (elements.goalForm) elements.goalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  upsertGoal(new FormData(elements.goalForm));
});

if (elements.categoryForm) elements.categoryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  upsertCategory(new FormData(elements.categoryForm));
});

if (elements.entriesSortToggle) elements.entriesSortToggle.addEventListener("click", (event) => {
  const button = event.target.closest("[data-sort]");
  if (!button) {
    return;
  }
  state.sortBy = button.dataset.sort;
  persistState();
  render();
});

if (elements.deleteExpenseButton) elements.deleteExpenseButton.addEventListener("click", () => {
  const id = elements.expenseForm.expenseId.value;
  if (id) {
    deleteExpense(id);
  }
});

if (elements.settingsForm) elements.settingsForm.addEventListener("input", () => {
  state.settings = {
    monthlyBudget: Number(elements.settingsForm.monthlyBudget.value || 0),
    monthlySalary: Number(elements.settingsForm.monthlySalary.value || 0),
    savingsTarget: Number(elements.settingsForm.savingsTarget.value || 0),
    currency: elements.settingsForm.currency.value
  };
  persistState();
  render();
});

if (elements.prevMonth) elements.prevMonth.addEventListener("click", () => {
  const [year, month] = state.selectedMonth.split("-").map(Number);
  const next = new Date(year, month - 2, 1);
  state.selectedMonth = getMonthKey(next);
  persistState();
  render();
});

if (elements.nextMonth) elements.nextMonth.addEventListener("click", () => {
  const [year, month] = state.selectedMonth.split("-").map(Number);
  const next = new Date(year, month, 1);
  state.selectedMonth = getMonthKey(next);
  persistState();
  render();
});

if (elements.insightToggle) elements.insightToggle.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mode]");
  if (!button) {
    return;
  }
  state.insightMode = button.dataset.mode;
  persistState();
  render();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installStatusOverride = "";
  renderInstallState();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installStatusOverride = "This app is installed on this device.";
  renderInstallState();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("Service worker registration failed.", error);
    });
  });
}

render();
