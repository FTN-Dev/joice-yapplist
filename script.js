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

// ----------------- CUSTOM AUTH SYSTEM -----------------
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

// Custom Register Function
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authMsg.textContent = '';
  authMsg.style.color = '';
  
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  
  if (password.length < 6) {
    authMsg.textContent = "Password minimal 6 karakter!";
    authMsg.style.color = "#ff6b6b";
    return;
  }
  
  try {
    console.log('Registering user:', email);
    
    // Cek apakah email sudah terdaftar
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();
    
    if (checkError) {
      console.error('Check error:', checkError);
    }
    
    if (existingUser) {
      authMsg.textContent = "Email sudah terdaftar!";
      authMsg.style.color = "#ff6b6b";
      return;
    }
    
    // Register user baru (password disimpan plain text - HANYA UNTUK BELAJAR!)
    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        email, 
        password // PERHATIAN: Password disimpan plain text!
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('Register success:', data);
    
    // Auto login setelah register
    currentUser = data;
    localStorage.setItem('yapp_user', JSON.stringify(data));
    
    authMsg.textContent = "Pendaftaran berhasil! Anda langsung login.";
    authMsg.style.color = "#34d399";
    
    // Tampilkan main app setelah 1 detik
    setTimeout(() => {
      showMain(currentUser);
    }, 1000);
    
  } catch (err) {
    console.error('Register error:', err);
    authMsg.textContent = "Error: " + (err.message || String(err));
    authMsg.style.color = "#ff6b6b";
  }
});

// Custom Login Function
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authMsg.textContent = '';
  authMsg.style.color = '';
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    console.log('Attempting login:', email);
    
    // Cari user di database
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password) // PERHATIAN: Password dibandingkan plain text!
      .maybeSingle();
    
    if (error) {
      console.error('Login query error:', error);
      throw new Error("Error sistem. Coba lagi.");
    }
    
    if (!data) {
      throw new Error("Email atau password salah!");
    }
    
    console.log('Login successful:', data);
    
    // Simpan user di localStorage dan state
    currentUser = data;
    localStorage.setItem('yapp_user', JSON.stringify(data));
    
    authMsg.textContent = "Login berhasil!";
    authMsg.style.color = "#34d399";
    
    // Tampilkan main app
    showMain(currentUser);
    
  } catch (err) {
    console.error('Login failed:', err);
    authMsg.textContent = "Login gagal: " + err.message;
    authMsg.style.color = "#ff6b6b";
  }
});

// Custom Logout
btnSignOut.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('yapp_user');
  showAuth();
});

// Check if user is logged in from localStorage
function checkStoredUser() {
  const storedUser = localStorage.getItem('yapp_user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      currentUser = user;
      showMain(user);
      return true;
    } catch (e) {
      console.error('Error parsing stored user:', e);
      localStorage.removeItem('yapp_user');
    }
  }
  return false;
}

// Initialize session
(function initSession() {
  if (!checkStoredUser()) {
    showAuth();
  }
})();

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
      .insert([{ 
        title, 
        notes, 
        priority, 
        assigner, 
        shared_id: 'shared', 
        checked: false, 
        user_id: currentUser.id 
      }])
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
    <div class="task-item-header">
      <h3>${escapeHtml(task.title)}</h3>
      <div class="priority">Prioritas: <strong>${escapeHtml(task.priority || '')}</strong></div>
    </div>

    ${task.notes ? `
      <div class="task-item-body">
        <div class="notes"><p>${escapeHtml(task.notes).replace(/\n/g, '<br>')}</p></div>
        <div class="assigner">Dibuat Oleh: ${escapeHtml(task.assigner || '')}</div>
      </div>
      ` : `
      <div class="task-item-body">
        <div class="assigner">Dibuat Oleh: ${escapeHtml(task.assigner || '')}</div>
      </div>
      `}

      <div class="task-item-footer">
        <label>
        <input type="checkbox" class="check-btn" data-id="${task.id}" ${task.checked ? 'checked' : ''}>
        Selesai
        </label>
        <button class="delete-btn" data-id="${task.id}">Hapus</button>
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

// ----------------- HELPER FUNCTIONS -----------------
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

// ----------------- Lupa Password Feature -----------------
function addForgotPasswordLink() {
  const link = document.createElement('a');
  link.href = '#';
  link.textContent = 'Lupa password?';
  link.style.cssText = 'display: block; margin-top: 10px; font-size: 13px; color: var(--accent); cursor: pointer;';
  
  link.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = prompt('Masukkan email Anda:');
    if (!email) return;
    
    try {
      // Cari user berdasarkan email
      const { data: user, error } = await supabase
        .from('users')
        .select('password')
        .eq('email', email)
        .maybeSingle();
      
      if (error) throw error;
      
      if (user) {
        alert(`Password Anda: ${user.password}\n\nPERINGATAN: Sistem ini menyimpan password plain text. Hanya untuk belajar!`);
      } else {
        alert('Email tidak ditemukan!');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Terjadi error: ' + err.message);
    }
  });
  
  loginForm.appendChild(link);
}

// Initialize
document.addEventListener('DOMContentLoaded', addForgotPasswordLink);

// ----------------- PWA + NOTIFIKASI REALTIME -----------------
async function requestNotificationPermission() {
  if (Notification.permission === "granted") return;
  const result = await Notification.requestPermission();
  if (result !== "granted") {
    console.warn("Izin notifikasi ditolak oleh user");
  }
}

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

// Request notification permission saat login
if (currentUser) {
  requestNotificationPermission();
  setupRealtimeNotifications();
}