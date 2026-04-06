/**
 * ANALYTICS — MQ Soft Performance Hub
 * Pure HTML/CSS charts — zero external dependencies (works with file://)
 */

'use strict';

// ─── CONFIG ───────────────────────────────────────────────
const ACCESS = '164726767694b476b9aa55371444621';
const BASE = 'https://mqsoft.1office.vn/api/work/task/gets';

const staffList = [
  { name: "Đoàn Văn Thiện", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Nguyễn Thành Long", dept: "Phòng Lập Trình" },
  { name: "Trần Thanh Tuấn", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Vũ Hữu Trùng Dương", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Lê Nhật Trường", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Nguyễn Phạm Nam An", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Nguyễn Phúc Văn", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "IT Thủ Đức 2", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "ITBV Thủ Đức", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Nguyễn Thanh Vinh", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Nguyễn Văn Thiện", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Lê Anh Vũ", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Triệu Anh Tú", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Trần Thanh Đạo", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Đặng Ngọc Trí", dept: "Phòng Triển Khai - Quản Lý Dự Án" },
  { name: "Nguyễn Mạnh Hoàng", dept: "Phòng Lập Trình" },
  { name: "NGÔ TẤN NGỌC", dept: "Phòng Lập Trình" },
  { name: "Phạm Đình Ngọc", dept: "Phòng Lập Trình" },
  { name: "Trần khánh Dư", dept: "Phòng Lập Trình" },
  { name: "Phạm Xuân Dũng", dept: "Phòng Lập Trình" },
  { name: "Lâm Hồng Phúc", dept: "Ban Giám Đốc" },
  { name: "Nguyễn Ngọc Sơn", dept: "Ban Giám Đốc" },
  { name: "Nguyễn Tấn Kỳ", dept: "Ban Giám Đốc" },
  { name: "Phan Văn Bảo An", dept: "Ban Giám Đốc" }
];

// ─── STATE ────────────────────────────────────────────────
const state = {
  period: 'week',
  deptFilter: 'All',
  ageFilter: 'all',  // all | green (<7d) | yellow (7-90d) | red (>90d)
  allStaffData: [],
  tasksByDay: {},    // dateStr (DD/MM/YYYY) → tasks[]
  staffTasks: {}     // staffName → sorted tasks[]
};

// ─── DATE HELPERS ─────────────────────────────────────────
function fmtVN(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function todayStr() { return fmtVN(new Date()); }

const VN_DAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** Last N days ending today (inclusive), oldest first */
function getLastNDays(n) {
  const result = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    result.push(d);
  }
  return result;
}

function getLast7Days() { return getLastNDays(7); }
function getLast30Days() { return getLastNDays(30); }

function parse1OfficeDate(str) {
  if (!str) return new Date(0);
  const parts = String(str).match(/(\d+)/g);
  if (!parts || parts.length < 3) return new Date(0);
  if (parts[0].length === 4) {
    const d = new Date(str); return isNaN(d) ? new Date(0) : d;
  }
  const [d, m, y, h, min, s] = parts;
  return new Date(y, m - 1, d, h || 0, min || 0, s || 0);
}

function daysSince(dateStr) {
  const d = parse1OfficeDate(dateStr);
  if (!d.getTime()) return 0;
  return (Date.now() - d.getTime()) / 86400000;
}

function daysLabel(days) {
  if (days < 1) return '< 1 ngày';
  if (days < 7) return `${Math.floor(days)} ngày`;
  if (days < 30) return `${Math.floor(days)} ngày`;
  if (days < 90) return `${Math.floor(days / 30)} tháng`;
  return `${Math.floor(days / 30)} tháng`;
}

// Ngưỡng màu: xanh < 7 ngày | vàng 7–90 ngày | đỏ > 90 ngày (3 tháng)
function dayClass(days) {
  if (days > 90) return 'days-red';
  if (days > 7) return 'days-yellow';
  return 'days-green';
}

function barColor(days) {
  if (days > 90) return '#f43f5e';
  if (days > 7) return '#f59e0b';
  return '#22c55e';
}

// ─── API ──────────────────────────────────────────────────
function buildUrl(filters) {
  return `${BASE}?access_token=${ACCESS}&limit=1000&filters=${encodeURIComponent(JSON.stringify(filters))}`;
}

async function fetchTasks(filters) {
  const res = await fetch(buildUrl(filters));
  const data = await res.json();
  const items = data?.data?.items || data?.items || data?.data || [];
  if (data?.total_item !== undefined) items.totalCount = data.total_item;
  return items;
}

// ─── LOADING ──────────────────────────────────────────────
function hideLoading(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('done');
}
function showLoading(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('done');
}

// ─── TOAST ────────────────────────────────────────────────
function toast(msg) {
  const t = document.getElementById('toast');
  const m = document.getElementById('toastMsg');
  if (!t || !m) return;
  m.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── KPI HELPERS ──────────────────────────────────────────
function setKpi(id, value, sub) {
  const el = document.getElementById(`kv-${id}`);
  if (!el) return;
  if (value === null) { el.innerHTML = '<div class="skel-line"></div>'; return; }
  el.textContent = value;
  if (sub !== undefined) {
    const subEl = document.getElementById(`ks-${id}`);
    if (subEl) subEl.textContent = sub;
  }
}

function computeTopPerformer(tasks) {
  const map = {};
  tasks.forEach(t => {
    const name = (t.assign_names || t.assign_ids || '').trim();
    if (!name) return;
    name.split(',').forEach(n => { n = n.trim(); if (n) map[n] = (map[n] || 0) + 1; });
  });
  const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
  return top ? { name: top[0], count: top[1] } : null;
}

// ─── PERIOD SELECTOR ──────────────────────────────────────
function setPeriod(period) {
  state.period = period;
  document.querySelectorAll('.period-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.period === period)
  );
  loadTimeline(period);
}

// ─── TIMELINE LOAD ────────────────────────────────────────
async function loadTimeline(period) {
  const el = document.getElementById('timelineChart');
  if (el) el.innerHTML = '';
  state.tasksByDay = {};
  showLoading('timelineLoading');
  setKpi('total', null); setKpi('avg', null); setKpi('best', null); setKpi('top', null);

  try {
    if (period === 'week') await runWeek();
    else if (period === 'month') await runMonth();
  } catch (e) {
    toast('Lỗi tải dữ liệu: ' + e.message);
    console.error(e);
    hideLoading('timelineLoading');
  }
}

// ─── LAST 7 DAYS ──────────────────────────────────────────
async function runWeek() {
  const dates = getLast7Days();
  const labels = dates.map(d => `${VN_DAY[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`);
  const dateStrs = dates.map(d => fmtVN(d));
  document.getElementById('loadingMsg').textContent = 'Đang tải 7 ngày gần nhất...';

  const results = await Promise.all(
    dates.map(d => fetchTasks([{ status: 'COMPLETED', date_updated: fmtVN(d) }]).catch(() => []))
  );

  let allTasks = [];
  const counts = results.map((tasks, i) => {
    state.tasksByDay[dateStrs[i]] = Array.isArray(tasks) ? [...tasks] : [];
    allTasks.push(...tasks);
    return tasks.totalCount ?? tasks.length;
  });

  const total = counts.reduce((a, b) => a + b, 0);
  const avg = (total / dates.length).toFixed(1);
  const bestI = counts.indexOf(Math.max(...counts));
  const top = computeTopPerformer(allTasks);

  setKpi('total', total, '7 ngày gần nhất');
  setKpi('avg', avg, 'tasks / ngày');
  setKpi('best', counts[bestI], labels[bestI] ?? '—');
  setKpi('top', top ? top.name.split(' ').pop() : '—', top ? `${top.count} tasks` : '');

  const t = document.getElementById('chartTitle');
  if (t) t.textContent = '7 Ngày Gần Nhất — Click cột để xem chi tiết';

  renderTimelineChart(labels, counts, dateStrs);
}

// ─── LAST 30 DAYS ─────────────────────────────────────────
async function runMonth() {
  const dates = getLast30Days();
  const labels = dates.map(d => `${d.getDate()}/${d.getMonth() + 1}`);
  const dateStrs = dates.map(d => fmtVN(d));
  const counts = new Array(dates.length).fill(0);
  let allTasks = [];

  const t = document.getElementById('chartTitle');
  if (t) t.textContent = '30 Ngày Gần Nhất — Click cột để xem chi tiết';

  const BATCH = 7;
  for (let i = 0; i < dates.length; i += BATCH) {
    const slice = dates.slice(i, i + BATCH);
    document.getElementById('loadingMsg').textContent =
      `Đang tải ngày ${i + 1}–${Math.min(i + BATCH, dates.length)} / ${dates.length}...`;

    const batchRes = await Promise.all(
      slice.map(d => fetchTasks([{ status: 'COMPLETED', date_updated: fmtVN(d) }]).catch(() => []))
    );
    batchRes.forEach((tasks, j) => {
      counts[i + j] = tasks.totalCount ?? tasks.length;
      state.tasksByDay[dateStrs[i + j]] = Array.isArray(tasks) ? [...tasks] : [];
      allTasks.push(...tasks);
    });

    renderTimelineChart(labels.slice(0, i + BATCH), counts.slice(0, i + BATCH), dateStrs.slice(0, i + BATCH));
  }

  const total = counts.reduce((a, b) => a + b, 0);
  const avg = (total / dates.length).toFixed(1);
  const bestI = counts.indexOf(Math.max(...counts));
  const top = computeTopPerformer(allTasks);

  setKpi('total', total, '30 ngày gần nhất');
  setKpi('avg', avg, 'tasks / ngày');
  setKpi('best', counts[bestI], labels[bestI] ?? '—');
  setKpi('top', top ? top.name.split(' ').pop() : '—', top ? `${top.count} tasks` : '');
}

// ─── RENDER: Vertical bar chart (CSS) ─────────────────────
function renderTimelineChart(labels, data, dateStrs = []) {
  const el = document.getElementById('timelineChart');
  if (!el) return;
  hideLoading('timelineLoading');

  const maxVal = Math.max(...data, 1);

  el.innerHTML = `
    <div class="chart-v-bars">
      ${data.map((val, i) => {
    const pct = (val / maxVal) * 100;
    const ds = dateStrs[i] || '';
    const clickable = val > 0 && ds;
    return `
          <div class="v-bar-col${clickable ? ' v-bar-clickable' : ''}"
               ${clickable ? `onclick="showDayDetail('${ds}','${labels[i]}')" title="Xem ${val} task ngày ${labels[i]}"` : ''}>
            <span class="v-bar-val">${val > 0 ? val : ''}</span>
            <div class="v-bar-fill" style="height:${pct}%"></div>
          </div>`;
  }).join('')}
    </div>
    <div class="chart-v-labels">
      ${labels.map(l => `<span>${l}</span>`).join('')}
    </div>`;
}

// ─── MODAL: Task detail for a day ─────────────────────────
function showDayDetail(dateStr, label) {
  const tasks = state.tasksByDay[dateStr] || [];
  const overlay = document.getElementById('detailOverlay');
  const titleEl = document.getElementById('detailTitle');
  const content = document.getElementById('detailContent');
  if (!overlay || !titleEl || !content) return;

  titleEl.textContent = `✓ ${label} — ${tasks.length} task hoàn thành`;

  if (!tasks.length) {
    content.innerHTML = '<div class="modal-empty">Không có dữ liệu chi tiết cho ngày này.</div>';
  } else {
    content.innerHTML = tasks.map((t, i) => {
      const taskID = t.ID || t.id || '';
      const taskUrl = `https://mqsoft.1office.vn/work-normal-normal/view?ID=${taskID}`;
      const assignee = (t.assign_names || t.assign_ids || '').trim();
      const project = (t.project_title || t.project_name || t.space_name || '').trim();

      return `
        <a href="${taskUrl}" target="_blank" rel="noopener" class="task-link-row">
          <div class="tlr-num">#${i + 1}</div>
          <div class="tlr-info">
            <div class="tlr-title">${t.title || t.name || '—'}</div>
            <div class="tlr-meta">
              ${assignee ? `<span>👤 ${assignee}</span>` : ''}
              ${project ? `<span>📁 ${project}</span>` : ''}
            </div>
          </div>
          <div class="tlr-arrow">→</div>
        </a>`;
    }).join('');
  }

  overlay.classList.add('open');
}

function closeDetailModal(e) {
  if (!e || e.target === document.getElementById('detailOverlay')) {
    document.getElementById('detailOverlay')?.classList.remove('open');
  }
}

// --- MODAL: Staff task detail ---
function showStaffDetail(name) {
  const allTasks = state.staffTasks[name] || [];
  const overlay  = document.getElementById('detailOverlay');
  const titleEl  = document.getElementById('detailTitle');
  const content  = document.getElementById('detailContent');
  if (!overlay || !titleEl || !content) return;

  // Áp dụng age filter để modal hiện đúng nhóm task đang xem
  const now = Date.now();
  const age = state.ageFilter;
  const tasks = allTasks.filter(t => {
    if (age === 'all') return true;
    const created = parse1OfficeDate(t.date_created || t.created || '');
    const days = (now - created.getTime()) / 86400000;
    if (age === 'green')  return days < 7;
    if (age === 'yellow') return days >= 7 && days < 90;
    if (age === 'red')    return days >= 90;
    return true;
  });

  const ageLabel = { all: 'tất cả', green: '< 7 ngày', yellow: '7 – 90 ngày', red: '> 3 tháng' };
  titleEl.textContent = '\uD83D\uDC64 ' + name + ' \u2014 ' + tasks.length + ' task [' + (ageLabel[age] || 'tất cả') + ']';

  const statusColor = { PENDING: '#f59e0b', DOING: '#22c55e', REVIEW: '#a855f7' };
  const statusLabel = { PENDING: 'Ch\u1EDD', DOING: '\u0110ang l\u00E0m', REVIEW: 'Review' };

  if (!tasks.length) {
    content.innerHTML = '<div class="modal-empty">Kh\u00F4ng c\u00F3 task n\u00E0o trong kho\u1EA3ng th\u1EDDi gian n\u00E0y!</div>';
  } else {
    content.innerHTML = tasks.map(function(t, i) {
      var taskID  = t.ID || t.id || '';
      var taskUrl = 'https://mqsoft.1office.vn/work-normal-normal/view?ID=' + taskID;
      var project = (t.project_title || t.project_name || t.space_name || '').trim();
      var created = parse1OfficeDate(t.date_created || t.created || '');
      var days = created.getTime() ? Math.floor((now - created.getTime()) / 86400000) : 0;
      var status = t._status || 'PENDING';
      var sc = statusColor[status] || '#888';
      var sl = statusLabel[status] || status;
      var dc = dayClass(days);
      return '<a href="' + taskUrl + '" target="_blank" rel="noopener" class="task-link-row">' +
        '<div class="tlr-num">#' + (i + 1) + '</div>' +
        '<div class="tlr-info">' +
        '<div class="tlr-title">' + (t.title || t.name || '\u2014') + '</div>' +
        '<div class="tlr-meta">' +
        '<span style="color:' + sc + ';border:1px solid ' + sc + '55;background:' + sc + '11;padding:1px 7px;border-radius:3px;font-size:0.62rem;font-family:var(--mono);">' + sl + '</span>' +
        (project ? '<span>\uD83D\uDCC1 ' + project + '</span>' : '') +
        (days > 0 ? '<span class="' + dc + '" style="font-family:var(--mono);font-size:0.62rem;">\uD83D\uDD52 ' + days + ' ng\u00E0y</span>' : '') +
        '</div>' +
        '</div>' +
        '<div class="tlr-arrow">\u2192</div>' +
        '</a>';
    }).join('');
  }

  overlay.classList.add('open');
}



// ─── STAFF DISTRIBUTION ───────────────────────────────────
async function loadStaffDistribution() {
  showLoading('staffLoading');
  state.allStaffData = [];

  const el = document.getElementById('staffChart');
  if (el) el.innerHTML = '';

  const toLoad = state.deptFilter === 'All'
    ? staffList
    : staffList.filter(s => s.dept === state.deptFilter);

  const BATCH = 3; // 3 người × 3 API calls = 9 concurrent
  let done = 0;

  for (let i = 0; i < toLoad.length; i += BATCH) {
    const slice = toLoad.slice(i, i + BATCH);

    const batchResult = await Promise.all(slice.map(async s => {
      try {
        // Gộp cả 3 trạng thái
        const [pending, doing, review] = await Promise.all([
          fetchTasks([{ status: 'PENDING', assign_ids: s.name }]).catch(() => []),
          fetchTasks([{ status: 'DOING', assign_ids: s.name }]).catch(() => []),
          fetchTasks([{ status: 'REVIEW', assign_ids: s.name }]).catch(() => []),
        ]);

        // Merge và deduplicate theo ID
        const allRaw = [
          ...pending.map(t => ({ ...t, _status: 'PENDING' })),
          ...doing.map(t => ({ ...t, _status: 'DOING' })),
          ...review.map(t => ({ ...t, _status: 'REVIEW' })),
        ];
        const seen = new Set();
        const tasks = allRaw.filter(t => {
          const id = t.ID || t.id;
          if (id && seen.has(String(id))) return false;
          if (id) seen.add(String(id));
          return true;
        });

        const now = Date.now();
        let totalDays = 0, validCount = 0;
        tasks.forEach(t => {
          const created = parse1OfficeDate(t.date_created || t.created || '');
          const ms = now - created.getTime();
          if (ms > 0) { totalDays += ms / 86400000; validCount++; }
        });

        // Lưu tasks cho modal chi tiết (sắp xếp cũ nhất lên đầu)
        state.staffTasks[s.name] = [...tasks].sort((a, b) => {
          const da = parse1OfficeDate(a.date_created || a.created || '').getTime();
          const db = parse1OfficeDate(b.date_created || b.created || '').getTime();
          return da - db;
        });

        return {
          name: s.name, dept: s.dept,
          count: tasks.length,
          avgDays: validCount > 0 ? totalDays / validCount : 0
        };
      } catch {
        return { name: s.name, dept: s.dept, count: 0, avgDays: 0 };
      }
    }));

    done += slice.length;
    batchResult.forEach(r => state.allStaffData.push(r));

    const msgEl = document.getElementById('staffLoadingMsg');
    if (msgEl) msgEl.textContent = `Đang phân tích (${done}/${toLoad.length})...`;

    renderStaffTable(filterStaffData());
  }

  renderStaffChartAndTable();
}

// Có tính đến cả dept lẫn age filter, trả về cả breakdown theo status
function getAgeFilteredData() {
  const now = Date.now();
  const dept = state.deptFilter;
  const age  = state.ageFilter;

  function matchAge(t) {
    if (age === 'all') return true;
    const created = parse1OfficeDate(t.date_created || t.created || '');
    const days = (now - created.getTime()) / 86400000;
    if (age === 'green')  return days < 7;
    if (age === 'yellow') return days >= 7 && days < 90;
    if (age === 'red')    return days >= 90;
    return true;
  }

  return state.allStaffData
    .filter(s => dept === 'All' || s.dept === dept)
    .map(s => {
      const raw      = state.staffTasks[s.name] || [];
      const filtered = age === 'all' ? raw : raw.filter(matchAge);
      let totalDays = 0, validCount = 0;
      let pending = 0, doing = 0, review = 0;
      filtered.forEach(t => {
        const created = parse1OfficeDate(t.date_created || t.created || '');
        const ms = now - created.getTime();
        if (ms > 0) { totalDays += ms / 86400000; validCount++; }
        if (t._status === 'PENDING') pending++;
        else if (t._status === 'DOING') doing++;
        else if (t._status === 'REVIEW') review++;
        else pending++; // default
      });
      return {
        name: s.name, dept: s.dept,
        count: filtered.length,
        pending, doing, review,
        avgDays: validCount > 0 ? totalDays / validCount : 0
      };
    })
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count);
}

// Giữ lại filterStaffData để tương thích với các chỗ gọi cũ
function filterStaffData() { return getAgeFilteredData(); }

// Người dùng click button lọc tuổi task
function filterAge(age) {
  state.ageFilter = age;
  document.querySelectorAll('.age-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.age === age)
  );
  if (state.allStaffData.length > 0) renderStaffChartAndTable();
}

// ─── RENDER: Stacked bar chart (PENDING / DOING / REVIEW) ──
function renderStaffChart(data) {
  const el = document.getElementById('staffChart');
  if (!el) return;

  const visible = data.filter(s => s.count > 0);
  const maxCount = Math.max(...visible.map(s => s.count), 1);

  const sub = document.getElementById('staffChartSub');
  const total = visible.reduce((a, b) => a + b.count, 0);
  if (sub) sub.textContent = visible.length
    ? `${visible.length} người · ${total} tasks`
    : 'Không có dữ liệu';

  if (!visible.length) {
    hideLoading('staffLoading');
    el.innerHTML = '<div class="chart-empty">Không có người nào có task đang chờ</div>';
    return;
  }

  el.innerHTML = visible.map(s => {
    const total100 = s.count || 1;
    const pPct = Math.round((s.pending / total100) * 100);
    const dPct = Math.round((s.doing   / total100) * 100);
    const rPct = Math.round((s.review  / total100) * 100);
    // bar width relative to maxCount
    const barW = Math.round((s.count / maxCount) * 100);
    const safeName = s.name.replace(/'/g, "\\'");
    return `
      <div class="sb-row sb-clickable" onclick="showStaffDetail('${safeName}')" title="${s.name}: ${s.pending} chờ · ${s.doing} đang làm · ${s.review} review">
        <span class="sb-name">${s.name}</span>
        <div class="sb-track">
          <div class="sb-bar-outer" style="width:${barW}%">
            ${s.pending > 0 ? `<div class="sb-seg sb-pending" style="flex:${s.pending}" title="Chờ: ${s.pending}"></div>` : ''}
            ${s.doing   > 0 ? `<div class="sb-seg sb-doing"   style="flex:${s.doing}"   title="Đang làm: ${s.doing}"></div>` : ''}
            ${s.review  > 0 ? `<div class="sb-seg sb-review"  style="flex:${s.review}"  title="Review: ${s.review}"></div>` : ''}
          </div>
          <span class="sb-total">${s.count}</span>
        </div>
        <div class="sb-breakdown">
          ${s.pending > 0 ? `<span class="sb-chip sb-chip-p">${s.pending}</span>` : ''}
          ${s.doing   > 0 ? `<span class="sb-chip sb-chip-d">${s.doing}</span>`   : ''}
          ${s.review  > 0 ? `<span class="sb-chip sb-chip-r">${s.review}</span>`  : ''}
        </div>
      </div>`;
  }).join('');

  hideLoading('staffLoading');
}

// renderStaffTable replaced — ranking now in pie legend
function renderStaffTable(data) {
  // no-op — ranking integrated into pie chart legend
}

function renderStaffChartAndTable() {
  const data = getAgeFilteredData();
  updateStaffSubtitle(data);
  renderStaffChart(data);
  renderStaffTable(data);
  renderPieChart(data);
}

// ─── TAB SWITCHER (right panel) ───────────────────────────
function switchRightTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab)
  );
  document.querySelectorAll('.tab-panel').forEach(p => {
    const isTarget = p.id === `tabPanel-${tab}`;
    p.classList.toggle('hidden', !isTarget);
  });
}

// ─── DONUT PIE CHART (SVG, zero deps) ─────────────────────
const PIE_PALETTE = [
  '#22c55e','#f59e0b','#f43f5e','#38bdf8','#a78bfa',
  '#fb923c','#34d399','#f472b6','#facc15','#60a5fa',
  '#4ade80','#c084fc','#fb7185','#2dd4bf','#fbbf24',
  '#818cf8','#86efac','#fda4af','#67e8f9','#fde68a',
  '#a5f3fc','#ddd6fe','#fecaca','#bbf7d0'
];

function renderPieChart(data) {
  const svg = document.getElementById('pieChartSvg');
  const legend = document.getElementById('pieLegend');
  const centerVal = document.getElementById('pieCenterVal');
  if (!svg || !legend || !centerVal) return;

  const visible = data.filter(s => s.count > 0);
  const total = data.reduce((a, b) => a + b.count, 0);

  // Update right panel subtitle
  const sub = document.getElementById('staffTableSub');
  const ageMap = { all: 'Tất cả', green: '< 7 ngày', yellow: '7 – 90 ngày', red: '> 3 tháng' };
  if (sub) sub.textContent = visible.length
    ? `${visible.length} người · ${total} tasks [${ageMap[state.ageFilter] || ''}]`
    : 'Đang tải...';

  if (!visible.length) {
    svg.innerHTML = '';
    legend.innerHTML = '<div class="chart-empty">Không có dữ liệu</div>';
    centerVal.textContent = '0';
    return;
  }

  centerVal.textContent = total;

  const R = 80;
  const r = 52;
  const cx = 100, cy = 100;
  const circumference = 2 * Math.PI * R;
  const gap = 2;

  let svgContent = '';
  svgContent += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none"
    stroke="rgba(255,255,255,0.04)" stroke-width="${R - r}"/>`;

  let offset = 0;
  const slices = visible.map((s, i) => {
    const pct = s.count / total;
    const dash = Math.max(0, circumference * pct - gap);
    const space = circumference - dash;
    const color = PIE_PALETTE[i % PIE_PALETTE.length];
    const slice = { s, pct, dash, space, offset, color, i };
    offset += circumference * pct;
    return slice;
  });

  slices.forEach(({ s, dash, space, offset: off, color }) => {
    const safeName = s.name.replace(/'/g, "\\'");
    svgContent += `
      <circle
        class="pie-slice"
        cx="${cx}" cy="${cy}" r="${R}"
        fill="none"
        stroke="${color}"
        stroke-width="${R - r}"
        stroke-dasharray="${dash} ${space}"
        stroke-dashoffset="${-off}"
        onclick="showStaffDetail('${safeName}')"
        title="${s.name}: ${s.count} tasks (${(s.count/total*100).toFixed(1)}%)"
      />`;
  });

  svgContent += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0b1120"/>`;
  svg.innerHTML = svgContent;

  // Ranking legend (tich hop so thu hang)
  legend.innerHTML = slices.map(({ s, color, pct, i }) => {
    const safeName = s.name.replace(/'/g, "\\'");
    const pctStr = (pct * 100).toFixed(1) + '%';
    const rank = i + 1;
    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    const rankClass = rank <= 3 ? 'pie-rank-top' : 'pie-rank-num';
    return `
      <div class="pie-legend-item" onclick="showStaffDetail('${safeName}')" title="#${rank} ${s.name}: ${s.count} tasks">
        <span class="${rankClass}">${rankEmoji}</span>
        <span class="pie-legend-dot" style="background:${color};"></span>
        <span class="pie-legend-name">${s.name}</span>
        <span class="pie-legend-count" style="color:${color}">${s.count}</span>
        <span class="pie-legend-pct">${pctStr}</span>
      </div>`;
  }).join('');
}

function updateStaffSubtitle(data) {
  // subtitle handled inside renderPieChart now
}

// ─── DEPT FILTER ──────────────────────────────────────────
function filterDept(dept) {
  state.deptFilter = dept;
  if (state.allStaffData.length > 0) renderStaffChartAndTable();
}

// ─── MAIN LOAD ────────────────────────────────────────────
async function loadAll() {
  const btn = document.getElementById('refreshBtn');
  if (btn) btn.classList.add('loading');
  toast('Đang tải dữ liệu...');

  await Promise.all([
    loadTimeline(state.period),
    loadStaffDistribution()
  ]);

  if (btn) btn.classList.remove('loading');
  toast('Cập nhật thành công!');
}

// ─── CLOCK ────────────────────────────────────────────────
function startClock() {
  const tick = () => {
    const now = new Date();
    const cl = document.getElementById('clock');
    const dd = document.getElementById('date-display');
    if (cl) cl.textContent = now.toLocaleTimeString('vi-VN');
    if (dd) dd.textContent = now.toLocaleDateString('vi-VN', {
      weekday: 'short', day: '2-digit', month: '2-digit'
    });
  };
  tick();
  setInterval(tick, 1000);
}

// ─── INIT ─────────────────────────────────────────────────
window.onload = () => {
  startClock();
  loadAll();
  setInterval(loadAll, 10 * 60 * 1000);
};
