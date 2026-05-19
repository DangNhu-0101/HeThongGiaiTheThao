// scripts/generateExcelTemplate.js (đã thêm dữ liệu mẫu cho tất cả sheet)
import exceljs from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_DIR = path.join(__dirname, '../../templates');

if (!fs.existsSync(TEMPLATE_DIR)) fs.mkdirSync(TEMPLATE_DIR, { recursive: true });

function styleHeader(ws) {
    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E78' } };
    header.alignment = { vertical: 'middle', horizontal: 'center' };
    header.height = 30;
}

function addValidation(ws, column, values) {
    for (let row = 2; row <= 100; row++) {
        const cell = ws.getCell(`${column}${row}`);
        cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`"${values.join(',')}"`],
            showDropDown: true
        };
    }
}

async function generate() {
    const wb = new exceljs.Workbook();

    // ==================== SHEET 1: NGƯỜI DÙNG ====================
    const wsUser = wb.addWorksheet('Người dùng');
    wsUser.columns = [
        { header: 'username*', width: 15 },
        { header: 'email*', width: 25 },
        { header: 'phoneNumber*', width: 15 },
        { header: 'password*', width: 20 },
        { header: 'role', width: 12 },
        { header: 'status', width: 12 }
    ];
    styleHeader(wsUser);
    addValidation(wsUser, 'E', ['player', 'referee', 'org']);
    addValidation(wsUser, 'F', ['active', 'inactive', 'banned']);
    wsUser.addRow(['john_doe', 'john@example.com', '0123456789', '123456', 'player', 'active']);
    wsUser.addRow(['jane_doe', 'jane@example.com', '0987654321', '123456', 'player', 'active']);
    wsUser.addRow(['admin_org', 'org@example.com', '0912345678', '123456', 'org', 'active']);

    // ==================== SHEET 2: GIẢI ĐẤU ====================
    const wsTour = wb.addWorksheet('Giải đấu');
    wsTour.columns = [
        { header: 'name*', width: 25 },
        { header: 'description', width: 30 },
        { header: 'sport*', width: 15 },
        { header: 'venue*', width: 25 },
        { header: 'timeOpen*', width: 20 },
        { header: 'timeClose', width: 20 },
        { header: 'location', width: 30 }
    ];
    styleHeader(wsTour);
    wsTour.addRow(['Giải Pickleball 2025', 'Giải đấu pickleball nội bộ', 'Pickleball', 'HM Sport', '2025-06-01', '2025-06-30', 'Vũng Tàu']);
    wsTour.addRow(['Giải Tennis 2025', 'Giải đấu tennis mở rộng', 'Tennis', 'CLB Tennis A', '2025-07-01', '2025-07-31', 'TP.HCM']);

    // ==================== SHEET 3: ĐỘI ====================
    const wsTeam = wb.addWorksheet('Đội');
    wsTeam.columns = [
        { header: 'name*', width: 20 },
        { header: 'tournamentName*', width: 25 },
        { header: 'sportType*', width: 15 },
        { header: 'categoryId', width: 10 },
        { header: 'ownerUsername*', width: 15 },
        { header: 'status', width: 12 }
    ];
    styleHeader(wsTeam);
    addValidation(wsTeam, 'C', ['Pickleball', 'Tennis', 'Badminton', 'Soccer']);
    addValidation(wsTeam, 'F', ['pending', 'active', 'inactive']);
    wsTeam.addRow(['Đội Alpha', 'Giải Pickleball 2025', 'Pickleball', 'MD', 'john_doe', 'active']);
    wsTeam.addRow(['Đội Beta', 'Giải Pickleball 2025', 'Pickleball', 'XD', 'jane_doe', 'pending']);
    wsTeam.addRow(['Đội Gamma', 'Giải Tennis 2025', 'Tennis', 'MS', 'john_doe', 'active']);

    // ==================== SHEET 4: CẦU THỦ ====================
    const wsPlayer = wb.addWorksheet('Cầu thủ');
    wsPlayer.columns = [
        { header: 'username*', width: 15 },
        { header: 'displayName*', width: 20 },
        { header: 'birthYear*', width: 12 },
        { header: 'gender', width: 8 },
        { header: 'skillLevel', width: 10 }
    ];
    styleHeader(wsPlayer);
    addValidation(wsPlayer, 'D', ['male', 'female', 'other']);
    addValidation(wsPlayer, 'E', ['1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0']);
    wsPlayer.addRow(['john_doe', 'John Doe', 1990, 'male', '3.5']);
    wsPlayer.addRow(['jane_doe', 'Jane Doe', 1992, 'female', '3.0']);
    wsPlayer.addRow(['mike_smith', 'Mike Smith', 1988, 'male', '4.0']);

    // ==================== SHEET 5: BẢNG ====================
    const wsGroup = wb.addWorksheet('Bảng');
    wsGroup.columns = [
        { header: 'name*', width: 15 },
        { header: 'tournamentName*', width: 25 },
        { header: 'sport*', width: 15 },
        { header: 'teamNames', width: 40 },
        { header: 'status', width: 12 }
    ];
    styleHeader(wsGroup);
    addValidation(wsGroup, 'C', ['Pickleball', 'Tennis', 'Badminton']);
    addValidation(wsGroup, 'E', ['pending', 'progress', 'completed']);
    wsGroup.addRow(['Bảng A', 'Giải Pickleball 2025', 'Pickleball', 'Đội Alpha, Đội Beta', 'pending']);
    wsGroup.addRow(['Bảng B', 'Giải Pickleball 2025', 'Pickleball', 'Đội Gamma', 'pending']);

    // ==================== SHEET 6: SÂN ====================
    const wsCourt = wb.addWorksheet('Sân');
    wsCourt.columns = [
        { header: 'name*', width: 20 },
        { header: 'tournamentName*', width: 25 },
        { header: 'sportTypes', width: 25 },
        { header: 'location', width: 30 },
        { header: 'status', width: 12 }
    ];
    styleHeader(wsCourt);
    addValidation(wsCourt, 'E', ['empty', 'busy', 'maintenance', 'inactive']);
    wsCourt.addRow(['Sân 1', 'Giải Pickleball 2025', 'Pickleball', 'Tầng 1', 'empty']);
    wsCourt.addRow(['Sân 2', 'Giải Pickleball 2025', 'Pickleball', 'Tầng 1', 'empty']);
    wsCourt.addRow(['Sân 3', 'Giải Tennis 2025', 'Tennis', 'Sân số 1', 'empty']);

    // ==================== SHEET 7: TRẬN ĐẤU ====================
    const wsMatch = wb.addWorksheet('Trận đấu');
    wsMatch.columns = [
        { header: 'tournamentName*', width: 25 },
        { header: 'team1Name*', width: 20 },
        { header: 'team2Name*', width: 20 },
        { header: 'groupName', width: 12 },
        { header: 'round', width: 8 },
        { header: 'matchNumber', width: 10 },
        { header: 'scheduledStartTime*', width: 20 },
        { header: 'courtName', width: 15 },
        { header: 'status', width: 12 }
    ];
    styleHeader(wsMatch);
    addValidation(wsMatch, 'I', ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']);
    wsMatch.addRow(['Giải Pickleball 2025', 'Đội Alpha', 'Đội Beta', 'Bảng A', 1, 1, '2025-06-10 14:00', 'Sân 1', 'SCHEDULED']);
    wsMatch.addRow(['Giải Pickleball 2025', 'Đội Alpha', 'Đội Gamma', 'Bảng A', 1, 2, '2025-06-10 15:30', 'Sân 1', 'SCHEDULED']);

    // ==================== SHEET 8: HƯỚNG DẪN ====================
    const wsGuide = wb.addWorksheet('Hướng dẫn');
    wsGuide.columns = [{ header: 'Hướng dẫn', width: 80 }];
    const lines = [
        '📋 HƯỚNG DẪN NHẬP EXCEL',
        '',
        '1. Các trường có dấu * là bắt buộc.',
        '2. Thứ tự import: Người dùng → Giải đấu → Đội → Cầu thủ → Bảng → Sân → Trận đấu',
        '3. Tên giải đấu, tên đội, username phải tồn tại trong hệ thống (hoặc được import trước).',
        '4. Định dạng ngày: YYYY-MM-DD hoặc YYYY-MM-DD HH:MM',
        '5. Đối với teamNames: nhập các tên đội cách nhau bằng dấu phẩy.',
        '6. sportTypes: nhập các môn cách nhau bằng dấu phẩy.',
        '',
        '📌 CÁC GIÁ TRỊ HỢP LỆ:',
        '- Role: player, referee, org',
        '- Status (Người dùng): active, inactive, banned',
        '- SportType: Pickleball, Tennis, Badminton, Soccer',
        '- Status (Đội): pending, active, inactive',
        '- Gender: male, female, other',
        '- SkillLevel: 1.0 → 5.0 (cách nhau 0.5)',
        '- Status (Sân): empty, busy, maintenance, inactive',
        '- Status (Trận đấu): SCHEDULED, IN_PROGRESS, COMPLETED, CANCELED'
    ];
    lines.forEach(l => wsGuide.addRow([l]));
    wsGuide.getColumn(1).alignment = { wrapText: true };

    const filePath = path.join(TEMPLATE_DIR, 'import_template.xlsx');
    await wb.xlsx.writeFile(filePath);
    console.log(`✅ Template tạo thành công: ${filePath}`);
}

generate().catch(console.error);