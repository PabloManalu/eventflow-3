const AppState = {
    user: null,
    token: null,
    activeEventId: null,
    currentView: 'dashboard',
    darkTheme: false
};

document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
});

function checkAuthStatus() {
    const token = localStorage.getItem('ef_token');
    const user = localStorage.getItem('ef_user');

    if (token && user) {
        AppState.token = token;
        AppState.user = JSON.parse(user);
        document.getElementById('auth-overlay').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        
        document.getElementById('user-name').textContent = AppState.user.name;
        document.getElementById('user-email').textContent = AppState.user.email;
        if(AppState.user.avatar) document.getElementById('user-avatar').src = AppState.user.avatar;

        loadEvents();
    } else {
        document.getElementById('auth-overlay').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    }
}

// Fungsi untuk menampilkan box pesan error di form auth
function showAuthError(message) {
    const errorBox = document.getElementById('auth-error-msg');
    const errorText = document.getElementById('auth-error-text');
    if (errorBox && errorText) {
        if (message) {
            errorText.textContent = message;
            errorBox.classList.remove('hidden');
        } else {
            errorBox.classList.add('hidden');
        }
    }
}

// Fungsi animasi loading pada tombol
function setButtonLoading(buttonId, isLoading, defaultText) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-sm"></i><span>Processing...</span>`;
    } else {
        btn.disabled = false;
        btn.innerHTML = `<span>${defaultText}</span>`;
    }
}

function setupEventListeners() {
    // Auth Switch (Login <-> Register)
    let isRegistering = false;
    const switchBtn = document.getElementById('auth-switch-btn');
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            isRegistering = !isRegistering;
            showAuthError(null); // Bersihkan error saat pindah form

            if (isRegistering) {
                document.getElementById('form-login').classList.add('hidden');
                document.getElementById('form-register').classList.remove('hidden');
                document.getElementById('auth-title').textContent = 'Create Account';
                document.getElementById('auth-subtitle').textContent = 'Join EventFlow today';
                document.getElementById('auth-switch-text').textContent = 'Already have an account?';
                switchBtn.textContent = 'Sign In';
            } else {
                document.getElementById('form-register').classList.add('hidden');
                document.getElementById('form-login').classList.remove('hidden');
                document.getElementById('auth-title').textContent = 'Welcome to EventFlow';
                document.getElementById('auth-subtitle').textContent = 'Sign in to manage your campus events';
                document.getElementById('auth-switch-text').textContent = "Don't have an account?";
                switchBtn.textContent = 'Register';
            }
        });
    }

    // Login Form Submit
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            showAuthError(null);
            setButtonLoading('btn-login', true, 'Sign In');

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || 'Email atau password salah.');
                }

                localStorage.setItem('ef_token', data.token);
                localStorage.setItem('ef_user', JSON.stringify(data.user));
                showToast('Login berhasil', 'success');
                checkAuthStatus();
            } catch (err) {
                showAuthError(err.message);
                showToast(err.message, 'error');
            } finally {
                setButtonLoading('btn-login', false, 'Sign In');
            }
        });
    }

    // Register Form Submit
    const formRegister = document.getElementById('form-register');
    if (formRegister) {
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            showAuthError(null);
            setButtonLoading('btn-register', true, 'Create Account');

            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || 'Gagal mendaftar.');
                }

                showToast('Registrasi berhasil! Silakan masuk.', 'success');
                switchBtn.click();
            } catch (err) {
                showAuthError(err.message);
                showToast(err.message, 'error');
            } finally {
                setButtonLoading('btn-register', false, 'Create Account');
            }
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('ef_token');
            localStorage.removeItem('ef_user');
            checkAuthStatus();
        });
    }

    // Navigation Views
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.getAttribute('data-view')));
    });

    // Active Event Selector
    const activeEventSelect = document.getElementById('active-event-select');
    if (activeEventSelect) {
        activeEventSelect.addEventListener('change', (e) => {
            AppState.activeEventId = e.target.value;
            renderAll();
        });
    }

    // Modal Triggers
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) addTaskBtn.addEventListener('click', () => openModal('modal-task'));
    const quickAddTaskBtn = document.getElementById('quick-create-task-btn');
    if (quickAddTaskBtn) quickAddTaskBtn.addEventListener('click', () => openModal('modal-task'));
    const addPropBtn = document.getElementById('add-proposal-btn');
    if (addPropBtn) addPropBtn.addEventListener('click', () => openModal('modal-proposal'));
    const createEvtBtn = document.getElementById('create-event-btn');
    if (createEvtBtn) createEvtBtn.addEventListener('click', () => openModal('modal-event'));
    const addBdgBtn = document.getElementById('add-budget-btn');
    if (addBdgBtn) addBdgBtn.addEventListener('click', () => openModal('modal-budget'));

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    // Modal Form Submissions
    const formTask = document.getElementById('form-task');
    if (formTask) formTask.addEventListener('submit', handleTaskSubmit);
    const formProp = document.getElementById('form-proposal');
    if (formProp) formProp.addEventListener('submit', handleProposalSubmit);
    const formEvt = document.getElementById('form-event');
    if (formEvt) formEvt.addEventListener('submit', handleEventSubmit);
    const formBdg = document.getElementById('form-budget');
    if (formBdg) formBdg.addEventListener('submit', handleBudgetSubmit);

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            AppState.darkTheme = !AppState.darkTheme;
            document.documentElement.classList.toggle('dark', AppState.darkTheme);
        });
    }
}

function switchView(viewName) {
    AppState.currentView = viewName;
    ['dashboard', 'tasks', 'proposals', 'budget', 'events'].forEach(v => {
        const sec = document.getElementById(`view-${v}`);
        if (sec) {
            sec.classList.add('hidden');
            sec.classList.remove('animate-fade-in'); // Reset animasi
        }
    });

    const activeSec = document.getElementById(`view-${viewName}`);
    if (activeSec) {
        activeSec.classList.remove('hidden');
        // Tambahkan class animasi agar konten muncul secara halus
        activeSec.classList.add('animate-fade-in');
    }

    document.querySelectorAll('.nav-item').forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.className = 'nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-white bg-indigo-600 shadow-md shadow-indigo-600/30';
        } else {
            btn.className = 'nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-800 text-slate-400 hover:text-white';
        }
    });

    const titleElem = document.getElementById('view-title');
    if (titleElem) titleElem.textContent = viewName.toUpperCase();
}

async function loadEvents() {
    try {
        const res = await fetch('/api/events');
        const events = await res.json();
        
        const select = document.getElementById('active-event-select');
        select.innerHTML = '';

        if (events.length > 0) {
            events.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.id;
                opt.textContent = e.title;
                select.appendChild(opt);
            });
            if (!AppState.activeEventId) AppState.activeEventId = events[0].id;
            select.value = AppState.activeEventId;
        }

        renderEvents(events);
        renderAll();
    } catch (err) {
        showToast('Gagal memuat events', 'error');
    }
}

function renderAll() {
    if (!AppState.activeEventId) return;
    renderDashboard();
    renderTasks();
    renderProposals();
    renderBudget();
}

async function renderDashboard() {
    try {
        const res = await fetch('/api/events');
        const events = await res.json();
        const evt = events.find(e => e.id == AppState.activeEventId);
        if (evt) {
            document.getElementById('dash-event-title').textContent = evt.title;
            document.getElementById('dash-event-desc').textContent = evt.description || '';
            document.getElementById('dash-target-attendees').textContent = evt.target_attendees;
            document.getElementById('event-subtitle').textContent = evt.title;
        }
    } catch(e) {}
}

// 1. RENDER TASKS BOARD
async function renderTasks() {
    try {
        const res = await fetch(`/api/tasks?event_id=${AppState.activeEventId}`);
        const tasks = await res.json();

        ['todo', 'in_progress', 'completed'].forEach(s => {
            const container = document.getElementById(`col-${s}`);
            if (!container) return;
            container.innerHTML = '';
            const filtered = tasks.filter(t => t.status === s);

            if (filtered.length === 0) {
                container.innerHTML = `<p class="text-xs text-slate-400 italic text-center py-4">Belum ada task</p>`;
                return;
            }

            filtered.forEach(t => {
                const card = document.createElement('div');
                card.className = 'bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2 card-hover-effect';
                card.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">${t.priority}</span>
                        <div class="flex items-center gap-1">
                            <button onclick="openEditTaskModal(${t.id}, '${escapeHtml(t.title)}', '${escapeHtml(t.description || '')}', '${t.priority}', '${t.status}', '${t.due_date || ''}')" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs p-1" title="Edit Task">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button onclick="deleteTask(${t.id})" class="text-rose-500 hover:text-rose-700 text-xs p-1" title="Delete Task">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <h4 class="font-bold text-sm text-slate-800 dark:text-white">${escapeHtml(t.title)}</h4>
                    <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">${escapeHtml(t.description || 'Tidak ada deskripsi')}</p>
                    <div class="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span><i class="fa-regular fa-clock mr-1"></i> ${t.due_date || 'Tanpa deadline'}</span>
                    </div>
                `;
                container.appendChild(card);
            });
        });

        const done = tasks.filter(t => t.status === 'completed').length;
        const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
        const statProg = document.getElementById('stat-progress-pct');
        if (statProg) statProg.textContent = `${pct}%`;
    } catch(e) {
        console.error(e);
    }
}

// Membuka modal untuk membuat task baru
function openTaskModal() {
    if (!AppState.activeEventId) {
        showToast('Pilih atau buat Event terlebih dahulu!', 'error');
        return;
    }
    document.getElementById('form-task').reset();
    document.getElementById('task-id').value = ''; // Kosongkan ID (tanda buat baru)
    openModal('modal-task');
}

// Membuka modal dengan data task yang sudah ada untuk diedit
function openEditTaskModal(id, title, description, priority, status, dueDate) {
    if (!AppState.activeEventId) return;
    
    document.getElementById('task-id').value = id;
    document.getElementById('task-title-input').value = title;
    document.getElementById('task-desc-input').value = description;
    document.getElementById('task-priority-input').value = priority;
    document.getElementById('task-status-input').value = status;
    document.getElementById('task-date-input').value = dueDate && dueDate !== 'null' ? dueDate : '';
    
    openModal('modal-task');
}

// Handler Submit yang mendukung Create & Update (PUT)
async function handleTaskSubmit(e) {
    e.preventDefault();
    if (!AppState.activeEventId) return;

    const taskId = document.getElementById('task-id').value;
    const body = {
        event_id: AppState.activeEventId,
        title: document.getElementById('task-title-input').value,
        description: document.getElementById('task-desc-input').value,
        priority: document.getElementById('task-priority-input').value,
        status: document.getElementById('task-status-input').value,
        due_date: document.getElementById('task-date-input').value || null,
        assignee_id: AppState.user ? AppState.user.id : null
    };

    try {
        let url = '/api/tasks';
        let method = 'POST';

        // Jika task-id ada isinya, gunakan method PUT untuk update
        if (taskId) {
            url = `/api/tasks?id=${taskId}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menyimpan task.');

        showToast(taskId ? 'Task berhasil diperbarui!' : 'Task berhasil ditambahkan!', 'success');
        closeModals();
        renderTasks();
        renderDashboard();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteTask(id) {
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
    renderTasks();
}

// 2. RENDER PROPOSALS LIST
async function renderProposals() {
    try {
        const res = await fetch(`/api/proposals?event_id=${AppState.activeEventId}`);
        const proposals = await res.json();
        const container = document.getElementById('proposals-list-container');
        if (!container) return;
        container.innerHTML = '';

        const statProp = document.getElementById('stat-proposals-count');
        if (statProp) statProp.textContent = proposals.filter(p => p.status === 'pending').length;

        if (proposals.length === 0) {
            container.innerHTML = `<div class="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-slate-400 text-xs">Belum ada proposal diajukan untuk event ini.</div>`;
            return;
        }

        proposals.forEach(p => {
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2 card-hover-effect';
            card.innerHTML = `
                <div class="flex justify-between items-center">
                    <h3 class="font-bold text-slate-800 dark:text-white text-base">${escapeHtml(p.title)}</h3>
                    <span class="text-xs uppercase px-2.5 py-0.5 font-semibold rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">${p.status}</span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">${escapeHtml(p.description)}</p>
            `;
            container.appendChild(card);
        });
    } catch(e) {
        console.error(e);
    }
}

async function handleProposalSubmit(e) {
    e.preventDefault();
    await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event_id: AppState.activeEventId,
            submitted_by: AppState.user.id,
            title: document.getElementById('prop-title-input').value,
            description: document.getElementById('prop-desc-input').value
        })
    });
    closeModals();
    renderProposals();
}

// 3. RENDER BUDGET TABLE
async function renderBudget() {
    try {
        const res = await fetch(`/api/budget?event_id=${AppState.activeEventId}`);
        const items = await res.json();
        const tbody = document.getElementById('budget-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        let totalExpense = 0;

        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 text-xs">Belum ada data anggaran.</td></tr>`;
        } else {
            items.forEach(b => {
                if (b.type === 'expense') totalExpense += Number(b.amount);
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors";
                tr.innerHTML = `
                    <td class="p-3.5 font-semibold text-slate-800 dark:text-slate-200">${escapeHtml(b.title)}</td>
                    <td class="p-3.5"><span class="text-xs px-2 py-0.5 font-medium rounded ${b.type === 'expense' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}">${b.type.toUpperCase()}</span></td>
                    <td class="p-3.5 text-right font-bold ${b.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}">Rp ${Number(b.amount).toLocaleString('id-ID')}</td>
                    <td class="p-3.5 text-right"><button onclick="deleteBudget(${b.id})" class="text-rose-500 hover:text-rose-700 text-xs"><i class="fa-solid fa-trash"></i></button></td>
                `;
                tbody.appendChild(tr);
            });
        }

        const statSpent = document.getElementById('stat-spent-amount');
        if (statSpent) statSpent.textContent = `Rp ${totalExpense.toLocaleString('id-ID')}`;
    } catch(e) {
        console.error(e);
    }
}

async function handleBudgetSubmit(e) {
    e.preventDefault();
    await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event_id: AppState.activeEventId,
            title: document.getElementById('budget-title-input').value,
            type: document.getElementById('budget-type-input').value,
            amount: document.getElementById('budget-amount-input').value
        })
    });
    closeModals();
    renderBudget();
}

async function deleteBudget(id) {
    await fetch(`/api/budget?id=${id}`, { method: 'DELETE' });
    renderBudget();
}

// 4. RENDER ALL EVENTS GRID (Mengecek Masalah Teks Putih di Gambar)
function renderEvents(events) {
    const grid = document.getElementById('all-events-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    if (events.length === 0) {
        grid.innerHTML = `<div class="col-span-full p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-slate-400 text-xs">Belum ada event. Buat event pertama kamu!</div>`;
        return;
    }

    events.forEach(evt => {
        const isActive = evt.id == AppState.activeEventId;
        const card = document.createElement('div');
        card.className = `bg-white dark:bg-slate-800 p-5 rounded-xl border ${isActive ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-700'} shadow-sm space-y-3 card-hover-effect`;
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-indigo-600 dark:text-indigo-400"><i class="fa-regular fa-calendar mr-1"></i> ${evt.event_date || 'No Date'}</span>
                ${isActive ? `<span class="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>` : ''}
            </div>
            <div>
                <h3 class="font-bold text-lg text-slate-800 dark:text-white">${escapeHtml(evt.title)}</h3>
                <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">${escapeHtml(evt.description || 'Tidak ada deskripsi')}</p>
            </div>
            <div class="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                <span class="text-slate-500 dark:text-slate-400">Target: <strong class="text-slate-700 dark:text-slate-200">${evt.target_attendees || 0}</strong> attendees</span>
                <button onclick="selectActiveEvent(${evt.id})" class="px-3 py-1.5 font-semibold text-xs rounded-lg transition-colors ${isActive ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}">
                    ${isActive ? 'Selected' : 'Switch Context'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function handleEventSubmit(e) {
    e.preventDefault();
    await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: document.getElementById('event-title-input').value,
            description: document.getElementById('event-desc-input').value,
            target_attendees: document.getElementById('event-attendees-input').value,
            event_date: document.getElementById('event-date-input').value,
            created_by: AppState.user.id
        })
    });
    closeModals();
    loadEvents();
}

// Helpers
function openModal(id) {
    if (id === 'modal-task' && !AppState.activeEventId) {
        showToast('Pilih atau buat Event terlebih dahulu!', 'error');
        return;
    }
    const m = document.getElementById(id);
    if (m) {
        m.classList.remove('hidden');
        m.classList.add('flex');
        
        // Tambahkan efek animasi zoom-in pada dialog modal
        const dialog = m.querySelector('div');
        if (dialog) {
            dialog.classList.remove('animate-modal-pop');
            // Trigger reflow kecil agar animasi berjalan kembali jika dibuka ulang
            void dialog.offsetWidth; 
            dialog.classList.add('animate-modal-pop');
        }
    }
}

function closeModals() {
    document.querySelectorAll('.fixed.inset-0.z-50').forEach(m => {
        if (m.id !== 'auth-overlay') m.classList.add('hidden');
    });
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const bg = type === 'error' ? 'bg-rose-600' : 'bg-emerald-600';
    toast.className = `${bg} text-white px-4 py-3 rounded-xl shadow-lg text-xs font-medium flex justify-between items-center`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Helper fungsi sanitasi HTML aman
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

// Fungsi pembantu ganti event aktif dari daftar card
function selectActiveEvent(eventId) {
    AppState.activeEventId = eventId;
    const select = document.getElementById('active-event-select');
    if (select) select.value = eventId;
    loadEvents();
    showToast('Active event switched!', 'info');
}
