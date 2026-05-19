// utils/excelHelper.js
import exceljs from 'exceljs';
import path from 'path';
import bcrypt from 'bcrypt';


// ==================== MAPPING CHUẨN VỚI MODELS ====================
export const SHEET_MAPPINGS = {
    'Người dùng': {
        model: 'User',
        fields: ['username', 'email', 'phoneNumber', 'hashedPassword', 'role', 'displayName', 'birthYear', 'gender', 'skillLevel', 'status'],
        required: ['username', 'email', 'phoneNumber', 'hashedPassword', 'role'],
        validation: {
            role: ['player', 'referee', 'org'],
            gender: ['male', 'female', 'other'],
            skillLevel: [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0'],
            status: ['active', 'inactive', 'banned']
        }
    },
    'Giải đấu': {  // THÊM MỚI
        model: 'Tournament',
        fields: ['displayName', 'description', 'sport', 'organizer', 'timeOpen', 'timeClose', 'location'],
        required: ['displayName', 'sport', 'timeOpen'],
        validation: {
            sport: ['Pickleball', 'Tennis', 'Badminton', 'Soccer']
        }
    },
    'Đội': {
        model: 'Team',
        fields: ['name', 'tournamentName', 'sportType', 'categoryId', 'ownerUsername', 'members', 'status'],
        required: ['name', 'tournamentName', 'sportType', 'ownerUsername'],
        validation: {
            sportType: ['Pickleball', 'Tennis', 'Badminton', 'Soccer'],
            status: ['pending', 'active', 'inactive']
        }
    },
    'Bảng': {
        model: 'Group',
        fields: ['name', 'tournamentName', 'sport', 'teamNames', 'status'],
        required: ['name', 'tournamentName', 'sport'],
        validation: {
            sport: ['Pickleball', 'Tennis', 'Badminton', 'Soccer'],
            status: ['pending', 'progress', 'completed']
        }
    },
    'Sân': {  // THÊM MỚI
        model: 'Court',
        fields: ['name', 'tournamentName', 'sportTypes', 'location', 'status'],
        required: ['name', 'tournamentName'],
        validation: {
            status: ['empty', 'busy', 'maintenance', 'inactive']
        }
    },
    'Trận đấu': {
        model: 'Match',
        fields: ['tournamentName', 'team1Name', 'team2Name', 'groupName', 'round', 'matchNumber', 'sportType', 'scheduledStartTime', 'courtName', 'status'],
        required: ['tournamentName', 'team1Name', 'team2Name', 'scheduledStartTime'],
        validation: {
            status: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']
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
            // Bỏ qua dòng trống hoàn toàn
            const values = row.values.slice(1);
            if (values.every(v => v === null || v === undefined || v === '')) return;
            rows.push(values);
        });
        result[sheetName] = rows;
    });
    return result;
}


// ==================== VALIDATE DỮ LIỆU ====================
export function validateExcelData(sheetName, rows) {
    const mapping = SHEET_MAPPINGS[sheetName];
    if (!mapping) return { valid: false, errors: [`Sheet '${sheetName}' không được hỗ trợ`], validRows: [], totalRows: rows.length, successRows: 0 };

    const errors = [];
    const validRows = [];
    
    rows.forEach((row, index) => {
        const rowErrors = [];
        const rowData = {};
        const rowNum = index + 2; // Hàng thực tế trong Excel
        
        // Gán tất cả giá trị vào rowData
        mapping.fields.forEach((field, fieldIndex) => {
            let value = row[fieldIndex];
            // Chuyển null/undefined thành chuỗi rỗng
            if (value === null || value === undefined) value = '';
            // Chuyển số thành chuỗi nếu cần
            if (typeof value === 'number') value = String(value);
            rowData[field] = value;
        });
        
        // Kiểm tra required
        mapping.required.forEach(field => {
            const value = rowData[field];
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                rowErrors.push(`Hàng ${rowNum}: Trường '${field}' là bắt buộc`);
            }
        });
        
        // Kiểm tra validation (enum)
        if (mapping.validation) {
            Object.entries(mapping.validation).forEach(([field, validValues]) => {
                const value = rowData[field];
                if (!value || (typeof value === 'string' && value.trim() === '')) return;
                
                // Chuyển cả value và validValues về string để so sánh
                const strValue = String(value).trim();
                const strValidValues = validValues.map(v => String(v));
                
                if (!strValidValues.includes(strValue)) {
                    rowErrors.push(`Hàng ${rowNum}: Trường '${field}'='${strValue}' phải là một trong: ${strValidValues.join(', ')}`);
                }
            });
        }
        
        if (rowErrors.length === 0) {
            // Chuyển đổi kiểu dữ liệu trước khi push
            const finalData = {};
            mapping.fields.forEach(field => {
                let value = rowData[field];
                if (field === 'birthYear' || field === 'round' || field === 'matchNumber') {
                    value = value ? parseInt(value) : undefined;
                } else if (field === 'skillLevel') {
                    value = value ? parseFloat(value) : undefined;
                }
                finalData[field] = value;
            });
            validRows.push(finalData);
        } else {
            errors.push(...rowErrors);
        }
    });
    
    return { 
        valid: errors.length === 0, 
        errors, 
        validRows, 
        totalRows: rows.length, 
        successRows: validRows.length 
    };
}


export async function parseExcelFile(filePath) {
    try {
        const excelData = await readExcelFile(filePath);
        const result = {};
        const allErrors = [];
        
        for (const [sheetName, rows] of Object.entries(excelData)) {
            const validation = validateExcelData(sheetName, rows);
            result[sheetName] = validation;
            if (!validation.valid) {
                allErrors.push({ sheet: sheetName, errors: validation.errors });
            }
        }
        
        return { 
            success: allErrors.length === 0, 
            data: result, 
            summary: { 
                totalSheets: Object.keys(excelData).length, 
                errors: allErrors 
            } 
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}