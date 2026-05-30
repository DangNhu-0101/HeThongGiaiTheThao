import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tournament } from "@/pages/TournamentDetail";
import { format } from "date-fns";

const IMAGE_BASE_URL = "http://localhost:5001/";

export function DetailConfigTab({ tournament }: { tournament: Tournament }) {
    const estimatedRevenue = tournament.sportsConfig?.reduce((acc, config) => {
        return acc + (config.feeEntry * config.maxTeams);
    }, 0) || 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    return (
        <div className="space-y-8">
            {/* Sports Config */}
            <div>
                <h3 className="text-xl font-semibold mb-4">Cấu hình Môn thi đấu</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tournament.sportsConfig?.map((config, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <CardTitle>{config.sportName}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Nội dung</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {config.categories.map(cat => <Badge key={cat} variant="secondary">{cat}</Badge>)}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <p className="text-sm font-medium">Lệ phí:</p>
                                    <p className="text-sm">{formatCurrency(config.feeEntry)}</p>
                                </div>
                                <div className="flex justify-between">
                                    <p className="text-sm font-medium">Số đội tối đa:</p>
                                    <p className="text-sm">{config.maxTeams}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    <Card className="md:col-span-2 lg:col-span-1 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <CardHeader>
                            <CardTitle className="text-green-800 dark:text-green-300">Doanh thu dự kiến</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-green-700 dark:text-green-400">{formatCurrency(estimatedRevenue)}</p>
                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">Dựa trên lệ phí và số đội tối đa.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Gala & QR */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <h3 className="text-xl font-semibold mb-4">Sự kiện Gala</h3>
                    {tournament.galaInfo ? (
                        <Card>
                            <CardContent className="pt-6 space-y-2">
                                <p><strong>Địa điểm:</strong> {tournament.galaInfo.venue}</p>
                                <p><strong>Thời gian:</strong> {format(new Date(tournament.galaInfo.time), "dd/MM/yyyy HH:mm")}</p>
                                <p><strong>Mô tả:</strong> {tournament.galaInfo.description}</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <p className="text-muted-foreground">Chưa có thông tin sự kiện Gala.</p>
                    )}
                </div>
                <div className="lg:col-span-2">
                    <h3 className="text-xl font-semibold mb-4">QR Thanh toán</h3>
                    {tournament.paymentInfo?.qrCodeUrl ? (
                        <div className="p-4 border rounded-lg flex justify-center">
                            <img src={`${IMAGE_BASE_URL}${tournament.paymentInfo.qrCodeUrl}`} alt="Payment QR Code" className="w-48 h-48 object-contain" />
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Chưa có mã QR thanh toán.</p>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <div>
                <h3 className="text-xl font-semibold mb-4">Mốc thời gian quan trọng</h3>
                <Card>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-muted rounded-md">
                            <p className="font-semibold">Đăng ký</p>
                            <p className="text-sm text-muted-foreground">
                                Từ {format(new Date(tournament.timeline.registrationStart), "dd/MM/yyyy")}
                                {' '}đến {format(new Date(tournament.timeline.registrationEnd), "dd/MM/yyyy")}
                            </p>
                        </div>
                        <div className="p-3 bg-muted rounded-md">
                            <p className="font-semibold">Thi đấu</p>
                            <p className="text-sm text-muted-foreground">
                                Từ {format(new Date(tournament.timeline.tournamentStart), "dd/MM/yyyy")}
                                {' '}đến {format(new Date(tournament.timeline.tournamentEnd), "dd/MM/yyyy")}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}