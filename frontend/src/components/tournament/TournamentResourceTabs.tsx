import { useState } from "react";
import { ResourceGridSection } from "@/components/shared/ResourceGridSection";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, ShieldCheck, Users, MapPin } from "lucide-react";

// --- 1. Định nghĩa kiểu dữ liệu (Interfaces) ---
interface Team {
    id: string;
    name: string;
    isPaid: boolean;
    memberCount: number;
}

interface Court {
    id: string;
    name: string;
    status: "empty" | "busy" | "maintenance";
}

// --- 2. Component sử dụng thực tế ---
export function TournamentResourceTabs() {
    // Dữ liệu mẫu (Giả lập việc fetch từ API)
    const [teams] = useState<Team[]>([
        { id: "t1", name: "Pickleball Warriors", isPaid: true, memberCount: 2 },
        { id: "t2", name: "Smash Hitters", isPaid: false, memberCount: 2 },
    ]);

    const [courts] = useState<Court[]>([
        { id: "c1", name: "Sân số 1 (Trung tâm)", status: "empty" },
        { id: "c2", name: "Sân số 2", status: "busy" },
    ]);

    return (
        <div className="space-y-10 p-6">
            {/* --- SECTION: DANH SÁCH ĐỘI --- */}
            <ResourceGridSection<Team>
                items={teams}
                title="Đội đã đăng ký"
                count={teams.length}
                emptyMessage="Chưa có đội nào đăng ký giải đấu này."
                keyExtractor={(team) => team.id}
                renderCard={(team) => (
                    <Card className="flex flex-col">
                        <CardHeader className="pb-3 flex flex-row items-start justify-between">
                            <CardTitle className="text-base font-medium">{team.name}</CardTitle>
                            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="flex-1 pb-3">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Users className="mr-2 h-4 w-4" />
                                {team.memberCount} thành viên
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                            <Badge variant={team.isPaid ? "default" : "outline"} className="w-full justify-center">
                                {team.isPaid ? "Đã đóng phí" : "Miễn phí / Chưa đóng"}
                            </Badge>
                        </CardFooter>
                    </Card>
                )}
            />

            {/* --- SECTION: DANH SÁCH SÂN --- */}
            <ResourceGridSection<Court>
                items={courts}
                title="Sân thi đấu"
                count={courts.length}
                emptyMessage="Bạn chưa cấu hình sân thi đấu nào."
                keyExtractor={(court) => court.id}
                headerAction={
                    <Button size="sm">
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Thêm Sân
                    </Button>
                }
                renderCard={(court) => (
                    <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-md"><MapPin className="h-5 w-5 text-primary" /></div>
                                <span className="font-medium text-sm">{court.name}</span>
                            </div>
                            <Badge variant={court.status === "empty" ? "secondary" : "destructive"}>
                                {court.status}
                            </Badge>
                        </CardContent>
                    </Card>
                )}
            />
        </div>
    );
}