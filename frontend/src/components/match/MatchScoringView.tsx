import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/axiosConfig";
import type {  Match, ScorePayload } from "@/types/match_scoring";
import { MatchScoreCard } from "./MatchScoreCard";
import { MatchScoreDialog } from "./MatchScoreDialog";

export const MatchScoringView: React.FC = () => {
  const params = useParams<{ id?: string; tournamentId?: string }>();
  const tournamentId = params.tournamentId ?? params.id;
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    let ignore = false;

    const loadMatches = async () => {
      if (!tournamentId) return;
      setIsLoading(true);
      try {
        const response = await api.get(`/matches?tournamentId=${tournamentId}`);
        if (!ignore) {
          setMatches(response.data.data || []);
        }
      } catch {
        toast.error("Không thể tải danh sách trận đấu");
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void loadMatches();
    return () => { ignore = false; };
  }, [tournamentId]);

  const handleScoreSubmit = async (matchId: string, team1Score: number, team2Score: number, isFinal: boolean) => {
    setIsProcessing(true);
    const payload: ScorePayload = {
      team1Score,
      team2Score,
      status: isFinal ? 'COMPLETED' : 'IN_PROGRESS',
    };

    try {
      await api.put(`/matches/${matchId}/score`, payload);
      
      setMatches(prev => prev.map(m => 
        m._id === matchId 
          ? { ...m, team1Score, team2Score, status: payload.status } 
          : m
      ));
      
      toast.success(isFinal ? "Trận đấu đã kết thúc" : "Đã cập nhật tỉ số");
      setSelectedMatch(null);
    } catch {
      toast.error("Lỗi khi cập nhật kết quả");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
        <p className="text-slate-400 font-medium">Đang tải dữ liệu trận đấu...</p>
      </div>
    );
  }

  const groupMatches = matches.filter(m => m.isGroupStage);
  const knockoutMatches = matches.filter(m => !m.isGroupStage);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ghi nhận tỉ số</h1>
        <p className="text-slate-500">Cập nhật kết quả thi đấu thời gian thực cho giải đấu</p>
      </header>

      {matches.length === 0 ? (
        <Alert className="bg-slate-50 border-slate-200">
          <Info className="h-4 w-4 text-slate-400" />
          <AlertDescription className="text-slate-500">Chưa tìm thấy trận đấu nào cho giải đấu này.</AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="group" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
            <TabsTrigger value="group" className="font-bold">Vòng bảng</TabsTrigger>
            <TabsTrigger value="knockout" className="font-bold">Knock-out</TabsTrigger>
          </TabsList>

          <TabsContent value="group" className="mt-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-3">
              {groupMatches.map(match => (
                <MatchScoreCard key={match._id} match={match} onOpenScoring={setSelectedMatch} />
              ))}
              {groupMatches.length === 0 && (
                <div className="col-span-full py-16 text-center border-2 border-dashed rounded-xl text-slate-400">Không có trận đấu vòng bảng</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="knockout" className="mt-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-3">
              {knockoutMatches.map(match => (
                <MatchScoreCard key={match._id} match={match} onOpenScoring={setSelectedMatch} />
              ))}
              {knockoutMatches.length === 0 && (
                <div className="col-span-full py-16 text-center border-2 border-dashed rounded-xl text-slate-400">Không có trận đấu knockout</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <MatchScoreDialog 
        match={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onSubmit={handleScoreSubmit}
        isProcessing={isProcessing}
      />
    </div>
  );
};
