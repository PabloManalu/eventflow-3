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

function setupEventListeners() {
    // Auth Switch
    let isRegistering = false;
    document.getElementById('auth-switch-btn').addEventListener('click', () => {
        isRegistering = !isRegistering;
        if (isRegistering) {
            document.getElementById('form-login').classList.add('hidden');
            document.getElementById('form-register').classList.remove('hidden');
            document.getElementById('auth-title').textContent = 'Create Account';
            document.getElementById('auth-subtitle').textContent = 'Join EventFlow today';
            document.getElementById('auth-switch-text').textContent = 'Already have an account?';
            document.getElementById('auth-switch-btn').textContent = 'Sign In';
        } else {
            document.getElementById('form-register').classList.add('hidden');
            document.getElementById('form-login').classList.remove('hidden');
            document.getElementById('auth-title').textContent = 'Welcome to EventFlow';
            document.getElementById('auth-subtitle').textContent = 'Sign in to manage your campus events';
            document.getElementById('auth-switch-text').textContent = "Don't have an account?";
            document.getElementById('auth-switch-btn').textContent = 'Register';
        }
    });

    // Auth Form Actions
    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            localStorage.setItem('ef_token', data.token);
            localStorage.setItem('ef_user', JSON.stringify(data.user));
            showToast('Login berhasil', 'success');
            checkAuthStatus();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    document.getElementById('form-register').addEventListener('submit', async (e) => {
        e.preventDefault();
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
            if (!res.ok) throw new Error(data.error);

            showToast('Registrasi berhasil, silakan login', 'success');
            document.getElementById('auth-switch-btn').click();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('ef_token');
        localStorage.removeItem('ef_user');
        checkAuthStatus();
    });

    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.getAttribute('data-view')));
    });

    // Event Switch
    document.getElementById('active-event-select').addEventListener('change', (e) => {
        AppState.activeEventId = e.target.value;
        renderAll();
    });

    // Modals Handlers
    document.getElementById('add-task-btn').addEventListener('click', () => openModal('modal-task'));
    document.getElementById('quick-create-task-btn').addEventListener('click', () => openModal('modal-task'));
    document.getElementById('add-proposal-btn').addEventListener('click', () => openModal('modal-proposal'));
    document.getElementById('create-event-btn').addEventListener('click', () => openModal('modal-event'));
    document.getElementById('add-budget-btn').addEventListener('click', () => openModal('modal-budget'));

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.fixed.inset-0.z-50').forEach(m => {
                if (m.id !== 'auth-overlay') m.classList.add('hidden');
            });
        });
    });

    // Form Submissions
    document.getElementById('form-task').addEventListener('submit', handleTaskSubmit);
    document.getElementById('form-proposal').addEventListener('submit', handleProposalSubmit);
    document.getElementById('form-event').addEventListener('submit', handleEventSubmit);
    document.getElementById('form-budget').addEventListener('submit', handleBudgetSubmit);

    // Theme Toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
        AppState.darkTheme = !AppState.darkTheme;
        document.documentElement.classList.toggle('dark', AppState.darkTheme);
    });
}

function switchView(viewName) {
    AppState.currentView = viewName;
    ['dashboard', 'tasks', 'proposals', 'budget', 'events'].forEach(v => {
        const sec = document.getElementById(`view-${v}`);
        if (sec) sec.classList.add('hidden');
    });
    document.getElementById(`view-${viewName}`).classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.className = 'nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-white bg-indigo-600';
        } else {
            btn.className = 'nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-800 text-slate-400 hover:text-white';
        }
    });

    document.getElementById('view-title').textContent = viewName.toUpperCase();
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
    const res = await fetch('/api/events');
    const events = await res.json();
    const evt = events.find(e => e.id == AppState.activeEventId);
    if (evt) {
        document.getElementById('dash-event-title').textContent = evt.title;
        document.getElementById('dash-event-desc').textContent = evt.description || '';
        document.getElementById('dash-target-attendees').textContent = evt.target_attendees;
        document.getElementById('event-subtitle').textContent = evt.title;
    }
}

async function renderTasks() {
    const res = await fetch(`/api/tasks?event_id=${AppState.activeEventId}`);
    const tasks = await res.json();

    ['todo', 'in_progress', 'completed'].forEach(s => {
        const container = document.getElementById(`col-${s}`);
        container.innerHTML = '';
        const filtered = tasks.filter(t => t.status === s);

        filtered.forEach(t => {
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm space-y-2';
            card.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-900 text-indigo-300">${t.priority}</span>
                    <button onclick="deleteTask(${t.id})" class="text-rose-500 text-xs"><i class="fa-solid fa-trash"></i></button>
                </div>
                <h4 class="font-bold text-sm text-white">${t.title}</h4>
                <p class="text-xs text-slate-400">${t.description || ''}</p>
            `;
            container.appendChild(card);
        });
    });

    const done = tasks.filter(t => t.status === 'completed').length;
    const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    document.getElementById('stat-progress-pct').textContent = `${pct}%`;
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    const body = {
        event_id: AppState.activeEventId,
        title: document.getElementById('task-title-input').value,
        description: document.getElementById('task-desc-input').value,
        priority: document.getElementById('task-priority-input').value,
        status: document.getElementById('task-status-input').value,
        due_date: document.getElementById('task-date-input').value,
        assignee_id: AppState.user.id
    };

    await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    closeModals();
    renderTasks();
}

async function deleteTask(id) {
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
    renderTasks();
}

async function renderProposals() {
    const res = await fetch(`/api/proposals?event_id=${AppState.activeEventId}`);
    const proposals = await res.json();
    const container = document.getElementById('proposals-list-container');
    container.innerHTML = '';

    document.getElementById('stat-proposals-count').textContent = proposals.filter(p => p.status === 'pending').length;

    proposals.forEach(p => {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-2';
        card.innerHTML = `
            <div class="flex justify-between">
                <h3 class="font-bold text-white">${p.title}</h3>
                <span class="text-xs uppercase px-2 py-0.5 rounded bg-amber-900 text-amber-300">${p.status}</span>
            </div>
            <p class="text-xs text-slate-300">${p.description}</p>
        `;
        container.appendChild(card);
    });
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

async function renderBudget() {
    const res = await fetch(`/api/budget?event_id=${AppState.activeEventId}`);
    const items = await res.json();
    const tbody = document.getElementById('budget-table-body');
    tbody.innerHTML = '';

    let totalExpense = 0;

    items.forEach(b => {
        if (b.type === 'expense') totalExpense += Number(b.amount);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="p-3 font-medium text-white">${b.title}</td>
            <td class="p-3"><span class="text-xs px-2 py-0.5 rounded ${b.type === 'expense' ? 'bg-rose-900 text-rose-300' : 'bg-emerald-900 text-emerald-300'}">${b.type}</span></td>
            <td class="p-3 text-right font-bold">Rp ${Number(b.amount).toLocaleString('id-ID')}</td>
            <td class="p-3 text-right"><button onclick="deleteBudget(${b.id})" class="text-rose-500 text-xs"><i class="fa-solid fa-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('stat-spent-amount').textContent = `Rp ${totalExpense.toLocaleString('id-ID')}`;
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

function renderEvents(events) {
    const grid = document.getElementById('all-events-grid');
    grid.innerHTML = '';
    events.forEach(evt => {
        const card = document.createElement('div');
        card.className = 'bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-3';
        card.innerHTML = `
            <h3 class="font-bold text-white text-lg">${evt.title}</h3>
            <p class="text-xs text-slate-400">${evt.description || ''}</p>
            <div class="text-xs text-indigo-400">Target: ${evt.target_attendees} attendees</div>
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
    document.getElementById(id).classList.remove('hidden');
    document.getElementById(id).classList.add('flex');
}

function closeModals() {
    document.querySelectorAll('.fixed.inset-0.z-50').forEach(m => {
        if (m.id !== 'auth-overlay') m.classList.add('hidden');
    });
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bg = type === 'error' ? 'bg-rose-600' : 'bg-emerald-600';
    toast.className = `${bg} text-white px-4 py-3 rounded-xl shadow-lg text-xs font-medium flex justify-between items-center`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}