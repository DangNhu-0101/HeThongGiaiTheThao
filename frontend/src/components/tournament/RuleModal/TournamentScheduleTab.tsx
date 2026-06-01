// src/components/tournament/TournamentScheduleTab.tsx
import React, { useEffect, useState } from 'react';
import { TournamentBracketDisplay } from '@/components/tournament/StageBracketView';
import type { IStage } from '@/types/rules';
import api from '@/api/axiosConfig';

export const TournamentScheduleTab: React.FC<{ tournamentId: string }> = ({ tournamentId }) => {
  const [stageTree, setStageTree] = useState<IStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const res = await api.get(`/stages/get-stages/${tournamentId}`);
        if (res.data?.success) {
          setStageTree(res.data.data || []);
        }
      } catch {
        // Không có dữ liệu
      } finally {
        setLoading(false);
      }
    };
    fetchStages();
  }, [tournamentId]);

  if (loading) return <div className="p-4 text-sm text-slate-400">Đang tải...</div>;

  return <TournamentBracketDisplay stageTree={stageTree} />;
};
