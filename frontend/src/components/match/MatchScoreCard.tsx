import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import type { Match } from "@/types/match_scoring";

interface MatchScoreCardProps {
  match: Match;
  onOpenScoring: (match: Match) => void;
}

export const MatchScoreCard: React.FC<MatchScoreCardProps> = ({ match, onOpenScoring }) => {
  const getStatusBadge = (status: Match['status']) => {
    switch (status) {
      case 'SCHEDULED': 
        return <Badge variant="secondary" className="bg-slate-200 text-slate-700 shadow-none border-none">Chưa bắt đầu</Badge>;
      case 'IN_PROGRESS': 
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 shadow-none">Đang diễn ra</Badge>;
      case 'COMPLETED': 
        return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 shadow-none">Kết thúc</Badge>;
      default: return null;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between py-3 space-y-0 border-b border-slate-50">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">
          {match.round ? `${match.round} - ` : ""}Trận {match.matchNumber}
        </span>
        {getStatusBadge(match.status)}
      </CardHeader>
      <CardContent className="py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <p className="font-bold text-slate-900 truncate text-sm">{match.teamA?.name || '---'}</p>
          </div>
          <div className="flex flex-col items-center px-4">
            <div className="text-3xl font-black text-slate-800 tracking-tighter">
              {match.team1Score ?? 0} <span className="text-slate-300 font-light">:</span> {match.team2Score ?? 0}
            </div>
          </div>
          <div className="flex-1 text-center">
            <p className="font-bold text-slate-900 truncate text-sm">{match.teamB?.name || '---'}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-4">
        <Button 
          variant="outline" 
          className="w-full gap-2 text-sky-600 border-sky-100 hover:bg-sky-50 hover:text-sky-700 font-bold"
          onClick={() => onOpenScoring(match)}
        >
          <Trophy className="h-4 w-4" />
          Nhập điểm
        </Button>
      </CardFooter>
    </Card>
  );
};