// src/pages/MyTeamsPage.tsx
import { useEffect, useState } from "react";
import { useTeamStore } from "@/stores/useTeamStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight, Trophy, Users } from "lucide-react";
import { MemberList } from "@/components/player/member-list"; 
import type { Team } from "@/types/Team";
import type { Member } from "@/types/member"; // 🆕 Import thêm type Member

export function MyTeamsPage() {
    const { userTeams, getUserTeams, getTeamDetail, loading } = useTeamStore();
    const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
    
    // 🆕 SỬA DÒNG 16: Thay đổi kiểu dữ liệu Record từ unknown[] sang Member[]
    const [membersCache, setMembersCache] = useState<Record<string, Member[]>>({});

    useEffect(() => {
        getUserTeams();
    }, [getUserTeams]);

    const toggleExpand = async (teamId: string) => {
        if (expandedTeamId === teamId) {
            setExpandedTeamId(null);
        } else {
            setExpandedTeamId(teamId);
            if (!membersCache[teamId]) {
                await getTeamDetail(teamId);
                // Lấy dữ liệu state mới nhất từ Zustand store sau khi gọi API thành công
                const freshMembers = useTeamStore.getState().members;
                setMembersCache((prev) => ({ ...prev, [teamId]: freshMembers }));
            }
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!userTeams.length) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Bạn chưa tham gia đội nào</CardTitle>
                        <CardDescription>
                            Hãy tạo đội mới hoặc chấp nhận lời mời để bắt đầu.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Đội của tôi</h1>
            <div className="space-y-4">
                {userTeams.map((team: Team) => {
                    const teamId = (team as { id?: string; _id?: string }).id || (team as { id?: string; _id?: string })._id || "";
                    const isExpanded = expandedTeamId === teamId;
                    const memberList = membersCache[teamId] || [];
                    
                    // 🆕 SỬA DÒNG 82: Do mảng đã là Member[] nên việc chấm .status hoàn toàn hợp lệ
                    const activeMemberCount = memberList.filter((m: Member) => m.status === "Active" || (m.status as string) === "active").length;

                    // 🆕 SỬA DÒNG 100: Kiểm tra an toàn xem tournamentId là chuỗi hay object trước khi lấy tên giải đấu
                    const tournamentName = team.tournamentId && typeof team.tournamentId === "object"
                        ? (team.tournamentId as { name?: string }).name || "Giải đấu Pickleball"
                        : "Giải đấu Pickleball";

                    return (
                        <Card key={teamId} className="overflow-hidden">
                            <CardHeader
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => teamId && toggleExpand(teamId)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">
                                            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                            {team.name}
                                        </CardTitle>
                                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Trophy className="h-4 w-4" />
                                                <span>{tournamentName}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                <span>{activeMemberCount} thành viên</span>
                                            </div>
                                            <Badge variant="outline">{team.sportCategory || "Pickleball"}</Badge>
                                        </div>
                                    </div>
                                    {team.logo && (
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={team.logo} alt={team.name} />
                                            <AvatarFallback>{team.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            </CardHeader>

                            {isExpanded && (
                                <CardContent className="border-t pt-4">
                                    <MemberList members={memberList} />
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}