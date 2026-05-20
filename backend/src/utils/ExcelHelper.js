// utils/excelHelper.js
import exceljs from 'exceljs';
import path from 'path';
import bcrypt from 'bcrypt';


export const SHEET_MAPPINGS = {
    'Người dùng': {
        model: 'User',
        fields: ['username', 'email', 'phoneNumber', 'hashedPassword', 'role', 'name', 'birthDate', 'gender', 'skillLevel', 'status'],
        required: ['username', 'email', 'phoneNumber', 'hashedPassword', 'role', 'name', 'birthDate', 'gender', 'skillLevel'],
        validation: {
            role: ['player', 'referee', 'org'],
            gender: ['male', 'female', 'other'],
            skillLevel: ['1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0'],
            status: ['active', 'inactive', 'banned']
        }
    },
   'Đội': {
        model: 'Team',
        fields: ['name', 'tournamentName', 'sportType', 'categoryId', 'ownerUsername', 'members', 'status'],
        required: ['name', 'tournamentName', 'sportType', 'ownerUsername'],
        validation: {
            sportType: ['Pickleball', 'Tennis', 'Badminton', 'Soccer', 'Volleyball', 'Basketball'],
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
    'Trận đấu': {
        model: 'Match',
        fields: ['tournamentName', 'team1Name', 'team2Name', 'groupName', 'round', 'matchNumber', 'sportType', 'scheduledStartTime', 'courtName', 'status'],
        required: ['tournamentName', 'team1Name', 'team2Name', 'scheduledStartTime', 'sportType'],
        validation: {
            status: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']
        }
    }
};


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
            const values = row.values.slice(1);
            if (values.every(v => v === null || v === undefined || v === '')) return;
            rows.push(values);
        });
        result[sheetName] = rows;
    });
    return result;
}


export function validateExcelData(sheetName, rows) {
    const mapping = SHEET_MAPPINGS[sheetName];
    if (!mapping) {
        return {
            valid: false,
            errors: [`Sheet '${sheetName}' không được hỗ trợ. Các sheet hỗ trợ: ${Object.keys(SHEET_MAPPINGS).join(', ')}`],
            validRows: [],
            totalRows: rows.length,
            successRows: 0
        };
    }


    const errors = [];
    const validRows = [];


    rows.forEach((row, index) => {
        const rowErrors = [];
        const rowData = {};
        const rowNum = index + 2;


        // Gán giá trị
        mapping.fields.forEach((field, fieldIndex) => {
            let value = row[fieldIndex];
            if (value === null || value === undefined) value = '';
            if (typeof value === 'number') value = String(value);
            rowData[field] = value;
        });


        // Kiểm tra required
        mapping.required.forEach(field => {
            const value = rowData[field];
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                rowErrors.push(`Dòng ${rowNum}: thiếu '${field}'`);
            }
        });


        // Kiểm tra enum
        if (mapping.validation) {
            Object.entries(mapping.validation).forEach(([field, validValues]) => {
                const value = rowData[field];
                if (!value || (typeof value === 'string' && value.trim() === '')) return;
                const strValue = String(value).trim();
                const strValid = validValues.map(v => String(v));
                if (!strValid.includes(strValue)) {
                    rowErrors.push(`Dòng ${rowNum}: '${field}'='${strValue}' không hợp lệ (chấp nhận: ${strValid.join(', ')})`);
                }
            });
        }


        if (rowErrors.length === 0) {
            // Chuyển đổi kiểu dữ liệu
            const finalData = {};
            mapping.fields.forEach(field => {
                let value = rowData[field];
                if (field === 'birthDate' || field === 'round' || field === 'matchNumber') {
                    value = value ? new Date(value) : undefined;
                } else if (field === 'skillLevel') {
                    value = value ? parseFloat(value) : undefined;
                } else if (field === 'hashedPassword') {
                    // giữ nguyên chuỗi, sẽ hash sau
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
                allErrors.push({
                    sheet: sheetName,
                    errors: validation.errors,
                    totalRows: validation.totalRows,
                    successRows: validation.successRows
                });
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
        console.error('Parse Excel error:', error);
        return { success: false, error: error.message };
    }
}



