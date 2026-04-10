const AI_MODEL = 'gemini-flash-latest';
const CHIASEGPU_MODEL = 'gpt-4.1';
const CHIASEGPU_ENDPOINT = 'https://llm.chiasegpu.vn/v1/chat/completions';

// ─── TOGGLE PROVIDER UI ────────────────────────────────
function toggleAIProviderUI() {
  const provider = document.getElementById('aiProvider')?.value || 'gemini';
  const isGemini = provider === 'gemini';
  document.getElementById('geminiKeyWrap').style.display = isGemini ? '' : 'none';
  document.getElementById('chiasegpuKeyWrap').style.display = isGemini ? 'none' : '';
  document.getElementById('geminiHint').style.display = isGemini ? '' : 'none';
  document.getElementById('chiasegpuHint').style.display = isGemini ? 'none' : '';
}

// ─── AI ANALYSIS ──────────────────────────────────────
async function analyzeWithAI() {
  const provider = document.getElementById('aiProvider')?.value || 'gemini';
  const card = document.getElementById('aiCard');
  const result = document.getElementById('aiResult');
  if (!card || !result) return;

  const providerLabel = provider === 'chiasegpu' ? '🤖 GPT-4.1 đang phân tích...' : '✨ Gemini AI đang phân tích dữ liệu lỗi...';
  card.style.display = 'block';
  result.innerHTML = `
    <div class="ai-thinking">
      <span>${providerLabel}</span>
      <div class="ai-dots"><span></span><span></span><span></span></div>
    </div>`;

  const sheet = sheets.find(s => s.id === activeSheetId);
  const days = parseInt(document.getElementById('dayRange')?.value || '30');
  const rows = filterByDays(sheet.data || [], days);
  const errorChat = rows.filter(r => isErrorMsg(r.noidung)).slice(-50);

  if (!errorChat.length) {
    result.innerHTML = '<div style="color:#94a3b8">Không có đủ dữ liệu lỗi để AI phân tích.</div>';
    return;
  }

  const repeatList = buildRepeatMap(rows);
  const repeatSummary = repeatList.slice(0, 8).map(r => `- Lặp ${r.count} lần: "${r.sample}"`).join('\n');
  const chatSample = errorChat.map(r => `[${r.thoigian}] ${r.nhanvien}: ${r.noidung}`).join('\n');

  const prompt = `Bạn là chuyên gia phân tích hệ thống phần mềm bệnh viện tại Việt Nam.

Tên bệnh viện: ${sheet.name}
Chu kỳ phân tích: ${days} ngày gần nhất
Tổng tin nhắn lỗi: ${errorChat.length}

=== TOP LỖI LẶP LẠI ===
${repeatSummary}

=== MẪU TIN NHẮN LỖI ===
${chatSample}

Hãy thực hiện phân tích chuyên sâu:

**1. TOP 3 VẤN ĐỀ NGHIÊM TRỌNG NHẤT** (dựa trên tần suất và mức độ ảnh hưởng)
**2. ĐÁNH GIÁ NGUYÊN NHÂN** (Bug phần mềm / Người dùng chưa quen / Cấu hình sai)
**3. ĐỀ XUẤT ƯU TIÊN XỬ LÝ** (ngắn gọn, cụ thể, thực thi được ngay)
**4. CẢNH BÁO RỦI RO** (nếu vấn đề không được giải quyết)

Trả lời bằng tiếng Việt, súc tích, có cấu trúc rõ ràng.`;

  try {
    let text = '';

    if (provider === 'chiasegpu') {
      // ── ChiaSeGPU (OpenAI-compatible) ──────────────
      let apiKey = document.getElementById('chiasegpuApiKey')?.value?.trim() || '';
      if (!apiKey) throw new Error('Vui lòng nhập ChiaSeGPU API Key vào sidebar.');

      const res = await fetch(CHIASEGPU_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: CHIASEGPU_MODEL,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'Lỗi ChiaSeGPU API');
      text = data.choices?.[0]?.message?.content || '';

    } else {
      // ── Google Gemini ──────────────────────────────
      let apiKey = document.getElementById('geminiApiKey')?.value?.trim() || '';
      if (!apiKey) apiKey = 'AIzaSyD48vtw8_xZYo09B1AzHaXkcP_HYc7Yh9Y';

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'Lỗi Gemini API');
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    result.innerHTML = formatAIResponse(text) + `
      <div style="margin-top: 24px; text-align: right; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
        <button onclick="exportReportToWord()" class="btn" style="background:#2563eb; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; font-weight:500;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          Xuất báo cáo Word (.doc)
        </button>
      </div>`;
  } catch (err) {
    console.error(err);
    result.innerHTML = `<span style="color:#fb7185">❌ Lỗi: ${escapeHtml(err.message)}</span>`;
  }
}

function formatAIResponse(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]+?<\/li>)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

window.exportReportToWord = function () {
  const resultDiv = document.getElementById('aiResult');
  if (!resultDiv) return;

  // Clone (phục vụ việc xóa nút mà không làm mất trên UI)
  const clone = resultDiv.cloneNode(true);

  // Tìm và xóa khối button div (nằm cuối cùng, căn lề phải)
  const btnDivs = clone.querySelectorAll('div[style*="text-align: right"]');
  btnDivs.forEach(el => el.remove());

  const hospital = sheets.find(s => s.id === activeSheetId)?.name || 'Bệnh_Viện';
  const timeStr = new Date().toLocaleString('vi-VN');

  // Đóng gói HTML vào chuẩn Namespace của Office Word
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Báo Cáo AI</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #000; }
        h3 { color: #1e40af; margin-top: 18pt; font-size: 14pt; border-bottom: 1px dashed #ccc; padding-bottom: 4px; }
        ul { padding-left: 24px; margin-top: 4px; }
        li { margin-bottom: 6pt; }
        p { margin-bottom: 12pt; }
        strong { font-weight: bold; }
      </style>
    </head>
    <body>
      <h2 style="text-align:center; color:#0f172a; font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom:2px;">
        BÁO CÁO PHÂN TÍCH NHẬT KÝ HỆ THỐNG
      </h2>
      <h3 style="text-align:center; margin-top:0; border:none; color:#1e40af; font-size: 15pt;">Đơn vị: ${hospital}</h3>
      <p style="text-align:right; font-style: italic; color: #475569;">Thời gian chốt báo cáo: ${timeStr}</p>
      
      <hr style="border: 0; border-top: 2px solid #1e40af; margin-bottom: 20px;">
      
      <!-- KẾT QUẢ TỪ AI -->
      ${clone.innerHTML}
      
      <p style="margin-top: 40px; font-style: italic; font-size: 11pt; color: #64748b; text-align: center;">
        - Báo cáo phân tích chuyên sâu được tự động khởi tạo bởi Hệ thống AI LogZalo -
      </p>
    </body>
    </html>
  `;

  // Dùng \ufeff (BOM) để Word hiểu đúng UTF-8 Tiếng Việt
  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `BaoCao_AI_${hospital.replace(/\s+/g, '_')}_${new Date().getTime()}.doc`;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
