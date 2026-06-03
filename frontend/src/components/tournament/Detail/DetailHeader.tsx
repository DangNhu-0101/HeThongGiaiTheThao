import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button";
import { Edit, Settings2, Trash2 } from "lucide-react";
import type { Tournament } from "@/components/tournament/TournamentDetail";
import TournamentRulesModal from "../RuleModal/TournamentRulesModal";
import { EditTournamentModal } from "../EditTournamentModal";

interface DetailHeaderProps {
    tournament: Tournament;
    onRefresh: () => Promise<void>;
    onDelete: () => void;
    isDeleting: boolean;
}

export function DetailHeader({ tournament, onRefresh, onDelete, isDeleting }: DetailHeaderProps) {
    const sportNames = (tournament.sports?.length ? tournament.sports : tournament.sportType)?.join(', ') || 'N/A';

    return (
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-6">
            <div className="w-full flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                Core-ID: {tournament._id}
                </p>
                <h1 
                    className="text-2xl md:text-4xl font-bold tracking-tight drop-shadow-lg break-words "
                >
                    {tournament.displayName || tournament.name || "TÊN GIẢI ĐẤU TRỐNG"}
                    </h1>                
                <div className="mt-2 flex items-center gap-2">
                    <Badge variant={tournament.status === 'upcoming' ? 'secondary' : 'default'}>
                        {tournament.status}
                    </Badge>
                    <Badge variant="outline">{sportNames}</Badge>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <TournamentRulesModal tournamentId={tournament._id} onSuccess={onRefresh}>
                    <Button variant="outline">
                        <Settings2 className="mr-2 h-4 w-4" />
                        Cấu hình Vòng Đấu
                    </Button>
                </TournamentRulesModal>
                <EditTournamentModal tournament={tournament} onSuccess={onRefresh}>
                    <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Sửa Thông Tin
                    </Button>
                </EditTournamentModal>
                <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? 'Đang xóa...' : 'Xóa'}
                </Button>
            </div>
        </div>
    );
}
