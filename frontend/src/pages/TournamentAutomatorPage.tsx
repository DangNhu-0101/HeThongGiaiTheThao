import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { TournamentAutomatorView } from "@/components/match/TournamentAutomatorView";
import api from "@/api/axiosConfig";
import { tournamentService } from "@/services/tournamentService";
import type { StageRule } from "@/types/automator";
import type { Tournament } from "@/types/tournament";

type TournamentRuleSource = {
  _id?: string;
  id?: string;
  ruleName?: string;
  sport?: string | string[];
  sportType?: string;
  stageName?: string;
  matchDuration?: number;
  tournamentStructure?: {
    stages?: Array<string | {
      _id?: string;
      stageName?: string;
      ruleName?: string;
      sportType?: string;
      matchDuration?: number;
    }>;
  };
};

const mapStageConfigs = (
  stages: TournamentRuleSource[],
  tournamentId: string,
  tournament?: Tournament | null
): StageRule[] => stages.map((stage, index) => ({
  _id: stage._id || stage.id || `${tournamentId}-stage-${index}`,
  stageRuleId: stage._id || stage.id,
  ruleName: stage.ruleName || stage.stageName || `Cấu hình vòng đấu ${index + 1}`,
  stageName: stage.stageName,
  sport: stage.sportType || tournament?.sportType?.[0] || "general",
  source: "stageRule",
  matchDuration: stage.matchDuration,
}));

const mapBaseRules = (
  rules: TournamentRuleSource[],
  tournamentId: string,
  tournament?: Tournament | null
): StageRule[] => rules.map((rule, index) => {
  const stage = rule.tournamentStructure?.stages?.[0];
  const stageObject = typeof stage === "object" ? stage : null;

  return {
    _id: rule._id || rule.id || `${tournamentId}-rule-${index}`,
    stageRuleId: stageObject?._id || (typeof stage === "string" ? stage : undefined),
    ruleName: rule.ruleName || stageObject?.ruleName || stageObject?.stageName || "Bộ luật giải đấu",
    stageName: stageObject?.stageName,
    sport: Array.isArray(rule.sport)
      ? rule.sport.join(", ")
      : rule.sport || rule.sportType || stageObject?.sportType || tournament?.sportType?.[0] || "general",
    source: "baseRule",
    matchDuration: rule.matchDuration || stageObject?.matchDuration,
  };
});

export function TournamentAutomatorPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [rules, setRules] = useState<StageRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadTournament = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const [data, rulesResponse, stagesResponse] = await Promise.all([
          tournamentService.getById(id),
          api.get("/rules", { params: { tournamentId: id } }).catch(() => ({ data: { data: [] } })),
          api.get(`/stages/get-stages/${id}`).catch(() => ({ data: { data: [] } })),
        ]);

        if (!isMounted) return;

        const stageConfigs = mapStageConfigs(stagesResponse.data?.data || [], id, data);
        const tournamentRules = (data?.rules || data?.baseRule || []) as TournamentRuleSource[];
        const apiRules = (rulesResponse.data?.data || []) as TournamentRuleSource[];
        const baseRules = mapBaseRules(apiRules.length ? apiRules : tournamentRules, id, data);

        setTournament(data || null);
        setRules(stageConfigs.length ? stageConfigs : baseRules);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadTournament();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return <div className="p-6 text-slate-500">Đang tải dữ liệu giải đấu...</div>;
  }

  if (!id || !tournament) {
    return <div className="p-6 text-slate-500">Không tìm thấy giải đấu.</div>;
  }

  return (
    
    <TournamentAutomatorView
    
      tournamentId={id}
      tournamentName={tournament.name}
      sportType={tournament.sportType?.join(", ") || "Chưa cấu hình"}
      rules={rules}
    />
  );
}
