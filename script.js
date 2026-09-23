// ===========================
// BJJ TOURNAMENT MANAGER - JS
// ===========================

const API = 'http://localhost:8080';

// In-memory caches
let teams = [];
let athletes = [];
let categories = [];
let matches = [];

// ===========================
// INIT
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
    await checkApiStatus();
    await loadAll();
    renderDashboard();
});

async function loadAll() {
    await Promise.allSettled([
        loadTeams(),
        loadAthletes(),
        loadCategories(),
        loadMatches()
    ]);
}

// ===========================
// API STATUS CHECK
// ===========================

async function checkApiStatus() {
    const dot = document.querySelector('.status-dot');
    const text = document.getElementById('apiStatusText');
    try {
        const res = await fetch(`${API}/teams`, { signal: AbortSignal.timeout(3000) });
        if (res.ok || res.status === 200) {
            dot.classList.add('online');
            text.textContent = 'API Online';
        } else {
            throw new Error();
        }
    } catch {
        dot.classList.add('offline');
        text.textContent = 'API Offline';
    }
}

// ===========================
// NAVIGATION
// ===========================

const sectionTitles = {
    dashboard: 'Dashboard',
    teams: 'Equipes',
    athletes: 'Atletas',
    categories: 'Categorias',
    matches: 'Lutas'
};

function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById(`section-${name}`).classList.add('active');
    document.querySelector(`[data-section="${name}"]`).classList.add('active');
    document.getElementById('pageTitle').textContent = sectionTitles[name];

    if (name === 'dashboard') renderDashboard();
}

// ===========================
// TOAST
// ===========================

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = (type === 'success' ? '✓ ' : '✗ ') + msg;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3200);
}

// ===========================
// MODAL HELPERS
// ===========================

function openModal(id) {
    document.getElementById('modal-overlay').classList.add('visible');
    document.getElementById(id).classList.add('visible');
}

function closeAllModals() {
    document.getElementById('modal-overlay').classList.remove('visible');
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('visible'));
}

// ===========================
// TEAMS CRUD
// ===========================

async function loadTeams() {
    try {
        const res = await fetch(`${API}/teams`);
        teams = await res.json();
        renderTeams();
        document.getElementById('stat-teams').textContent = teams.length;
        document.getElementById('teams-count').textContent = teams.length;
    } catch {
        document.getElementById('teams-tbody').innerHTML =
            `<tr><td colspan="4" class="empty-state">Erro ao carregar equipes.</td></tr>`;
    }
}

function renderTeams() {
    const tbody = document.getElementById('teams-tbody');
    if (!teams.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Nenhuma equipe cadastrada.</td></tr>`;
        return;
    }
    tbody.innerHTML = teams.map(t => `
        <tr>
            <td><span style="color:var(--text-muted)">#${t.id}</span></td>
            <td style="color:var(--text-primary);font-weight:500">${t.teamName}</td>
            <td><span class="badge">${t.athletes ? t.athletes.length : 0}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon edit" onclick="editTeam(${t.id})" title="Editar">✏️</button>
                    <button class="btn-icon delete" onclick="confirmDelete('teams', ${t.id})" title="Excluir">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openTeamModal(id = null) {
    document.getElementById('team-id').value = '';
    document.getElementById('team-name').value = '';
    document.getElementById('modal-team-title').textContent = 'Nova Equipe';
    openModal('modal-team');
}

async function editTeam(id) {
    const team = teams.find(t => t.id === id);
    if (!team) return;
    document.getElementById('team-id').value = team.id;
    document.getElementById('team-name').value = team.teamName;
    document.getElementById('modal-team-title').textContent = 'Editar Equipe';
    openModal('modal-team');
}

async function saveTeam() {
    const id = document.getElementById('team-id').value;
    const name = document.getElementById('team-name').value.trim();
    if (!name) { showToast('Informe o nome da equipe!', 'error'); return; }

    const body = JSON.stringify({ teamName: name });
    const url = id ? `${API}/teams/${id}` : `${API}/teams`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
        if (res.ok || res.status === 201) {
            showToast(id ? 'Equipe atualizada!' : 'Equipe criada!');
            closeAllModals();
            await loadTeams();
        } else {
            showToast('Erro ao salvar equipe.', 'error');
        }
    } catch {
        showToast('Sem conexão com a API.', 'error');
    }
}

// ===========================
// ATHLETES CRUD
// ===========================

async function loadAthletes() {
    try {
        const res = await fetch(`${API}/athletes`);
        athletes = await res.json();
        renderAthletes();
        document.getElementById('stat-athletes').textContent = athletes.length;
        document.getElementById('athletes-count').textContent = athletes.length;
    } catch {
        document.getElementById('athletes-tbody').innerHTML =
            `<tr><td colspan="8" class="empty-state">Erro ao carregar atletas.</td></tr>`;
    }
}

function renderAthletes() {
    const tbody = document.getElementById('athletes-tbody');
    if (!athletes.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Nenhum atleta cadastrado.</td></tr>`;
        return;
    }
    tbody.innerHTML = athletes.map(a => `
        <tr>
            <td><span style="color:var(--text-muted)">#${a.id}</span></td>
            <td style="color:var(--text-primary);font-weight:500">${a.name}</td>
            <td>${a.team ? a.team.teamName : '<span style="color:var(--text-muted)">—</span>'}</td>
            <td>${a.category ? a.category.category_name : '<span style="color:var(--text-muted)">—</span>'}</td>
            <td><span class="belt-badge belt-${a.belt}">${a.belt || '—'}</span></td>
            <td>${a.weight ? a.weight + ' kg' : '—'}</td>
            <td><span class="status-badge status-${a.isFighting}">${a.isFighting || '—'}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon edit" onclick="editAthlete(${a.id})" title="Editar">✏️</button>
                    <button class="btn-icon delete" onclick="confirmDelete('athletes', ${a.id})" title="Excluir">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function openAthleteModal() {
    await refreshSelectData();
    document.getElementById('athlete-id').value = '';
    document.getElementById('athlete-name').value = '';
    document.getElementById('athlete-belt').value = '';
    document.getElementById('athlete-gender').value = '';
    document.getElementById('athlete-weight').value = '';
    document.getElementById('athlete-age').value = '';
    document.getElementById('athlete-fighting').value = 'Não';
    document.getElementById('athlete-team').value = '';
    document.getElementById('athlete-category').value = '';
    document.getElementById('modal-athlete-title').textContent = 'Novo Atleta';
    openModal('modal-athlete');
}

async function editAthlete(id) {
    const a = athletes.find(x => x.id === id);
    if (!a) return;
    await refreshSelectData();
    document.getElementById('athlete-id').value = a.id;
    document.getElementById('athlete-name').value = a.name || '';
    document.getElementById('athlete-belt').value = a.belt || '';
    document.getElementById('athlete-gender').value = a.gender || '';
    document.getElementById('athlete-weight').value = a.weight || '';
    document.getElementById('athlete-age').value = a.age || '';
    document.getElementById('athlete-fighting').value = a.isFighting || 'Não';
    document.getElementById('athlete-team').value = a.team ? a.team.id : '';
    document.getElementById('athlete-category').value = a.category ? a.category.id : '';
    document.getElementById('modal-athlete-title').textContent = 'Editar Atleta';
    openModal('modal-athlete');
}

async function saveAthlete() {
    const id = document.getElementById('athlete-id').value;
    const name = document.getElementById('athlete-name').value.trim();
    const teamId = document.getElementById('athlete-team').value;
    const categoryId = document.getElementById('athlete-category').value;
    const belt = document.getElementById('athlete-belt').value;
    const gender = document.getElementById('athlete-gender').value;
    const weight = document.getElementById('athlete-weight').value;
    const age = document.getElementById('athlete-age').value;
    const isFighting = document.getElementById('athlete-fighting').value;

    if (!name) { showToast('Informe o nome do atleta!', 'error'); return; }

    const body = {
        name,
        belt,
        gender,
        weight: weight ? parseFloat(weight) : 0,
        age: age ? parseInt(age) : 0,
        isFighting,
        team: teamId ? { id: parseInt(teamId) } : null,
        category: categoryId ? { id: parseInt(categoryId) } : null
    };

    const url = id ? `${API}/athletes/${id}` : `${API}/athletes`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok || res.status === 201) {
            showToast(id ? 'Atleta atualizado!' : 'Atleta criado!');
            closeAllModals();
            await loadAthletes();
        } else {
            showToast('Erro ao salvar atleta.', 'error');
        }
    } catch {
        showToast('Sem conexão com a API.', 'error');
    }
}

// ===========================
// CATEGORIES CRUD
// ===========================

async function loadCategories() {
    try {
        const res = await fetch(`${API}/categories`);
        categories = await res.json();
        renderCategories();
        document.getElementById('stat-categories').textContent = categories.length;
        document.getElementById('categories-count').textContent = categories.length;
    } catch {
        document.getElementById('categories-tbody').innerHTML =
            `<tr><td colspan="7" class="empty-state">Erro ao carregar categorias.</td></tr>`;
    }
}

function renderCategories() {
    const tbody = document.getElementById('categories-tbody');
    if (!categories.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhuma categoria cadastrada.</td></tr>`;
        return;
    }
    tbody.innerHTML = categories.map(c => `
        <tr>
            <td><span style="color:var(--text-muted)">#${c.id}</span></td>
            <td style="color:var(--text-primary);font-weight:500">${c.category_name}</td>
            <td><span class="belt-badge belt-${c.belt}">${c.belt || '—'}</span></td>
            <td>${c.gender || '—'}</td>
            <td>${c.max_weight ? c.max_weight + ' kg' : '—'}</td>
            <td>${c.max_age || '—'} anos</td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon edit" onclick="editCategory(${c.id})" title="Editar">✏️</button>
                    <button class="btn-icon delete" onclick="confirmDelete('categories', ${c.id})" title="Excluir">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function editCategory(id) {
    const c = categories.find(x => x.id === id);
    if (!c) return;
    document.getElementById('category-id').value = c.id;
    document.getElementById('category-name').value = c.category_name || '';
    document.getElementById('category-belt').value = c.belt || '';
    document.getElementById('category-gender').value = c.gender || '';
    document.getElementById('category-weight').value = c.max_weight || '';
    document.getElementById('category-age').value = c.max_age || '';
    document.getElementById('modal-category-title').textContent = 'Editar Categoria';
    openModal('modal-category');
}

function openCategoryModal() {
    document.getElementById('category-id').value = '';
    document.getElementById('category-name').value = '';
    document.getElementById('category-belt').value = '';
    document.getElementById('category-gender').value = '';
    document.getElementById('category-weight').value = '';
    document.getElementById('category-age').value = '';
    document.getElementById('modal-category-title').textContent = 'Nova Categoria';
    openModal('modal-category');
}

async function saveCategory() {
    const id = document.getElementById('category-id').value;
    const name = document.getElementById('category-name').value.trim();
    const belt = document.getElementById('category-belt').value;
    const gender = document.getElementById('category-gender').value;
    const weight = document.getElementById('category-weight').value;
    const age = document.getElementById('category-age').value;

    if (!name) { showToast('Informe o nome da categoria!', 'error'); return; }

    const body = {
        category_name: name,
        belt,
        gender,
        max_weight: weight ? parseFloat(weight) : 0,
        max_age: age ? parseInt(age) : 0
    };

    const url = id ? `${API}/categories/${id}` : `${API}/categories`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok || res.status === 201) {
            showToast(id ? 'Categoria atualizada!' : 'Categoria criada!');
            closeAllModals();
            await loadCategories();
        } else {
            showToast('Erro ao salvar categoria.', 'error');
        }
    } catch {
        showToast('Sem conexão com a API.', 'error');
    }
}

// ===========================
// MATCHES CRUD
// ===========================

async function loadMatches() {
    try {
        const res = await fetch(`${API}/matches`);
        matches = await res.json();
        renderMatches();
        document.getElementById('stat-matches').textContent = matches.length;
        document.getElementById('matches-count').textContent = matches.length;
    } catch {
        document.getElementById('matches-tbody').innerHTML =
            `<tr><td colspan="7" class="empty-state">Erro ao carregar lutas.</td></tr>`;
    }
}

function renderMatches() {
    const tbody = document.getElementById('matches-tbody');
    if (!matches.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Nenhuma luta registrada.</td></tr>`;
        return;
    }
    tbody.innerHTML = matches.map(m => {
        const statusKey = m.matchStatus ? m.matchStatus.replace(' ', '-') : '';
        return `
        <tr>
            <td><span style="color:var(--text-muted)">#${m.id}</span></td>
            <td style="color:var(--text-primary);font-weight:500">${m.athlete1 ? m.athlete1.name : '—'}</td>
            <td style="color:var(--text-primary);font-weight:500">${m.athlete2 ? m.athlete2.name : '—'}</td>
            <td>${m.category ? m.category.category_name : '—'}</td>
            <td>${m.winner ? `<span style="color:var(--gold)">🏅 ${m.winner.name}</span>` : '<span style="color:var(--text-muted)">—</span>'}</td>
            <td><span class="status-badge status-${statusKey}">${m.matchStatus || '—'}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon edit" onclick="editMatch(${m.id})" title="Editar">✏️</button>
                    <button class="btn-icon delete" onclick="confirmDelete('matches', ${m.id})" title="Excluir">🗑️</button>
                </div>
            </td>
        </tr>
    `}).join('');
}

async function openMatchModal() {
    await refreshSelectData();
    populateMatchSelects();
    document.getElementById('match-id').value = '';
    document.getElementById('match-athlete1').value = '';
    document.getElementById('match-athlete2').value = '';
    document.getElementById('match-category').value = '';
    document.getElementById('match-winner').value = '';
    document.getElementById('match-status').value = 'Agendada';
    document.getElementById('modal-match-title').textContent = 'Nova Luta';
    openModal('modal-match');
}

async function editMatch(id) {
    const m = matches.find(x => x.id === id);
    if (!m) return;
    await refreshSelectData();
    populateMatchSelects();
    document.getElementById('match-id').value = m.id;
    document.getElementById('match-athlete1').value = m.athlete1 ? m.athlete1.id : '';
    document.getElementById('match-athlete2').value = m.athlete2 ? m.athlete2.id : '';
    document.getElementById('match-category').value = m.category ? m.category.id : '';
    document.getElementById('match-winner').value = m.winner ? m.winner.id : '';
    document.getElementById('match-status').value = m.matchStatus || 'Agendada';
    document.getElementById('modal-match-title').textContent = 'Editar Luta';
    openModal('modal-match');
}

function populateMatchSelects() {
    const athleteOpts = athletes.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    const catOpts = categories.map(c => `<option value="${c.id}">${c.category_name}</option>`).join('');

    document.getElementById('match-athlete1').innerHTML = `<option value="">Selecione...</option>${athleteOpts}`;
    document.getElementById('match-athlete2').innerHTML = `<option value="">Selecione...</option>${athleteOpts}`;
    document.getElementById('match-winner').innerHTML = `<option value="">Sem vencedor definido</option>${athleteOpts}`;
    document.getElementById('match-category').innerHTML = `<option value="">Selecione...</option>${catOpts}`;
}

async function saveMatch() {
    const id = document.getElementById('match-id').value;
    const a1 = document.getElementById('match-athlete1').value;
    const a2 = document.getElementById('match-athlete2').value;
    const cat = document.getElementById('match-category').value;
    const winner = document.getElementById('match-winner').value;
    const status = document.getElementById('match-status').value;

    if (!a1 || !a2) { showToast('Selecione os dois atletas!', 'error'); return; }
    if (a1 === a2) { showToast('Os dois atletas devem ser diferentes!', 'error'); return; }

    const body = {
        athlete1: { id: parseInt(a1) },
        athlete2: { id: parseInt(a2) },
        category: cat ? { id: parseInt(cat) } : null,
        winner: winner ? { id: parseInt(winner) } : null,
        matchStatus: status
    };

    const url = id ? `${API}/matches/${id}` : `${API}/matches`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok || res.status === 201) {
            showToast(id ? 'Luta atualizada!' : 'Luta criada!');
            closeAllModals();
            await loadMatches();
        } else {
            showToast('Erro ao salvar luta.', 'error');
        }
    } catch {
        showToast('Sem conexão com a API.', 'error');
    }
}

// ===========================
// DELETE
// ===========================

function confirmDelete(entity, id) {
    const btn = document.getElementById('confirm-delete-btn');
    btn.onclick = () => deleteRecord(entity, id);
    openModal('modal-confirm');
}

async function deleteRecord(entity, id) {
    try {
        const res = await fetch(`${API}/${entity}/${id}`, { method: 'DELETE' });
        if (res.status === 204 || res.ok) {
            showToast('Registro excluído com sucesso!');
            closeAllModals();
            if (entity === 'teams') await loadTeams();
            else if (entity === 'athletes') await loadAthletes();
            else if (entity === 'categories') await loadCategories();
            else if (entity === 'matches') await loadMatches();
        } else {
            showToast('Erro ao excluir registro.', 'error');
        }
    } catch {
        showToast('Sem conexão com a API.', 'error');
    }
}

// ===========================
// SELECT DATA REFRESH
// ===========================

async function refreshSelectData() {
    // Refresh teams and categories for selects if needed
    if (!teams.length) await loadTeams();
    if (!categories.length) await loadCategories();
    if (!athletes.length) await loadAthletes();

    // Populate athlete form selects
    const teamOpts = teams.map(t => `<option value="${t.id}">${t.teamName}</option>`).join('');
    const catOpts = categories.map(c => `<option value="${c.id}">${c.category_name}</option>`).join('');

    const teamSel = document.getElementById('athlete-team');
    const catSel = document.getElementById('athlete-category');
    if (teamSel) teamSel.innerHTML = `<option value="">Selecione uma equipe...</option>${teamOpts}`;
    if (catSel) catSel.innerHTML = `<option value="">Selecione uma categoria...</option>${catOpts}`;
}

// ===========================
// DASHBOARD
// ===========================

function renderDashboard() {
    // Recent matches
    const matchesDiv = document.getElementById('dashboard-matches');
    if (!matches.length) {
        matchesDiv.innerHTML = `<div class="loading-state">Nenhuma luta registrada.</div>`;
    } else {
        const recent = matches.slice(-5).reverse();
        matchesDiv.innerHTML = recent.map(m => `
            <div class="mini-match">
                <div class="mini-match-teams">
                    <span>${m.athlete1 ? m.athlete1.name : '?'}</span>
                    <span class="vs-text">VS</span>
                    <span>${m.athlete2 ? m.athlete2.name : '?'}</span>
                </div>
                <span class="status-badge status-${m.matchStatus ? m.matchStatus.replace(' ', '-') : ''}">${m.matchStatus || '—'}</span>
            </div>
        `).join('');
    }

    // Athletes currently fighting
    const fightingDiv = document.getElementById('dashboard-fighting');
    const fighting = athletes.filter(a => a.isFighting === 'Sim');
    if (!fighting.length) {
        fightingDiv.innerHTML = `<div class="loading-state">Nenhum atleta em luta.</div>`;
    } else {
        fightingDiv.innerHTML = fighting.slice(0, 6).map(a => `
            <div class="mini-fighter">
                <div class="fighter-avatar">${(a.name || '?').charAt(0).toUpperCase()}</div>
                <div>
                    <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${a.name}</div>
                    <div style="font-size:11px;color:var(--text-muted)">${a.team ? a.team.teamName : 'Sem equipe'}</div>
                </div>
                <span class="belt-badge belt-${a.belt}" style="margin-left:auto">${a.belt || '—'}</span>
            </div>
        `).join('');
    }
}