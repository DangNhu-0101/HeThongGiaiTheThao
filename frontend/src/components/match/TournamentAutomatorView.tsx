import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ChevronRight, Flag, GitBranch, Layers, RotateCcw, Settings, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/axiosConfig";
import { MatchCard } from "./MatchCard";
import { MatchEditDialog } from "./MatchEditDialog";
import type { Group, Match, QualifiedTeam, StageRule } from "@/types/automator";

interface TournamentAutomatorViewProps {
  tournamentId: string;
  tournamentName: string;
  sportType: string;
  rules: StageRule[];
}

type QualifiedEntry = string | QualifiedTeam | { teamId?: QualifiedTeam | string; rank?: number; groupName?: string; points?: number; goalDifference?: number };
type QualifiedResponse = Record<string, QualifiedEntry[]>;

const toInputDateTime = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const buildCourtNames = (count: number) => Array.from({ length: Math.max(1, count) }, (_, index) => `SÃ¢n ${index + 1}`);

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const response = typeof error === 'object' && error && 'response' in error
    ? (error.response as { data?: { message?: string } })
    : null;
  return response?.data?.message || (error instanceof Error ? error.message : fallback);
};

const toMatch = (raw: Record<string, unknown>): Match => {
  const team1 = raw.team1 as QualifiedTeam | undefined;
  const team2 = raw.team2 as QualifiedTeam | undefined;

  return {
    _id: String(raw._id || ''),
    matchNumber: Number(raw.matchNumber || 0),
    round: raw.round as string | number | undefined,
    roundName: raw.roundName as string | undefined,
    matchName: raw.matchName as string | undefined,
    teamA: raw.teamA as QualifiedTeam | undefined || (team1?._id ? { _id: team1._id, name: team1.name, logo: team1.logo } : undefined),
    teamB: raw.teamB as QualifiedTeam | undefined || (team2?._id ? { _id: team2._id, name: team2.name, logo: team2.logo } : undefined),
    scheduledStartTime: raw.scheduledStartTime as string | undefined,
    courtName: raw.courtName as string | undefined,
    status: String(raw.status || 'SCHEDULED'),
    scoreA: Number(raw.team1Score || raw.scoreA || 0),
    scoreB: Number(raw.team2Score || raw.scoreB || 0),
    matchType: raw.matchType as 'group' | 'knockout' | undefined,
  };
};

export const TournamentAutomatorView: React.FC<TournamentAutomatorViewProps> = ({
  tournamentId,
  tournamentName,
  sportType,
  rules
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [groups, setGroups] = useState<Group[]>([]);
  const [knockoutMatches, setKnockoutMatches] = useState<Match[]>([]);
  const [qualifiedTeams, setQualifiedTeams] = useState<QualifiedResponse>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [drawMethod, setDrawMethod] = useState('random');
  const [startTime, setStartTime] = useState(toInputDateTime());
  const [courtCount, setCourtCount] = useState(4);
  const [loadedStateKey, setLoadedStateKey] = useState<string | null>(null);

  const selectedRule = useMemo(
    () => rules.find((rule) => rule._id === selectedRuleId) || rules[0],
    [rules, selectedRuleId]
  );

  const courts = useMemo(() => buildCourtNames(courtCount), [courtCount]);
  const totalGroupMatches = groups.reduce((sum, group) => sum + (group.matches?.length || 0), 0);
  const completedGroupMatches = groups.reduce(
    (sum, group) => sum + (group.matches?.filter((match) => match.status === 'COMPLETED').length || 0),
    0
  );
  const incompleteGroupMatches = Math.max(0, totalGroupMatches - completedGroupMatches);
  const isGroupStageComplete = totalGroupMatches > 0 && incompleteGroupMatches === 0;
  const stateKey = `${tournamentId}:${rules.map((rule) => rule._id).join('|')}`;

  if (loadedStateKey !== stateKey) {
    setLoadedStateKey(stateKey);
    const savedData = localStorage.getItem(`automator_${tournamentId}`);
    if (!savedData) {
      setCurrentStep(1);
      setGroups([]);
      setKnockoutMatches([]);
      setQualifiedTeams({});
      setSelectedRuleId(rules[0]?._id || '');
    } else {
      const parsed = JSON.parse(savedData) as {
        step?: number;
        groups?: Group[];
        knockout?: Match[];
        qualified?: QualifiedResponse;
        selectedRuleId?: string;
        drawMethod?: string;
        startTime?: string;
        courtCount?: number;
      };
      setCurrentStep(parsed.step || 1);
      setGroups(parsed.groups || []);
      setKnockoutMatches(parsed.knockout || []);
      setQualifiedTeams(parsed.qualified || {});
      setSelectedRuleId(parsed.selectedRuleId || rules[0]?._id || '');
      setDrawMethod(parsed.drawMethod || 'random');
      setStartTime(parsed.startTime || toInputDateTime());
      setCourtCount(parsed.courtCount || 4);
    }
  }

  const persist = (data: Partial<{
    step: number;
    groups: Group[];
    knockout: Match[];
    qualified: QualifiedResponse;
    selectedRuleId: string;
    drawMethod: string;
    startTime: string;
    courtCount: number;
  }>) => {
    const existing = JSON.parse(localStorage.getItem(`automator_${tournamentId}`) || '{}');
    localStorage.setItem(`automator_${tournamentId}`, JSON.stringify({ ...existing, ...data }));
  };

  const ruleParams = () => ({
    ...(selectedRule?.source === 'baseRule' ? { ruleId: selectedRule._id } : {}),
    ...(selectedRule?.stageRuleId || selectedRule?.source === 'stageRule'
      ? { stageRuleId: selectedRule?.stageRuleId || selectedRule?._id }
      : {}),
  });

  const requestBody = () => ({
    ...ruleParams(),
    method: drawMethod,
    startTime,
    courts,
    matchDuration: selectedRule?.matchDuration,
  });

  const handleInitialize = async () => {
    setIsProcessing(true);
    try {
      const res = await api.post(`/automator/${tournamentId}/init-groups`, requestBody());
      const nextGroups = res.data?.groups || res.data?.data?.groups || [];
      setGroups(nextGroups);
      setKnockoutMatches([]);
      setQualifiedTeams({});
      setCurrentStep(1);
      persist({
        step: 1,
        groups: nextGroups,
        knockout: [],
        qualified: {},
        selectedRuleId: selectedRule?._id || '',
        drawMethod,
        startTime,
        courtCount
      });
      toast.success("ÄÃ£ phÃ¢n báº£ng vÃ  xáº¿p lá»‹ch vÃ²ng báº£ng.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "KhÃ´ng thá»ƒ khá»Ÿi táº¡o giáº£i Ä‘áº¥u.";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    setIsProcessing(true);
    try {
      await api.patch(`/automator/${tournamentId}/publish-groups`, {
        sportType: selectedRule?.sport,
      });
      setCurrentStep(2);
      persist({ step: 2 });
      toast.success("VÃ²ng báº£ng Ä‘Ã£ Ä‘Æ°á»£c cÃ´ng khai.");
    } catch {
      toast.error("KhÃ´ng thá»ƒ cÃ´ng khai vÃ²ng báº£ng.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreviewQualified = async () => {
    setIsProcessing(true);
    try {
      const res = await api.get(`/automator/tournament/${tournamentId}/qualified-teams`, {
        params: ruleParams(),
      });
      const nextQualified = res.data?.data?.qualifiedTeams || {};
      setQualifiedTeams(nextQualified);
      setCurrentStep(3);
      persist({ step: 3, qualified: nextQualified });
      toast.success("ÄÃ£ láº¥y danh sÃ¡ch Ä‘á»™i Ä‘i tiáº¿p.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Khong the lay danh sach doi di tiep."));
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchKnockoutMatches = async () => {
    const res = await api.get('/matches', {
      params: { tournamentId, matchType: 'knockout' }
    });
    return (res.data?.data || []).map((match: Record<string, unknown>) => toMatch(match));
  };

  const handleCreateKnockout = async () => {
    setIsProcessing(true);
    try {
      const res = await api.post(`/automator/${tournamentId}/advance-knockout`, requestBody());
      const responseMatches = res.data?.data?.matches;
      const nextMatches = Array.isArray(responseMatches)
        ? responseMatches.map((match: Record<string, unknown>) => toMatch(match))
        : await fetchKnockoutMatches();
      const nextQualified = res.data?.data?.qualifiedTeams || qualifiedTeams;
      setKnockoutMatches(nextMatches);
      setQualifiedTeams(nextQualified);
      setCurrentStep(3);
      persist({ step: 3, knockout: nextMatches, qualified: nextQualified });
      toast.success("ÄÃ£ táº¡o lá»‹ch knock-out.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Khong the tao lich knock-out."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublishKnockout = async () => {
    setIsProcessing(true);
    try {
      await api.patch(`/automator/${tournamentId}/publish-knockout`, {
        sportType: selectedRule?.sport,
      });
      toast.success("ÄÃ£ cÃ´ng khai vÃ²ng knock-out.");
    } catch {
      toast.error("KhÃ´ng thá»ƒ cÃ´ng khai vÃ²ng knock-out.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSchedule = async (id: string, data: { scheduledStartTime: string; courtName: string }) => {
    setIsProcessing(true);
    try {
      await api.patch(`/matches/${id}/schedule`, data);
      const updateMatch = (match: Match) => match._id === id ? { ...match, ...data } : match;
      const nextGroups = groups.map((group) => ({ ...group, matches: group.matches.map(updateMatch) }));
      const nextKnockout = knockoutMatches.map(updateMatch);
      setGroups(nextGroups);
      setKnockoutMatches(nextKnockout);
      persist({ groups: nextGroups, knockout: nextKnockout });
      setEditingMatch(null);
      toast.success("ÄÃ£ cáº­p nháº­t lá»‹ch thi Ä‘áº¥u.");
    } catch {
      toast.error("KhÃ´ng thá»ƒ cáº­p nháº­t lá»‹ch.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepper = () => {
    const steps = [
      { id: 1, label: "PhÃ¢n báº£ng" },
      { id: 2, label: "CÃ´ng khai" },
      { id: 3, label: "Knock-out" }
    ];

    return (
      <div className="grid grid-cols-3 gap-2">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setCurrentStep(step.id)}
            className={`flex h-12 items-center justify-center gap-2 border text-sm font-semibold transition-colors ${
              currentStep === step.id ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            {currentStep > step.id ? <CheckCircle2 className="h-4 w-4" /> : <span>{step.id}</span>}
            <span>{step.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderQualifiedTeams = () => {
    const branches = Object.entries(qualifiedTeams);
    if (!branches.length) {
      return (
        <Alert className="border-slate-200 bg-slate-50">
          <AlertDescription>ChÆ°a cÃ³ dá»¯ liá»‡u Ä‘á»™i Ä‘i tiáº¿p. HÃ£y láº¥y danh sÃ¡ch sau khi Ä‘Ã£ cáº­p nháº­t káº¿t quáº£ vÃ²ng báº£ng.</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {branches.map(([branch, teams]) => (
          <Card key={branch} className="border-slate-200">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-bold text-slate-700">{branch}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {teams.map((entry, index) => {
                const teamValue = typeof entry === 'object' && 'teamId' in entry ? entry.teamId : entry;
                const teamId = typeof teamValue === 'object' && teamValue && '_id' in teamValue ? teamValue._id : String(teamValue || index);
                const teamName = typeof teamValue === 'object' && teamValue && 'name' in teamValue ? teamValue.name : String(teamValue || "Äá»™i chá» xÃ¡c Ä‘á»‹nh");
                const rank = typeof entry === 'object' && 'rank' in entry ? entry.rank : undefined;
                return (
                  <div key={`${branch}-${teamId}`} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-b-0">
                    <span className="font-medium text-slate-700">{teamName}</span>
                    <Badge variant="outline">#{rank || index + 1}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4">
      <section className="grid gap-4 border-b border-slate-200 pb-5 lg:grid-cols-[1fr_420px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-sky-100 text-sky-700">{sportType}</Badge>
            <Badge variant="outline">{totalGroupMatches} tráº­n vÃ²ng báº£ng</Badge>
            <Badge variant="outline">{groups.length} báº£ng</Badge>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{tournamentName}</h1>
            <p className="text-sm text-slate-500">Äiá»u hÃ nh phÃ¢n báº£ng, xáº¿p lá»‹ch vÃ²ng báº£ng vÃ  táº¡o nhÃ¡nh knock-out theo cáº¥u hÃ¬nh vÃ²ng Ä‘áº¥u Ä‘Ã£ lÆ°u.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Cáº¥u hÃ¬nh vÃ²ng Ä‘áº¥u</label>
            <Select value={selectedRuleId} onValueChange={setSelectedRuleId}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Tá»± dÃ¹ng cáº¥u hÃ¬nh má»›i nháº¥t" /></SelectTrigger>
              <SelectContent>
                {rules.map((rule) => (
                  <SelectItem key={rule._id} value={rule._id}>
                    {rule.ruleName}{rule.matchDuration ? ` - ${rule.matchDuration} phÃºt/tráº­n` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!rules.length && (
              <p className="text-[11px] text-slate-500">KhÃ´ng cáº§n BaseRule; há»‡ thá»‘ng sáº½ tÃ¬m cáº¥u hÃ¬nh vÃ²ng Ä‘áº¥u má»›i nháº¥t cá»§a giáº£i khi khá»Ÿi táº¡o.</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Kiá»ƒu phÃ¢n báº£ng</label>
            <Select value={drawMethod} onValueChange={setDrawMethod}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Ngáº«u nhiÃªn</SelectItem>
                <SelectItem value="snake">Snake seed</SelectItem>
                <SelectItem value="skill">Theo trÃ¬nh Ä‘á»™</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Báº¯t Ä‘áº§u</label>
            <Input type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="h-10" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Sá»‘ sÃ¢n</label>
            <Input type="number" min={1} value={courtCount} onChange={(event) => setCourtCount(Number(event.target.value) || 1)} className="h-10" />
          </div>
        </div>
      </section>

      {renderStepper()}

      {currentStep === 1 && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-sm text-slate-500">
              {courts.map((court) => <Badge key={court} variant="outline">{court}</Badge>)}
            </div>
            <Button onClick={handleInitialize} disabled={isProcessing} className="gap-2 bg-sky-600 hover:bg-sky-700">
              {groups.length ? <RotateCcw className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
              {groups.length ? "Khá»Ÿi táº¡o láº¡i" : "PhÃ¢n báº£ng & xáº¿p lá»‹ch"}
            </Button>
          </div>

          {groups.length === 0 ? (
            <Alert className="border-sky-200 bg-sky-50">
              <GitBranch className="h-4 w-4 text-sky-600" />
              <AlertDescription className="text-sky-900">Chá»n cáº¥u hÃ¬nh vÃ²ng Ä‘áº¥u náº¿u cÃ³, thá»i gian báº¯t Ä‘áº§u vÃ  sá»‘ sÃ¢n rá»“i khá»Ÿi táº¡o Ä‘á»ƒ táº¡o báº£ng Ä‘áº¥u cÃ¹ng lá»‹ch vÃ²ng báº£ng. Náº¿u chÆ°a chá»n, backend sáº½ Æ°u tiÃªn cáº¥u hÃ¬nh vÃ²ng Ä‘áº¥u má»›i nháº¥t cá»§a giáº£i.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-5">
              {groups.map((group) => (
                <Card key={group._id} className="border-slate-200">
                  <CardHeader className="border-b border-slate-100 py-3">
                    <CardTitle className="flex items-center justify-between gap-3 text-base">
                      <span className="flex items-center gap-2"><Users className="h-4 w-4 text-sky-600" /> {group.name}</span>
                      <Badge variant="secondary">{group.teams?.length || 0} Ä‘á»™i</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex flex-wrap gap-2">
                      {group.teams?.map((team) => <Badge key={team._id} variant="outline">{team.name}</Badge>)}
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {group.matches?.map((match) => (
                        <MatchCard key={match._id} match={match} variant="group" onEdit={setEditingMatch} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {currentStep === 2 && (
        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Alert className="border-amber-200 bg-amber-50">
            <Flag className="h-4 w-4 text-amber-700" />
            <AlertDescription className="text-amber-900">
              Kiá»ƒm tra lá»‹ch, sÃ¢n vÃ  danh sÃ¡ch Ä‘á»™i trong tá»«ng báº£ng trÆ°á»›c khi cÃ´ng khai. Sau khi cÃ´ng khai, cÃ¡c tráº­n vÃ²ng báº£ng sáº½ Ä‘Æ°á»£c Ä‘Ã¡nh dáº¥u sáºµn sÃ ng thi Ä‘áº¥u.
            </AlertDescription>
          </Alert>
          <Card className="border-slate-200">
            <CardContent className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500">Báº£ng</p><p className="font-bold text-slate-900">{groups.length}</p></div>
                <div><p className="text-slate-500">Tráº­n</p><p className="font-bold text-slate-900">{totalGroupMatches}</p></div>
              </div>
              <Button onClick={handlePublish} disabled={isProcessing || groups.length === 0} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                <ChevronRight className="h-4 w-4" /> CÃ´ng khai vÃ²ng báº£ng
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {currentStep === 3 && (
        <section className="space-y-5">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handlePreviewQualified} disabled={isProcessing || !isGroupStageComplete} className="gap-2">
                <Trophy className="h-4 w-4" /> Láº¥y Ä‘á»™i Ä‘i tiáº¿p
              </Button>
              <Button onClick={handleCreateKnockout} disabled={isProcessing || !isGroupStageComplete} className="gap-2 bg-violet-600 hover:bg-violet-700">
                <Layers className="h-4 w-4" /> Táº¡o lá»‹ch knock-out
              </Button>
              <Button variant="outline" onClick={handlePublishKnockout} disabled={isProcessing || knockoutMatches.length === 0} className="gap-2">
                <Flag className="h-4 w-4" /> CÃ´ng khai knock-out
              </Button>
            </div>
            <Badge variant="outline">{knockoutMatches.length} tráº­n knock-out</Badge>
          </div>

          {!isGroupStageComplete && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-900">
                Can cap nhat ket qua tat ca tran vong bang truoc khi lay doi di tiep va tao lich knock-out. Da hoan tat {completedGroupMatches}/{totalGroupMatches} tran, con {incompleteGroupMatches} tran.
              </AlertDescription>
            </Alert>
          )}

          {renderQualifiedTeams()}

          {knockoutMatches.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader className="border-b border-slate-100 py-3">
                <CardTitle className="text-base">Lá»‹ch knock-out</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                {knockoutMatches.map((match) => (
                  <MatchCard key={match._id} match={match} variant="knockout" onEdit={setEditingMatch} />
                ))}
              </CardContent>
            </Card>
          )}
        </section>
      )}

      <MatchEditDialog
        match={editingMatch}
        isOpen={!!editingMatch}
        onClose={() => setEditingMatch(null)}
        isProcessing={isProcessing}
        onSave={handleSaveSchedule}
      />
    </div>
  );
};
