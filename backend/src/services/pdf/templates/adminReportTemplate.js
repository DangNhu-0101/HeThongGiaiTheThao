import { addTable, createPdfDocument, finalizePdf } from '../pdfExportService.js';

const COLORS = {
    ink: '#0D243B',
    muted: '#64748B',
    border: '#DCE3EA',
    panel: '#F8FAFC',
    primary: '#325978',
    accent: '#A7CADF',
    green: '#16A34A',
    amber: '#D97706',
    red: '#DC2626',
};

const text = (value, fallback = 'Chưa cập nhật') => {
    const output = String(value ?? '').trim();
    return output || fallback;
};

const pageBox = (doc) => ({
    left: doc.page.margins.left,
    right: doc.page.width - doc.page.margins.right,
    bottom: doc.page.height - doc.page.margins.bottom - 18,
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
});

const ensureSpace = (doc, height) => {
    const box = pageBox(doc);
    if (doc.y + height > box.bottom) {
        doc.addPage();
        doc.y = doc.page.margins.top;
    }
};

const drawSectionLabel = (doc, fonts, label, x, y, width) => {
    doc.font(fonts.bold).fontSize(11).fillColor(COLORS.ink)
        .text(label, x, y, { width });
};

const drawInfoPanel = (doc, fonts, rows) => {
    const box = pageBox(doc);
    const height = 76;
    ensureSpace(doc, height + 12);
    const y = doc.y;
    doc.roundedRect(box.left, y, box.width, height, 8).fillAndStroke('#FFFFFF', COLORS.border);
    drawSectionLabel(doc, fonts, 'Thông tin báo cáo', box.left + 14, y + 12, 180);

    rows.forEach(([label, value], index) => {
        const rowY = y + 32 + index * 10;
        doc.font(fonts.bold).fontSize(8).fillColor(COLORS.muted)
            .text(`${label}:`, box.left + 14, rowY, { width: 90 });
        doc.font(fonts.regular).fontSize(8).fillColor('#334155')
            .text(text(value), box.left + 104, rowY, { width: box.width - 118 });
    });
    doc.y = y + height + 14;
};

const drawMetric = (doc, fonts, label, value, trend, x, y, width) => {
    doc.roundedRect(x, y, width, 64, 8).fillAndStroke('#FFFFFF', COLORS.border);
    doc.font(fonts.bold).fontSize(8).fillColor(COLORS.muted)
        .text(label, x + 10, y + 10, { width: width - 20, height: 10 });
    doc.font(fonts.bold).fontSize(16).fillColor(COLORS.ink)
        .text(String(value ?? 0), x + 10, y + 27, { width: width - 20, height: 20 });
    doc.font(fonts.regular).fontSize(7.2).fillColor(COLORS.muted)
        .text(text(trend, ''), x + 10, y + 49, { width: width - 20, height: 9, ellipsis: true });
};

const drawMetrics = (doc, fonts, stats = []) => {
    const box = pageBox(doc);
    const gap = 10;
    const width = (box.width - gap * 2) / 3;
    const y = doc.y;
    ensureSpace(doc, 76);
    stats.slice(0, 3).forEach((item, index) => {
        drawMetric(doc, fonts, item.label, item.value, item.trend, box.left + (width + gap) * index, y, width);
    });
    doc.y = y + 78;
};

const normalizedRows = (data = [], valueKey = 'value') => data
    .filter(Boolean)
    .map((item) => ({
        name: text(item.month || item.name, 'Không rõ'),
        value: Number(item[valueKey] ?? item.value ?? 0),
        color: item.color,
    }))
    .filter((item) => item.value > 0)
    .slice(0, 8);

const drawBarPanel = (doc, fonts, title, data, x, y, width, height) => {
    doc.roundedRect(x, y, width, height, 8).fillAndStroke('#FFFFFF', COLORS.border);
    doc.font(fonts.bold).fontSize(10).fillColor(COLORS.ink)
        .text(title, x + 12, y + 12, { width: width - 24 });

    const rows = normalizedRows(data, 'athletes');
    if (!rows.length) {
        doc.font(fonts.regular).fontSize(8).fillColor(COLORS.muted)
            .text('Không có dữ liệu', x + 12, y + 42, { width: width - 24 });
        return;
    }

    const max = Math.max(...rows.map((item) => item.value), 1);
    const chartX = x + 28;
    const chartY = y + 44;
    const chartW = width - 48;
    const chartH = height - 76;
    const slot = chartW / rows.length;

    rows.forEach((item, index) => {
        const barW = Math.min(26, slot * 0.46);
        const barH = Math.max(4, (item.value / max) * chartH);
        const barX = chartX + index * slot + (slot - barW) / 2;
        const barY = chartY + chartH - barH;
        doc.roundedRect(barX, barY, barW, barH, 3).fill(index % 2 === 0 ? COLORS.primary : COLORS.accent);
        doc.font(fonts.bold).fontSize(7).fillColor(COLORS.ink)
            .text(String(item.value), chartX + index * slot, barY - 10, { width: slot, align: 'center' });
        doc.font(fonts.regular).fontSize(7).fillColor('#334155')
            .text(item.name, chartX + index * slot, chartY + chartH + 6, { width: slot, align: 'center', ellipsis: true });
    });

    doc.moveTo(chartX, chartY + chartH).lineTo(chartX + chartW, chartY + chartH).strokeColor(COLORS.border).stroke();
};

const drawSector = (doc, cx, cy, radius, start, end, color) => {
    const steps = Math.max(10, Math.ceil((end - start) / (Math.PI / 18)));
    doc.save();
    doc.moveTo(cx, cy);
    for (let index = 0; index <= steps; index += 1) {
        const angle = start + ((end - start) * index) / steps;
        doc.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    }
    doc.closePath().fill(color);
    doc.restore();
};

const drawLegend = (doc, fonts, rows, colors, x, y, width) => {
    rows.slice(0, 6).forEach((item, index) => {
        const rowY = y + index * 13;
        doc.roundedRect(x, rowY + 2, 8, 8, 1.5).fill(item.color || colors[index % colors.length]);
        doc.font(fonts.regular).fontSize(7.5).fillColor('#334155')
            .text(item.name, x + 12, rowY, { width: width - 44, height: 10, ellipsis: true });
        doc.font(fonts.bold).fontSize(7.5).fillColor(COLORS.ink)
            .text(String(item.value), x + width - 30, rowY, { width: 30, align: 'right' });
    });
};

const drawDonutPanel = (doc, fonts, title, data, x, y, width, height) => {
    const fallbackColors = [COLORS.primary, COLORS.green, COLORS.amber, '#6366F1', COLORS.red, '#14B8A6'];
    doc.roundedRect(x, y, width, height, 8).fillAndStroke('#FFFFFF', COLORS.border);
    doc.font(fonts.bold).fontSize(10).fillColor(COLORS.ink)
        .text(title, x + 12, y + 12, { width: width - 24 });

    const rows = normalizedRows(data);
    if (!rows.length) {
        doc.font(fonts.regular).fontSize(8).fillColor(COLORS.muted)
            .text('Không có dữ liệu', x + 12, y + 42, { width: width - 24 });
        return;
    }

    const total = rows.reduce((sum, item) => sum + item.value, 0) || 1;
    const cx = x + 72;
    const cy = y + height / 2 + 8;
    const radius = 42;
    let start = -Math.PI / 2;
    rows.forEach((item, index) => {
        const end = start + (item.value / total) * Math.PI * 2;
        drawSector(doc, cx, cy, radius, start, end, item.color || fallbackColors[index % fallbackColors.length]);
        start = end;
    });
    doc.circle(cx, cy, radius * 0.58).fill('#FFFFFF');
    doc.font(fonts.bold).fontSize(14).fillColor(COLORS.ink)
        .text(String(total), cx - 24, cy - 9, { width: 48, align: 'center' });
    doc.font(fonts.regular).fontSize(6.6).fillColor(COLORS.muted)
        .text('trận', cx - 24, cy + 8, { width: 48, align: 'center' });

    drawLegend(doc, fonts, rows, fallbackColors, x + 136, y + 42, width - 150);
};

const drawCharts = (doc, fonts, report = {}) => {
    const box = pageBox(doc);
    const gap = 12;
    const panelW = (box.width - gap) / 2;
    const panelH = 150;
    ensureSpace(doc, panelH + 42);
    const startY = doc.y;
    drawSectionLabel(doc, fonts, 'Sơ đồ thống kê', box.left, startY, box.width);
    const y = startY + 20;
    drawBarPanel(doc, fonts, 'Xu hướng đăng ký VĐV', report.trend || [], box.left, y, panelW, panelH);
    drawDonutPanel(doc, fonts, 'Phân bổ trạng thái trận đấu', report.distribution || [], box.left + panelW + gap, y, panelW, panelH);
    doc.y = y + panelH + 18;
};

const drawSummaryTable = (doc, fonts, stats = []) => {
    const box = pageBox(doc);
    ensureSpace(doc, 90);
    drawSectionLabel(doc, fonts, 'Bảng dữ liệu tóm tắt', box.left, doc.y, box.width);
    doc.y += 18;
    addTable(doc, fonts, [
        { label: 'STT', accessor: (_row, index) => index + 1, width: 36 },
        { label: 'Chỉ số', accessor: 'label', width: 190 },
        { label: 'Giá trị', accessor: (row) => String(row.value ?? 0), width: 110 },
        { label: 'Ghi chú', accessor: (row) => text(row.trend, ''), width: 178 },
    ], stats);
};

export const buildAdminReportPdf = async ({ report, adminName = 'Quản trị viên' }) => {
    const { doc, fonts } = createPdfDocument({
        title: 'Báo cáo quản trị viên',
        subtitle: 'Thống kê toàn hệ thống',
        orientation: 'portrait',
    });

    drawInfoPanel(doc, fonts, [
        ['Người xuất', adminName],
        ['Phạm vi', 'Toàn hệ thống'],
        ['Nguồn dữ liệu', 'MongoDB collections đang phục vụ dashboard admin'],
        ['Thời gian xuất', new Date().toLocaleString('vi-VN')],
    ]);

    drawMetrics(doc, fonts, report?.stats || []);
    drawCharts(doc, fonts, report || {});
    drawSummaryTable(doc, fonts, report?.stats || []);

    return finalizePdf(doc, fonts);
};
