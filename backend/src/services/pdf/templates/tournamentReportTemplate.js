import { addKeyValueRows, addSectionTitle, addTable, createPdfDocument, finalizePdf } from '../pdfExportService.js';

const formatDate = (value) => {
    if (!value) return 'Chưa cập nhật';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
    return date.toLocaleDateString('vi-VN');
};

const money = (value) => Number(value || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
});

export const buildTournamentOverviewPdf = async ({ tournament, teams = [], exportedBy }) => {
    const { doc, fonts } = createPdfDocument({
        title: `Báo cáo tổng quan giải đấu`,
        subtitle: tournament?.name || 'Giải đấu',
    });

    addSectionTitle(doc, fonts, 'Thông tin giải đấu');
    addKeyValueRows(doc, fonts, [
        ['Tên giải', tournament?.name],
        ['Môn thể thao', tournament?.sportType || tournament?.categoryRule?.sportType],
        ['Thể thức', tournament?.format],
        ['Địa điểm', tournament?.location?.detail || tournament?.location?.city],
        ['Thời gian đăng ký', `${formatDate(tournament?.timeLine?.registrationStart)} - ${formatDate(tournament?.timeLine?.registrationEnd)}`],
        ['Thời gian thi đấu', `${formatDate(tournament?.timeLine?.tournamentStart || tournament?.startDate)} - ${formatDate(tournament?.timeLine?.tournamentEnd || tournament?.endDate)}`],
        ['Trạng thái', tournament?.status],
        ['Lệ phí mỗi vận động viên', money(tournament?.feeEntry || tournament?.paymentConfig?.feePerAthlete)],
        ['Người xuất', exportedBy?.name || exportedBy?.username || exportedBy?.email],
    ]);

    addSectionTitle(doc, fonts, 'Chỉ số tổng quan');
    addKeyValueRows(doc, fonts, [
        ['Số đội đã đăng ký', String(teams.length)],
        ['Giới hạn đăng ký', String(tournament?.maxTeams || 'Chưa cấu hình')],
        ['Đội đã duyệt', String(teams.filter((team) => team.registrationStatus === 'approved').length)],
        ['Đội miễn phí', String(teams.filter((team) => team.paymentStatus === 'exempted').length)],
    ]);

    addSectionTitle(doc, fonts, 'Danh sách đội tham gia');
    if (!teams.length) {
        doc.font(fonts.regular).fontSize(10).fillColor('#64748B').text('Chưa có đội tham gia.');
    } else {
        addTable(doc, fonts, [
            { label: 'STT', accessor: (_row, index) => index + 1, width: 36 },
            { label: 'Tên đội', accessor: 'name', width: 150 },
            { label: 'Người đại diện', accessor: (row) => row.representative?.name || '', width: 120 },
            { label: 'Trạng thái', accessor: 'registrationStatus', width: 90 },
            { label: 'Lệ phí', accessor: 'paymentStatus', width: 90 },
            { label: 'Số VĐV', accessor: (row) => row.lineup?.length || 0, width: 60 },
        ], teams.map((team, index) => ({ ...team, index })));
    }

    return finalizePdf(doc, fonts);
};
