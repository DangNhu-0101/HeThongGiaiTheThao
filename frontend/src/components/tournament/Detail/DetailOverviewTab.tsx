import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, Phone, Gift } from "lucide-react";
import type { Tournament } from "@/pages/TournamentDetail";
import { format } from "date-fns";

const IMAGE_BASE_URL = "http://localhost:5001/";

export function DetailOverviewTab({ tournament }: { tournament: Tournament }) {
    return (
        <div className="space-y-6">
            {/* Banner & Logo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative h-64 rounded-lg overflow-hidden bg-gray-800">
                    {tournament.bannerUrl ? (
                        <img src={`${IMAGE_BASE_URL}${tournament.bannerUrl}`} alt="Tournament Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-white">No Banner</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    {tournament.slogan && (
                        <p className="absolute bottom-4 left-4 text-xl font-semibold text-white italic">
                            "{tournament.slogan}"
                        </p>
                    )}
                </div>
                <div className="flex items-center justify-center bg-muted rounded-lg h-64 lg:h-auto">
                    {tournament.logoUrl ? (
                        <img src={`${IMAGE_BASE_URL}${tournament.logoUrl}`} alt="Tournament Logo" className="h-40 w-40 object-contain" />
                    ) : (
                        <div className="text-muted-foreground">No Logo</div>
                    )}
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex-row items-center gap-3 space-y-0">
                        <MapPin className="h-6 w-6 text-primary" />
                        <CardTitle>Địa điểm</CardTitle>
                    </CardHeader>
                    <CardContent>{tournament.venue || 'Chưa cập nhật'}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex-row items-center gap-3 space-y-0">
                        <Users className="h-6 w-6 text-primary" />
                        <CardTitle>Đối tượng tham gia</CardTitle>
                    </CardHeader>
                    <CardContent>{tournament.targetAudience || 'Chưa cập nhật'}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex-row items-center gap-3 space-y-0">
                        <Phone className="h-6 w-6 text-primary" />
                        <CardTitle>Thông tin Ban tổ chức</CardTitle>
                    </CardHeader>
                    <CardContent>{tournament.organizerInfo || 'Chưa cập nhật'}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex-row items-center gap-3 space-y-0">
                        <Gift className="h-6 w-6 text-primary" />
                        <CardTitle>Giải thưởng</CardTitle>
                    </CardHeader>
                    <CardContent>{tournament.prizes || 'Chưa cập nhật'}</CardContent>
                </Card>
            </div>

            {/* Footer Meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground border-t pt-4">
                <div>
                    <p className="font-semibold">Ngày tạo</p>
                    <p>{format(new Date(tournament.createdAt), "dd/MM/yyyy HH:mm")}</p>
                </div>
                <div>
                    <p className="font-semibold">Cập nhật lần cuối</p>
                    <p>{format(new Date(tournament.updatedAt), "dd/MM/yyyy HH:mm")}</p>
                </div>
                <div>
                    <p className="font-semibold">Đơn vị tổ chức</p>
                    <p>{tournament.organizer?.name || 'Chưa cập nhật'}</p>
                </div>
                <div>
                    <p className="font-semibold">Khu vực</p>
                    <p>{tournament.location || 'Chưa cập nhật'}</p>
                </div>
            </div>
        </div>
    );
}