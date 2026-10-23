/**
 * MOCK DB & LOCALSTORAGE ENGINE
 */
const DB_KEY = 'eventflow_db_v1';

const InitialSeedData = {
    profiles: [
        { id: 'usr-1', name: 'Sarah Jenkins', email: 'sarah@campus.edu', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
        { id: 'usr-2', name: 'Alex Rivera', email: 'alex@campus.edu', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
        { id: 'usr-3', name: 'Maya Lin', email: 'maya@campus.edu', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
        { id: 'usr-4', name: 'Budi Santoso', email: 'budi@campus.edu', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' }
    ],
    events: [
        {
            id: 'evt-101',
            title: 'Annual Tech Expo 2026',
            description: 'The flagship technology exhibition bringing together student developers, startups, and campus tech communities.',
            event_date: '2026-11-15',
            target_attendees: 500,
            created_at: new Date().toISOString()
        },
        {
            id: 'evt-102',
            title: 'Music & Arts Festival',
            description: 'Inter-faculty live acoustic performances, art displays, and food stalls.',
            event_date: '2026-12-05',
            target_attendees: 800,
            created_at: new Date().toISOString()
        }
    ],
    event_members: [
        { event_id: 'evt-101', user_id: 'usr-1', role: 'owner' },
        { event_id: 'evt-101', user_id: 'usr-2', role: 'admin' },
        { event_id: 'evt-101', user_id: 'usr-3', role: 'treasurer' },
        { event_id: 'evt-101', user_id: 'usr-4', role: 'member' }
    ],
    tasks: [
        {
            id: 'tsk-1',
            event_id: 'evt-101',
            title: 'Finalize Main Stage Speaker Contracts',
            description: 'Confirm keynote availability and send official invitation letters.',
            status: 'in_progress',
            priority: 'high',
            due_date: '2026-10-30',
            assignee_id: 'usr-2'
        },
        {
            id: 'tsk-2',
            event_id: 'evt-101',
            title: 'Design Social Media Promotion Banner',
            description: 'Prepare Instagram feed and story templates for early-bird registration.',
            status: 'completed',
            priority: 'medium',
            due_date: '2026-10-20',
            assignee_id: 'usr-4'
        },
        {
            id: 'tsk-3',
            event_id: 'evt-101',
            title: 'Secure Campus Main Auditorium Venue Permit',
            description: 'Submit venue request form to student affairs department.',
            status: 'todo',
            priority: 'high',
            due_date: '2026-11-01',
            assignee_id: 'usr-1'
        }
    ],
    proposals: [
        {
            id: 'prop-1',
            event_id: 'evt-101',
            submitted_by: 'usr-4',
            title: 'Add VR Gaming Zone in Exhibition Area',
            description: 'Partner with the Esports club to showcase VR headsets. Requires additional Rp 1,500,000 budget for booth equipment.',
            status: 'pending',
            response_note: '',
            created_at: new Date(Date.now() - 86400000 * 2).toISOString()
        }
    ],
    budget_items: [
        {
            id: 'bdg-1',
            event_id: 'evt-101',
            title: 'Main Hall Venue Rental',
            type: 'expense',
            amount: 5000000,
            status: 'approved'
        },
        {
            id: 'bdg-2',
            event_id: 'evt-101',
            title: 'Tech Company Title Sponsorship',
            type: 'sponsorship',
            amount: 10000000,
            status: 'received'
        }
    ]
};

class DB {
    static get() {
        const data = localStorage.getItem(DB_KEY);
        if (!data) {
            this.set(InitialSeedData);
            return InitialSeedData;
        }
        return JSON.parse(data);
    }

    static set(data) {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    }

    static query(table, filterFn) {
        const db = this.get();
        if (!db[table]) return [];
        return filterFn ? db[table].filter(filterFn) : db[table];
    }

    static insert(table, record) {
        const db = this.get();
        if (!db[table]) db[table] = [];
        record.id = record.id || 'id-' + Date.now();
        db[table].push(record);
        this.set(db);
        return record;
    }

    static update(table, id, updates) {
        const db = this.get();
        if (!db[table]) return null;
        const idx = db[table].findIndex(item => item.id === id);
        if (idx !== -1) {
            db[table][idx] = { ...db[table][idx], ...updates };
            this.set(db);
            return db[table][idx];
        }
        return null;
    }

    static delete(table, id) {
        const db = this.get();
        if (!db[table]) return;
        db[table] = db[table].filter(item => item.id !== id);
        this.set(db);
    }
}

/**
 * STATE MANAGEMENT
 */
const AppState = {
    currentUserId: 'usr-1',
    activeEventId: 'evt-101',
    simulatedRole: 'owner',
    currentView: 'dashboard',
    darkTheme: false
};

/**
 * UI CONTROLLERS
 */
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        AppState.darkTheme = true;
        document.documentElement.classList.add('dark');
    }

    setupEventListeners();
    populateActiveEventSelect();
    renderAll();
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.getAttribute('data-view'));
        });
    });

    document.querySelectorAll('[data-view-trigger]').forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.getAttribute('data-view-trigger'));
        });
    });

    document.getElementById('active-event-select').addEventListener('change', (e) => {
        AppState.activeEventId = e.target.value;
        renderAll();
        showToast('Active event switched', 'info');
    });

    document.getElementById('role-simulator-select').addEventListener('change', (e) => {
        AppState.simulatedRole = e.target.value;
        document.getElementById('role-badge').textContent = e.target.value.toUpperCase();
        renderAll();
        showToast(`Switched role simulation to: ${e.target.value}`, 'success');
    });

    document.getElementById('open-sidebar-btn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('-translate-x-full');
    });
    document.getElementById('close-sidebar-btn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('-translate-x-full');
    });

    document.getElementById('theme-toggle').addEventListener('click', () => {
        AppState.darkTheme = !AppState.darkTheme;
        document.documentElement.classList.toggle('dark', AppState.darkTheme);
    });

    document.getElementById('quick-create-task-btn').addEventListener('click', () => openTaskModal());
    document.getElementById('add-task-btn').addEventListener('click', () => openTaskModal());
    document.getElementById('quick-create-proposal-btn').addEventListener('click', () => openProposalModal());
    document.getElementById('add-proposal-btn').addEventListener('click', () => openProposalModal());
    document.getElementById('create-event-btn').addEventListener('click', () => openEventModal());
    document.getElementById('add-budget-btn').addEventListener('click', () => openBudgetModal());

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.fixed.inset-0.z-50').forEach(m => m.classList.add('hidden'));
        });
    });

    document.getElementById('form-task').addEventListener('submit', handleTaskSubmit);
    document.getElementById('form-proposal').addEventListener('submit', handleProposalSubmit);
    document.getElementById('form-event').addEventListener('submit', handleEventSubmit);
    document.getElementById('form-budget').addEventListener('submit', handleBudgetSubmit);
}

function switchView(viewName) {
    AppState.currentView = viewName;
    ['dashboard', 'tasks', 'proposals', 'budget', 'team', 'events'].forEach(v => {
        const section = document.getElementById(`view-${v}`);
        if (section) section.classList.add('hidden');
    });

    const activeSection = document.getElementById(`view-${viewName}`);
    if (activeSection) activeSection.classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.className = 'nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-white bg-indigo-600';
        } else {
            btn.className = 'nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-800 text-slate-400 hover:text-white';
        }
    });

    const titles = {
        dashboard: 'Dashboard',
        tasks: 'Tasks & Board',
        proposals: 'Proposals & Approvals',
        budget: 'Budget & Finances',
        team: 'Committee Team',
        events: 'All Events'
    };
    document.getElementById('view-title').textContent = titles[viewName] || 'Dashboard';

    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.add('-translate-x-full');
    }

    renderAll();
}

function populateActiveEventSelect() {
    const events = DB.query('events');
    const select = document.getElementById('active-event-select');
    select.innerHTML = '';
    events.forEach(evt => {
        const opt = document.createElement('option');
        opt.value = evt.id;
        opt.textContent = evt.title;
        if (evt.id === AppState.activeEventId) opt.selected = true;
        select.appendChild(opt);
    });
}

function renderAll() {
    const currentEvent = DB.query('events', e => e.id === AppState.activeEventId)[0];
    if (currentEvent) {
        document.getElementById('event-subtitle').textContent = currentEvent.title;
    }

    renderDashboard();
    renderTasks();
    renderProposals();
    renderBudget();
    renderTeam();
    renderEvents();
    updatePendingBadge();
}

function renderDashboard() {
    const currentEvent = DB.query('events', e => e.id === AppState.activeEventId)[0];
    if (!currentEvent) return;

    document.getElementById('dash-event-title').textContent = currentEvent.title;
    document.getElementById('dash-event-desc').textContent = currentEvent.description;
    document.getElementById('dash-event-dates').innerHTML = `<i class="fa-regular fa-calendar mr-1"></i> ${currentEvent.event_date}`;
    document.getElementById('dash-target-attendees').textContent = currentEvent.target_attendees;

    const daysLeft = Math.ceil((new Date(currentEvent.event_date) - new Date()) / (1000 * 60 * 60 * 24));
    document.getElementById('dash-days-left').textContent = daysLeft > 0 ? daysLeft : 0;

    const tasks = DB.query('tasks', t => t.event_id === AppState.activeEventId);
    const doneTasks = tasks.filter(t => t.status === 'completed');
    const pct = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
    
    document.getElementById('stat-progress-pct').textContent = `${pct}%`;
    document.getElementById('stat-tasks-done').textContent = doneTasks.length;
    document.getElementById('stat-tasks-total').textContent = tasks.length;

    const urgentContainer = document.getElementById('dash-urgent-tasks-list');
    urgentContainer.innerHTML = '';
    const upcoming = tasks.filter(t => t.status !== 'completed').slice(0, 3);
    
    if (upcoming.length === 0) {
        urgentContainer.innerHTML = `<p class="text-xs text-slate-400 italic">No urgent tasks pending.</p>`;
    } else {
        upcoming.forEach(task => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40';
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="w-2.5 h-2.5 rounded-full ${task.priority === 'high' ? 'bg-rose-500' : 'bg-amber-500'}"></span>
                    <div>
                        <h4 class="text-xs font-semibold text-slate-800 dark:text-slate-200">${escapeHtml(task.title)}</h4>
                        <p class="text-[11px] text-slate-500">Due: ${task.due_date || 'No date'}</p>
                    </div>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase ${task.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'}">${task.status.replace('_', ' ')}</span>
            `;
            urgentContainer.appendChild(div);
        });
    }

    const proposals = DB.query('proposals', p => p.event_id === AppState.activeEventId && p.status === 'pending');
    document.getElementById('stat-proposals-count').textContent = proposals.length;

    const dashPropContainer = document.getElementById('dash-pending-proposals-list');
    dashPropContainer.innerHTML = '';
    if (proposals.length === 0) {
        dashPropContainer.innerHTML = `<p class="text-xs text-slate-400 italic">No pending proposals needing approval.</p>`;
    } else {
        proposals.forEach(prop => {
            const div = document.createElement('div');
            div.className = 'p-3 rounded-lg border border-amber-200/50 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/20';
            div.innerHTML = `
                <h4 class="text-xs font-bold text-amber-900 dark:text-amber-200">${escapeHtml(prop.title)}</h4>
                <p class="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">${escapeHtml(prop.description)}</p>
            `;
            dashPropContainer.appendChild(div);
        });
    }

    const budgetItems = DB.query('budget_items', b => b.event_id === AppState.activeEventId);
    const spent = budgetItems.filter(b => b.type === 'expense').reduce((acc, cur) => acc + Number(cur.amount), 0);
    const income = budgetItems.filter(b => b.type === 'sponsorship').reduce((acc, cur) => acc + Number(cur.amount), 0);
    
    document.getElementById('stat-spent-amount').textContent = formatRp(spent);
    const budgetPct = income > 0 ? Math.round((spent / income) * 100) : 0;
    document.getElementById('stat-budget-pct').textContent = `${budgetPct}%`;

    const members = DB.query('event_members', m => m.event_id === AppState.activeEventId);
    document.getElementById('stat-team-count').textContent = members.length;
}

function renderTasks() {
    const tasks = DB.query('tasks', t => t.event_id === AppState.activeEventId);
    const profiles = DB.query('profiles');

    ['todo', 'in_progress', 'completed'].forEach(status => {
        const container = document.getElementById(`col-${status}`);
        const statusTasks = tasks.filter(t => t.status === status);
        
        document.getElementById(`count-${status}`).textContent = statusTasks.length;
        container.innerHTML = '';

        if (statusTasks.length === 0) {
            container.innerHTML = `<div class="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700/60 rounded-xl text-center text-xs text-slate-400">No tasks in this column</div>`;
            return;
        }

        statusTasks.forEach(task => {
            const assignee = profiles.find(p => p.id === task.assignee_id) || { name: 'Unassigned', avatar: 'https://placehold.co/100?text=U' };
            
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3 cursor-pointer hover:border-indigo-400 transition-all';
            
            const priorityColor = {
                high: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200',
                medium: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200',
                low: 'bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200'
            }[task.priority || 'medium'];

            card.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${priorityColor}">${task.priority}</span>
                    <div class="flex items-center gap-1 text-slate-400 hover:text-slate-600">
                        <button onclick="openTaskModal('${task.id}')" title="Edit Task" class="p-1 text-xs"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button onclick="deleteTask('${task.id}')" title="Delete Task" class="p-1 text-xs text-rose-500"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <h4 class="font-bold text-sm text-slate-800 dark:text-white leading-snug">${escapeHtml(task.title)}</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">${escapeHtml(task.description || '')}</p>
                
                <div class="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <div class="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <i class="fa-regular fa-clock"></i>
                        <span>${task.due_date || 'No due date'}</span>
                    </div>
                    <img src="${assignee.avatar}" title="${assignee.name}" class="w-6 h-6 rounded-full object-cover border border-slate-200">
                </div>
            `;

            container.appendChild(card);
        });
    });
}

function renderProposals() {
    const proposals = DB.query('proposals', p => p.event_id === AppState.activeEventId);
    const profiles = DB.query('profiles');
    const container = document.getElementById('proposals-list-container');
    container.innerHTML = '';

    if (proposals.length === 0) {
        container.innerHTML = `<div class="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-slate-400">No proposals submitted for this event yet.</div>`;
        return;
    }

    const canApprove = ['owner', 'admin'].includes(AppState.simulatedRole);

    proposals.forEach(prop => {
        const submitter = profiles.find(p => p.id === prop.submitted_by) || { name: 'Committee Member' };
        
        const statusBadge = {
            pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300',
            approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300',
            rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300'
        }[prop.status];

        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4';
        
        card.innerHTML = `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusBadge}">${prop.status}</span>
                    <h3 class="text-base font-bold text-slate-800 dark:text-white mt-2">${escapeHtml(prop.title)}</h3>
                    <p class="text-xs text-slate-400">Submitted by <span class="font-medium text-slate-600 dark:text-slate-300">${escapeHtml(submitter.name)}</span> on ${new Date(prop.created_at).toLocaleDateString()}</p>
                </div>
                ${canApprove && prop.status === 'pending' ? `
                    <div class="flex items-center gap-2 shrink-0">
                        <button onclick="updateProposalStatus('${prop.id}', 'rejected')" class="px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300 rounded-lg transition-colors">Reject</button>
                        <button onclick="updateProposalStatus('${prop.id}', 'approved')" class="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors shadow-sm">Approve Proposal</button>
                    </div>
                ` : ''}
            </div>
            
            <p class="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">${escapeHtml(prop.description)}</p>
        `;

        container.appendChild(card);
    });
}

function renderBudget() {
    const items = DB.query('budget_items', b => b.event_id === AppState.activeEventId);
    const tbody = document.getElementById('budget-table-body');
    tbody.innerHTML = '';

    let totalSpent = 0;
    let totalIncome = 0;

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">No budget line items created yet.</td></tr>`;
    } else {
        items.forEach(item => {
            const val = Number(item.amount);
            if (item.type === 'expense') totalSpent += val;
            else totalIncome += val;

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50/50 dark:hover:bg-slate-700/30';
            tr.innerHTML = `
                <td class="p-3.5 font-semibold text-slate-800 dark:text-slate-200">${escapeHtml(item.title)}</td>
                <td class="p-3.5"><span class="text-xs px-2 py-0.5 rounded font-medium ${item.type === 'expense' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}">${item.type.toUpperCase()}</span></td>
                <td class="p-3.5 text-right font-bold ${item.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}">${formatRp(val)}</td>
                <td class="p-3.5 text-center"><span class="text-xs text-slate-500">${item.status || 'Active'}</span></td>
                <td class="p-3.5 text-right">
                    <button onclick="deleteBudgetItem('${item.id}')" class="text-xs text-rose-500 hover:text-rose-700"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('budget-total-allocated').textContent = formatRp(totalIncome);
    document.getElementById('budget-total-spent').textContent = formatRp(totalSpent);
    document.getElementById('budget-total-remaining').textContent = formatRp(totalIncome - totalSpent);
}

function renderTeam() {
    const members = DB.query('event_members', m => m.event_id === AppState.activeEventId);
    const profiles = DB.query('profiles');
    const grid = document.getElementById('team-members-grid');
    grid.innerHTML = '';

    members.forEach(m => {
        const profile = profiles.find(p => p.id === m.user_id) || { name: 'Unknown', email: '-', avatar: 'https://placehold.co/100' };
        
        const roleBadge = {
            owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
            admin: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
            treasurer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
            member: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
        }[m.role];

        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm';
        card.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${profile.avatar}" class="w-10 h-10 rounded-full object-cover border border-slate-200">
                <div>
                    <h4 class="font-bold text-sm text-slate-800 dark:text-white">${escapeHtml(profile.name)}</h4>
                    <p class="text-xs text-slate-400">${escapeHtml(profile.email)}</p>
                </div>
            </div>
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded ${roleBadge}">${m.role}</span>
        `;
        grid.appendChild(card);
    });
}

function renderEvents() {
    const events = DB.query('events');
    const grid = document.getElementById('all-events-grid');
    grid.innerHTML = '';

    events.forEach(evt => {
        const isActive = evt.id === AppState.activeEventId;
        const card = document.createElement('div');
        card.className = `bg-white dark:bg-slate-800 p-5 rounded-xl border ${isActive ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-700'} shadow-sm space-y-4`;
        
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-indigo-600 dark:text-indigo-400"><i class="fa-regular fa-calendar mr-1"></i> ${evt.event_date}</span>
                ${isActive ? `<span class="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>` : ''}
            </div>
            <div>
                <h3 class="font-bold text-base text-slate-800 dark:text-white">${escapeHtml(evt.title)}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">${escapeHtml(evt.description)}</p>
            </div>
            <div class="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span class="text-xs text-slate-400">Target: ${evt.target_attendees} attendees</span>
                <button onclick="setActiveEvent('${evt.id}')" class="px-3 py-1.5 text-xs font-semibold ${isActive ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'} rounded-lg transition-colors">
                    ${isActive ? 'Selected' : 'Switch Context'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openTaskModal(taskId = null) {
    const modal = document.getElementById('modal-task');
    const form = document.getElementById('form-task');
    const titleInput = document.getElementById('task-title-input');
    const descInput = document.getElementById('task-desc-input');
    const priorityInput = document.getElementById('task-priority-input');
    const statusInput = document.getElementById('task-status-input');
    const dateInput = document.getElementById('task-date-input');
    const assigneeSelect = document.getElementById('task-assignee-input');

    const members = DB.query('event_members', m => m.event_id === AppState.activeEventId);
    const profiles = DB.query('profiles');
    assigneeSelect.innerHTML = '';
    members.forEach(m => {
        const prof = profiles.find(p => p.id === m.user_id);
        if (prof) {
            const opt = document.createElement('option');
            opt.value = prof.id;
            opt.textContent = prof.name;
            assigneeSelect.appendChild(opt);
        }
    });

    if (taskId) {
        const task = DB.query('tasks', t => t.id === taskId)[0];
        if (task) {
            document.getElementById('modal-task-title').textContent = 'Edit Task';
            document.getElementById('task-id').value = task.id;
            titleInput.value = task.title;
            descInput.value = task.description || '';
            priorityInput.value = task.priority;
            statusInput.value = task.status;
            dateInput.value = task.due_date || '';
            assigneeSelect.value = task.assignee_id || '';
        }
    } else {
        document.getElementById('modal-task-title').textContent = 'Create New Task';
        form.reset();
        document.getElementById('task-id').value = '';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function handleTaskSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('task-id').value;
    const record = {
        event_id: AppState.activeEventId,
        title: document.getElementById('task-title-input').value,
        description: document.getElementById('task-desc-input').value,
        priority: document.getElementById('task-priority-input').value,
        status: document.getElementById('task-status-input').value,
        due_date: document.getElementById('task-date-input').value,
        assignee_id: document.getElementById('task-assignee-input').value
    };

    if (id) {
        DB.update('tasks', id, record);
        showToast('Task updated successfully', 'success');
    } else {
        DB.insert('tasks', record);
        showToast('New task created', 'success');
    }

    document.getElementById('modal-task').classList.add('hidden');
    renderAll();
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        DB.delete('tasks', taskId);
        showToast('Task deleted', 'info');
        renderAll();
    }
}

function openProposalModal() {
    document.getElementById('form-proposal').reset();
    const modal = document.getElementById('modal-proposal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function handleProposalSubmit(e) {
    e.preventDefault();
    const record = {
        event_id: AppState.activeEventId,
        submitted_by: AppState.currentUserId,
        title: document.getElementById('prop-title-input').value,
        description: document.getElementById('prop-desc-input').value,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    DB.insert('proposals', record);
    showToast('Proposal submitted for approval', 'success');
    document.getElementById('modal-proposal').classList.add('hidden');
    renderAll();
}

function updateProposalStatus(propId, status) {
    DB.update('proposals', propId, { status });
    showToast(`Proposal ${status}`, 'info');
    renderAll();
}

function openEventModal() {
    document.getElementById('form-event').reset();
    const modal = document.getElementById('modal-event');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function handleEventSubmit(e) {
    e.preventDefault();
    const evt = DB.insert('events', {
        title: document.getElementById('event-title-input').value,
        description: document.getElementById('event-desc-input').value,
        target_attendees: Number(document.getElementById('event-attendees-input').value),
        event_date: document.getElementById('event-date-input').value,
        created_at: new Date().toISOString()
    });

    DB.insert('event_members', {
        event_id: evt.id,
        user_id: AppState.currentUserId,
        role: 'owner'
    });

    AppState.activeEventId = evt.id;
    populateActiveEventSelect();
    showToast('New event created and set to active', 'success');
    document.getElementById('modal-event').classList.add('hidden');
    renderAll();
}

function openBudgetModal() {
    document.getElementById('form-budget').reset();
    const modal = document.getElementById('modal-budget');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function handleBudgetSubmit(e) {
    e.preventDefault();
    DB.insert('budget_items', {
        event_id: AppState.activeEventId,
        title: document.getElementById('budget-title-input').value,
        type: document.getElementById('budget-type-input').value,
        amount: Number(document.getElementById('budget-amount-input').value),
        status: 'approved'
    });

    showToast('Budget item added', 'success');
    document.getElementById('modal-budget').classList.add('hidden');
    renderAll();
}

function deleteBudgetItem(id) {
    DB.delete('budget_items', id);
    showToast('Budget item removed', 'info');
    renderAll();
}

function setActiveEvent(eventId) {
    AppState.activeEventId = eventId;
    populateActiveEventSelect();
    renderAll();
    showToast('Active event context switched', 'success');
}

function updatePendingBadge() {
    const pending = DB.query('proposals', p => p.event_id === AppState.activeEventId && p.status === 'pending');
    const badge = document.getElementById('pending-proposals-badge');
    if (pending.length > 0) {
        badge.textContent = pending.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const bg = {
        success: 'bg-emerald-600 text-white',
        info: 'bg-indigo-600 text-white',
        error: 'bg-rose-600 text-white'
    }[type] || 'bg-slate-800 text-white';

    toast.className = `${bg} px-4 py-3 rounded-xl shadow-lg text-xs font-medium flex items-center justify-between pointer-events-auto transition-all duration-300 translate-y-2 opacity-0`;
    toast.innerHTML = `
        <span>${message}</span>
        <i class="fa-solid fa-xmark text-sm ml-3 cursor-pointer" onclick="this.parentElement.remove()"></i>
    `;

    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatRp(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}