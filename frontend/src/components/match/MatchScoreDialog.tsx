import React, { useState} from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Match } from "@/types/match_scoring";

interface MatchScoreDialogProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (matchId: string, team1Score: number, team2Score: number, isFinal: boolean) => Promise<void>;
  isProcessing: boolean;
}

export const MatchScoreDialog: React.FC<MatchScoreDialogProps> = ({
  match,
  isOpen,
  onClose,
  onSubmit,
  isProcessing,
}) => {
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [prevMatchId, setPrevMatchId] = useState<string | null>(null);

  // Sync prop to state during render (Recommended pattern to avoid react-hooks/set-state-in-effect)
  if (match && match._id !== prevMatchId) {
    setPrevMatchId(match._id);
    setTeam1Score(match.team1Score ?? 0);
    setTeam2Score(match.team2Score ?? 0);
  }

  const handleAction = (isFinal: boolean) => {
    if (match) {
      void onSubmit(match._id, team1Score, team2Score, isFinal);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Cập nhật tỉ số trận {match?.matchNumber}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-8 py-8 px-2">
          <div className="space-y-4">
            <Label className="text-center block text-slate-500 font-bold truncate text-xs uppercase">
              {match?.teamA?.name || 'Đội A'}
            </Label>
            <Input
              type="number"
              min="0"
              className="text-center text-3xl h-20 font-black border-slate-200 focus-visible:ring-sky-500"
              value={team1Score}
              onChange={(e) => setTeam1Score(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
          <div className="space-y-4">
            <Label className="text-center block text-slate-500 font-bold truncate text-xs uppercase">
              {match?.teamB?.name || 'Đội B'}
            </Label>
            <Input
              type="number"
              min="0"
              className="text-center text-3xl h-20 font-black border-slate-200 focus-visible:ring-sky-500"
              value={team2Score}
              onChange={(e) => setTeam2Score(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isProcessing} className="flex-1">Hủy</Button>
          <Button 
            variant="outline" 
            onClick={() => handleAction(false)} 
            disabled={isProcessing}
            className="flex-1 border-sky-200 text-sky-700 hover:bg-sky-50"
          >
            Cập nhật
          </Button>
          <Button 
            variant="default" 
            onClick={() => handleAction(true)} 
            disabled={isProcessing}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Kết thúc trận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};