// src/components/tournament/StageBracketView.tsx
import React from 'react';
import type { IBranch, IStage } from '@/types/rules';
import { GitBranch, MapPin, Swords, Trophy, Users } from 'lucide-react';

type StageWithPath = IStage & {
  displayRound?: number;
  matchStartNumber?: number;
  nextMatchStartNumber?: number;
  pathLabel?: string;
};

const posCode = (...parts: Array<string | number | undefined>) =>
  parts.filter((part) => part !== undefined && part !== '').join('-');

const groupByBranch = (stages: IStage[]) => stages.reduce<Record<string, IStage[]>>((acc, stage) => {
  const key = stage.branchName || 'Nhanh chinh';
  if (!acc[key]) acc[key] = [];
  acc[key].push(stage);
  return acc;
}, {});

const getStageInCount = (stage: IStage) => {
  if (stage.type === 'GROUP_STAGE') {
    return stage.branches.reduce((sum, branch) => sum + branch.numberOfGroups * branch.playersPerGroup, 0);
  }
  return stage.totalTeamsIn || 2;
};

const getStageOutCount = (stage: IStage) => {
  if (stage.type === 'GROUP_STAGE') {
    return stage.branches.reduce((sum, branch) => sum + branch.numberOfGroups * branch.selectedRanks.length, 0);
  }
  return Math.floor((stage.totalTeamsIn || 0) / 2) + (stage.hasWildcards ? stage.wildcardsCount || 0 : 0);
};

const getBranchNo = (stage: IStage) => {
  const match = String(stage.branchName || '').match(/\d+/);
  return match ? Number(match[0]) : 1;
};

const getStageMatchCount = (stage: StageWithPath) =>
  Math.max(1, Math.floor(Number(stage.totalTeamsIn || 2) / 2));

const withKnockoutCodes = (
  stages: StageWithPath[],
  counters: { rounds: Record<string, number>; matches: Record<string, number> } = { rounds: {}, matches: {} },
  pathLabel?: string
): StageWithPath[] => stages.map((stage) => {
  const branchKey = stage.branchName || stage.pathLabel || pathLabel || 'main';
  let nextStage: StageWithPath = { ...stage, pathLabel: stage.pathLabel || pathLabel };

  if (stage.type === 'KNOCKOUT') {
    counters.rounds[branchKey] = (counters.rounds[branchKey] || 1) + 1;
    const matchStartNumber = counters.matches[branchKey] || 1;
    const matchCount = getStageMatchCount(stage);
    const nextMatchStartNumber = matchStartNumber + matchCount;
    counters.matches[branchKey] = nextMatchStartNumber;

    nextStage = {
      ...nextStage,
      displayRound: counters.rounds[branchKey],
      matchStartNumber,
      nextMatchStartNumber: matchCount > 1 ? nextMatchStartNumber : undefined,
    };
  }

  if (nextStage.substages?.length) {
    nextStage = {
      ...nextStage,
      substages: withKnockoutCodes(nextStage.substages, counters, nextStage.pathLabel),
    };
  }

  return nextStage;
});

const SourceBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase text-slate-500">
    <MapPin className="h-3 w-3" />
    {children}
  </span>
);

const GroupTable: React.FC<{
  stageNo: number;
  branch: IBranch;
  branchIndex: number;
  groupIndex: number;
}> = ({ stageNo, branch, branchIndex, groupIndex }) => {
  const groupCode = posCode(`R${stageNo}`, `B${branchIndex + 1}`, `G${groupIndex + 1}`);
  return (
    <div className="min-w-[230px] overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b bg-slate-100 px-3 py-2">
        <span className="text-xs font-bold text-slate-700">Bảng {groupIndex + 1}</span>
        <SourceBadge>{groupCode}</SourceBadge>
      </div>
      <div className="p-2">
        {Array.from({ length: branch.playersPerGroup }, (_, index) => {
          const rank = index + 1;
          const advances = branch.selectedRanks.includes(rank);
          return (
            <div key={rank} className="mb-1.5 flex items-center justify-between rounded border border-slate-100 bg-slate-50 px-2 py-1.5 text-[11px] last:mb-0">
              <span className="font-semibold text-slate-500">Vi tri {rank}</span>
              <span className="font-mono text-[10px] text-slate-400">{groupCode}-P{rank}</span>
              {advances && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">Di tiep</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const GroupStageNode = ({ stage }: { stage: IStage }) => {
  const stageNo = stage.stageNumber || 1;
  return (
    <div className="min-w-[320px] rounded-xl border border-sky-200 bg-sky-50/50 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Users className="h-4 w-4 text-sky-600" />
        <h3 className="text-sm font-extrabold text-slate-800">{stage.stageName}</h3>
        <SourceBadge>R{stageNo}</SourceBadge>
        <span className="rounded bg-white px-2 py-1 text-[10px] font-bold text-slate-500">
          {getStageInCount(stage)} Đội vào/ {getStageOutCount(stage)} Đội đi tiếp
        </span>
      </div>
      <div className="space-y-4">
        {stage.branches.map((branch, branchIndex) => (
          <div key={branch.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
              {branch.name}
              <SourceBadge>{posCode(`R${stageNo}`, `B${branchIndex + 1}`)}</SourceBadge>
              <span className="text-[10px] text-emerald-600">Lay hang {branch.selectedRanks.join(', ')}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: branch.numberOfGroups }, (_, groupIndex) => (
                <GroupTable key={groupIndex} stageNo={stageNo} branch={branch} branchIndex={branchIndex} groupIndex={groupIndex} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const KnockoutStageNode = ({ stage }: { stage: StageWithPath }) => {
  const stageNo = stage.displayRound || stage.stageNumber || 1;
  const matchCount = getStageMatchCount(stage);
  const matchStartNumber = stage.matchStartNumber || 1;
  return (
    <div className="relative min-w-[260px] rounded-xl border border-rose-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Swords className="h-4 w-4 text-rose-600" />
        <h3 className="text-sm font-extrabold text-slate-800">{stage.stageName}</h3>
        <SourceBadge>R{stageNo}</SourceBadge>
        {stage.pathLabel && <span className="rounded bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">{stage.pathLabel}</span>}
      </div>
      <div className="mb-3 text-[11px] font-bold uppercase text-slate-500">
        {stage.knockoutRound || 'Knockout'} - {stage.totalTeamsIn || 0} Đội vào - {matchCount} trận
      </div>
      <div className="space-y-3">
        {Array.from({ length: matchCount }, (_, index) => {
          const matchNo = matchStartNumber + index;
          const code = posCode(`R${stageNo}`, `B${getBranchNo(stage)}`, `M${matchNo}`);
          const target = stage.nextMatchStartNumber
            ? posCode(`R${stageNo + 1}`, `B${getBranchNo(stage)}`, `M${stage.nextMatchStartNumber + Math.floor(index / 2)}`, index % 2 === 0 ? 1 : 2)
            : 'Vo dich / A quan';
          return (
            <div key={code} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-500">Tran {matchNo}</span>
                <SourceBadge>{code}</SourceBadge>
              </div>
              <div className="mb-1 flex justify-between rounded bg-white px-2 py-1 text-[11px]">
                <span>Slot 1</span><span className="font-mono text-slate-400">{code}-1</span>
              </div>
              <div className="flex justify-between rounded bg-white px-2 py-1 text-[11px]">
                <span>Slot 2</span><span className="font-mono text-slate-400">{code}-2</span>
              </div>
              <div className="mt-1 rounded bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                Thang den: {target}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StageColumn = ({ stage }: { stage: StageWithPath }) => (
  stage.type === 'GROUP_STAGE' ? <GroupStageNode stage={stage} /> : <KnockoutStageNode stage={stage} />
);

const StageFlow = ({ stages, depth = 0 }: { stages: StageWithPath[]; depth?: number }) => {
  if (!stages.length) return null;
  const [current, ...rest] = stages;
  const childGroups = current.substages?.length ? groupByBranch(current.substages) : {};
  const hasChildren = Object.keys(childGroups).length > 0;

  return (
    <div className="flex min-w-max items-start gap-8">
      <div className="relative">
        <StageColumn stage={current} />
        {(rest.length > 0 || hasChildren) && (
          <span className="pointer-events-none absolute left-full top-1/2 h-px w-8 bg-slate-300" />
        )}
      </div>

      {hasChildren ? (
        <div className="relative flex flex-col gap-8">
          {Object.entries(childGroups).length > 1 && (
            <span className="pointer-events-none absolute -left-4 top-6 bottom-6 w-px bg-slate-300" />
          )}
          {Object.entries(childGroups).map(([branchName, branchStages]) => (
            <div key={branchName} className="relative rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase text-slate-500">
                <GitBranch className="h-4 w-4" />
                {branchName}
              </div>
              <StageFlow stages={branchStages.map((stage) => ({ ...stage, pathLabel: branchName }))} depth={depth + 1} />
            </div>
          ))}
        </div>
      ) : (
        <StageFlow stages={rest} depth={depth} />
      )}
    </div>
  );
};

export const StageBracketView: React.FC<{ stage: IStage; depth?: number }> = ({ stage }) => (
  <StageFlow stages={withKnockoutCodes([stage])} />
);

export const TournamentBracketDisplay: React.FC<{ stageTree: IStage[] }> = ({ stageTree }) => {
  if (!stageTree || stageTree.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400">
        <Trophy className="mx-auto mb-3 h-12 w-12 text-slate-200" />
        <p className="text-sm font-medium">Chua co cau hinh vong dau</p>
        <p className="mt-1 text-xs">Hay cau hinh the thuc thi dau truoc</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-4">
      <div className="mb-6 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-extrabold uppercase text-slate-800">Khung cay theo cau hinh vong</h2>
      </div>
      <StageFlow stages={withKnockoutCodes(stageTree)} />
    </div>
  );
};
