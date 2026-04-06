/**
 * DASHBOARD MQ - UNIFIED SCRIPT
 * Merged into a single file to bypass browser CORS restrictions when opening locally.
 */

// --- CONFIGURATION ---
const TOKEN = '164726767694b476b9aa55371444621';
const BASE = 'https://mqsoft.1office.vn/api/work/task/gets';
const ACCESS = '164726767694b476b9aa55371444621';

const staffList = [
  { name: "Đoàn Văn Thiện", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  {
    name: "Nguyễn Thành Long", dept: "Phòng Lập Trình"
  },
  { name: "Trần Thanh Tuấn", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Vũ Hữu Trùng Dương", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Lê Nhật Trường", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Nguyễn Phạm Nam An", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Nguyễn Mạnh Hoàng", dept: "Phòng Lập Trình" },
  { name: "Nguyễn Phúc Văn", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "NGÔ TẤN NGỌC", dept: "Phòng Lập Trình" },
  { name: "Phạm Đình Ngọc", dept: "Phòng Lập Trình" },
  { name: "IT Thủ Đức 2", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "ITBV Thủ Đức", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Nguyễn Thanh Vinh", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Trần khánh Dư", dept: "Phòng Lập Trình" },
  { name: "Nguyễn Văn Thiện", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Phạm Xuân Dũng", dept: "Phòng Lập Trình" },
  { name: "Lê Anh Vũ", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Triệu Anh Tú", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Trần Thanh Đạo", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Đặng Ngọc Trí", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Lâm Hồng Phúc", dept: "Ban Giám Đốc" },
  { name: "Nguyễn Ngọc Sơn", dept: "Ban Giám Đốc" },
  { name: "Nguyễn Tấn Kỳ", dept: "Ban Giám Đốc" },
  { name: "Phan Văn Bảo An", dept: "Ban Giám Đốc" }
];

// --- STATE ---
let state = {
  taskData: { completed: [], created: [], 'wait-test': [], pending: [], doing: [], priority: [] },
  staffData: {},
  activeTab: 'completed',
  currentDept: 'All',
  currentProject: 'All',
  currentModalStaff: '',
  currentModalFilter: 'all',
  searchText: '',
  sortOrder: 'oldest' // 'oldest' or 'newest'
};

function getTodayString() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// --- API ---
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

function parse1OfficeDate(dateStr) {
  if (!dateStr) return new Date(0);
  // Match DD/MM/YYYY or YYYY-MM-DD and potentially HH:mm:ss
  const parts = String(dateStr).match(/(\d+)/g);
  if (!parts || parts.length < 3) return new Date(dateStr) || new Date(0);

  if (parts[0].length === 4) { // YYYY-MM-DD
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date(0) : d;
  } else { // DD/MM/YYYY
    const [d, m, y, h, min, s] = parts;
    return new Date(y, m - 1, d, h || 0, min || 0, s || 0);
  }
}

function timeSince(dateStr) {
  if (!dateStr) return '';
  const d = parse1OfficeDate(dateStr);
  const diffMs = new Date() - d;
  if (diffMs < 0) return 'Vừa xong';
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'Vừa xong';
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút";
  return Math.floor(seconds) + " giây";
}

// --- COMPONENTS ---
function renderTaskItem(t, tab, index) {
  const tagMap = {
    completed: 'tag-completed',
    created: 'tag-doing',
    'wait-test': 'tag-review',
    pending: 'tag-pending',
    doing: 'tag-doing',
    priority: 'tag-priority'
  };
  const labelMap = {
    completed: 'Hoàn thành',
    created: 'Tạo mới',
    'wait-test': 'Chờ test',
    pending: 'Chờ',
    doing: 'Đang làm',
    priority: 'Ưu tiên'
  };

  const assignee = t.assign_names || t.assign_ids || t.assigned_to_name || t.assignee || '';
  const project = t.project_title || t.project_name || t.space_name || '';

  const tagsText = t.tag_names || t.tag_ids || '';
  const tagsBadge = tagsText ? `<span class="task-tag tag-review">${tagsText}</span>` : '';

  const taskID = t.ID || t.id;
  const taskUrl = `https://mqsoft.1office.vn/work-normal-normal/view?ID=${taskID}`;
  const createdDate = t.date_created || t.created || t.start || '';
  const delay = timeSince(createdDate);

  return `
    <div class="task-item" onclick="window.open('${taskUrl}', '_blank')">
      <div class="task-title" style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="display:flex; gap:8px">
          <span style="opacity:0.5; font-family:var(--mono); font-size:0.75rem">#${index + 1}</span>
          <span>${t.title || t.name || '—'}</span>
        </div>
        ${createdDate ? `<span style="font-size:0.65rem; color:var(--red); font-weight:bold; white-space:nowrap;">🕒 Chậm: ${delay}</span>` : ''}
      </div>
      <div class="task-meta">
        <span class="task-tag ${tagMap[tab]}">${labelMap[tab]}</span>
        ${tagsBadge}
        ${assignee ? `<span class="task-assignee">👤 ${assignee}</span>` : ''}
        ${project ? `<span style="font-size:0.65rem;color:var(--text-muted)">📁 ${project}</span>` : ''}
        ${createdDate ? `<span style="font-size:0.65rem;color:var(--text-muted);margin-left:auto">📅 ${createdDate.split(' ')[0]}</span>` : ''}
      </div>
    </div>`;
}

function renderPersonRow(s) {
  const nameId = btoa(encodeURIComponent(s.name));
  return `
    <div class="person-row" id="row-${nameId}" onclick="app.showPersonDetail('${s.name.replace(/'/g, "\\'")}')">
      <div class="person-name">${s.name}</div>
      <div class="person-stat stat-pending">...</div>
      <div class="person-stat stat-doing">...</div>
      <div class="person-stat stat-review">...</div>
      <div class="person-stat stat-priority">...</div>
    </div>`;
}

function renderModalContent(name, d, currentFilter) {
  const totalCount = (d.pending?.length || 0) + (d.doing?.length || 0) + (d.review?.length || 0);
  const cats = [
    { id: 'all', label: 'Tất cả', count: totalCount, class: 'tag-review' },
    { id: 'pending', label: 'Chờ', count: d.pending?.length || 0, class: 'tag-pending' },
    { id: 'doing', label: 'Làm', count: d.doing?.length || 0, class: 'tag-doing' },
    { id: 'review', label: 'Review', count: d.review?.length || 0, class: 'tag-review' },
    { id: 'priority', label: 'Ưu tiên', count: d.priority?.length || 0, class: 'tag-priority' },
  ];

  let tasks = [];
  if (currentFilter === 'all') {
    tasks = [
      ...d.doing.map(t => ({ ...t, _cat: 'doing' })),
      ...d.pending.map(t => ({ ...t, _cat: 'pending' })),
      ...d.review.map(t => ({ ...t, _cat: 'review' }))
    ];
  } else if (currentFilter === 'priority') {
    tasks = d.priority.map(t => {
      let cat = 'pending';
      if (d.doing.find(x => x.id === t.id)) cat = 'doing';
      else if (d.review.find(x => x.id === t.id)) cat = 'review';
      return { ...t, _cat: cat };
    });
  } else {
    tasks = d[currentFilter].map(t => ({ ...t, _cat: currentFilter }));
  }

  const tagHtml = cats.map(c => `
    <span class="task-tag ${c.class} ${currentFilter === c.id ? 'active-filter' : ''}" 
          style="cursor:pointer; ${currentFilter !== 'all' && currentFilter !== c.id ? 'opacity:0.4' : ''}"
          onclick="app.filterModal('${c.id}')">
      ${c.label}: ${c.count}
    </span>
  `).join('');

  const taskHtml = tasks.length ? tasks.map((t, i) => {
    const taskID = t.ID || t.id;
    const taskUrl = `https://mqsoft.1office.vn/work-normal-normal/view?ID=${taskID}`;
    const isPriority = (d.priority || []).find(p => p.id === t.id);
    const catClass = t._cat === 'doing' ? 'tag-doing' : t._cat === 'review' ? 'tag-review' : 'tag-pending';
    const catLabel = t._cat === 'doing' ? 'Đang làm' : t._cat === 'review' ? 'Review' : 'Chờ';

    return `
      <div class="task-item" onclick="window.open('${taskUrl}', '_blank')">
        <div class="task-title" style="display:flex; gap:8px">
          <span style="opacity:0.5; font-family:var(--mono); font-size:0.75rem">#${i + 1}</span>
          <span>${t.title || t.name || '—'}</span>
        </div>
        <div class="task-meta">
          <span class="task-tag ${catClass}">${catLabel}</span>
          ${isPriority ? '<span class="task-tag tag-priority">Ưu tiên</span>' : ''}
        </div>
      </div>`;
  }).join('') : `<div class="empty-state">Không có task nào trong mục này</div>`;

  return `
    <div style="margin-bottom:1.5rem; display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center;">
      ${tagHtml}
      <button class="refresh-btn" onclick="app.exportPersonTasks()" style="background:#22c55e; color:white; border:none; padding:4px 10px; border-radius:4px; font-size:10px; font-weight:bold; cursor:pointer; height:28px; display:flex; align-items:center; gap:5px; margin-left:auto;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        XUẤT EXCEL
      </button>
    </div>
    <div>${taskHtml}</div>`;
}

// --- LOGIC ---
async function loadPersonnelStats(filteredStaff) {
  let overloadedNames = [];

  for (const s of filteredStaff) {
    const name = s.name;
    try {
      const [pending, doing, review, pDoing, pPending] = await Promise.all([
        fetchTasks([{ status: "PENDING", assign_ids: name }]),
        fetchTasks([{ status: "DOING", assign_ids: name }]),
        fetchTasks([{ status: "REVIEW", assign_ids: name }]),
        fetchTasks([{ status: "DOING", tag_ids: "Ưu tiên", assign_ids: name }]),
        fetchTasks([{ status: "PENDING", tag_ids: "Ưu tiên", assign_ids: name }]),
      ]);
      const priority = [...pDoing, ...pPending];
      state.staffData[name] = { pending, doing, review, priority };

      const row = document.getElementById('row-' + btoa(encodeURIComponent(name)));
      if (row) {
        const cells = row.querySelectorAll('.person-stat');
        cells[0].innerHTML = pending.length || '<span style="opacity:0.3">&mdash;</span>';
        cells[1].innerHTML = doing.length || '<span style="opacity:0.3">&mdash;</span>';
        cells[2].innerHTML = review.length || '<span style="opacity:0.3">&mdash;</span>';
        cells[3].innerHTML = priority.length ? `<span style="color:var(--red)">${priority.length}</span>` : '<span style="opacity:0.3">&mdash;</span>';

        // --- Workload Heatmap ---
        const totalActive = doing.length + pending.length;
        row.classList.remove('load-high', 'load-mid', 'load-low');
        if (doing.length >= 15 || priority.length >= 5) {
          row.classList.add('load-high');
          overloadedNames.push(name);
        } else if (doing.length >= 10 || totalActive >= 15) {
          row.classList.add('load-mid');
        } else if (doing.length > 0) {
          row.classList.add('load-low');
        }
      }
    } catch (e) {
      console.warn('Failed for', name, e);
    }
  }

  // --- Smart Alert Banner ---
  const banner = document.getElementById('alertBanner');
  const alertMsg = document.getElementById('alertMsg');
  if (overloadedNames.length > 0) {
    alertMsg.textContent = `\u26a0\ufe0f C\u1ea3nh b\u00e1o: ${overloadedNames.join(', ')} \u0111ang qu\u00e1 t\u1ea3i (\u2265 15 task \u0111ang l\u00e0m ho\u1eb7c 5+ \u01b0u ti\u00ean)!`;
    banner.classList.add('visible');
  } else {
    banner.classList.remove('visible');
  }
}

// --- HELPERS: Filtered Staff & Top Performers ---
function getFilteredStaff() {
  return staffList.filter(s => {
    const matchDept = state.currentDept === 'All' || s.dept === state.currentDept;
    const matchSearch = !state.searchText || s.name.toLowerCase().includes(state.searchText);
    return matchDept && matchSearch;
  });
}

function renderTopPerformers(completedToday) {
  // Count completions per person from today's completed tasks
  const countMap = {};
  (completedToday || []).forEach(t => {
    const name = t.assign_names || t.assign_ids || '';
    if (!name) return;
    // assign_names can be a comma-separated list
    name.split(',').forEach(n => {
      n = n.trim();
      if (n) countMap[n] = (countMap[n] || 0) + 1;
    });
  });

  const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const section = document.getElementById('topPerfSection');
  const list = document.getElementById('topPerfList');
  if (!section || !list) return;

  if (sorted.length === 0) {
    section.classList.remove('visible');
    return;
  }

  list.innerHTML = sorted.map(([name, count]) =>
    `<span class="top-perf-badge">${name} · ${count} task</span>`
  ).join('');
  section.classList.add('visible');
}

// --- GLOBAL APP OBJECT ---
window.app = {
  loadAll: async () => {
    const btn = document.getElementById('refreshBtn');
    btn.classList.add('loading');
    showToast('Đang tải dữ liệu...');

    try {
      const today = getTodayString();
      const [completed, created, waitTest, pending, doing, pDoing, pPending] = await Promise.all([
        fetchTasks([{ status: "COMPLETED", date_updated: today }]),
        fetchTasks([{ start: today }]),
        fetchTasks([{ status: "DOING", tag_ids: "Đã commit" }]),
        fetchTasks([{ status: "PENDING" }]),
        fetchTasks([{ status: "DOING" }]),
        fetchTasks([{ status: "DOING", tag_ids: "Ưu tiên" }]),
        fetchTasks([{ status: "PENDING", tag_ids: "Ưu tiên" }]),
      ]);

      const priorityTasks = [...pDoing, ...pPending];
      state.taskData = { completed, created, 'wait-test': waitTest, pending, doing, priority: priorityTasks };

      ['completed', 'created', 'waitTest', 'pending', 'doing', 'priority'].forEach((id, i) => {
        const val = [completed, created, waitTest, pending, doing, priorityTasks][i];
        const el = document.getElementById(`kpi-${id}`);
        if (el) el.textContent = val.totalCount || val.length;
      });

      // 2. Render Personnel List (Skeleton)
      const filteredStaff = getFilteredStaff();
      document.getElementById('staffCount').textContent = `${filteredStaff.length} người`;
      document.getElementById('personList').innerHTML = filteredStaff.map(renderPersonRow).join('');

      // 3. Render Initial Tab
      app.showTab(state.activeTab);

      // 4. Update Project Dropdown
      updateProjectDropdown();

      // 5. Render Top Performers
      renderTopPerformers(completed);

      // 6. Load detailed stats for visible personnel
      await loadPersonnelStats(filteredStaff);

      showToast('Cập nhật thành công!');
    } catch (e) {
      showToast('Lỗi kết nối API');
      console.error(e);
    }
    btn.classList.remove('loading');
  },

  showTab: (tab) => {
    state.activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));

    let items = state.taskData[tab] || [];

    // Apply Global Sorting based on creation date
    items = [...items].sort((a, b) => {
      const da = parse1OfficeDate(a.date_created || a.created || a.start || '').getTime();
      const db = parse1OfficeDate(b.date_created || b.created || b.start || '').getTime();
      return state.sortOrder === 'oldest' ? da - db : db - da;
    });

    // Apply Project Filter
    if (state.currentProject !== 'All') {
      items = items.filter(t => {
        const p = t.project_title || t.project_name || t.space_name || '';
        return p === state.currentProject;
      });
    }

    const list = document.getElementById('taskList');
    list.innerHTML = items.length ? items.map((t, i) => renderTaskItem(t, tab, i)).join('') : '<div class="empty-state">Không có task nào trong dự án này</div>';
  },

  filterByProject: (project) => {
    state.currentProject = project;
    app.showTab(state.activeTab);
  },

  toggleSort: () => {
    state.sortOrder = state.sortOrder === 'oldest' ? 'newest' : 'oldest';
    showToast(`Đã sắp xếp: ${state.sortOrder === 'oldest' ? 'Chậm lâu nhất' : 'Mới nhất'}`);
    app.showTab(state.activeTab);
  },

  exportTasks: () => {
    const today = getTodayString();
    let items = state.taskData[state.activeTab] || [];

    // Apply Project Filter
    if (state.currentProject !== 'All') {
      items = items.filter(t => (t.project_title || t.project_name || t.space_name || '') === state.currentProject);
    }

    if (!items.length) {
      showToast('Không có dữ liệu để xuất');
      return;
    }

    // CSV Header (Vietnamese with BOM for Excel support)
    const header = ['STT', 'Tiêu đề', 'Người thực hiện', 'Dự án', 'Trạng thái', 'Tags', 'Link 1Office'];
    const rows = items.map((t, i) => {
      const taskID = t.ID || t.id;
      const taskUrl = `https://mqsoft.1office.vn/work-normal-normal/view?ID=${taskID}`;

      return [
        i + 1,
        t.title || t.name || '',
        t.assign_names || t.assign_ids || '',
        t.project_title || t.project_name || t.space_name || '',
        state.activeTab,
        t.tag_names || '',
        taskUrl
      ];
    });

    const csvContent = "\uFEFF" + [header, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `Tasks_${state.activeTab}_${state.currentProject}_${today.replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Đang tải file Excel...');
  },

  exportPersonTasks: () => {
    const today = getTodayString();
    const name = state.currentModalStaff;
    const d = state.staffData[name];
    if (!d) return;

    let items = state.currentModalFilter === 'all'
      ? [...d.doing.map(t => ({ ...t, _cat: 'doing' })), ...d.pending.map(t => ({ ...t, _cat: 'pending' })), ...d.review.map(t => ({ ...t, _cat: 'review' }))]
      : d[state.currentModalFilter].map(t => ({ ...t, _cat: state.currentModalFilter }));

    if (state.currentModalFilter === 'priority') {
      items = d.priority.map(t => {
        let cat = 'pending';
        if (d.doing.find(x => x.id === t.id)) cat = 'doing';
        else if (d.review.find(x => x.id === t.id)) cat = 'review';
        else if (d.pending.find(x => x.id === t.id)) cat = 'pending';
        return { ...t, _cat: cat };
      });
    }

    if (!items.length) {
      showToast('Không có dữ liệu để xuất');
      return;
    }

    const header = ['STT', 'Tiêu đề', 'Trạng thái', 'Dự án', 'Link 1Office'];
    const rows = items.map((t, i) => {
      const taskID = t.ID || t.id;
      const taskUrl = `https://mqsoft.1office.vn/work-normal-normal/view?ID=${taskID}`;
      const statusLabel = t._cat === 'doing' ? 'Đang làm' : t._cat === 'review' ? 'Review' : 'Chờ';

      return [
        i + 1,
        t.title || t.name || '',
        statusLabel,
        t.project_title || t.project_name || t.space_name || '',
        taskUrl
      ];
    });

    const csvContent = "\uFEFF" + [header, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `Tasks_${name}_${state.currentModalFilter}_${today.replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Đang xuất danh sách ${name}...`);
  },

  filterByDept: (dept) => {
    state.currentDept = dept;
    // Reset search when switching dept
    state.searchText = '';
    const input = document.getElementById('staffSearch');
    if (input) input.value = '';
    app.loadAll();
  },

  // Real-time Staff Search
  searchStaff: (val) => {
    state.searchText = val.trim().toLowerCase();
    const filtered = getFilteredStaff();
    document.getElementById('staffCount').textContent = `${filtered.length} ng\u01b0\u1eddi`;
    document.getElementById('personList').innerHTML = filtered.map(renderPersonRow).join('');
    // Load stats for newly visible rows
    loadPersonnelStats(filtered);
  },

  showPersonDetail: (name) => {
    state.currentModalStaff = name;
    state.currentModalFilter = 'all';
    app.renderPersonDetail();
    document.getElementById('modalOverlay').classList.add('open');
  },

  filterModal: (cat) => {
    state.currentModalFilter = state.currentModalFilter === cat ? 'all' : cat;
    app.renderPersonDetail();
  },

  renderPersonDetail: () => {
    const name = state.currentModalStaff;
    const d = state.staffData[name];
    if (!d) return;
    document.getElementById('modalTitle').textContent = '👤 ' + name;
    document.getElementById('modalBody').innerHTML = renderModalContent(name, d, state.currentModalFilter);
  },

  closeModal: (e) => {
    if (e.target.id === 'modalOverlay') app.closeModalDirect();
  },

  closeModalDirect: () => {
    document.getElementById('modalOverlay').classList.remove('open');
  }
};

// --- HELPERS ---
function showToast(msg) {
  const t = document.getElementById('toast');
  const m = document.getElementById('toastMsg');
  if (t && m) {
    m.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }
}

// --- INIT ---
function init() {
  // Clock
  setInterval(() => {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('vi-VN');
    document.getElementById('date-display').textContent = now.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
  }, 1000);

  // Load Data
  app.loadAll();
  setInterval(app.loadAll, 5 * 60 * 1000);
}

function updateProjectDropdown() {
  // Use a Map to ensure unique tasks by ID
  const taskMap = new Map();
  Object.keys(state.taskData).forEach(key => {
    // Exclude 'priority' from uniqueness pool if we only want to count status-based tasks,
    // OR just take everything and unique by ID. Unique by ID is safer.
    state.taskData[key].forEach(t => {
      const id = t.ID || t.id;
      if (id) taskMap.set(id, t);
    });
  });

  const allUniqueTasks = Array.from(taskMap.values());
  const projects = new Set();

  allUniqueTasks.forEach(t => {
    const p = t.project_title || t.project_name || t.space_name;
    if (p) projects.add(p);
  });

  const select = document.getElementById('projectSelect');
  if (!select) return;

  const current = state.currentProject;
  let html = `<option value="All">Tất cả dự án (${allUniqueTasks.length})</option>`;

  Array.from(projects).sort().forEach(p => {
    const count = allUniqueTasks.filter(t => (t.project_title || t.project_name || t.space_name) === p).length;
    html += `<option value="${p}" ${p === current ? 'selected' : ''}>${p} (${count})</option>`;
  });

  select.innerHTML = html;
}

window.onload = init;
