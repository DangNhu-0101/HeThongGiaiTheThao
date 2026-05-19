
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
        { header: 'hashedPassword*', width: 20 },
        { header: 'role', width: 12 },
        { header: 'displayName', width: 20 },
        { header: 'birthYear', width: 12 },
        { header: 'gender', width: 8 },
        { header: 'skillLevel', width: 10 },
        { header: 'status', width: 12 }
    ];
    styleHeader(wsUser);
    // addValidation(wsUser, 'E', ['player', 'referee', 'org']);
    // addValidation(wsUser, 'H', ['male', 'female', 'other']);
    // addValidation(wsUser, 'I', ['1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0']);
    // addValidation(wsUser, 'J', ['active', 'inactive', 'banned']);
    
    // NHIỀU dữ liệu mẫu cho Users
    wsUser.addRow(['john_doe', 'john@example.com', '0123456789', '123456', 'player', 'John Doe', 1990, 'male', 3.5, 'active']);
wsUser.addRow(['jane_doe', 'jane@example.com', '0987654321', '123456', 'player', 'Jane Doe', 1992, 'female', 3.0, 'active']);
wsUser.addRow(['mike_smith', 'mike@example.com', '0911222333', '123456', 'player', 'Mike Smith', 1988, 'male', 4.0, 'active']);
wsUser.addRow(['anna_lee', 'anna@example.com', '0909111222', '123456', 'player', 'Anna Lee', 1995, 'female', 3.5, 'active']);
wsUser.addRow(['tom_wilson', 'tom@example.com', '0909222333', '123456', 'player', 'Tom Wilson', 1991, 'male', 4.5, 'active']);
wsUser.addRow(['lisa_chen', 'lisa@example.com', '0909333444', '123456', 'player', 'Lisa Chen', 1993, 'female', 3.0, 'active']);
wsUser.addRow(['david_kim', 'david@example.com', '0909444555', '123456', 'player', 'David Kim', 1989, 'male', 4.0, 'active']);
wsUser.addRow(['sarah_park', 'sarah@example.com', '0909555666', '123456', 'player', 'Sarah Park', 1994, 'female', 3.5, 'active']);
wsUser.addRow(['admin_org', 'org@example.com', '0912345678', '123456', 'org', '', '', '', '', 'active']);
wsUser.addRow(['referee_01', 'ref1@example.com', '0923456789', '123456', 'referee', '', '', '', '', 'active']);

    // ==================== SHEET 2: GIẢI ĐẤU ====================
    const wsTour = wb.addWorksheet('Giải đấu');
    wsTour.columns = [
        { header: 'displayName*', width: 25 },
        { header: 'description', width: 30 },
        { header: 'sport*', width: 15 },
        { header: 'organizer', width: 20 },
        { header: 'timeOpen*', width: 20 },
        { header: 'timeClose', width: 20 },
        { header: 'location', width: 30 }
    ];
    styleHeader(wsTour);
    
    // NHIỀU dữ liệu mẫu cho Tournaments
    wsTour.addRow(['Giải Pickleball 2025', 'Giải pickleball nội bộ', 'Pickleball', 'PTSC SPORT', '2025-03-01', '2025-03-30', 'Vũng Tàu']);
wsTour.addRow(['Giải Tennis 2025', 'Giải tennis mở rộng', 'Tennis', 'PTSC SPORT', '2025-04-01', '2025-04-15', 'Vũng Tàu']);

    // ==================== SHEET 3: ĐỘI ====================
    const wsTeam = wb.addWorksheet('Đội');
    wsTeam.columns = [
        { header: 'name*', width: 20 },
        { header: 'tournamentName*', width: 25 },
        { header: 'sportType*', width: 15 },
        { header: 'categoryId', width: 10 },
        { header: 'ownerUsername*', width: 15 },
        { header: 'members', width: 40 },
        { header: 'status', width: 12 }
    ];
    styleHeader(wsTeam);
    // addValidation(wsTeam, 'C', ['Pickleball', 'Tennis', 'Badminton', 'Soccer']);
    // addValidation(wsTeam, 'G', ['pending', 'active', 'inactive']);
    
    // NHIỀU dữ liệu mẫu cho Teams
   wsTeam.addRow(['Đội Alpha', 'Giải Pickleball 2025', 'Pickleball', 'MD', 'john_doe', 'jane_doe, mike_smith', 'active']);
wsTeam.addRow(['Đội Beta', 'Giải Pickleball 2025', 'Pickleball', 'XD', 'anna_lee', 'tom_wilson, lisa_chen', 'active']);
wsTeam.addRow(['Đội Gamma', 'Giải Pickleball 2025', 'Pickleball', 'MD', 'david_kim', 'sarah_park', 'pending']);
wsTeam.addRow(['Đội Tennis A', 'Giải Tennis 2025', 'Tennis', 'MS', 'david_kim', 'john_doe, mike_smith', 'active']);
wsTeam.addRow(['Đội Tennis B', 'Giải Tennis 2025', 'Tennis', 'XD', 'sarah_park', 'anna_lee, jane_doe', 'active']);
    // ==================== SHEET 4: BẢNG ====================
    const wsGroup = wb.addWorksheet('Bảng');
    wsGroup.columns = [
        { header: 'name*', width: 15 },
        { header: 'tournamentName*', width: 25 },
        { header: 'sport*', width: 15 },
        { header: 'teamNames', width: 40 },
        { header: 'status', width: 12 }
    ];
    styleHeader(wsGroup);
    // addValidation(wsGroup, 'C', ['Pickleball', 'Tennis', 'Badminton']);
    // addValidation(wsGroup, 'E', ['pending', 'progress', 'completed']);
    
    // NHIỀU dữ liệu mẫu cho Groups
   wsGroup.addRow(['Bảng A', 'Giải Pickleball 2025', 'Pickleball', 'Đội Alpha, Đội Beta', 'pending']);
wsGroup.addRow(['Bảng B', 'Giải Pickleball 2025', 'Pickleball', 'Đội Gamma', 'pending']);
wsGroup.addRow(['Bảng A', 'Giải Tennis 2025', 'Tennis', 'Đội Tennis A, Đội Tennis B', 'pending']);

    // ==================== SHEET 5: SÂN ====================
    const wsCourt = wb.addWorksheet('Sân');
    wsCourt.columns = [
        { header: 'name*', width: 20 },
        { header: 'tournamentName*', width: 25 },
        { header: 'sportTypes', width: 25 },
        { header: 'location', width: 30 },
        { header: 'status', width: 12 }
    ];
    styleHeader(wsCourt);
    // addValidation(wsCourt, 'E', ['empty', 'busy', 'maintenance', 'inactive']);
    
    // NHIỀU dữ liệu mẫu cho Courts
   wsCourt.addRow(['Sân 1', 'Giải Pickleball 2025', 'Pickleball', 'Tầng 1', 'empty']);
wsCourt.addRow(['Sân 2', 'Giải Pickleball 2025', 'Pickleball', 'Tầng 1', 'empty']);
wsCourt.addRow(['Sân 3', 'Giải Pickleball 2025', 'Pickleball', 'Tầng 2', 'empty']);
wsCourt.addRow(['Sân Tennis 1', 'Giải Tennis 2025', 'Tennis', 'Sân ngoài trời', 'empty']);
wsCourt.addRow(['Sân Tennis 2', 'Giải Tennis 2025', 'Tennis', 'Sân ngoài trời', 'empty']);


    // ==================== SHEET 6: TRẬN ĐẤU ====================
    const wsMatch = wb.addWorksheet('Trận đấu');
    wsMatch.columns = [
        { header: 'tournamentName*', width: 25 },
        { header: 'team1Name*', width: 20 },
        { header: 'team2Name*', width: 20 },
        { header: 'groupName', width: 12 },
        { header: 'round', width: 8 },
        { header: 'matchNumber', width: 10 },
        { header: 'sportType', width: 15 },
        { header: 'scheduledStartTime*', width: 20 },
        { header: 'courtName', width: 15 },
        { header: 'status', width: 12 }
    ];
    styleHeader(wsMatch);
    // addValidation(wsMatch, 'J', ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']);
    
    // NHIỀU dữ liệu mẫu cho Matches
   wsMatch.addRow(['Giải Pickleball 2025', 'Đội Alpha', 'Đội Beta', 'Bảng A', 1, 1, 'Pickleball', '2025-03-10 08:00', 'Sân 1', 'SCHEDULED']);
wsMatch.addRow(['Giải Pickleball 2025', 'Đội Alpha', 'Đội Gamma', 'Bảng A', 1, 2, 'Pickleball', '2025-03-10 09:30', 'Sân 2', 'SCHEDULED']);
wsMatch.addRow(['Giải Pickleball 2025', 'Đội Beta', 'Đội Gamma', '', 1, 3, 'Pickleball', '2025-03-11 08:00', 'Sân 3', 'SCHEDULED']);
wsMatch.addRow(['Giải Tennis 2025', 'Đội Tennis A', 'Đội Tennis B', 'Bảng A', 1, 1, 'Tennis', '2025-04-05 09:00', 'Sân Tennis 1', 'SCHEDULED']);
wsMatch.addRow(['Giải Tennis 2025', 'Đội Tennis A', 'Đội Tennis B', '', 2, 2, 'Tennis', '2025-04-06 09:00', 'Sân Tennis 2', 'SCHEDULED']);
    // ==================== SHEET 7: HƯỚNG DẪN ====================
    const wsGuide = wb.addWorksheet('Hướng dẫn');
    wsGuide.columns = [{ header: 'Hướng dẫn', width: 80 }];
    const lines = [
        '📋 HƯỚNG DẪN NHẬP EXCEL',
        '',
        'THỨ TỰ IMPORT (QUAN TRỌNG):',
        '1. Người dùng (Users + Players gộp chung)',
        '2. Giải đấu (Tournaments)',
        '3. Đội (Teams) - cần có Users và Tournament trước',
        '4. Bảng (Groups) - cần có Teams trước',
        '5. Sân (Courts) - cần có Tournament trước',
        '6. Trận đấu (Matches) - cần có Teams, Groups, Courts trước',
        '',
        'QUY TẮC NHẬP LIỆU:',
        '- Các trường có dấu * là bắt buộc',
        '- Tên giải đấu (tournamentName) phải khớp chính xác với displayName',
        '- Username, tên đội phải tồn tại trong hệ thống hoặc được import trước',
        '- members/teamNames: nhập các giá trị cách nhau bằng dấu phẩy (,)',
        '- sportTypes: nhập các môn cách nhau bằng dấu phẩy (,)',
        '- Định dạng ngày: YYYY-MM-DD hoặc YYYY-MM-DD HH:MM',
        '',
        '📌 GIÁ TRỊ HỢP LỆ:',
        'Role: player | referee | org',
        'Status (User): active | inactive | banned',
        'Gender: male | female | other',
        'SkillLevel: 1.0 → 5.0 (cách 0.5)',
        'Status (Team): pending | active | inactive',
        'Status (Group): pending | progress | completed',
        'Status (Court): empty | busy | maintenance | inactive',
        'Status (Match): SCHEDULED | IN_PROGRESS | COMPLETED | CANCELED',
        'Sport: Pickleball | Tennis | Badminton | Soccer',
        '',
        '⚠️ LƯU Ý ĐẶC BIỆT:',
        '- Sheet "Người dùng" GỘP CẢ Player: nếu role=player PHẢI điền displayName, birthYear, gender, skillLevel',
        '- Với role=org hoặc referee: để trống các cột displayName, birthYear, gender, skillLevel',
        '- Owner của đội tự động trở thành Captain, không cần thêm vào cột members',
        '- Trận đấu có groupName → matchType=group (vòng bảng)',
        '- Trận đấu KHÔNG có groupName → matchType=knockout (loại trực tiếp)',
        '- Mỗi lần import nên import TẤT CẢ các sheet để đảm bảo dữ liệu đầy đủ',
        ''
       
    ];
    lines.forEach(l => wsGuide.addRow([l]));
    wsGuide.getColumn(1).alignment = { wrapText: true };

    const filePath = path.join(TEMPLATE_DIR, 'import_template.xlsx');
    await wb.xlsx.writeFile(filePath);
    console.log(`✅ Template tạo thành công: ${filePath}`);
}

generate().catch(console.error);