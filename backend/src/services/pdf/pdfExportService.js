import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const fontCandidates = [
    process.env.PDF_FONT_PATH,
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/calibri.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
].filter(Boolean);

const boldFontCandidates = [
    process.env.PDF_BOLD_FONT_PATH,
    'C:/Windows/Fonts/arialbd.ttf',
    'C:/Windows/Fonts/calibrib.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
].filter(Boolean);

const findFont = (candidates) => candidates.find((filePath) => filePath && fs.existsSync(filePath));

const registerFonts = (doc) => {
    const regular = findFont(fontCandidates);
    const bold = findFont(boldFontCandidates) || regular;
    if (regular) doc.registerFont('AppRegular', regular);
    if (bold) doc.registerFont('AppBold', bold);
    return {
        regular: regular ? 'AppRegular' : 'Helvetica',
        bold: bold ? 'AppBold' : 'Helvetica-Bold',
    };
};

const collectBuffer = (doc) => new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
});

const drawFooter = (doc, fonts) => {
    const bottom = doc.page.height - 42;
    doc.font(fonts.regular).fontSize(8).fillColor('#64748B')
        .text(`Xuất lúc ${new Date().toLocaleString('vi-VN')}`, doc.page.margins.left, bottom, { align: 'left' })
        .text(`Trang ${doc.bufferedPageRange().count}`, doc.page.margins.left, bottom, { align: 'right' });
};

export const createPdfDocument = ({ title, subtitle, orientation = 'portrait' } = {}) => {
    const doc = new PDFDocument({
        size: 'A4',
        layout: orientation,
        margin: 42,
        bufferPages: true,
        autoFirstPage: true,
        info: { Title: title || 'Báo cáo' },
    });
    const fonts = registerFonts(doc);
    doc.font(fonts.bold).fontSize(18).fillColor('#0D243B').text(title || 'Báo cáo', { align: 'left' });
    if (subtitle) {
        doc.moveDown(0.25).font(fonts.regular).fontSize(10).fillColor('#64748B').text(subtitle);
    }
    doc.moveDown(1);
    return { doc, fonts };
};

export const addSectionTitle = (doc, fonts, title) => {
    doc.moveDown(0.6).font(fonts.bold).fontSize(12).fillColor('#0D243B').text(title);
    doc.moveDown(0.3);
};

export const addKeyValueRows = (doc, fonts, rows = []) => {
    rows.filter(Boolean).forEach(([label, value]) => {
        doc.font(fonts.bold).fontSize(9).fillColor('#334155').text(`${label}: `, { continued: true });
        doc.font(fonts.regular).fillColor('#334155').text(value || 'Chưa cập nhật');
    });
};

export const addTable = (doc, fonts, columns = [], rows = []) => {
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const widths = columns.map((column) => column.width || Math.floor(pageWidth / columns.length));
    const startX = doc.page.margins.left;
    const headerHeight = 24;
    const rowHeight = 28;

    const drawHeader = () => {
        if (doc.y + headerHeight > doc.page.height - doc.page.margins.bottom) doc.addPage();
        let x = startX;
        const headerY = doc.y;
        doc.rect(startX, headerY, pageWidth, headerHeight).fill('#F5F7FA');
        columns.forEach((column, index) => {
            doc.font(fonts.bold).fontSize(8).fillColor('#0D243B')
                .text(column.label, x + 6, headerY + 7, { width: widths[index] - 12 });
            x += widths[index];
        });
        doc.y = headerY + headerHeight;
    };

    drawHeader();
    rows.forEach((row, rowIndex) => {
        if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            drawHeader();
        }
        let x = startX;
        const rowY = doc.y;
        columns.forEach((column, index) => {
            const value = typeof column.accessor === 'function' ? column.accessor(row, rowIndex) : row[column.accessor];
            doc.font(fonts.regular).fontSize(8).fillColor('#334155')
                .text(String(value ?? ''), x + 6, rowY + 7, { width: widths[index] - 12, height: rowHeight - 8 });
            x += widths[index];
        });
        doc.moveTo(startX, rowY + rowHeight).lineTo(startX + pageWidth, rowY + rowHeight).strokeColor('#DCE3EA').stroke();
        doc.y = rowY + rowHeight;
    });
};

export const finalizePdf = async (doc, fonts) => {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i += 1) {
        doc.switchToPage(i);
        drawFooter(doc, fonts);
    }
    const bufferPromise = collectBuffer(doc);
    doc.end();
    return bufferPromise;
};

export const safePdfFileName = (value = 'bao-cao') => `${value}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
