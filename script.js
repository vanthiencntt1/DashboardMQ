// CONFIGURATION
const TOKEN = '164726767694b476b9aa55371444621';
const BASE = 'https://mqsoft.1office.vn/api/work/task/gets';
const ACCESS = '164726767694b476b9aa55371444621';

const assign_ids = [
  "Nguyễn Văn Thiện", "Nguyễn Thành Long", "Trần Thanh Tuấn", "Vũ Hữu Trùng Dương",
  "Lê Nhật Trường", "Nguyễn Phạm Nam An", "Nguyễn Mạnh Hoàng", "Nguyễn Phúc Văn",
  "Ngô Tấn Ngọc", "Phạm Đình Ngọc", "Nguyễn Thanh Vinh", "Trần Khánh Dư",
  "Phạm Xuân Dũng", "Lê Anh Vũ", "Triệu Anh Tú", "Trần Thanh Đạo", "Đặng Ngọc Trí"
];

const now = new Date();
const today = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

// State
let taskData = {
  completed: [], created: [], 'wait-test': [], pending: [], doing: []
};
let staffData = {};
let activeTab = 'completed';

function buildUrl(filters) {
  return `${BASE}?access_token=${ACCESS}&limit=1000&filters=${encodeURIComponent(JSON.stringify(filters))}`;
}

async function fetchTasks(filters) {
  const url = buildUrl(filters);
  const res = await fetch(url);
  const data = await res.json();
  const items = data?.data?.items || data?.items || data?.data || [];
  if (data?.total_item !== undefined) items.totalCount = data.total_item;
  return items;
}

async function loadKPIs() {
  const [completed, created, waitTest, pending, doing] = await Promise.all([
    fetchTasks([{status: "COMPLETED", date_updated: today}]),
    fetchTasks([{start: today}]),
    fetchTasks([{status: "DOING", tag_ids: "Đã commit"}]),
    fetchTasks([{status: "PENDING"}]),
    fetchTasks([{status: "DOING"}]),
  ]);

  taskData.completed = completed;
  taskData.created = created;
  taskData['wait-test'] = waitTest;
  taskData.pending = pending;
  taskData.doing = doing;

  setKPI('kpi-completed', completed.totalCount || completed.length);
  setKPI('kpi-created', created.totalCount || created.length);
  setKPI('kpi-waitTest', waitTest.totalCount || waitTest.length);
  setKPI('kpi-pending', pending.totalCount || pending.length);
  setKPI('kpi-doing', doing.totalCount || doing.length);

  renderTab(activeTab);
}

async function loadPersonnel() {
  const list = document.getElementById('personList');
  list.innerHTML = assign_ids.map(name => `
    <div class="person-row" id="row-${btoa(encodeURIComponent(name))}" onclick="showPersonDetail('${name.replace(/'/g,"\\'")}')">
      <div class="person-name">${name}</div>
      <div class="person-stat stat-pending"><div class="skel" style="width:20px;height:14px;margin:auto"></div></div>
      <div class="person-stat stat-doing"><div class="skel" style="width:20px;height:14px;margin:auto"></div></div>
      <div class="person-stat stat-review"><div class="skel" style="width:20px;height:14px;margin:auto"></div></div>
      <div class="person-stat stat-priority"><div class="skel" style="width:20px;height:14px;margin:auto"></div></div>
    </div>
  `).join('');

  // Load each person sequentially to avoid hammering the API
  for (const name of assign_ids) {
    try {
      const [pending, doing, review, priority] = await Promise.all([
        fetchTasks([{status:"PENDING", assign_ids: name}]),
        fetchTasks([{status:"DOING", assign_ids: name}]),
        fetchTasks([{status:"REVIEW", assign_ids: name}]),
        fetchTasks([{status:"DOING", tag_ids:"Ưu tiên", assign_ids: name}]),
      ]);
      staffData[name] = {pending, doing, review, priority};
      updatePersonRow(name, pending.length, doing.length, review.length, priority.length);
    } catch(e) {
      console.warn('Failed for', name, e);
    }
  }
}

function updatePersonRow(name, p, d, r, pr) {
  const id = btoa(encodeURIComponent(name));
  const row = document.getElementById('row-' + id);
  if (!row) return;
  const cells = row.querySelectorAll('.person-stat');
  cells[0].innerHTML = p || '<span style="opacity:0.3">—</span>';
  cells[1].innerHTML = d || '<span style="opacity:0.3">—</span>';
  cells[2].innerHTML = r || '<span style="opacity:0.3">—</span>';
  cells[3].innerHTML = pr ? `<span style="color:var(--red)">${pr}</span>` : '<span style="opacity:0.3">—</span>';
}

function setKPI(id, val) {
  document.getElementById(id).textContent = val;
}

function renderTab(tab) {
  activeTab = tab;
  // Update tabs
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });

  const list = document.getElementById('taskList');
  const items = taskData[tab] || [];

  if (!items.length) {
    list.innerHTML = `<div class="empty-state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
      <div>Không có task nào</div>
    </div>`;
    return;
  }

  list.innerHTML = items.map(t => renderTaskItem(t, tab)).join('');
}

function renderTaskItem(t, tab) {
  const tagMap = {
    completed: 'tag-completed',
    created: 'tag-doing',
    'wait-test': 'tag-review',
    pending: 'tag-pending',
    doing: 'tag-doing'
  };
  const labelMap = {
    completed: 'Hoàn thành',
    created: 'Tạo mới',
    'wait-test': 'Chờ test',
    pending: 'Chờ',
    doing: 'Đang làm'
  };

  const assignee = t.assign_names || t.assign_ids || t.assigned_to_name || t.assignee || '';
  const project = t.project_title || t.project_name || t.space_name || '';
  const priority = t.tag_names?.includes('Ưu tiên') || t.is_priority || t.priority === 'Cao' ? 
    `<span class="task-tag tag-priority">Ưu tiên</span>` : '';
  const tags = t.tag_names || t.tag_ids ? `<span class="task-tag tag-review">${t.tag_names || t.tag_ids}</span>` : '';

  const taskID = t.ID || t.id;
  const taskUrl = `https://mqsoft.1office.vn/work-normal-normal/view?ID=${taskID}`;

  return `<div class="task-item" onclick="window.open('${taskUrl}', '_blank')">
    <div class="task-title">${t.title || t.name || 'Không có tiêu đề'}</div>
    <div class="task-meta">
      <span class="task-tag ${tagMap[tab]}">${labelMap[tab]}</span>
      ${priority}
      ${tags}
      ${assignee ? `<span class="task-assignee">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        ${assignee}
      </span>` : ''}
      ${project ? `<span style="font-size:0.65rem;color:var(--text-muted)">📁 ${project}</span>` : ''}
    </div>
  </div>`;
}

function showTab(tab) {
  renderTab(tab);
}

function showPersonDetail(name) {
  const d = staffData[name];
  if (!d) { showToast('Đang tải dữ liệu...'); return; }

  const all = [...(d.doing||[]), ...(d.pending||[]), ...(d.review||[])];
  if (!all.length) { showToast('Không có task nào cho ' + name); return; }

  const body = `
    <div style="margin-bottom:1rem;display:flex;gap:0.75rem;flex-wrap:wrap">
      <span class="task-tag tag-pending">Chờ: ${d.pending?.length||0}</span>
      <span class="task-tag tag-doing">Đang làm: ${d.doing?.length||0}</span>
      <span class="task-tag tag-review">Review: ${d.review?.length||0}</span>
      <span class="task-tag tag-priority">Ưu tiên: ${d.priority?.length||0}</span>
    </div>
    ${[...d.doing.map(t=>({...t,_cat:'doing'})), ...d.pending.map(t=>({...t,_cat:'pending'})), ...d.review.map(t=>({...t,_cat:'review'}))]
      .map(t => {
        const taskID = t.ID || t.id;
        const taskUrl = `https://mqsoft.1office.vn/work-normal-normal/view?ID=${taskID}`;
        return `<div class="task-item" onclick="window.open('${taskUrl}', '_blank')">
          <div class="task-title">${t.title||t.name||'—'}</div>
          <div class="task-meta">
            <span class="task-tag ${t._cat==='doing'?'tag-doing':t._cat==='review'?'tag-review':'tag-pending'}">${t._cat==='doing'?'Đang làm':t._cat==='review'?'Review':'Chờ'}</span>
            ${(d.priority||[]).find(p=>p.id===t.id)?'<span class="task-tag tag-priority">Ưu tiên</span>':''}
          </div>
        </div>`
      }).join('')}
  `;

  document.getElementById('modalTitle').textContent = '👤 ' + name;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modalOverlay').classList.add('open');
}

function openTaskModal(task) {
  const taskID = task.ID || task.id;
  const taskUrl = `https://mqsoft.1office.vn/work-normal-normal/view?ID=${taskID}`;

  const fields = [
    ['Link 1Office', taskID ? `<a href="${taskUrl}" target="_blank" style="color:var(--accent);text-decoration:none;font-weight:bold;display:flex;align-items:center;gap:5px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y1="3"></line></svg>
      Xem chi tiết #${taskID}
    </a>` : '—'],
    ['Tiêu đề', task.title || task.name || '—'],
    ['Trạng thái', task.status || '—'],
    ['Người thực hiện', task.assign_names || task.assignee || '—'],
    ['Người tạo', task.created_by_name || '—'],
    ['Dự án', task.project_name || task.space_name || '—'],
    ['Ngày tạo', task.created_at ? new Date(task.created_at).toLocaleString('vi-VN') : '—'],
    ['Ngày cập nhật', task.updated_at || task.date_updated ? new Date(task.updated_at||task.date_updated).toLocaleString('vi-VN') : '—'],
    ['Ưu tiên', task.priority || '—'],
    ['Tags', task.tag_names || '—'],
    ['Mô tả', task.description || task.content || '—'],
  ];

  document.getElementById('modalTitle').textContent = task.title || task.name || 'Task Detail';
  document.getElementById('modalBody').innerHTML = fields.map(([label, val]) => `
    <div class="modal-field">
      <div class="modal-field-label">${label}</div>
      <div class="modal-field-value">${val}</div>
    </div>
  `).join('');
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModalDirect();
}
function closeModalDirect() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

async function loadAll() {
  const btn = document.getElementById('refreshBtn');
  btn.classList.add('loading');
  const span = btn.querySelector('span');
  if (span) span.textContent = 'LOADING...';
  
  showToast('Đang tải dữ liệu...');
  try {
    await Promise.all([loadKPIs(), loadPersonnel()]);
    showToast('Cập nhật thành công!');
  } catch(e) {
    showToast('Lỗi kết nối API');
    console.error(e);
  }
  btn.classList.remove('loading');
  if (span) span.textContent = 'REFRESH';
}

// Clock
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('vi-VN');
  document.getElementById('date-display').textContent = now.toLocaleDateString('vi-VN', {weekday:'short', day:'2-digit', month:'2-digit'});
}
setInterval(updateClock, 1000);
updateClock();

// Init
window.onload = loadAll;

// Auto refresh every 5 min
setInterval(loadAll, 5 * 60 * 1000);
