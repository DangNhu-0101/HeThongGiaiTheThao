import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Edit2, MapPin } from "lucide-react";
import type { Match } from "@/types/automator";
import { cn } from "@/libs/utils";

interface MatchCardProps {
  match: Match;
  variant: 'group' | 'knockout';
  onEdit?: (match: Match) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, variant, onEdit }) => {
  const isGroup = variant === 'group';
  const matchLabel = match.roundName || match.matchName || (match.round ? `Vòng ${match.round}` : "");
  const teamAName = match.teamA?.name || match.team1Name || 'Chưa xác định';
  const teamBName = match.teamB?.name || match.team2Name || 'Chưa xác định';

  return (
    <Card className={cn(
      "relative overflow-hidden border-l-4 transition-all hover:shadow-md",
      isGroup
        ? "border-l-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50"
        : "border-l-violet-500 bg-gradient-to-br from-violet-50 to-fuchsia-50"
    )}>
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Badge variant="outline" className="bg-white/60 font-bold">
              {matchLabel ? `${matchLabel} - ` : ""}Trận {match.matchNumber}
            </Badge>
            {match.slotCode && (
              <div className="font-mono text-[10px] font-semibold text-slate-400">{match.slotCode}</div>
            )}
          </div>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(match)}
              className="h-8 w-8 text-slate-500 hover:text-slate-900"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mb-4 space-y-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm font-semibold text-slate-700">
            <span className={cn("truncate", !match.teamA && "italic text-slate-500")}>
              {teamAName}
            </span>
            <span className="text-xs text-slate-400">VS</span>
            <span className={cn("truncate text-right", !match.teamB && "italic text-slate-500")}>
              {teamBName}
            </span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 font-mono text-[10px] text-slate-400">
            <span className="truncate">{match.team1SlotCode}</span>
            <span />
            <span className="truncate text-right">{match.team2SlotCode}</span>
          </div>
          {match.winnerTarget && (
            <div className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
              Thắng tới: {match.winnerTarget}
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-wrap gap-3 border-t border-slate-200/60 pt-2">
          <div className="flex items-center text-[11px] font-medium text-slate-500">
            <Calendar className="mr-1 h-3 w-3" />
            {match.scheduledStartTime ? new Date(match.scheduledStartTime).toLocaleString('vi-VN') : 'Chưa xếp lịch'}
          </div>
          <div className="flex items-center text-[11px] font-medium text-slate-500">
            <MapPin className="mr-1 h-3 w-3" />
            {match.courtName || 'Chưa gán sân'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
