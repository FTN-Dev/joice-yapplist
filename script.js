// Ambil elemen DOM
const todoForm = document.getElementById('todoForm');
const taskList = document.getElementById('taskList');

// Array untuk menyimpan tugas
let tasks = [];

// =============== CUSTOM DROPDOWN UNTUK PRIORITAS ===============
const dropdown = document.getElementById('priorityDropdown');
const dropdownHeader = document.querySelector('.dropdown-header');
const dropdownList = document.getElementById('dropdownList');
const dropdownIcon = document.getElementById('dropdownIcon');
const dropdownText = document.getElementById('dropdownText');
const hiddenPriorityInput = document.getElementById('priority');

let isOpen = false;

// Toggle dropdown saat header diklik
dropdownHeader.addEventListener('click', (e) => {
  e.stopPropagation();
  isOpen = !isOpen;
  dropdownList.classList.toggle('active', isOpen);
  dropdownHeader.querySelector('.arrow').style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
});

// Pilih prioritas dari list
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

// Tutup dropdown jika klik di luar
document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target)) {
    isOpen = false;
    dropdownList.classList.remove('active');
    dropdownHeader.querySelector('.arrow').style.transform = 'rotate(0deg)';
  }
});

// =============== FORM SUBMIT & RENDER TASK ===============
todoForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const priority = hiddenPriorityInput.value;
  const notes = document.getElementById('notes').value.trim();
  const assigner = document.getElementById('assigner').value.trim();

  if (!title || !assigner) return alert("Nama Topik dan Pembuat wajib diisi!");

  const newTask = {
    id: Date.now(),
    title,
    priority,
    notes,
    assigner
  };

  tasks.push(newTask);
  renderTasks();
  todoForm.reset();

  // Reset dropdown ke Low
  dropdownIcon.textContent = '🟢';
  dropdownText.textContent = 'Low';
  hiddenPriorityInput.value = 'Low';
  dropdownList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
  dropdownList.querySelector('li[data-value="Low"]').classList.add('active');
});

// Render daftar tugas
function renderTasks() {
  taskList.innerHTML = '';

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${task.priority.toLowerCase()}`;
    
    li.innerHTML = `
      <h3>${task.title}</h3>
      <div class="priority">Prioritas: <strong>${task.priority}</strong></div>
      ${task.notes ? `
        <div class="notes">
          <p>${task.notes.replace(/\n/g, '<br>')}</p>
        </div>
      ` : ''}
      <div class="assigner">Dibuat Oleh: ${task.assigner}</div>
      <button class="delete-btn" data-id="${task.id}">Hapus</button>
    `;

    taskList.appendChild(li);
  });

  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', function () {
      const taskId = Number(this.getAttribute('data-id'));
      tasks = tasks.filter(t => t.id !== taskId);
      renderTasks();
    });
  });
}

// Inisialisasi dropdown
document.addEventListener('DOMContentLoaded', () => {
  const defaultItem = dropdownList.querySelector('li[data-value="Low"]');
  defaultItem.classList.add('active');
});

// =============== TAB NAVIGATION (FIXED: no transform, no jump) ===============
const listTab = document.getElementById('listTab');
const formTab = document.getElementById('formTab');
const navList = document.getElementById('navList');
const navForm = document.getElementById('navForm');

function goToTab(tabIndex) {
  // Sembunyikan semua tab
  listTab.classList.remove('active');
  formTab.classList.remove('active');

  // Aktifkan tab yang dipilih
  if (tabIndex === 0) {
    listTab.classList.add('active');
    navList.classList.add('nav-active');
    navForm.classList.remove('nav-active');
  } else {
    formTab.classList.add('active');
    navList.classList.remove('nav-active');
    navForm.classList.add('nav-active');
  }
}

// Klik tombol bawah
navList.addEventListener('click', () => goToTab(0));
navForm.addEventListener('click', () => goToTab(1));

// Swipe Detection (optional, tapi tidak ganggu textarea)
let isDragging = false;
let startX = 0;
let currentTab = 1; // default ke "Buat"

document.addEventListener('touchstart', (e) => {
  if (e.target.closest('.tab') || e.target.closest('form')) {
    isDragging = true;
    startX = e.touches[0].clientX;
  }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  e.preventDefault(); // Cegah scroll saat swipe
}, { passive: false });

document.addEventListener('touchend', (e) => {
  if (!isDragging) return;
  isDragging = false;

  const endX = e.changedTouches[0].clientX;
  const diff = startX - endX;

  const threshold = 50;

  if (diff > threshold && currentTab === 1) {
    goToTab(0);
    currentTab = 0;
  } else if (diff < -threshold && currentTab === 0) {
    goToTab(1);
    currentTab = 1;
  }
});

// Inisialisasi: default ke tab "Buat"
goToTab(1);