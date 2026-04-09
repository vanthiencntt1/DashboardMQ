// ─── CONFIG ──────────────────────────────────────────────
const COLORS = ['#4f8ef7', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee', '#fb923c', '#e879f9'];


const sheets = [
  { id: 1, name: 'BV Buôn Ma Thuột', url: 'https://docs.google.com/spreadsheets/d/1JscdsQpUdIi4DS6XgBhTMIo9AZmh8-NGj_IUQSQxH9Y', status: '', data: [] },
  { id: 2, name: 'BV ĐH Y Dược TPHCM - CS2', url: 'https://docs.google.com/spreadsheets/d/1ihVIivZ1hYaXicQg-9v4jU9ztxaY7PFhu9TM7oXazi8', status: '', data: [] },
  { id: 3, name: 'BV Đa khoa Tân Tạo', url: 'https://docs.google.com/spreadsheets/d/1T55e5arCjK5ODenO9IDMTBgo-qAipxNCF32e8Qs6Ap0', status: '', data: [] },
  { id: 4, name: 'BV Đa Khoa Nhà Bè', url: 'https://docs.google.com/spreadsheets/d/16ufPA_95iTE9i9RQ_uytNKA6kgC2-Sdge3Q6KIFftxM', status: '', data: [] },
  { id: 5, name: 'BV Đa khoa Củ Chi', url: 'https://docs.google.com/spreadsheets/d/1SVDsyr4b_9gA02tmtveUb_mNU-B_YZJT0PAb2877w7o', status: '', data: [] },
  { id: 6, name: 'BV Đa Khoa Bạc Liêu', url: 'https://docs.google.com/spreadsheets/d/1tOS2Oe5t9misvXd1NrsRHqEhSxjT5AoKGMPZR4l64h0', status: '', data: [] },
  { id: 7, name: 'BV An Bình', url: 'https://docs.google.com/spreadsheets/d/1aieOePVTkANARGgWl0HUUos9MV1-JIT2uP541iaYF_w', status: '', data: [] },
  { id: 8, name: 'BV Đa khoa Thủ Đức', url: 'https://docs.google.com/spreadsheets/d/13ATUVK5bqA1IuEi_kj_X2TxBAVQ3MQbTaiD7h3dNaGs', status: '', data: [] },
  { id: 9, name: 'NỘI BỘ MQ', url: 'https://docs.google.com/spreadsheets/d/1TCVf1LAYbDrQcd2zfHLxMZ1CrprdFqYFrpckyre_MJI', status: '', data: [] },
];

let activeSheetId = 1;
let autoTimer = null;
let timelineChart = null;
let isAutoActive = false;

// ─── FETCH / PARSE ────────────────────────────────────
function extractId(url) {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  return m ? m[1] : null;
}
function extractGid(url) {
  const m = url.match(/[#&?]gid=(\d+)/);
  return m ? m[1] : '0';
}
function gvizUrl(sheetId, gid) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}&headers=1`;
}

async function fetchSheet(sheet) {
  const id = extractId(sheet.url);
  if (!id) throw new Error('Link không hợp lệ');
  const gid = extractGid(sheet.url);
  const url = gvizUrl(id, gid);
  return new Promise((resolve, reject) => {
    const cb = 'gvizcb_' + Math.floor(Math.random() * 1e7);
    window[cb] = function (data) {
      delete window[cb];
      document.head.removeChild(script);
      try { resolve(parseGvizData(data)); } catch (e) { reject(e); }
    };
    const script = document.createElement('script');
    script.src = url.replace('out:json', 'out:json;responseHandler:' + cb);
    script.onerror = () => {
      delete window[cb];
      document.head.removeChild(script);
      reject(new Error('Lỗi mạng, kiểm tra lại kết nối'));
    };
    document.head.appendChild(script);
  });
}

function parseGvizData(data) {
  if (data.status === 'error') throw new Error(data.errors?.[0]?.message || 'Lỗi đọc dữ liệu');
  const table = data.table;
  if (!table || !table.cols) return [];
  const norm = s => String(s || '').trim().toLowerCase()
    .replace('thời gian', 'thoigian').replace('nhân viên', 'nhanvien')
    .replace('nội dung', 'noidung').replace('link hình ảnh', 'linkhinhanh')
    .replace('linkhinhảnh', 'linkhinhanh');
  let headers = table.cols.map(c => norm(c.label));
  let start = 0;
  if (headers.every(h => !h) && table.rows.length > 0) {
    headers = table.rows[0].c.map(cell => norm(cell ? (cell.f || cell.v) : ''));
    start = 1;
  }
  const rows = [];
  for (let i = start; i < table.rows.length; i++) {
    const row = {}; const rData = table.rows[i].c; let hasData = false;
    if (rData) headers.forEach((h, idx) => {
      if (!h) return;
      const cell = rData[idx];
      let val = cell != null ? String(cell.f || cell.v || '').trim() : '';
      row[h] = val; if (val) hasData = true;
    });
    if (hasData) {
      if (!row.noidung && row.linkhinhanh && rows.length > 0) {
        let prevRow = rows[rows.length - 1];
        if (prevRow.nhanvien === row.nhanvien) {
          prevRow.linkhinhanh = prevRow.linkhinhanh ? prevRow.linkhinhanh + ',' + row.linkhinhanh : row.linkhinhanh;
          continue;
        }
      } else if (row.noidung && rows.length > 0) {
        let prevRow = rows[rows.length - 1];
        if (!prevRow.noidung && prevRow.linkhinhanh && prevRow.nhanvien === row.nhanvien) {
          row.linkhinhanh = row.linkhinhanh ? prevRow.linkhinhanh + ',' + row.linkhinhanh : prevRow.linkhinhanh;
          rows.pop();
        }
      }
      rows.push(row);
    }
  }
  return rows;
}

// ─── DATE ─────────────────────────────────────────────
function parseDate(str) {
  if (!str?.trim()) return null;
  const s = str.trim();
  let m;
  if ((m = s.match(/(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return new Date(+m[5], +m[4] - 1, +m[3], +m[1], +m[2]);
  if ((m = s.match(/(\d{4})-(\d{2})-(\d{2})/))) return new Date(+m[1], +m[2] - 1, +m[3]);
  if ((m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/))) return new Date(+m[3], +m[2] - 1, +m[1]);
  return null;
}
function filterByDays(rows, days) {
  const cutoff = Date.now() - days * 86400000;
  return rows.filter(r => { const d = parseDate(r.thoigian || r.time || r.date || ''); return d && d.getTime() >= cutoff; });
}

// ─── ANALYSIS ─────────────────────────────────────────
function countStaff(rows) {
  const c = {};
  rows.forEach(r => { const n = (r.nhanvien || r.staff || r.user || '').trim(); if (n) c[n] = (c[n] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10);
}
function countErrors(rows) {
  const c = {};
  rows.forEach(r => {
    let raw = (r.noidung || r.content || '').toLowerCase();
    if (!isErrorMsg(raw)) return;
    
    // Loại bỏ dấu câu và từ nối (STOP words) để kéo các từ quan trọng lại gần nhau
    let txt = raw.replace(/[.,:;"'!?()[\]{}\-\/\\]/g, ' ').replace(/\s+/g, ' ').trim();
    if (typeof STOP !== 'undefined') {
      txt = txt.split(' ').filter(w => !STOP.has(w)).join(' ');
    }

    ERROR_KW.forEach(kw => {
      let idx = txt.indexOf(kw);
      if (idx !== -1) {
        // Cắt lấy Keyword + tối đa 2 từ liền kề sau nó (vì từ tiếng Việt hay ghép 2 âm tiết. vd: lỗi + máy + in)
        let words = txt.slice(idx).split(' ');
        let len = kw.split(' ').length + 2; 
        let phrase = words.slice(0, len).join(' ').trim();
        
        if (phrase) {
          // Viết hoa chữ đầu cho đẹp nhãn biểu đồ
          phrase = phrase.charAt(0).toUpperCase() + phrase.slice(1);
          c[phrase] = (c[phrase] || 0) + 1;
        }
      }
    });
  });
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10);
}
function buildTimeline(rows, days) {
  const map = {};
  rows.forEach(r => {
    const d = parseDate(r.thoigian || r.time || r.date || '');
    if (!d) return;
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    map[k] = (map[k] || 0) + 1;
  });
  const labels = [], data = [], now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    labels.push(k.slice(5)); data.push(map[k] || 0);
  }
  return { labels, data };
}


// Build repeated-error map WITH original messages
function buildRepeatMap(rows) {
  const map = {};
  const errorRows = rows.filter(r => isErrorMsg(r.noidung));
  errorRows.forEach(r => {
    const key = getCorePattern(r.noidung);
    if (!map[key]) map[key] = { count: 0, pattern: key, sample: r.noidung, messages: [] };
    map[key].count++;
    if (map[key].messages.length < 20) map[key].messages.push(r);
  });
  return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 15);
}

// ─── RENDER HELPERS ──────────────────────────────────
function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function renderBarList(items, offset = 0) {
  if (!items.length) return '<div class="no-data">Không có dữ liệu</div>';
  const max = items[0][1];
  return items.map(([label, count], i) => `
    <div class="bar-row">
      <div class="bar-rank">#${i + 1}</div>
      <div class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(count / max * 100)}%;background:${COLORS[(i + offset) % COLORS.length]}"></div></div>
      <div class="bar-num">${count}</div>
    </div>`).join('');
}

function renderTimeline(rows, days) {
  if (typeof Chart === 'undefined') return;
  const { labels, data } = buildTimeline(rows, days);
  const canvas = document.getElementById('tlCanvas');
  if (!canvas) return;
  if (timelineChart) timelineChart.destroy();
  timelineChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Tin nhắn',
        data,
        backgroundColor: ctx => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
          g.addColorStop(0, 'rgba(79,142,247,0.7)');
          g.addColorStop(1, 'rgba(79,142,247,0.1)');
          return g;
        },
        borderColor: '#4f8ef7',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(10,16,32,0.9)', titleColor: '#f1f5f9', bodyColor: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 } },
      scales: {
        x: { ticks: { color: '#475569', font: { size: 10, family: 'Inter' }, maxTicksLimit: 20 }, grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false } },
        y: { ticks: { color: '#475569', font: { size: 10, family: 'Inter' } }, grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }, beginAtZero: true }
      },
      animation: { duration: 600, easing: 'easeOutQuart' }
    }
  });
}

// ─── REPEAT ERRORS DETAILED RENDER ───────────────────
function renderRepeatErrors(rows) {
  const repeatList = buildRepeatMap(rows);
  if (!repeatList.length) return '<div class="no-data">Không phát hiện lỗi lặp lại.</div>';

  return repeatList.map((item, idx) => `
    <div class="repeat-card" id="rcard-${idx}">
      <div class="repeat-header" onclick="toggleRepeat(${idx})">
        <div class="repeat-count">
          <div class="repeat-count-num">${item.count}</div>
          <div class="repeat-count-label">lần</div>
        </div>
        <div class="repeat-info">
          <div class="repeat-pattern" title="${escapeHtml(item.pattern)}">${escapeHtml(item.pattern)}</div>
          <div class="repeat-sample">${escapeHtml(item.sample)}</div>
          <div class="repeat-meta">
            <span class="repeat-tag">🔁 Lặp ${item.count} lần</span>
            <span class="repeat-tag" style="background:rgba(59,130,246,0.1);color:#60a5fa;border-color:rgba(59,130,246,0.2)">📋 ${item.messages.length} bản ghi</span>
          </div>
        </div>
        <div class="repeat-expand-btn" id="rexpand-${idx}">▼</div>
      </div>
      <div class="repeat-details" id="rdetails-${idx}">
        <div class="repeat-details-inner">
          <div class="repeat-details-title">📋 Chi tiết ${item.messages.length} tin nhắn liên quan</div>
          <div class="repeat-msg-list">
            ${item.messages.map(r => `
              <div class="repeat-msg-item">
                <div class="repeat-msg-meta">
                  <span class="repeat-msg-staff">👤 ${escapeHtml((r.nhanvien || 'Không rõ').trim())}</span>
                  <span class="repeat-msg-time">🕒 ${escapeHtml((r.thoigian || '').trim())}</span>
                </div>
                <div class="repeat-msg-text">${escapeHtml(r.noidung || '')}</div>
                <div class="repeat-msg-images">
                  ${r.linkhinhanh && r.linkhinhanh.includes('http') ? r.linkhinhanh.split(',').filter(url => url.includes('http')).map((url, i, arr) => `<a href="${escapeHtml(url.trim())}" target="_blank" class="err-img-link">🖼️ Xem hình${arr.length > 1 ? ' ' + (i + 1) : ''}</a>`).join(' ') : ''}
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`).join('');
}

function toggleRepeat(idx) {
  const card = document.getElementById(`rcard-${idx}`);
  const details = document.getElementById(`rdetails-${idx}`);
  if (!card || !details) return;
  const isOpen = card.classList.contains('expanded');
  card.classList.toggle('expanded', !isOpen);
  details.classList.toggle('open', !isOpen);
}

// ─── RENDER ERROR LOG ─────────────────────────────────
function renderErrorDetails(rows) {
  const errorRows = rows.filter(r => isErrorMsg(r.noidung));
  if (!errorRows.length) return '<div class="no-data">Không ghi nhận tin nhắn báo lỗi nào trong khoảng thời gian này.</div>';
  return [...errorRows].reverse().map(r => `
    <div class="err-item">
      <div class="err-header">
        <div class="err-staff">👤 ${escapeHtml((r.nhanvien || 'Không rõ').trim())}</div>
        <div class="err-time">🕒 ${escapeHtml((r.thoigian || '').trim())}</div>
      </div>
      <div class="err-desc">${escapeHtml(r.noidung || '')}</div>
      <div class="err-images">
        ${r.linkhinhanh && r.linkhinhanh.includes('http') ? r.linkhinhanh.split(',').filter(url => url.includes('http')).map((url, i, arr) => `<a href="${escapeHtml(url.trim())}" target="_blank" class="err-img-link">🖼️ Xem hình${arr.length > 1 ? ' ' + (i + 1) : ''}</a>`).join(' ') : ''}
      </div>
    </div>`).join('');
}

// ─── SIDEBAR ──────────────────────────────────────────
function renderSidebar() {
  const el = document.getElementById('sheetList');
  if (!el) return;
  el.innerHTML = sheets.map((s, i) => `
    <div class="sheet-item ${s.id === activeSheetId ? 'active' : ''}" onclick="selectSheet(${s.id})">
      <div class="sheet-dot" style="background:${COLORS[i % COLORS.length]}"></div>
      <div class="sheet-info">
        <div class="sheet-name">${s.name}</div>
        <div class="sheet-rows">${s.data?.length ? s.data.length + ' tin nhắn' : s.status === 'error' ? 'Lỗi dữ liệu' : 'Chưa tải'}</div>
      </div>
    </div>`).join('');
}

function selectSheet(id) {
  if (activeSheetId === id) return;
  activeSheetId = id;
  renderSidebar();
  runAnalysis();
}

// ─── MAIN ANALYSIS ────────────────────────────────────
async function runAnalysis() {
  const btn = document.getElementById('analyzeBtn');
  if (!btn) return;
  btn.innerHTML = '<span class="spin"></span>Đang tải...';
  btn.disabled = true;

  const sheet = sheets.find(s => s.id === activeSheetId);
  const titleEl = document.querySelector('.page-title');
  if (titleEl) titleEl.textContent = 'Báo cáo: ' + sheet.name;

  sheet.status = 'loading';
  renderSidebar();

  try {
    sheet.data = await fetchSheet(sheet);
    sheet.status = 'ok';
  } catch (e) {
    sheet.status = 'error';
    sheet.data = [];
    console.warn(sheet.name, e.message);
  }
  renderSidebar();

  const days = parseInt(document.getElementById('dayRange')?.value || '30');
  const rows = filterByDays(sheet.data || [], days);
  const staffCounts = countStaff(rows);
  const errorCounts = countErrors(rows);
  const uniqueStaff = new Set(rows.map(r => (r.nhanvien || '').trim()).filter(Boolean)).size;
  const errorRows = rows.filter(r => isErrorMsg(r.noidung));

  const main = document.getElementById('mainContent');
  if (!main) return;

  if (sheet.status === 'error' || rows.length === 0) {
    main.innerHTML = `
      <div class="empty">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">${sheet.status === 'error' ? 'Không thể đọc dữ liệu' : 'Không có tin nhắn nào'}</div>
        <div class="empty-sub">${sheet.status === 'error' ? 'Hãy chắc chắn Sheet đã bật "Anyone with link → Viewer"' : 'Bệnh viện không có hoạt động nào trong chu kỳ vừa qua.'}</div>
      </div>`;
    btn.innerHTML = '▶ Phân tích';
    btn.disabled = false;
    if (timelineChart) { timelineChart.destroy(); timelineChart = null; }
    return;
  }

  main.innerHTML = `
    <!-- Metrics -->
    <div class="metrics">
      <div class="metric-card blue-accent">
        <div class="metric-label"><span class="metric-icon">💬</span>Tổng tin nhắn</div>
        <div class="metric-value">${rows.length.toLocaleString()}</div>
        <div class="metric-sub">${days} ngày gần nhất</div>
      </div>
      <div class="metric-card rose-accent">
        <div class="metric-label"><span class="metric-icon">⚠️</span>Tin lỗi</div>
        <div class="metric-value">${errorRows.length.toLocaleString()}</div>
        <div class="metric-sub">${((errorRows.length / rows.length) * 100).toFixed(1)}% tổng tin nhắn</div>
      </div>
      <div class="metric-card emerald-accent">
        <div class="metric-label"><span class="metric-icon">👤</span>Nhân sự</div>
        <div class="metric-value">${uniqueStaff}</div>
        <div class="metric-sub">người tham gia chat</div>
      </div>
      <div class="metric-card amber-accent">
        <div class="metric-label"><span class="metric-icon">🔁</span>Lỗi lặp lại</div>
        <div class="metric-value">${buildRepeatMap(rows).length}</div>
        <div class="metric-sub">mẫu lỗi khác nhau</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-title"><div class="chart-title-left">⚠️ Vấn đề phổ biến nhất</div></div>
        ${renderBarList(errorCounts, 0)}
      </div>
      <div class="chart-card">
        <div class="chart-title"><div class="chart-title-left">👥 Nhân sự hoạt động nhiều</div></div>
        ${renderBarList(staffCounts, 3)}
      </div>
    </div>

    <!-- Timeline -->
    <div class="chart-card">
      <div class="chart-title"><div class="chart-title-left">📈 Hoạt động theo ngày</div></div>
      <div class="timeline-wrap"><canvas id="tlCanvas"></canvas></div>
    </div>

    <!-- AI Analysis Card -->
    <div class="chart-card ai-card" id="aiCard" style="display:none;">
      <div class="ai-card-header">
        <span class="ai-badge">✨ Gemini AI</span>
        <span class="ai-model-tag">${AI_MODEL}</span>
      </div>
      <div class="ai-content" id="aiResult"></div>
    </div>

    <!-- Repeat Errors – DETAILED -->
    <div class="chart-card">
      <div class="chart-title">
        <div class="chart-title-left">🔁 Lỗi lặp lại chi tiết <span class="section-badge badge-danger">${buildRepeatMap(rows).length} mẫu</span></div>
        <button class="ai-btn" onclick="analyzeWithAI()">✨ Phân tích AI</button>
      </div>
      <div class="repeat-grid" id="repeatGrid">
        ${renderRepeatErrors(rows)}
      </div>
    </div>

  `;

  renderTimeline(rows, days);
  const lu = document.getElementById('lastUpdated');
  if (lu) lu.textContent = 'Cập nhật ' + new Date().toLocaleTimeString('vi-VN');
  btn.innerHTML = '▶ Phân tích';
  btn.disabled = false;
}


// ─── AUTO REFRESH ─────────────────────────────────────
function toggleAuto() {
  const btn = document.getElementById('autoBtn');
  if (isAutoActive) {
    clearInterval(autoTimer);
    isAutoActive = false;
    btn.textContent = '⟳ Live Updates';
    btn.classList.remove('active');
  } else {
    isAutoActive = true;
    btn.textContent = '⏸ Auto Syncing...';
    btn.classList.add('active');
    runAnalysis();
    autoTimer = setInterval(runAnalysis, 5 * 60 * 1000);
  }
}

// ─── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderSidebar();
  runAnalysis();
});
