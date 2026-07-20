import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCEL_PATH = path.resolve(__dirname, '../data/UngHoThi.xlsx');
const OUTPUT_DIR = path.resolve(__dirname, '../src/data');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'contributors.json');

// Hàm tự động tính toán các công thức toán học cơ bản (vd: =500+580)
function evalSimpleFormula(val) {
  if (typeof val !== 'string' || !val.startsWith('=')) {
    return null;
  }
  
  // Loại bỏ dấu '=' và khoảng trắng
  const expr = val.substring(1).replace(/\s+/g, '');
  
  // Chỉ cho phép các phép tính toán học cơ bản giữa các số thực
  if (/^[0-9+\-*/().]+$/.test(expr)) {
    try {
      // Eval an toàn thông qua khởi tạo hàm mới
      const result = Function(`"use strict"; return (${expr})`)();
      if (typeof result === 'number' && !isNaN(result)) {
        return result;
      }
    } catch (e) {
      console.warn(`⚠️ Không thể tự động tính toán biểu thức: ${val}. Lỗi: ${e.message}`);
    }
  }
  return null;
}

function syncData() {
  console.log('🔄 Đang đồng bộ dữ liệu từ Excel...');
  try {
    if (!fs.existsSync(EXCEL_PATH)) {
      console.error(`❌ Không tìm thấy file Excel tại: ${EXCEL_PATH}`);
      return;
    }

    // Đọc workbook
    const workbook = xlsx.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Thu thập toàn bộ các ô để kiểm tra công thức nếu giá trị trả về là rỗng
    const list = [];
    let totalSum = 0;
    
    // Sử dụng sheet_to_json để duyệt dễ dàng hơn, 
    // nhưng chúng ta sẽ đọc trực tiếp từ các cell của sheet để lấy công thức (.f) nếu giá trị (.v) là None/null
    const range = xlsx.utils.decode_range(worksheet['!ref']);
    
    // Dòng 0 là headers. Tìm các cột tương ứng
    let colSTT = 0;
    let colName = 1;
    let colAmount = 2;
    
    // Đọc headers
    const headers = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = xlsx.utils.encode_cell({ r: range.s.r, c: col });
      const cell = worksheet[cellRef];
      headers.push(cell ? cell.v : null);
    }
    
    console.log('Headers phát hiện:', headers);

    // Duyệt qua các dòng dữ liệu từ dòng index 1 trở đi
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      const cellSTT = worksheet[xlsx.utils.encode_cell({ r, c: colSTT })];
      const cellName = worksheet[xlsx.utils.encode_cell({ r, c: colName })];
      const cellAmount = worksheet[xlsx.utils.encode_cell({ r, c: colAmount })];
      
      // Bỏ qua dòng trống
      if (!cellSTT && !cellName && !cellAmount) continue;
      
      const stt = cellSTT ? cellSTT.v : (r - range.s.r);
      const name = cellName ? String(cellName.v).trim() : null;
      
      if (!name) continue; // Bỏ qua nếu không có tên
      
      // Đọc giá trị số tiền
      let rawAmount = null;
      if (cellAmount) {
        if (cellAmount.v !== undefined && cellAmount.v !== null) {
          rawAmount = cellAmount.v;
        } else if (cellAmount.f) {
          // Có công thức nhưng không có cached value
          rawAmount = '=' + cellAmount.f;
        }
      }
      
      let amount = null;
      let status = 'active';
      let note = '';
      
      // Xử lý giá trị số tiền
      if (typeof rawAmount === 'number') {
        amount = rawAmount * 1000;
        totalSum += amount;
      } else if (typeof rawAmount === 'string') {
        // Kiểm tra xem có phải công thức toán học không
        if (rawAmount.startsWith('=')) {
          const evaled = evalSimpleFormula(rawAmount);
          if (evaled !== null) {
            amount = evaled * 1000;
            totalSum += amount;
            rawAmount = evaled; // cập nhật lại rawAmount thành số đã tính toán
          } else {
            note = rawAmount;
            status = 'refunded';
          }
        } else {
          // Kiểm tra xem chuỗi có phải là số viết ở dạng string không
          const parsed = parseFloat(rawAmount.replace(/[,.]/g, ''));
          if (!isNaN(parsed)) {
            amount = parsed * 1000;
            totalSum += amount;
          } else {
            note = rawAmount;
            status = 'refunded';
          }
        }
      }
      
      list.push({
        stt: typeof stt === 'number' ? stt : parseInt(stt) || (r - range.s.r),
        name,
        amount,
        rawAmount,
        status,
        note
      });
    }

    // Tạo thư mục đầu ra nếu chưa có
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const outputData = {
      updatedAt: new Date().toISOString(),
      totalAmount: totalSum,
      totalContributors: list.filter(item => item.status === 'active').length,
      contributors: list
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(outputData, null, 2), 'utf-8');
    console.log(`✅ Đồng bộ thành công! Đã ghi ${list.length} dòng dữ liệu vào ${OUTPUT_PATH}`);
    console.log(`📊 Tổng số tiền: ${totalSum.toLocaleString('vi-VN')} VND từ ${outputData.totalContributors} người ủng hộ.`);
  } catch (error) {
    console.error('❌ Lỗi khi đồng bộ dữ liệu:', error);
  }
}

// Chạy trực tiếp
syncData();

// Nếu có flag --watch thì theo dõi file
if (process.argv.includes('--watch')) {
  console.log(`👀 Đang theo dõi thay đổi của file Excel: ${EXCEL_PATH}`);
  const watcher = chokidar.watch(EXCEL_PATH, {
    persistent: true,
    ignoreInitial: true
  });

  watcher.on('change', () => {
    console.log('⚡ File Excel thay đổi. Đang tự động cập nhật...');
    setTimeout(syncData, 500);
  });
}
