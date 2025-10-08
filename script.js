// ----------------- SUPABASE CONFIG -----------------
const SUPABASE_URL = "https://omhfxjvkfboxosgckxdk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taGZ4anZrZmJveG9zZ2NreGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MjEyNTYsImV4cCI6MjA3NTM5NzI1Nn0.LavHN4mkp6h8yKMjOzLUtzk1yxy33FEJ8g6Z8Lpxeio";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ----------------- DOM -----------------
const authContainer = document.getElementById('authContainer');
const mainContainer = document.getElementById('mainContainer');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const toggleAuthLink = document.getElementById('toggleAuthLink');
const authToggleText = document.getElementById('authToggleText');
const authMsg = document.getElementById('authMsg');
const userEmailEl = document.getElementById('userEmail');
const btnSignOut = document.getElementById('btnSignOut');
const todoForm = document.getElementById('todoForm');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const listTab = document.getElementById('listTab');
const formTab = document.getElementById('formTab');
const navList = document.getElementById('navList');
const navForm = document.getElementById('navForm');

// === FIX VIEWPORT HEIGHT ISSUE ON MOBILE ===
function updateViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', updateViewportHeight);
window.addEventListener('orientationchange', updateViewportHeight);
window.addEventListener('load', updateViewportHeight);
updateViewportHeight();

// Dropdown
const dropdown = document.getElementById('priorityDropdown');
const dropdownHeader = document.getElementById('dropdownHeader');
const dropdownList = document.getElementById('dropdownList');
const dropdownIcon = document.getElementById('dropdownIcon');
const dropdownText = document.getElementById('dropdownText');
const hiddenPriorityInput = document.getElementById('priority');

let isOpen = false;
let tasks = [];
let currentUser = null;

// ----------------- AUTH -----------------
toggleAuthLink.addEventListener('click', (e) => {
  e.preventDefault();
  const onLogin = loginForm.style.display !== 'none' && !loginForm.classList.contains('hidden');
  if (onLogin) {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    authToggleText.textContent = "Sudah punya akun?";
    toggleAuthLink.textContent = "Login";
  } else {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authToggleText.textContent = "Belum punya akun?";
    toggleAuthLink.textContent = "Daftar";
  }
});

// Register
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authMsg.textContent = '';
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  try {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    authMsg.textContent = "Pendaftaran berhasil. Cek email untuk verifikasi.";
    toggleAuthLink.click();
  } catch (err) {
    authMsg.textContent = err.message || String(err);
  }
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authMsg.textContent = '';
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    authMsg.textContent = "Login berhasil!";
  } catch (err) {
    authMsg.textContent = err.message || String(err);
  }
});

// Logout
btnSignOut.addEventListener('click', async () => {
  await supabase.auth.signOut();
  showAuth();
});

// Auth state
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    currentUser = session.user;
    showMain(session.user);
  } else {
    currentUser = null;
    showAuth();
  }
});

// Session restore
(async function initSession() {
  const { data } = await supabase.auth.getSession();
  if (data?.session?.user) {
    currentUser = data.session.user;
    showMain(currentUser);
  } else {
    showAuth();
  }
})();

function showAuth() {
  authContainer.style.display = 'block';
  mainContainer.style.display = 'none';
  userEmailEl.textContent = '';
  tasks = [];
  renderTasks();
}

function showMain(user) {
  authContainer.style.display = 'none';
  mainContainer.style.display = 'block';
  userEmailEl.textContent = user.email || '';
  fetchTasks();
  goToTab(0);
}

// ----------------- TASK CRUD -----------------
async function fetchTasks() {
  try {
    const { data, error } = await supabase
      .from('yapp_tasks')
      .select('*')
      .eq('shared_id', 'shared')
      .order('created_at', { ascending: false });

    if (error) throw error;
    tasks = data || [];
    renderTasks();
  } catch (err) {
    console.error('Fetch tasks error', err);
    alert('Gagal memuat tugas: ' + (err.message || err));
  }
}

todoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return alert('Silakan login terlebih dahulu.');

  const title = document.getElementById('title').value.trim();
  const priority = hiddenPriorityInput.value;
  const notes = document.getElementById('notes').value.trim();
  const assigner = document.getElementById('assigner').value.trim();

  if (!title || !assigner) return alert("Nama Topik dan Pembuat wajib diisi!");

  try {
    const { data, error } = await supabase
      .from('yapp_tasks')
      .insert([{ title, notes, priority, assigner, shared_id: 'shared', checked: false }])
      .select();

    if (error) throw error;

    if (data?.[0]) tasks.unshift(data[0]);
    renderTasks();
    todoForm.reset();
    dropdownIcon.textContent = '🟢';
    dropdownText.textContent = 'Low';
    hiddenPriorityInput.value = 'Low';
    goToTab(0);
  } catch (err) {
    console.error('Insert task error', err);
    alert('Gagal menambah topik: ' + (err.message || err));
  }
});

async function deleteTask(taskId) {
  if (!confirm('Hapus topik ini?')) return;
  try {
    const { error } = await supabase.from('yapp_tasks').delete().eq('id', taskId);
    if (error) throw error;
    tasks = tasks.filter(t => t.id !== taskId);
    renderTasks();
  } catch (err) {
    console.error('Delete task error', err);
    alert('Gagal menghapus: ' + (err.message || err));
  }
}

async function toggleTaskCheck(taskId, checked) {
  try {
    const { error } = await supabase
      .from('yapp_tasks')
      .update({ checked })
      .eq('id', taskId);
    if (error) throw error;
    const task = tasks.find(t => t.id === taskId);
    if (task) task.checked = checked;
    renderTasks();
  } catch (err) {
    console.error('Checklist update error', err);
  }
}

// ----------------- RENDER -----------------
function renderTasks() {
  taskList.innerHTML = '';
  if (!tasks?.length) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${(task.priority || 'Low').toLowerCase()}`;
    li.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3>${escapeHtml(task.title)}</h3>
        <div class="priority">Prioritas: <strong>${escapeHtml(task.priority || '')}</strong></div>
      </div>
      ${task.notes ? `<div class="notes"><p>${escapeHtml(task.notes).replace(/\n/g, '<br>')}</p></div>` : ''}
      <div style="display:flex;justify-content:space-between;align-items:center">
        <label>
          <input type="checkbox" class="check-btn" data-id="${task.id}" ${task.checked ? 'checked' : ''}>
          Selesai
        </label>
        <div>
          <span class="assigner">Dibuat Oleh: ${escapeHtml(task.assigner || '')}</span>
          <button class="delete-btn" data-id="${task.id}">Hapus</button>
        </div>
      </div>
    `;
    taskList.appendChild(li);
  });

  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', function () {
      const id = Number(this.dataset.id);
      deleteTask(id);
    });
  });

  document.querySelectorAll('.check-btn').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      const id = Number(this.dataset.id);
      toggleTaskCheck(id, this.checked);
    });
  });
}

// ----------------- HELPERS -----------------
function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ----------------- DROPDOWN -----------------
dropdownHeader.addEventListener('click', (e) => {
  e.stopPropagation();
  isOpen = !isOpen;
  dropdownList.classList.toggle('active', isOpen);
  dropdownHeader.querySelector('.arrow').style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
});

dropdownList.addEventListener('click', (e) => {
  const target = e.target.closest('li');
  if (!target) return;
  const value = target.dataset.value;
  const icon = target.querySelector('.icon').textContent;
  dropdownIcon.textContent = icon;
  dropdownText.textContent = value;
  hiddenPriorityInput.value = value;
  isOpen = false;
  dropdownList.classList.remove('active');
  dropdownHeader.querySelector('.arrow').style.transform = 'rotate(0deg)';
});

document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target)) {
    isOpen = false;
    dropdownList.classList.remove('active');
    dropdownHeader.querySelector('.arrow').style.transform = 'rotate(0deg)';
  }
});

// ----------------- TAB NAVIGATION -----------------
function goToTab(tabIndex) {
  listTab.classList.remove('active');
  formTab.classList.remove('active');
  navList.classList.remove('nav-active');
  navForm.classList.remove('nav-active');
  if (tabIndex === 0) {
    listTab.classList.add('active');
    navList.classList.add('nav-active');
  } else {
    formTab.classList.add('active');
    navForm.classList.add('nav-active');
  }
}

navList.addEventListener('click', () => goToTab(0));
navForm.addEventListener('click', () => goToTab(1));

goToTab(0);

// ----------------- PWA + NOTIFIKASI REALTIME -----------------

// Minta izin notifikasi saat user login
async function requestNotificationPermission() {
  if (Notification.permission === "granted") return;
  const result = await Notification.requestPermission();
  if (result !== "granted") {
    console.warn("Izin notifikasi ditolak oleh user");
  }
}

// Panggil setelah login sukses
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    currentUser = session.user;
    showMain(session.user);
    requestNotificationPermission();
    setupRealtimeNotifications(); // 👈 tambahkan listener realtime di sini
  } else {
    currentUser = null;
    showAuth();
  }
});

// Setup Realtime Supabase Listener
function setupRealtimeNotifications() {
  console.log("📡 Listening for realtime task inserts...");
  supabase
    .channel("yapp_realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "yapp_tasks" },
      (payload) => {
        console.log("🆕 New task detected:", payload.new);
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "NEW_TASK",
            payload: payload.new
          });
        }
      }
    )
    .subscribe();
}
