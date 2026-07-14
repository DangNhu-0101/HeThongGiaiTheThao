import ExcelJS from 'exceljs';
import User from '../models/users.js';

export const normalizeImportHeader = (value = '') => value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .toLowerCase()
    .trim();

export const parseCsvRows = (text) => {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && next === '"') {
            cell += '"';
            i += 1;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            row.push(cell);
            cell = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && next === '\n') i += 1;
            row.push(cell);
            if (row.some(value => value.toString().trim())) rows.push(row);
            row = [];
            cell = '';
        } else {
            cell += char;
        }
    }

    if (cell || row.length) {
        row.push(cell);
        if (row.some(value => value.toString().trim())) rows.push(row);
    }
    return rows;
};

export const decodeHtmlCell = (value = '') => value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .trim();

export const parseHtmlTableRows = (text) => {
    const rows = [];
    const rowMatches = text.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    rowMatches.forEach((rowHtml) => {
        const cells = [];
        const cellMatches = rowHtml.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || [];
        cellMatches.forEach((cellHtml) => cells.push(decodeHtmlCell(cellHtml)));
        if (cells.some(value => value)) rows.push(cells);
    });
    return rows;
};

export const mapGender = (value = '') => {
    const normalized = normalizeImportHeader(value);
    if (['nam', 'male'].includes(normalized)) return 'male';
    if (['nu', 'female'].includes(normalized)) return 'female';
    return 'other';
};

export const mapPaymentStatus = (value = '') => {
    const normalized = normalizeImportHeader(value);
    if (normalized.includes('mien')) return 'exempted';
    if (normalized.includes('da dong') || normalized.includes('paid')) return 'paid';
    return 'unpaid';
};

export const normalizePhone = (value = '') => value.toString().trim().replace(/[\s.-]/g, '');

export const parseImportDate = (value) => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    const text = value.toString().trim();
    
    //  Hỗ trợ cả dấu gạch ngang (-) và gạch chéo (/)
    const ddmmyyyy = text.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day));
        if (parsed.getFullYear() === Number(year) && parsed.getMonth() === Number(month) - 1 && parsed.getDate() === Number(day)) return parsed;
    }
    
    // Hỗ trợ cả định dạng yyyy-mm-dd hoặc yyyy/mm/dd
    const yyyymmdd = text.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
    if (yyyymmdd) {
        const [, year, month, day] = yyyymmdd;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day));
        if (parsed.getFullYear() === Number(year) && parsed.getMonth() === Number(month) - 1 && parsed.getDate() === Number(day)) return parsed;
    }
    return null;
};

export const formatDateForExcel = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
};

export const slugifyUsername = (value = '') => normalizeImportHeader(value)
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24) || 'vdv';

export const makeImportPassword = () => 'TMS@123456';

export const getUniqueUsername = async (base, used) => {
    let index = 1;
    let username = base;
    while (used.has(username) || await User.exists({ username })) {
        username = `${base}${index}`;
        index += 1;
    }
    used.add(username);
    return username;
};

export const getImportValue = (row, headerMap, keys) => {
    for (const key of keys) {
        const index = headerMap[key];
        if (index !== undefined) return row[index]?.toString().trim() || '';
    }
    return '';
};

export const buildImportGroups = (rows) => {
    rows = rows
        .map((row, index) => ({ row, originalRowNumber: index + 1 }))
        .filter(item => !item.row[0]?.toString().trim().startsWith('#'));
    if (rows.length < 2) return { groups: [], errors: [{ row: 0, message: 'File thiếu header hoặc dữ liệu.' }] };
    const headers = rows[0].row.map(normalizeImportHeader);
    const headerMap = {};
    headers.forEach((header, index) => {
        if (header.includes('ma doi')) headerMap.teamCode = index;
        else if (header.includes('ten doi')) headerMap.teamName = index;
        else if (header.includes('nguoi dai dien')) headerMap.representativeName = index;
        else if (header.includes('so dien thoai')) headerMap.phone = index;
        else if (header.includes('email')) headerMap.email = index;
        else if (header.includes('ho ten')) headerMap.athleteName = index;
        else if (header.includes('ngay sinh')) headerMap.birthDate = index;
        else if (header.includes('gioi tinh')) headerMap.gender = index;
        else if (header.includes('ky nang') || header.includes('trinh do')) headerMap.skill = index;
        else if (header.includes('le phi') || header.includes('thanh toan')) headerMap.paymentStatus = index;
    });

    const requiredHeaders = ['teamCode', 'teamName', 'representativeName', 'phone', 'email', 'athleteName', 'birthDate', 'gender', 'skill', 'paymentStatus'];
    const headerLabels = {
        teamCode: 'Mã đội',
        teamName: 'Tên đội',
        representativeName: 'Người đại diện',
        phone: 'Số điện thoại',
        email: 'Email',
        athleteName: 'Họ tên VĐV',
        birthDate: 'Ngày sinh',
        gender: 'Giới tính',
        skill: 'Kỹ năng',
        paymentStatus: 'Trạng thái lệ phí',
    };
    const errors = requiredHeaders
        .filter(key => headerMap[key] === undefined)
        .map(key => ({ row: rows[0].originalRowNumber, message: `Thiếu cột ${headerLabels[key]}.` }));

    const groups = new Map();
    rows.slice(1).forEach(({ row, originalRowNumber }, index) => {
        if (!row.some(value => value?.toString().trim())) return;
        const teamName = getImportValue(row, headerMap, ['teamName']);
        const athleteName = getImportValue(row, headerMap, ['athleteName']);
        const teamCode = getImportValue(row, headerMap, ['teamCode']) || `ROW-${index + 2}`;
        const phone = normalizePhone(getImportValue(row, headerMap, ['phone']));
        const email = getImportValue(row, headerMap, ['email']).toLowerCase();
        const representativeName = getImportValue(row, headerMap, ['representativeName']);
        const birthDateRaw = getImportValue(row, headerMap, ['birthDate']);
        const birthDate = parseImportDate(birthDateRaw);
        const genderRaw = getImportValue(row, headerMap, ['gender']);
        const paymentRaw = getImportValue(row, headerMap, ['paymentStatus']);
        const skillRaw = getImportValue(row, headerMap, ['skill']);
        const skill = Number(skillRaw || 1);

        if (!teamCode.trim()) errors.push({ row: originalRowNumber, message: 'Thiếu mã đội.' });
        if (!teamName) errors.push({ row: originalRowNumber, message: 'Thiếu tên đội.' });
        if (!representativeName) errors.push({ row: originalRowNumber, message: 'Thiếu người đại diện.' });
        if (!/^0\d{8,10}$/.test(phone)) errors.push({ row: originalRowNumber, message: 'Số điện thoại phải có 9-11 chữ số và bắt đầu bằng 0. Hãy định dạng cột này là Text.' });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push({ row: originalRowNumber, message: 'Email không đúng định dạng.' });
        if (!athleteName) errors.push({ row: originalRowNumber, message: 'Thiếu họ tên VĐV.' });
        if (!birthDate) errors.push({ row: originalRowNumber, message: 'Ngày sinh phải theo dạng dd-mm-yyyy.' });
        if (!['nam', 'nu', 'khac', 'male', 'female', 'other'].includes(normalizeImportHeader(genderRaw))) errors.push({ row: originalRowNumber, message: 'Giới tính chỉ nhận Nam, Nữ hoặc Khác.' });
        if (!Number.isFinite(skill) || skill < 1 || skill > 5) errors.push({ row: originalRowNumber, message: 'Kỹ năng phải là số từ 1 đến 5.' });
        if (!['da dong', 'chua dong', 'mien phi', 'paid', 'unpaid', 'exempted'].includes(normalizeImportHeader(paymentRaw))) errors.push({ row: originalRowNumber, message: 'Trạng thái lệ phí chỉ nhận Đã đóng, Chưa đóng hoặc Miễn phí.' });
        if (errors.some(error => error.row === originalRowNumber)) return;

        if (!groups.has(teamCode)) {
            groups.set(teamCode, {
                code: teamCode,
                name: teamName,
                representative: {
                    name: representativeName,
                    phone,
                    email
                },
                paymentStatus: mapPaymentStatus(paymentRaw),
                athletes: []
            });
        }

        const group = groups.get(teamCode);
        group.athletes.push({
            name: athleteName,
            birthDate,
            gender: mapGender(getImportValue(row, headerMap, ['gender'])),
            skill,
            rowNumber: originalRowNumber
        });
    });

    return { groups: Array.from(groups.values()), errors };
};

export const parseImportRows = async (file) => {
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    if (extension === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) return [];
        const rows = [];
        worksheet.eachRow((row) => {
            const values = [];
            for (let index = 1; index <= Math.max(row.cellCount, 10); index += 1) {
                const cell = row.getCell(index);
                if (cell.value instanceof Date) values.push(formatDateForExcel(cell.value));
                else values.push(cell.text || cell.value || '');
            }
            rows.push(values);
        });
        return rows;
    }
    const text = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
    if (/<table[\s\S]*<\/table>/i.test(text)) return parseHtmlTableRows(text);
    return parseCsvRows(text);
};

export const buildImportTemplateBuffer = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Nhập đội và VĐV');
    sheet.columns = [
        { header: 'Mã đội', key: 'teamCode', width: 14 },
        { header: 'Tên đội', key: 'teamName', width: 24 },
        { header: 'Người đại diện', key: 'representativeName', width: 24 },
        { header: 'Số điện thoại', key: 'phone', width: 16 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Họ tên VĐV', key: 'athleteName', width: 24 },
        { header: 'Ngày sinh', key: 'birthDate', width: 14 },
        { header: 'Giới tính', key: 'gender', width: 12 },
        { header: 'Kỹ năng', key: 'skill', width: 10 },
        { header: 'Trạng thái lệ phí', key: 'paymentStatus', width: 18 },
    ];
    sheet.spliceRows(1, 0,
        ['# Hướng dẫn: mỗi dòng là một VĐV. Các VĐV cùng Mã đội sẽ được gom vào cùng một đội.'],
        ['# Ngày sinh nhập dạng dd-mm-yyyy. Số điện thoại là dạng Text để giữ số 0 đầu. Lệ phí hợp lệ: Đã đóng, Chưa đóng, Miễn phí.'],
    );
    sheet.getRow(3).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 3 }];
    const sampleRows = [
        ['TEAM001', 'PTSC Pickleball 1', 'Nguyễn Văn A', '0909000001', 'team001@example.com', 'Trần Minh Anh', '20-05-1995', 'Nam', 4, 'Đã đóng'],
        ['TEAM001', 'PTSC Pickleball 1', 'Nguyễn Văn A', '0909000001', 'team001@example.com', 'Lê Hoàng Nam', '12-08-1994', 'Nam', 3, 'Đã đóng'],
        ['TEAM002', 'Vũng Tàu Smash', 'Phạm Thu Hà', '0909000002', 'team002@example.com', 'Phạm Thu Hà', '10-03-1997', 'Nữ', 4, 'Chưa đóng'],
        ['TEAM002', 'Vũng Tàu Smash', 'Phạm Thu Hà', '0909000002', 'team002@example.com', 'Đỗ Minh Khoa', '22-11-1996', 'Nam', 3, 'Chưa đóng'],
        ['TEAM003', 'Đà Lạt Wave', 'Lâm Quốc Bảo', '0909000003', 'team003@example.com', 'Lâm Quốc Bảo', '07-07-1992', 'Nam', 4, 'Đã đóng'],
        ['TEAM003', 'Đà Lạt Wave', 'Lâm Quốc Bảo', '0909000003', 'team003@example.com', 'Nguyễn Hoài An', '18-09-1998', 'Nữ', 2, 'Đã đóng'],
        ['TEAM004', 'Sài Gòn Masters', 'Trương Mỹ Linh', '0909000004', 'team004@example.com', 'Trương Mỹ Linh', '05-01-1993', 'Nữ', 5, 'Miễn phí'],
        ['TEAM004', 'Sài Gòn Masters', 'Trương Mỹ Linh', '0909000004', 'team004@example.com', 'Võ Thành Đạt', '14-04-1991', 'Nam', 4, 'Miễn phí'],
        ['TEAM005', 'Cần Thơ PK', 'Huỳnh Văn Tín', '0909000005', 'team005@example.com', 'Huỳnh Văn Tín', '30-12-1990', 'Nam', 3, 'Đã đóng'],
        ['TEAM005', 'Cần Thơ PK', 'Huỳnh Văn Tín', '0909000005', 'team005@example.com', 'Mai Thảo Vy', '09-06-1999', 'Nữ', 3, 'Đã đóng'],
        ['TEAM006', 'Hà Nội Pro', 'Ngô Minh Quân', '0909000006', 'team006@example.com', 'Ngô Minh Quân', '25-02-1989', 'Nam', 5, 'Chưa đóng'],
        ['TEAM006', 'Hà Nội Pro', 'Ngô Minh Quân', '0909000006', 'team006@example.com', 'Phan Nhật Minh', '16-10-1995', 'Nam', 4, 'Chưa đóng'],
    ];
    sampleRows.forEach(row => sheet.addRow(row));
    sheet.getColumn('phone').numFmt = '@';
    sheet.getColumn('birthDate').numFmt = '@';
    for (let rowNumber = 4; rowNumber <= sheet.rowCount; rowNumber += 1) {
        sheet.getCell(`D${rowNumber}`).numFmt = '@';
        sheet.getCell(`G${rowNumber}`).numFmt = '@';
    }
    sheet.getColumn('gender').eachCell((cell, rowNumber) => {
        if (rowNumber >= 4) {
            cell.dataValidation = {
                type: 'list',
                allowBlank: false,
                formulae: ['"Nam,Nữ,Khác"'],
                showErrorMessage: true,
                error: 'Giới tính chỉ nhận Nam, Nữ hoặc Khác',
            };
        }
    });
    sheet.getColumn('paymentStatus').eachCell((cell, rowNumber) => {
        if (rowNumber >= 4) {
            cell.dataValidation = {
                type: 'list',
                allowBlank: false,
                formulae: ['"Đã đóng,Chưa đóng,Miễn phí"'],
                showErrorMessage: true,
                error: 'Lệ phí chỉ nhận Đã đóng, Chưa đóng hoặc Miễn phí',
            };
        }
    });
    return await workbook.xlsx.writeBuffer();
};

export const buildLoginWorkbookBuffer = async (rows = []) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tài khoản VĐV');
    sheet.columns = [
        { header: 'Mã đội', key: 'teamCode', width: 14 },
        { header: 'Tên đội', key: 'teamName', width: 24 },
        { header: 'Họ tên VĐV', key: 'athleteName', width: 24 },
        { header: 'Tài khoản', key: 'username', width: 24 },
        { header: 'Mật khẩu tạm', key: 'password', width: 18 },
        { header: 'Ghi chú', key: 'note', width: 40 },
    ];
    sheet.getRow(1).font = { bold: true };
    rows.forEach(row => sheet.addRow(row));
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    return workbook.xlsx.writeBuffer();
};
