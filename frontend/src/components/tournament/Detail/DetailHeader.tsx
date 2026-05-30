import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button";
import { Edit, Settings2, Trash2 } from "lucide-react";
import type { Tournament } from "@/pages/TournamentDetail";

interface DetailHeaderProps {
    tournament: Tournament;
    onRefresh: () => Promise<void>;
    onDelete: () => void;
    isDeleting: boolean;
}

// The request mentions a TournamentRulesModal, which is not provided.
// This component acts as a placeholder wrapper for the trigger button.
const TournamentRulesModal = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

export function DetailHeader({ tournament, onDelete, isDeleting }: DetailHeaderProps) {
    const sportNames = tournament.sports?.join(', ') || 'N/A';

    return (
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-6">
            <div className="w-full flex-1">
                <p className="text-sm text-muted-foreground mb-1">
                Core-ID: {tournament._id}
                </p>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900 break-words">
                    {tournament.displayName || tournament.name}
                    </h1>                
                <div className="mt-2 flex items-center gap-2">
                    <Badge variant={tournament.status === 'upcoming' ? 'secondary' : 'default'}>
                        {tournament.status}
                    </Badge>
                    <Badge variant="outline">{sportNames}</Badge>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <TournamentRulesModal>
                    <Button variant="outline">
                        <Settings2 className="mr-2 h-4 w-4" />
                        Cấu hình Vòng Đấu
                    </Button>
                </TournamentRulesModal>
                <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Sửa Thông Tin
                </Button>
                <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? 'Đang xóa...' : 'Xóa'}
                </Button>
            </div>
        </div>
    );
}