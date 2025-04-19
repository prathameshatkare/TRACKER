const table = document.getElementById("progressTable");
const toggleDark = document.getElementById("toggleDark");

const NUM_DAYS = 180;
const NUM_TASKS = 10;
const STORAGE_KEY = "progressTrackerData_v2";

// Dark mode toggle
toggleDark.onclick = () => {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
};
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

// Generate next 180 dates
function generateDates() {
  const today = new Date();
  const dates = [];
  for (let i = 0; i < NUM_DAYS; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || generateInitialData();

function generateInitialData() {
  const dates = generateDates();
  const d = {};
  dates.forEach(date => {
    d[date] = Array(NUM_TASKS).fill("");
  });
  d["tasks"] = Array.from({ length: NUM_TASKS }, (_, i) => `Task ${i + 1}`);
  return d;
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function renderTable() {
  const dates = Object.keys(data).filter(k => k !== "tasks");
  const tasks = data.tasks;

  table.innerHTML = "";

  // Header Row (Task Names)
  const headerRow = document.createElement("tr");
  const firstHeader = document.createElement("th");
  firstHeader.textContent = "Date";
  firstHeader.className = "px-2 py-1 border bg-gray-300 dark:bg-gray-700 sticky left-0";
  headerRow.appendChild(firstHeader);

  tasks.forEach((task, taskIndex) => {
    const th = document.createElement("th");
    th.contentEditable = true;
    th.textContent = task;
    th.className = "px-2 py-1 border bg-gray-100 dark:bg-gray-800";
    th.addEventListener("input", () => {
      data.tasks[taskIndex] = th.textContent;
      saveData();
    });
    headerRow.appendChild(th);
  });

  table.appendChild(headerRow);

  // Rows for each Date
  dates.forEach((date, rowIndex) => {
    const tr = document.createElement("tr");

    const tdDate = document.createElement("td");
    tdDate.textContent = date;
    tdDate.className = "px-2 py-1 border font-medium bg-white dark:bg-gray-900 sticky left-0";
    tr.appendChild(tdDate);

    tasks.forEach((_, taskIndex) => {
      const td = document.createElement("td");
      td.contentEditable = true;
      td.textContent = data[date][taskIndex];
      td.className = "px-2 py-1 border min-w-[70px]";
      td.addEventListener("input", () => {
        data[date][taskIndex] = td.textContent;
        saveData();
      });
      tr.appendChild(td);
    });

    table.appendChild(tr);
  });
}

renderTable();
// Scroll to today row + highlight
function scrollToToday() {
    const today = new Date().toISOString().split("T")[0];
    const rows = Array.from(table.rows).slice(1); // Skip header
    const todayRow = rows.find(row => row.cells[0].textContent === today);
    if (todayRow) {
      todayRow.scrollIntoView({ behavior: "smooth", block: "center" });
      todayRow.classList.add("bg-yellow-100", "dark:bg-yellow-800");
      setTimeout(() => {
        todayRow.classList.remove("bg-yellow-100", "dark:bg-yellow-800");
      }, 3000); // Highlight disappears after 3s
    }
  }
  
  // Auto-highlight today when rendering
  function highlightToday() {
    const today = new Date().toISOString().split("T")[0];
    const rows = Array.from(table.rows).slice(1); // Skip header
    const todayRow = rows.find(row => row.cells[0].textContent === today);
    if (todayRow) {
      todayRow.classList.add("bg-green-100", "dark:bg-green-800");
    }
  }
  function downloadCSV() {
    const tasks = data.tasks;
    const dates = Object.keys(data).filter(k => k !== "tasks");
  
    let csv = ["Date," + tasks.join(",")]; // Header row
  
    dates.forEach(date => {
      const row = [date, ...(data[date] || [])];
      csv.push(row.join(","));
    });
  
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "daily_progress_tracker.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  function generateWeeklyData() {
    const weeks = [];
    const weekProgress = [];
  
    let week = 0;
    let currentWeek = 0;
    let weekSum = 0;
    let weekCount = 0;
  
    const dates = Object.keys(data).filter(k => k !== "tasks");
  
    // Loop through the dates and accumulate weekly progress
    dates.forEach(date => {
      const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 6 = Saturday
      const taskProgress = data[date].reduce((sum, task) => sum + (task ? 1 : 0), 0) / NUM_TASKS;
      
      if (dayOfWeek === 0 && weekCount > 0) { // New week
        weeks.push(`Week ${currentWeek + 1}`);
        weekProgress.push((weekSum / weekCount) * 100);
        weekSum = 0;
        weekCount = 0;
        currentWeek++;
      }
  
      weekSum += taskProgress;
      weekCount++;
    });
  
    if (weekCount > 0) { // For the last week
      weeks.push(`Week ${currentWeek + 1}`);
      weekProgress.push((weekSum / weekCount) * 100);
    }
  
    return { weeks, weekProgress };
  }
  
  function generateMonthlyData() {
    const months = [];
    const monthProgress = [];
    
    let monthSum = 0;
    let monthCount = 0;
    let currentMonth = new Date().getMonth();
  
    const dates = Object.keys(data).filter(k => k !== "tasks");
  
    dates.forEach(date => {
      const month = new Date(date).getMonth();
      const taskProgress = data[date].reduce((sum, task) => sum + (task ? 1 : 0), 0) / NUM_TASKS;
  
      if (month !== currentMonth && monthCount > 0) { // New month
        months.push(`Month ${currentMonth + 1}`);
        monthProgress.push((monthSum / monthCount) * 100);
        monthSum = 0;
        monthCount = 0;
        currentMonth = month;
      }
  
      monthSum += taskProgress;
      monthCount++;
    });
  
    if (monthCount > 0) { // For the last month
      months.push(`Month ${currentMonth + 1}`);
      monthProgress.push((monthSum / monthCount) * 100);
    }
  
    return { months, monthProgress };
  }
  
  function renderCharts() {
    const weeklyData = generateWeeklyData();
    const monthlyData = generateMonthlyData();
  
    // Weekly Chart
    const ctxWeekly = document.getElementById("weeklyChart").getContext("2d");
    new Chart(ctxWeekly, {
      type: "line",
      data: {
        labels: weeklyData.weeks,
        datasets: [{
          label: "Weekly Progress (%)",
          data: weeklyData.weekProgress,
          borderColor: "#4CAF50",
          fill: false,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            min: 0,
            max: 100
          }
        }
      }
    });
  
    // Monthly Chart
    const ctxMonthly = document.getElementById("monthlyChart").getContext("2d");
    new Chart(ctxMonthly, {
      type: "line",
      data: {
        labels: monthlyData.months,
        datasets: [{
          label: "Monthly Progress (%)",
          data: monthlyData.monthProgress,
          borderColor: "#2196F3",
          fill: false,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            min: 0,
            max: 100
          }
        }
      }
    });
  }
  
  // Call after rendering table
  renderCharts();
  function checkTimeForReminder() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
  
    if (hours === 21 && minutes === 0) { // Check if it's 9:00 PM
      alert("⏰ Come on champ, are your tasks done?");
    }
  }
  
  // Check every minute if it's 9 PM
  setInterval(checkTimeForReminder, 60000);
  
  document.getElementById("downloadCSV").addEventListener("click", downloadCSV);
  
  
  highlightToday(); // Call after rendering
  
  // Scroll button logic
  document.getElementById("scrollToday").addEventListener("click", scrollToToday);
  
