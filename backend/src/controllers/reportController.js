import { buildOrgReportPdf } from '../services/pdf/templates/orgReportTemplate.js';
import { safePdfFileName } from '../services/pdf/pdfExportService.js';

export const exportOrgReportPdf = async (req, res) => {
    try {
        const { report, filters, organizationName } = req.body || {};
        if (!report || !Array.isArray(report.tournaments)) {
            return res.status(400).json({ message: 'Thiếu dữ liệu báo cáo để xuất PDF' });
        }
        const buffer = await buildOrgReportPdf({
            report,
            filters,
            organizationName: organizationName || req.user?.username || 'Ban tổ chức',
        });
        const date = new Date().toISOString().slice(0, 10);
        const fileName = `bao-cao-giai-dau-${safePdfFileName(date)}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        return res.send(buffer);
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Không thể xuất báo cáo PDF' });
    }
};
