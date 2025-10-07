// ----------------- SUPABASE CONFIG (ISI DENGAN MILIKMU) -----------------
const SUPABASE_URL = "https://omhfxjvkfboxosgckxdk.supabase.co";   // <-- ganti
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taGZ4anZrZmJveG9zZ2NreGRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MjEyNTYsImV4cCI6MjA3NTM5NzI1Nn0.LavHN4mkp6h8yKMjOzLUtzk1yxy33FEJ8g6Z8Lpxeio";            // <-- ganti

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

// ----------------- AUTH UI / HANDLERS -----------------
toggleAuthLink.addEventListener('click', (e) => {
  e.preventDefault();
  const onLogin = loginForm.style.display !== 'none' && !loginForm.classList.contains('hidden');
  if (onLogin) {
    // show register
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    authToggleText.textContent = "Sudah punya akun?";
    toggleAuthLink.textContent = "Login";
  } else {
    // show login
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
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    authMsg.textContent = "Pendaftaran berhasil. Cek email untuk verifikasi (jika aktif). Silakan login.";
    // switch to login form
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // login success — UI akan di-handle oleh onAuthStateChange listener
    authMsg.textContent = "Login berhasil!";
  } catch (err) {
    authMsg.textContent = err.message || String(err);
  }
});

// Sign out
btnSignOut.addEventListener('click', async () => {
  await supabase.auth.signOut();
  showAuth();
});

// Listen to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (session && session.user) {
    currentUser = session.user;
    showMain(session.user);
  } else {
    currentUser = null;
    showAuth();
  }
});

// Try to restore session on load
(async function initSession(){
  const { data } = await supabase.auth.getSession();
  if (data && data.session && data.session.user) {
    currentUser = data.session.user;
    showMain(currentUser);
  } else {
    showAuth();
  }
})();

function showAuth(){
  authContainer.style.display = 'block';
  mainContainer.style.display = 'none';
  userEmailEl.textContent = '';
  tasks = [];
  renderTasks();
}

function showMain(user){
  authContainer.style.display = 'none';
  mainContainer.style.display = 'block';
  userEmailEl.textContent = user.email || user.user_metadata?.email || '';
  // load tasks
  fetchTasks();
  goToTab(0); // default to daftar
}

// ----------------- TASK CRUD (Supabase) -----------------
async function fetchTasks(){
  if (!currentUser) return;
  try {
    const userId = currentUser.id;
    const { data, error } = await supabase
      .from('yapp_tasks')
      .select('*')
      .eq('user_id', userId)
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
    const userId = currentUser.id;
    const { data, error } = await supabase
      .from('yapp_tasks')
      .insert([{ user_id: userId, title, notes, priority, assigner }])
      .select(); // return inserted row(s)

    if (error) throw error;
    // append to tasks and render
    if (data && data[0]) {
      tasks.unshift(data[0]);
    }
    renderTasks();
    todoForm.reset();
    // reset dropdown to Low
    dropdownIcon.textContent = '🟢';
    dropdownText.textContent = 'Low';
    hiddenPriorityInput.value = 'Low';
    dropdownList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
    dropdownList.querySelector('li[data-value="Low"]').classList.add('active');
    goToTab(0);
  } catch (err) {
    console.error('Insert task error', err);
    alert('Gagal menambah topik: ' + (err.message || err));
  }
});

async function deleteTask(taskId){
  if (!confirm('Hapus topik ini?')) return;
  try {
    const { error } = await supabase
      .from('yapp_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
    tasks = tasks.filter(t => t.id !== taskId);
    renderTasks();
  } catch (err) {
    console.error('Delete task error', err);
    alert('Gagal menghapus: ' + (err.message || err));
  }
}

// Render tasks to DOM
function renderTasks(){
  taskList.innerHTML = '';
  if (!tasks || tasks.length === 0) {
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
        <div class="assigner">Dibuat Oleh: ${escapeHtml(task.assigner || '')}</div>
        <button class="delete-btn" data-id="${task.id}">Hapus</button>
      </div>
    `;
    taskList.appendChild(li);
  });

  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', function () {
      const taskId = Number(this.getAttribute('data-id'));
      deleteTask(taskId);
    });
  });
}

// small helper to escape HTML
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
  const value = target.getAttribute('data-value');
  const icon = target.querySelector('.icon').textContent;
  dropdownIcon.textContent = icon;
  dropdownText.textContent = value;
  hiddenPriorityInput.value = value;
  isOpen = false;
  dropdownList.classList.remove('active');
  dropdownHeader.querySelector('.arrow').style.transform = 'rotate(0deg)';
  dropdownList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
  target.classList.add('active');
});

document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target)) {
    isOpen = false;
    dropdownList.classList.remove('active');
    dropdownHeader.querySelector('.arrow').style.transform = 'rotate(0deg)';
  }
});

// init default active item
document.addEventListener('DOMContentLoaded', () => {
  const defaultItem = document.querySelector('li[data-value="Low"]');
  if (defaultItem) defaultItem.classList.add('active');
});

// ----------------- TAB NAVIGATION -----------------
function goToTab(tabIndex){
  // 0 => daftar, 1 => buat
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

// Optional: simple swipe detection for mobile
let isDragging = false;
let startX = 0;
let currentTab = 0;

document.addEventListener('touchstart', (e) => {
  if (e.target.closest('.tab') || e.target.closest('form')) {
    isDragging = true;
    startX = e.touches[0].clientX;
  }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', (e) => {
  if (!isDragging) return;
  isDragging = false;
  const endX = e.changedTouches[0].clientX;
  const diff = startX - endX;
  const threshold = 50;
  if (diff > threshold) {
    // swipe left
    if (currentTab === 0) { goToTab(1); currentTab = 1; }
  } else if (diff < -threshold) {
    // swipe right
    if (currentTab === 1) { goToTab(0); currentTab = 0; }
  }
});

// initialize default
goToTab(0);
