import { addTable, createPdfDocument, finalizePdf } from '../pdfExportService.js';

const COLORS = {
    ink: '#0D243B',
    muted: '#64748B',
    border: '#DCE3EA',
    panel: '#F8FAFC',
    header: '#EEF3F8',
    primary: '#325978',
    accent: '#A7CADF',
    green: '#16A34A',
    amber: '#D97706',
};

const money = (value) => Number(value || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
});

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

    const labelW = 92;
    const startY = y + 32;
    rows.forEach(([label, value], index) => {
        const rowY = startY + index * 10;
        doc.font(fonts.bold).fontSize(8).fillColor(COLORS.muted)
            .text(`${label}:`, box.left + 14, rowY, { width: labelW });
        doc.font(fonts.regular).fontSize(8).fillColor('#334155')
            .text(text(value), box.left + 14 + labelW, rowY, { width: box.width - labelW - 28 });
    });
    doc.y = y + height + 14;
};

const drawMetric = (doc, fonts, label, value, x, y, width) => {
    doc.roundedRect(x, y, width, 54, 8).fillAndStroke('#FFFFFF', COLORS.border);
    doc.font(fonts.bold).fontSize(8).fillColor(COLORS.muted)
        .text(label, x + 10, y + 10, { width: width - 20 });
    doc.font(fonts.bold).fontSize(15).fillColor(COLORS.ink)
        .text(String(value), x + 10, y + 28, { width: width - 20, height: 20 });
};

const drawMetrics = (doc, fonts, report) => {
    const box = pageBox(doc);
    const gap = 10;
    const width = (box.width - gap * 3) / 4;
    const y = doc.y;
    ensureSpace(doc, 64);
    drawMetric(doc, fonts, 'Tổng giải', report?.summary?.totalTournaments || 0, box.left, y, width);
    drawMetric(doc, fonts, 'Tổng đội', report?.summary?.totalTeams || 0, box.left + (width + gap), y, width);
    drawMetric(doc, fonts, 'Tổng VĐV', report?.summary?.totalPlayers || 0, box.left + (width + gap) * 2, y, width);
    drawMetric(doc, fonts, 'Đã thu', money(report?.summary?.collectedAmount || 0), box.left + (width + gap) * 3, y, width);
    doc.y = y + 68;
};

const normalizedChart = (data = []) => data
    .filter(Boolean)
    .map((item) => ({
        name: text(item.name, 'Không rõ'),
        value: Number(item.value || item.expected || item.collected || 0),
    }))
    .filter((item) => item.value > 0)
    .slice(0, 7);

const drawBarPanel = (doc, fonts, title, data, x, y, width, height) => {
    doc.roundedRect(x, y, width, height, 8).fillAndStroke('#FFFFFF', COLORS.border);
    doc.font(fonts.bold).fontSize(10).fillColor(COLORS.ink)
        .text(title, x + 12, y + 12, { width: width - 24 });

    const rows = normalizedChart(data);
    if (!rows.length) {
        doc.font(fonts.regular).fontSize(8).fillColor(COLORS.muted)
            .text('Không có dữ liệu', x + 12, y + 42, { width: width - 24 });
        return;
    }

    const max = Math.max(...rows.map((item) => item.value), 1);
    const labelW = Math.min(86, Math.max(64, width * 0.36));
    const barX = x + 12 + labelW + 8;
    const barMaxW = width - labelW - 58;
    const rowGap = Math.min(14, (height - 46) / rows.length);

    rows.forEach((item, index) => {
        const rowY = y + 38 + index * rowGap;
        const barW = Math.max(8, (item.value / max) * barMaxW);
        doc.font(fonts.regular).fontSize(7.4).fillColor('#334155')
            .text(item.name, x + 12, rowY - 1, { width: labelW, height: 10, ellipsis: true });
        doc.roundedRect(barX, rowY, barW, 8, 2).fill(index % 2 === 0 ? COLORS.primary : COLORS.accent);
        doc.font(fonts.bold).fontSize(7.4).fillColor(COLORS.ink)
            .text(String(item.value), barX + barMaxW + 8, rowY - 1, { width: 28, align: 'right' });
    });
};

const chartRows = (data = []) => normalizedChart(data);

const drawLegend = (doc, fonts, rows, colors, x, y, width) => {
    rows.slice(0, 6).forEach((item, index) => {
        const rowY = y + index * 12;
        doc.roundedRect(x, rowY + 2, 7, 7, 1.5).fill(colors[index % colors.length]);
        doc.font(fonts.regular).fontSize(7.4).fillColor('#334155')
            .text(item.name, x + 11, rowY, { width: width - 42, height: 10, ellipsis: true });
        doc.font(fonts.bold).fontSize(7.4).fillColor(COLORS.ink)
            .text(String(item.value), x + width - 28, rowY, { width: 28, align: 'right' });
    });
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

const drawPiePanel = (doc, fonts, title, data, x, y, width, height) => {
    const colors = [COLORS.primary, COLORS.accent, COLORS.green, COLORS.amber, '#730F1A', '#6366F1'];
    doc.roundedRect(x, y, width, height, 8).fillAndStroke('#FFFFFF', COLORS.border);
    doc.font(fonts.bold).fontSize(10).fillColor(COLORS.ink)
        .text(title, x + 12, y + 12, { width: width - 24 });

    const rows = chartRows(data);
    if (!rows.length) {
        doc.font(fonts.regular).fontSize(8).fillColor(COLORS.muted)
            .text('Không có dữ liệu', x + 12, y + 42, { width: width - 24 });
        return;
    }

    const total = rows.reduce((sum, item) => sum + item.value, 0) || 1;
    const cx = x + 66;
    const cy = y + height / 2 + 8;
    const radius = Math.min(38, height / 3);
    let start = -Math.PI / 2;
    rows.forEach((item, index) => {
        const end = start + (item.value / total) * Math.PI * 2;
        drawSector(doc, cx, cy, radius, start, end, colors[index % colors.length]);
        start = end;
    });
    doc.circle(cx, cy, radius * 0.56).fill('#FFFFFF');
    doc.font(fonts.bold).fontSize(12).fillColor(COLORS.ink)
        .text(String(total), cx - radius * 0.45, cy - 8, { width: radius * 0.9, align: 'center' });
    doc.font(fonts.regular).fontSize(6.6).fillColor(COLORS.muted)
        .text('tổng', cx - radius * 0.45, cy + 6, { width: radius * 0.9, align: 'center' });

    drawLegend(doc, fonts, rows, colors, x + 124, y + 42, width - 138);
};

const drawRevenuePanel = (doc, fonts, title, data = [], x, y, width, height) => {
    doc.roundedRect(x, y, width, height, 8).fillAndStroke('#FFFFFF', COLORS.border);
    doc.font(fonts.bold).fontSize(10).fillColor(COLORS.ink)
        .text(title, x + 12, y + 12, { width: width - 24 });

    const rows = data
        .filter(Boolean)
        .map((item) => ({
            name: text(item.name, 'Không rõ'),
            expected: Number(item.expected || 0),
            collected: Number(item.collected || 0),
        }))
        .filter((item) => item.expected > 0 || item.collected > 0)
        .slice(0, 5);

    if (!rows.length) {
        doc.font(fonts.regular).fontSize(8).fillColor(COLORS.muted)
            .text('Không có dữ liệu', x + 12, y + 42, { width: width - 24 });
        return;
    }

    const max = Math.max(...rows.flatMap((item) => [item.expected, item.collected]), 1);
    const chartX = x + 34;
    const chartY = y + 42;
    const chartW = width - 58;
    const chartH = height - 68;
    const slot = chartW / rows.length;
    rows.forEach((item, index) => {
        const groupX = chartX + index * slot + slot * 0.22;
        const barW = Math.min(14, slot * 0.2);
        const expectedH = (item.expected / max) * chartH;
        const collectedH = (item.collected / max) * chartH;
        doc.roundedRect(groupX, chartY + chartH - expectedH, barW, expectedH, 2).fill(COLORS.accent);
        doc.roundedRect(groupX + barW + 3, chartY + chartH - collectedH, barW, collectedH, 2).fill(COLORS.primary);
        doc.font(fonts.regular).fontSize(6.7).fillColor('#334155')
            .text(item.name, chartX + index * slot, chartY + chartH + 5, { width: slot, align: 'center', ellipsis: true });
    });
    doc.roundedRect(x + width - 92, y + 17, 7, 7, 1.5).fill(COLORS.accent);
    doc.font(fonts.regular).fontSize(7).fillColor(COLORS.muted).text('Dự kiến', x + width - 82, y + 15, { width: 34 });
    doc.roundedRect(x + width - 46, y + 17, 7, 7, 1.5).fill(COLORS.primary);
    doc.font(fonts.regular).fontSize(7).fillColor(COLORS.muted).text('Đã thu', x + width - 36, y + 15, { width: 30 });
};

const drawCharts = (doc, fonts, charts = {}) => {
    const box = pageBox(doc);
    const gap = 12;
    const panelW = (box.width - gap) / 2;
    const panelH = 118;
    ensureSpace(doc, panelH * 3 + gap * 2 + 20);
    const startY = doc.y;
    drawSectionLabel(doc, fonts, 'Sơ đồ thống kê', box.left, startY, box.width);
    const y = startY + 20;

    drawBarPanel(doc, fonts, 'Số giải theo thời gian', charts.tournamentsByTime || [], box.left, y, panelW, panelH);
    drawPiePanel(doc, fonts, 'Số giải theo trạng thái', charts.tournamentsByStatus || [], box.left + panelW + gap, y, panelW, panelH);
    drawBarPanel(doc, fonts, 'Số giải theo môn thể thao', charts.tournamentsBySport || [], box.left, y + panelH + gap, panelW, panelH);
    drawBarPanel(doc, fonts, 'Số đội đăng ký theo thời gian', charts.teamsByTime || [], box.left + panelW + gap, y + panelH + gap, panelW, panelH);
    drawPiePanel(doc, fonts, 'Tỷ lệ đội được duyệt', charts.teamApproval || [], box.left, y + (panelH + gap) * 2, panelW, panelH);
    drawRevenuePanel(doc, fonts, 'Lệ phí dự kiến so với thực tế', charts.revenueByTime || [], box.left + panelW + gap, y + (panelH + gap) * 2, panelW, panelH);
    doc.y = y + panelH * 3 + gap * 2 + 18;
};

const statusLabel = (status) => ({
    Live: 'Đang diễn ra',
    Completed: 'Hoàn tất',
    Draft: 'Bản nháp',
    'Registration Open': 'Mở đăng ký',
}[status] || text(status, 'Không rõ'));

const short = (value, length = 34) => {
    const output = text(value, '');
    return output.length > length ? `${output.slice(0, length - 1)}…` : output;
};

const drawTournamentTable = (doc, fonts, tournaments = []) => {
    const box = pageBox(doc);
    ensureSpace(doc, 84);
    drawSectionLabel(doc, fonts, 'Bảng dữ liệu tóm tắt', box.left, doc.y, box.width);
    doc.y += 18;
    addTable(doc, fonts, [
        { label: 'STT', accessor: (_row, index) => index + 1, width: 28 },
        { label: 'Giải đấu', accessor: (row) => short(row.name, 32), width: 132 },
        { label: 'Môn', accessor: (row) => short(row.sport, 16), width: 68 },
        { label: 'Hình thức', accessor: (row) => short(row.competitionType || row.kind, 18), width: 74 },
        { label: 'Trạng thái', accessor: (row) => statusLabel(row.status), width: 82 },
        { label: 'Đội', accessor: (row) => Number(row.teamsCount || row.registration?.current || 0), width: 34 },
        { label: 'Lệ phí/VĐV', accessor: (row) => money(row.feeEntry || 0), width: 93 },
    ], tournaments);
};

export const buildOrgReportPdf = async ({ report, filters = {}, organizationName = 'Ban tổ chức' }) => {
    const { doc, fonts } = createPdfDocument({
        title: 'Báo cáo giải đấu',
        subtitle: 'Báo cáo Ban tổ chức',
        orientation: 'portrait',
    });

    drawInfoPanel(doc, fonts, [
        ['Ban tổ chức', organizationName],
        ['Khoảng thời gian', `${filters.from || 'Từ đầu'} - ${filters.to || 'Hiện tại'}`],
        ['Bộ lọc', `${filters.sport || 'Tất cả môn'} · ${filters.status || 'Tất cả trạng thái'} · ${filters.kind || 'Tất cả hình thức'}`],
        ['Thời gian xuất', new Date().toLocaleString('vi-VN')],
    ]);

    drawMetrics(doc, fonts, report);
    drawCharts(doc, fonts, report?.charts || {});
    drawTournamentTable(doc, fonts, report?.tournaments || []);

    return finalizePdf(doc, fonts);
};
