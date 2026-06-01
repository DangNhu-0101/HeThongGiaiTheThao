import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ResourceGridSection } from "@/components/shared/ResourceGridSection";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, ShieldCheck, Users, MapPin } from "lucide-react";
import { resourceService, type ApiCourt, type ApiTeam } from "@/services/resourceService";

export function TournamentResourceTabs() {
  const { id } = useParams<{ id: string }>();
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [courts, setCourts] = useState<ApiCourt[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadResources = async () => {
      const [teamData, courtData] = await Promise.all([
        resourceService.getTeams(id).catch(() => []),
        resourceService.getCourts(id).catch(() => []),
      ]);

      if (!isMounted) return;
      setTeams(teamData);
      setCourts(courtData);
    };

    void loadResources();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="space-y-10 p-6">
      <ResourceGridSection<ApiTeam>
        items={teams}
        title="Đội đã đăng ký"
        count={teams.length}
        emptyMessage="Chưa có đội nào đăng ký giải đấu này."
        keyExtractor={(team) => team._id}
        renderCard={(team) => (
          <Card className="flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <CardTitle className="text-base font-medium">{team.name}</CardTitle>
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex-1 pb-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-2 h-4 w-4" />
                {team.memberCount ?? team.members?.length ?? 0} thành viên
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

      <ResourceGridSection<ApiCourt>
        items={courts}
        title="Sân thi đấu"
        count={courts.length}
        emptyMessage="Bạn chưa cấu hình sân thi đấu nào."
        keyExtractor={(court) => court._id}
        headerAction={
          <Button size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            Thêm sân
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
                {court.status || "Chưa rõ"}
              </Badge>
            </CardContent>
          </Card>
        )}
      />
    </div>
  );
}
