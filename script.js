const STORAGE_KEY = "studentTaskManager.tasks.v1";
const $ = (id) => document.getElementById(id);
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0,10); };
let tasks = loadTasks();
let toastTimer;

function loadTasks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveTasks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function escapeHTML(value="") {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function formatDate(date) {
  if (!date) return "No due date";
  return new Date(date + "T00:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});
}
function isOverdue(task) { return task.status !== "Completed" && task.dueDate && task.dueDate < today(); }
function getDeadlineLabel(task) {
  if (task.status === "Completed" || !task.dueDate) {
    return "";
  }

  if (task.dueDate < today()) {
    return "Overdue";
  }

  if (task.dueDate === today()) {
    return "Due Today";
  }

  return "Upcoming";
}

function deadlineBadge(task) {
  const label = getDeadlineLabel(task);

  if (!label) return "";

  const classes = {
    "Overdue": "deadline-overdue",
    "Due Today": "deadline-today",
    "Upcoming": "deadline-upcoming"
  };

  return `<span class="deadline-badge ${classes[label]}">${label}</span>`;
}
function statusClass(status) { return status.replace(/\s+/g,"-"); }
function showToast(message) {
  const toast=$("toast"); toast.textContent=message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove("show"),2500);
}
function setView(view) {
  ["dashboard","tasks","completed"].forEach(name => $(name+"View").classList.toggle("hidden",name!==view));
  document.querySelectorAll(".nav-item").forEach(btn=>btn.classList.toggle("active",btn.dataset.view===view));
  $("pageTitle").textContent = view==="dashboard"?"Dashboard":view==="tasks"?"My Tasks":"Completed Tasks";
  if(view==="tasks") renderTasks();
  if(view==="completed") renderCompleted();
}
document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>setView(btn.dataset.view)));
$("viewAllBtn").addEventListener("click",()=>setView("tasks"));
$("recentViewAll").addEventListener("click",()=>setView("tasks"));
$("addTaskTop").addEventListener("click",()=>openModal());
$("closeModal").addEventListener("click",closeModal);
$("cancelModal").addEventListener("click",closeModal);
$("taskModal").addEventListener("click",e=>{if(e.target===$("taskModal"))closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
["searchInput","priorityFilter","statusFilter"].forEach(id=>$(id).addEventListener(id==="searchInput"?"input":"change",renderTasks));

function openModal(task=null) {
  $("taskForm").reset();
  $("taskId").value=task?.id||"";
  $("titleInput").value=task?.title||"";
  $("descriptionInput").value=task?.description||"";
  $("priorityInput").value=task?.priority||"Medium";
  $("dueDateInput").value=task?.dueDate||today();
  $("statusInput").value=task?.status||"Pending";
  $("modalTitle").textContent=task?"Edit task":"Add a new task";
  $("taskModal").classList.remove("hidden");
  setTimeout(()=>$("titleInput").focus(),30);
}
function closeModal() { $("taskModal").classList.add("hidden"); }
$("taskForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=$("taskId").value;
  const existing=tasks.find(t=>t.id===id);
  const task={
    id:id||((crypto.randomUUID&&crypto.randomUUID())||String(Date.now())),
    title:$("titleInput").value.trim(),
    description:$("descriptionInput").value.trim(),
    priority:$("priorityInput").value,
    dueDate:$("dueDateInput").value,
    status:$("statusInput").value,
    createdAt:existing?.createdAt||Date.now(),
    updatedAt:Date.now()
  };
  if(!task.title){showToast("Please enter a task title.");return;}
  if(id) tasks=tasks.map(t=>t.id===id?task:t); else tasks.push(task);
  saveTasks();closeModal();renderAll();showToast(id?"Task updated successfully":"Task added successfully");
});
function editTask(id) { const task=tasks.find(t=>t.id===id); if(task)openModal(task); }
function deleteTask(id) {
  const task=tasks.find(t=>t.id===id);
  if(!task)return;
  if(!confirm(`Delete "${task.title}"? This cannot be undone.`))return;
  tasks=tasks.filter(t=>t.id!==id);saveTasks();renderAll();showToast("Task deleted");
}
function toggleComplete(id) {
  tasks=tasks.map(t=>t.id===id?{...t,status:t.status==="Completed"?"Pending":"Completed",updatedAt:Date.now()}:t);
  saveTasks();renderAll();showToast("Task status updated");
}
function taskRow(task,showActions=true) {
  return `<tr>
    <td><div class="task-name">${escapeHTML(task.title)}</div>${task.description?`<div class="task-description">${escapeHTML(task.description)}</div>`:""}</td>
    <td><span class="priority ${task.priority}">${task.priority}</span></td>
    <td>${formatDate(task.dueDate)}
     ${deadlineBadge(task)}
     </td>
    <td><span class="status ${statusClass(task.status)} ${isOverdue(task)?"overdue":""}">${isOverdue(task)?"Overdue":task.status}</span></td>
    ${showActions?`<td><div class="actions"><button class="icon-btn" title="${task.status==="Completed"?"Mark pending":"Mark completed"}" onclick="toggleComplete('${task.id}')">${task.status==="Completed"?"↶":"✓"}</button><button class="icon-btn" title="Edit task" onclick="editTask('${task.id}')">✎</button><button class="icon-btn delete" title="Delete task" onclick="deleteTask('${task.id}')">×</button></div></td>`:""}
  </tr>`;
}
function tableHTML(list,showActions=true) {
  if(!list.length)return `<div class="empty-state"><div class="empty-icon">✦</div><strong>Nothing here just yet</strong><p>Add a task and it will show up here.</p></div>`;
  return `<div style="overflow-x:auto"><table class="task-table"><thead><tr><th>Task</th><th>Priority</th><th>Due date</th><th>Status</th>${showActions?"<th>Actions</th>":""}</tr></thead><tbody>${list.map(t=>taskRow(t,showActions)).join("")}</tbody></table></div>`;
}
function renderTasks() {
  const query=$("searchInput").value.trim().toLowerCase();
  const priority=$("priorityFilter").value,status=$("statusFilter").value;
  const filtered=tasks.filter(t=>(t.title+" "+t.description).toLowerCase().includes(query)&&(priority==="all"||t.priority===priority)&&(status==="all"||t.status===status)).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  $("taskResultCount").textContent=`${filtered.length} task${filtered.length===1?"":"s"}`;
  $("taskList").innerHTML=tableHTML(filtered);
}
function renderCompleted() {
  const completed=tasks.filter(t=>t.status==="Completed").sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  $("completedList").innerHTML=tableHTML(completed);
}
function renderUpcoming() {
  const upcoming=tasks.filter(t=>t.status!=="Completed").sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,5);
  $("upcomingList").innerHTML=upcoming.length?upcoming.map(t=>`<div class="upcoming-item"><i class="deadline-dot" style="background:${t.priority==="High"?"#e45d66":t.priority==="Medium"?"#e9a23b":"#1ca779"}"></i><div><div class="upcoming-title">${escapeHTML(t.title)}</div><div class="upcoming-date">${getDeadlineLabel(t)} · ${formatDate(t.dueDate)}</div></div><span class="priority ${t.priority}">${t.priority}</span></div>`).join(""):`<div class="empty-state"><div class="empty-icon">✓</div><strong>You're all caught up!</strong><p>Add a task whenever something new comes up.</p></div>`;
}
function renderRecent() {
  const recent=[...tasks].sort((a,b)=>b.createdAt-a.createdAt).slice(0,4);
  $("recentList").innerHTML=tableHTML(recent);
}
function renderDashboard() {
  const total=tasks.length,completed=tasks.filter(t=>t.status==="Completed").length,pending=tasks.filter(t=>t.status!=="Completed").length,overdue=tasks.filter(isOverdue).length;
  const percent=total?Math.round(completed/total*100):0;
  $("totalCount").textContent=total;$("pendingCount").textContent=pending;$("completedCount").textContent=completed;$("overdueCount").textContent=overdue;
  $("progressPercent").textContent=percent+"%";$("progressRing").style.background=`conic-gradient(var(--blue) ${percent}%,#edf0f7 ${percent}%)`;
  $("progressSummary").textContent=`${completed} of ${total} tasks`;$("progressBar").style.width=percent+"%";$("progressTrack").setAttribute("aria-valuenow", percent);
  renderUpcoming();renderRecent();
}
function renderAll(){renderDashboard();renderTasks();renderCompleted();}
renderAll();
const themeToggle = document.getElementById("themeToggle");

// Load the saved theme
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
  themeToggle.textContent = "☀️ Light Mode";
}

// Toggle between light and dark mode
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  const isDarkMode =
    document.body.classList.contains("dark-mode");

  localStorage.setItem(
    "theme",
    isDarkMode ? "dark" : "light"
  );

  themeToggle.textContent = isDarkMode
    ? "☀️ Light Mode"
    : "🌙 Dark Mode";
});