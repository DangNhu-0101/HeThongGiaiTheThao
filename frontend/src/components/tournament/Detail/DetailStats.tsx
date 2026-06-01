import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Tournament } from "@/components/tournament/TournamentDetail";
import { Users, Shield, LandPlot, Flag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    detailsLinkText: string;
    onDetailsClick: () => void;
}

const StatCard = ({ title, value, icon: Icon, detailsLinkText, onDetailsClick }: StatCardProps) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <Button variant="ghost" className="text-xs text-sky-600 hover:underline p-0 h-auto mt-1" onClick={onDetailsClick}>
                {detailsLinkText}
            </Button>
        </CardContent>
    </Card>
);


export function DetailStats({ tournament }: { tournament: Tournament }) {
    const teamCount = tournament.registeredTeams?.length || tournament.teams?.length || 0;
    const playerCount = teamCount * 2; // As per requirement
    const courtCount = tournament.courts?.length || 0;
    const refereeCount = tournament.referees?.length || 0;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard
                title="Số đội"
                value={teamCount}
                icon={Shield}
                detailsLinkText="Xem chi tiết ➔"
                onDetailsClick={() => console.log("Navigate to teams")}
            />
            <StatCard
                title="Vận động viên"
                value={playerCount}
                icon={Users}
                detailsLinkText="Xem chi tiết ➔"
                onDetailsClick={() => console.log("Navigate to players")}
            />
            <StatCard
                title="Số sân"
                value={courtCount}
                icon={LandPlot}
                detailsLinkText="Xem chi tiết ➔"
                onDetailsClick={() => console.log("Navigate to courts")}
            />
            <StatCard
                title="Trọng tài"
                value={refereeCount}
                icon={Flag}
                detailsLinkText="Xem chi tiết ➔"
                onDetailsClick={() => console.log("Navigate to referees")}
            />
        </div>
    );
}