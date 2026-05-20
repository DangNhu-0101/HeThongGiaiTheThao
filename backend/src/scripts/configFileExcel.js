
import exceljs from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_DIR = path.join(__dirname, '../templates');
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


    // Sheet 1: Người dùng (gộp User + Player)
    const wsUser = wb.addWorksheet('Người dùng');
    wsUser.columns = [
        { header: 'username*', width: 15 },
        { header: 'email*', width: 25 },
        { header: 'phoneNumber*', width: 15 },
        { header: 'password*', width: 20 },
        { header: 'role*', width: 12 },
        { header: 'name', width: 20 },
        { header: 'birthDate', width: 12 },
        { header: 'gender', width: 8 },
        { header: 'skillLevel', width: 10 },
        { header: 'status', width: 12 }
    ];
    styleHeader(wsUser);
    addValidation(wsUser, 'E', ['player', 'referee', 'org']);
    addValidation(wsUser, 'H', ['male', 'female', 'other']);
    addValidation(wsUser, 'I', ['1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0']);
    addValidation(wsUser, 'J', ['active', 'inactive', 'banned']);


 


    // Sheet 3: Đội (có members)
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
    addValidation(wsTeam, 'C', ['Pickleball', 'Tennis', 'Badminton', 'Soccer', 'Volleyball', 'Basketball']);
    addValidation(wsTeam, 'G', ['pending', 'active', 'inactive']);


    // Sheet 4: Bảng
    const wsGroup = wb.addWorksheet('Bảng');
    wsGroup.columns = [
        { header: 'name*', width: 15 },
        { header: 'tournamentName*', width: 25 },
        { header: 'sport*', width: 15 },
        { header: 'teamNames', width: 40 },
        { header: 'status', width: 12 }
    ];
    styleHeader(wsGroup);
    addValidation(wsGroup, 'C', ['Pickleball', 'Tennis', 'Badminton', 'Soccer', 'Volleyball', 'Basketball']);
    addValidation(wsGroup, 'E', ['pending', 'progress', 'completed']);
    wsGroup.addRow(['Bảng A', 'Giải Pickleball 2025', 'Pickleball', 'Đội Alpha, Đội Beta', 'pending']);


   


    // Sheet 6: Trận đấu
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




    // Sheet 7: Hướng dẫn
    const wsGuide = wb.addWorksheet('Hướng dẫn');
    wsGuide.columns = [{ header: 'Hướng dẫn', width: 80 }];
    const lines = [
        '📋 HƯỚNG DẪN NHẬP EXCEL',
        '',
        'THỨ TỰ IMPORT:',
        '1. Người dùng → 2. Giải đấu → 3. Đội → 4. Bảng → 5. Sân → 6. Trận đấu',
        '',
        'QUY TẮC NHẬP:',
        '- Các trường có dấu * là bắt buộc',
        '- members: danh sách username (đã có trong sheet Người dùng), cách nhau bằng dấu phẩy',
        '- teamNames: danh sách tên đội, cách nhau bằng dấu phẩy',
        '- sportTypes: danh sách môn, cách nhau bằng dấu phẩy',
        '- Định dạng ngày: YYYY-MM-DD hoặc YYYY-MM-DD HH:MM',
        '',
        '📌 GIÁ TRỊ HỢP LỆ:',
        'Role: player, referee, org',
        'Gender: male, female, other',
        'SkillLevel: 1.0 → 5.0 (cách 0.5)',
        'Status (User): active, inactive, banned',
        'Status (Team): pending, active, inactive',
        'Status (Group): pending, progress, completed',
        'Status (Court): empty, busy, maintenance, inactive',
        'Status (Match): SCHEDULED, IN_PROGRESS, COMPLETED, CANCELED'
    ];
    lines.forEach(l => wsGuide.addRow([l]));
    wsGuide.getColumn(1).alignment = { wrapText: true };


    const filePath = path.join(TEMPLATE_DIR, 'import_template.xlsx');
    await wb.xlsx.writeFile(filePath);
    console.log(`✅ Template tạo thành công: ${filePath}`);
}


generate().catch(console.error);

