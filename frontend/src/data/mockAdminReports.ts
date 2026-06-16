import type { ReportStatItem, TrendDataPoint, DistributionDataPoint, ExportFileItem } from "@/types/adminReports";

export const mockReportStats: ReportStatItem[] = [
  { id: "rs1", label: "Tổng Vận động viên", value: "4,821", trend: "↑ 12.4% so với mùa trước", isPositive: true, iconType: "athletes" },
  { id: "rs2", label: "Đội thi đấu", value: "312", trend: "↑ 8.1% so với mùa trước", isPositive: true, iconType: "teams" },
  { id: "rs3", label: "Tổng Doanh thu", value: "$2.4M", trend: "↑ 18.2% so với mùa trước", isPositive: true, iconType: "revenue" },
];

export const mockTrendData: TrendDataPoint[] = [
  { month: "Thg 1", athletes: 400 },
  { month: "Thg 2", athletes: 800 },
  { month: "Thg 3", athletes: 1500 },
  { month: "Thg 4", athletes: 2100 },
  { month: "Thg 5", athletes: 3200 },
  { month: "Thg 6", athletes: 4821 },
];

export const mockDistributionData: DistributionDataPoint[] = [
  { name: 'Bóng đá', value: 2150, color: '#3b82f6' },
  { name: 'Bóng rổ', value: 1200, color: '#f59e0b' },
  { name: 'Quần vợt', value: 850, color: '#10b981' },
  { name: 'Bơi lội', value: 421, color: '#8b5cf6' },
  { name: 'Khác', value: 200, color: '#94a3b8' },
];

export const mockExportFiles: ExportFileItem[] = [
  { id: "ef1", name: "Báo cáo toàn mùa giải (Full Season)", description: "Toàn bộ dữ liệu hệ thống", format: "XLSX", size: "4.2 MB" },
  { id: "ef2", name: "Tóm tắt Tài chính (Financial Summary)", description: "Doanh thu & Chi phí các tổ chức", format: "CSV", size: "0.9 MB" },
  { id: "ef3", name: "Danh sách VĐV hợp lệ", description: "Hồ sơ VĐV đã được xác thực", format: "PDF", size: "1.8 MB" },
];