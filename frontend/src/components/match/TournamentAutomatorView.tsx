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

const buildCourtNames = (count: number) => Array.from({ length: Math.max(1, count) }, (_, index) => `Sân ${index + 1}`);

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
      toast.success("Đã phân bảng và xếp lịch vòng bảng.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể khởi tạo giải đấu.";
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
      toast.success("Vòng bảng đã được công khai.");
    } catch {
      toast.error("Không thể công khai vòng bảng.");
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
      toast.success("Đã lấy danh sách đội đi tiếp.");
    } catch {
      toast.error("Không thể lấy danh sách đội đi tiếp.");
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
      await api.post(`/automator/${tournamentId}/advance-knockout`, requestBody());
      const nextMatches = await fetchKnockoutMatches();
      setKnockoutMatches(nextMatches);
      setCurrentStep(3);
      persist({ step: 3, knockout: nextMatches });
      toast.success("Đã tạo lịch knock-out.");
    } catch {
      toast.error("Không thể tạo lịch knock-out.");
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
      toast.success("Đã cập nhật lịch thi đấu.");
    } catch {
      toast.error("Không thể cập nhật lịch.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepper = () => {
    const steps = [
      { id: 1, label: "Phân bảng" },
      { id: 2, label: "Công khai" },
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
          <AlertDescription>Chưa có dữ liệu đội đi tiếp. Hãy lấy danh sách sau khi đã cập nhật kết quả vòng bảng.</AlertDescription>
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
                const teamName = typeof teamValue === 'object' && teamValue && 'name' in teamValue ? teamValue.name : String(teamValue || "Đội chờ xác định");
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
            <Badge variant="outline">{totalGroupMatches} trận vòng bảng</Badge>
            <Badge variant="outline">{groups.length} bảng</Badge>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{tournamentName}</h1>
            <p className="text-sm text-slate-500">Điều hành phân bảng, xếp lịch vòng bảng và tạo nhánh knock-out theo cấu hình vòng đấu đã lưu.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Cấu hình vòng đấu</label>
            <Select value={selectedRuleId} onValueChange={setSelectedRuleId}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Tự dùng cấu hình mới nhất" /></SelectTrigger>
              <SelectContent>
                {rules.map((rule) => (
                  <SelectItem key={rule._id} value={rule._id}>
                    {rule.ruleName}{rule.matchDuration ? ` - ${rule.matchDuration} phút/trận` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!rules.length && (
              <p className="text-[11px] text-slate-500">Không cần BaseRule; hệ thống sẽ tìm cấu hình vòng đấu mới nhất của giải khi khởi tạo.</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Kiểu phân bảng</label>
            <Select value={drawMethod} onValueChange={setDrawMethod}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Ngẫu nhiên</SelectItem>
                <SelectItem value="snake">Snake seed</SelectItem>
                <SelectItem value="skill">Theo trình độ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Bắt đầu</label>
            <Input type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="h-10" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">Số sân</label>
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
              {groups.length ? "Khởi tạo lại" : "Phân bảng & xếp lịch"}
            </Button>
          </div>

          {groups.length === 0 ? (
            <Alert className="border-sky-200 bg-sky-50">
              <GitBranch className="h-4 w-4 text-sky-600" />
              <AlertDescription className="text-sky-900">Chọn cấu hình vòng đấu nếu có, thời gian bắt đầu và số sân rồi khởi tạo để tạo bảng đấu cùng lịch vòng bảng. Nếu chưa chọn, backend sẽ ưu tiên cấu hình vòng đấu mới nhất của giải.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-5">
              {groups.map((group) => (
                <Card key={group._id} className="border-slate-200">
                  <CardHeader className="border-b border-slate-100 py-3">
                    <CardTitle className="flex items-center justify-between gap-3 text-base">
                      <span className="flex items-center gap-2"><Users className="h-4 w-4 text-sky-600" /> {group.name}</span>
                      <Badge variant="secondary">{group.teams?.length || 0} đội</Badge>
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
              Kiểm tra lịch, sân và danh sách đội trong từng bảng trước khi công khai. Sau khi công khai, các trận vòng bảng sẽ được đánh dấu sẵn sàng thi đấu.
            </AlertDescription>
          </Alert>
          <Card className="border-slate-200">
            <CardContent className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500">Bảng</p><p className="font-bold text-slate-900">{groups.length}</p></div>
                <div><p className="text-slate-500">Trận</p><p className="font-bold text-slate-900">{totalGroupMatches}</p></div>
              </div>
              <Button onClick={handlePublish} disabled={isProcessing || groups.length === 0} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                <ChevronRight className="h-4 w-4" /> Công khai vòng bảng
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {currentStep === 3 && (
        <section className="space-y-5">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handlePreviewQualified} disabled={isProcessing} className="gap-2">
                <Trophy className="h-4 w-4" /> Lấy đội đi tiếp
              </Button>
              <Button onClick={handleCreateKnockout} disabled={isProcessing} className="gap-2 bg-violet-600 hover:bg-violet-700">
                <Layers className="h-4 w-4" /> Tạo lịch knock-out
              </Button>
            </div>
            <Badge variant="outline">{knockoutMatches.length} trận knock-out</Badge>
          </div>

          {renderQualifiedTeams()}

          {knockoutMatches.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader className="border-b border-slate-100 py-3">
                <CardTitle className="text-base">Lịch knock-out</CardTitle>
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
