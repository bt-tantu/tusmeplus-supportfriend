import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { exec } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom plugin to watch Excel and sync data during development
function excelSyncPlugin() {
  return {
    name: 'excel-sync-plugin',
    configureServer(server) {
      const excelPath = path.resolve(__dirname, 'data/UngHoThi.xlsx');
      const scriptPath = path.resolve(__dirname, 'scripts/sync.js');
      
      // Chạy sync lần đầu khi khởi động dev server
      console.log('🚀 [Vite Sync] Đang đồng bộ dữ liệu Excel lần đầu...');
      exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ [Vite Sync] Lỗi khởi tạo: ${error.message}`);
          return;
        }
        console.log(`✅ [Vite Sync] ${stdout.trim()}`);
      });

      // Theo dõi file Excel
      server.watcher.add(excelPath);
      server.watcher.on('change', (filePath) => {
        if (filePath.endsWith('UngHoThi.xlsx')) {
          console.log('⚡ [Vite Sync] Phát hiện file Excel thay đổi. Đang đồng bộ...');
          // Đợi 500ms để Excel hoàn tất ghi file tránh lỗi locked file trên Windows
          setTimeout(() => {
            exec(`node "${scriptPath}"`, (error, stdout) => {
              if (error) {
                console.error(`❌ [Vite Sync] Lỗi: ${error.message}`);
                return;
              }
              console.log(`✅ [Vite Sync] ${stdout.trim()}`);
            });
          }, 500);
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), excelSyncPlugin()],
})

