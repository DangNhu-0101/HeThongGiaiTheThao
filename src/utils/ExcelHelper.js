// utils/excelHelper.js
import exceljs from 'exceljs';
import path from 'path';
import bcrypt from 'bcrypt';


// ==================== MAPPING CHUẨN VỚI MODELS ====================
export const SHEET_MAPPINGS = {
    'Người dùng': {
        model: 'User',
        fields: ['username', 'email', 'phoneNumber', 'password', 'role', 'status'],
        required: ['username', 'email', 'phoneNumber', 'password'],
        validation: {
            role: ['player', 'referee', 'org'],
            status: ['active', 'inactive', 'banned']
        }
    },
    'Giải đấu': {
        model: 'Tournament',
        fields: ['name', 'description', 'sport', 'venue', 'timeOpen', 'timeClose', 'location'],
        required: ['name', 'sport', 'venue', 'timeOpen'],
        // timeOpen, timeClose sẽ được parse Date
    },
    'Đội': {
        model: 'Team',
        fields: ['name', 'tournamentName', 'sportType', 'categoryId', 'ownerUsername', 'status'],
        required: ['name', 'tournamentName', 'sportType', 'ownerUsername'],
        validation: {
            sportType: ['Soccer', 'Pickleball', 'Tennis', 'Badminton', 'Volleyball', 'Basketball'],
            status: ['pending', 'active', 'inactive']
        }
    },
    'Cầu thủ': {
        model: 'Player',
        fields: ['username', 'displayName', 'birthYear', 'gender', 'skillLevel'],
        required: ['username', 'displayName', 'birthYear'],
        validation: {
            gender: ['male', 'female', 'other'],
            skillLevel: ['1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0']
        }
    },
    'Trận đấu': {
        model: 'Match',
        fields: ['tournamentName', 'team1Name', 'team2Name', 'groupName', 'round', 'matchNumber', 'scheduledStartTime', 'courtName', 'status'],
        required: ['tournamentName', 'team1Name', 'team2Name', 'scheduledStartTime'],
        validation: {
            status: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']
        }
    },
    'Sân': {
        model: 'Court',
        fields: ['name', 'tournamentName', 'sportTypes', 'location', 'status'],
        required: ['name', 'tournamentName'],
        validation: {
            status: ['empty', 'busy', 'maintenance', 'inactive']
        }
    },
    'Bảng': {
        model: 'Group',
        fields: ['name', 'tournamentName', 'sport', 'teamNames', 'status'],
        required: ['name', 'tournamentName', 'sport'],
        validation: {
            sport: ['Soccer', 'Pickleball', 'Tennis', 'Badminton', 'Volleyball', 'Basketball'],
            status: ['pending', 'progress', 'completed']
        }
    }
};


// ==================== ĐỌC FILE EXCEL ====================
export async function readExcelFile(filePath) {
    const workbook = new exceljs.Workbook();
    await workbook.xlsx.readFile(filePath);
    const result = {};
    workbook.eachSheet((worksheet) => {
        const sheetName = worksheet.name;
        if (sheetName === 'Hướng dẫn') return;
        const rows = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            if (row.values.every(v => !v)) return;
            rows.push(row.values.slice(1));
        });
        result[sheetName] = rows;
    });
    return result;
}


// ==================== VALIDATE DỮ LIỆU ====================
export function validateExcelData(sheetName, rows) {
    const mapping = SHEET_MAPPINGS[sheetName];
    if (!mapping) return { valid: false, errors: [`Sheet '${sheetName}' không được hỗ trợ`] };


    const errors = [];
    const validRows = [];
    rows.forEach((row, index) => {
        const rowErrors = [];
        const rowData = {};
        // Kiểm tra required
        mapping.required.forEach(field => {
            const fieldIndex = mapping.fields.indexOf(field);
            const value = row[fieldIndex];
            if (!value || value.toString().trim() === '') {
                rowErrors.push(`Hàng ${index + 2}: Trường '${field}' là bắt buộc`);
            } else {
                rowData[field] = value;
            }
        });
        // Kiểm tra validation (enum)
        mapping.fields.forEach((field, fieldIndex) => {
            const value = row[fieldIndex];
            if (!value) return;
            const validationRules = mapping.validation?.[field];
            if (validationRules && !validationRules.includes(value)) {
                rowErrors.push(`Hàng ${index + 2}: Trường '${field}' phải là một trong: ${validationRules.join(', ')}`);
            }
            if (!rowData[field]) rowData[field] = value;
        });
        if (rowErrors.length === 0) validRows.push(rowData);
        else errors.push(...rowErrors);
    });
    return { valid: errors.length === 0, errors, validRows, totalRows: rows.length, successRows: validRows.length };
}


export async function parseExcelFile(filePath) {
    try {
        const excelData = await readExcelFile(filePath);
        const result = {};
        const allErrors = [];
        for (const [sheetName, rows] of Object.entries(excelData)) {
            const validation = validateExcelData(sheetName, rows);
            result[sheetName] = validation;
            if (!validation.valid) allErrors.push({ sheet: sheetName, errors: validation.errors });
        }
        return { success: allErrors.length === 0, data: result, summary: { totalSheets: Object.keys(excelData).length, errors: allErrors } };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

