const ERROR_KW = [
  // 1. Dấu hiệu lỗi trực tiếp
  'lỗi', 'bug', 'sai', 'hỏng', 'treo', 'chết', 'văng', 'đơ', 'đứng', 'chậm', 'delay', 'vấn đề', 
  'không', 'chưa', 'thiếu', 'mất', 'nhầm', 'chờ', 'kẹt',
  
  // 2. Yêu cầu hỗ trợ, tùy chỉnh, nâng cấp
  'nhờ', 'giúp', 'xem', 'kiểm tra', 'check', 'coi', 'chỉnh', 'thêm', 'cập nhật', 'update', 'đổi', 'mở', 'reset', 'cấp', 'cho', 'tạo',
  
  // 3. Nghiệp vụ Bệnh viện (HIS) - Hễ nhắc tới thường là hỏi nghiệp vụ
  'bhyt', 'bảo hiểm', 'xml', 'viện phí', 'thanh toán', 'biên lai', 'hdđt', 'hóa đơn', 'tạm ứng',
  'kê toa', 'đơn thuốc', 'chỉ định', 'cls', 'xn', 'xét nghiệm', 'siêu âm', 'pacs', 'kq', 'kết quả', 'bệnh án', 'tường trình',
  'kho', 'dược', 'vật tư', 'cấp phát', 'thẻ', 'lô',
  'tiếp nhận', 'đăng ký', 'nội trú', 'ngoại trú', 'chuyển tuyến', 'chuyển viện',
  'báo cáo', 'chốt', 'thống kê', 'phân quyền', 'mật khẩu', 'user', 'tài khoản', 'ký số', 'in', 'form', 'phiếu'
];

const IGNORE_KW = [
  // Các câu phản hồi đã hoàn thành của team IT
  'đã check', 'đã kiểm tra', 'đã xử lý', 'đã fix', 'đã sửa', 'đã báo', 'đã xong', 'đã update', 'hoàn thành', 'đã mở'
];

function isErrorMsg(text) {
  const t = (text || '').toLowerCase();
  if (!t) return false;
  
  // 1. Lọc rác và tin nhắn xác nhận ngắn gọn của nhân sự (IT/User)
  if (/^(ok|oke|dạ|vâng|rồi|xong|chờ xíu|đang xử lý|đang check)[\s.!]*$/.test(t)) return false;
  
  // 2. Lọc các câu IT báo cáo ĐÃ làm xong
  if (IGNORE_KW.some(kw => t.includes(kw))) return false;

  // 3. Chỉ cần khớp ngữ cảnh công việc là lấy
  return ERROR_KW.some(kw => t.includes(kw));
}

const STOP = new Set(['và', 'có', 'của', 'là', 'để', 'cho', 'trong', 'với', 'theo', 'được', 'này', 'đó', 'ở', 'anh', 'em', 'ok', 'ạ', 'nhé', 'thì', 'nha', 'a', 'e', 'r', 'k', 'mà', 'sếp', 'oke', 'okay', 'đã', 'cần', 'về', 'vào', 'lên', 'ra', 'xem', 'giúp', 'tôi', 'bạn', 'họ', 'mình', 'đây', 'đấy', 'rồi', 'như', 'hay', 'cũng', 'vẫn', 'xuống', 'bên', 'dưới', 'trên', 'nên', 'phải', 'khi', 'lúc', 'vừa', 'đang', 'sẽ', 'vì', 'nếu', 'nhưng', 'hoặc', 'còn', 'rất', 'quá', 'lắm', 'kia', 'đi', 'cái', 'hộ', 'nhờ', 'giùm', 'lun']);

const ERROR_CATEGORIES = [
  { name: '💰 Nhóm Viện phí / BHYT / Thanh toán', kw: ['bhyt', 'bảo hiểm', 'xml', 'giám định', 'cổng', 'thanh toán', 'viện phí', 'hóa đơn', 'thu tiền', 'biên lai', 'hdđt', 'tạm ứng', 'miễn giảm', 'chi phí', 'phí'] },
  { name: '🩺 Nhóm Khám bệnh / Cận lâm sàng', kw: ['kê toa', 'đơn thuốc', 'chỉ định', 'cls', 'xét nghiệm', 'xn', 'siêu âm', 'x-quang', 'pacs', 'phác đồ', 'khám', 'bệnh án', 'kết luận', 'sinh hiệu', 'tường trình', 'kq', 'kết quả', 'ft4', 'miễn dịch'] },
  { name: '💊 Nhóm Kho Dược / Vật tư y tế', kw: ['kho', 'vật tư', 'thuốc', 'cấp phát', 'nhập kho', 'xuất kho', 'thẻ kho', 'dược', 'hết thuốc', 'tồn kho', 'lô hạn', 'hoạt chất'] },
  { name: '📝 Nhóm Tiếp nhận / Hành chính', kw: ['tiếp nhận', 'đăng ký', 'số thứ tự', 'gọi loa', 'nội trú', 'ngoại trú', 'chuyển tuyến', 'chuyển viện', 'nhập viện', 'xuất viện', 'cccd', 'thông tin bn', 'pid', 'stt'] },
  { name: '📊 Nhóm Báo cáo / Phân quyền / Ký số', kw: ['báo cáo', 'chốt', 'thống kê', 'phân quyền', 'mật khẩu', 'tài khoản', 'đăng nhập', 'sai dữ liệu', 'user', 'hết hạn', 'ký số', 'token'] },
  { name: '💻 Nhóm Hệ thống / Mạng / In ấn', kw: ['treo', 'crash', 'chết', 'văng', 'đơ', 'đứng', 'mạng', 'network', 'chậm', 'delay', 'quay', 'timeout', 'server', 'load', 'in', 'máy in', 'print', 'máy tính'] },
  { name: '⚙️ Yêu cầu hỗ trợ / Tùy chỉnh hệ thống', kw: ['cập nhật', 'update', 'chỉnh form', 'thêm mới', 'sửa chức năng', 'hỗ trợ', 'nhờ', 'kiểm tra', 'check', 'xem lại', 'fix', 'xuống dòng', 'format'] }
];

// Lọc lấy cốt lõi lỗi theo nhóm chức năng (Group Pattern Extractor)
function getCorePattern(text) {
  let s = (text || '').toLowerCase();

  // 1. Phân loại theo rule TỪ KHÓA CHÍNH (Xếp nhóm bao quát)
  for (let cat of ERROR_CATEGORIES) {
    if (cat.kw.some(k => s.includes(k))) return cat.name;
  }

  // 2. Nếu nằm ngoài các nhóm trên, tạo tên nhóm động (bỏ bớt rác)
  s = s.replace(/\b(pid|mã bn|mã bệnh nhân|bn|hsba|id|mã|phòng|khoa|user|bác sĩ|bs)\s*[:=]?\s*\w+/g, '');
  s = s.replace(/\d+/g, '');
  s = s.replace(/[.,:;"'!?()[\]{}\-\/\\]/g, ' ');
  let words = s.split(/\s+/).filter(w => w.length > 0 && !STOP.has(w));

  let pattern = words.join(' ').trim();
  return pattern ? "⚠️ Vấn đề khác: " + pattern : 'Trường hợp không xác định';
}
