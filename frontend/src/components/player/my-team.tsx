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


export function MyTeamsPage() {
    const { userTeams, getUserTeams, getTeamDetail, members, loading } = useTeamStore();
    const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
    const [membersCache, setMembersCache] = useState<Record<string, unknown[]>>({});


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
                const { members: freshMembers } = useTeamStore.getState();
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
                    const isExpanded = expandedTeamId === team.id;
                    const memberList = membersCache[team.id] || [];
                    const activeMemberCount = memberList.filter((m: unknown) => m.status === "active").length;


                    return (
                        <Card key={team.id} className="overflow-hidden">
                            <CardHeader
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => toggleExpand(team.id)}
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
                                                <span>{team.tournamentId?.name || "Đang cập nhật"}</span>
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
                                    <h4 className="font-medium mb-3">Danh sách thành viên</h4>
                                    <MemberList members={memberList} isLoading={!memberList.length && isExpanded} />
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

