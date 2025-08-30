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

// =============== TAB & SWIPE NAVIGATION ===============
const tabsWrapper = document.getElementById('tabsWrapper');
const navList = document.getElementById('navList');
const navForm = document.getElementById('navForm');
let isDragging = false;
let startX, startTranslateX = 0;

function goToTab(tabIndex) {
  startTranslateX = -tabIndex * 50;
  tabsWrapper.style.transform = `translateX(${startTranslateX}%)`;

  if (tabIndex === 0) {
    navList.classList.add('nav-active');
    navForm.classList.remove('nav-active');
  } else {
    navList.classList.remove('nav-active');
    navForm.classList.add('nav-active');
  }
}

navList.addEventListener('click', () => goToTab(0));
navForm.addEventListener('click', () => goToTab(1));

tabsWrapper.addEventListener('touchstart', (e) => {
  isDragging = true;
  startX = e.touches[0].clientX;
}, { passive: true });

tabsWrapper.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  const currentX = e.touches[0].clientX;
  const diff = currentX - startX;
  const movePercent = (diff / window.innerWidth) * 100;
  const translateX = startTranslateX + movePercent;

  if ((startTranslateX === 0 && diff < 0) || (startTranslateX === -50 && diff > 0)) {
    tabsWrapper.style.transform = `translateX(${translateX}%)`;
  }
}, { passive: true });

tabsWrapper.addEventListener('touchend', () => {
  if (!isDragging) return;
  isDragging = false;

  const currentX = startTranslateX * -1;
  const endX = tabsWrapper.getBoundingClientRect().x;
  const threshold = 15;

  if (currentX === 0 && endX < -threshold) {
    goToTab(1);
  } else if (currentX === 50 && endX > -window.innerWidth + threshold) {
    goToTab(0);
  } else {
    goToTab(currentX === 0 ? 0 : 1);
  }
});

// Default ke tab "Buat"
goToTab(1);