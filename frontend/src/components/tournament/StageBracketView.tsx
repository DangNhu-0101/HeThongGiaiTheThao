// src/components/tournament/StageBracketView.tsx
import React from 'react';
import type { IStage} from '@/types/rules';
import { Trophy, Users, ArrowRight, Swords } from 'lucide-react';

const KNOCKOUT_ROUNDS = [ 'Round of 8', 'Quarter Final', 'Semi Final', 'Final'];

interface StageBracketViewProps {
  stage: IStage;
  depth?: number;
}

// Component hiển thị 1 bảng đấu (placeholder)
const GroupTable: React.FC<{ groupIndex: number; teamsCount: number }> = ({ groupIndex, teamsCount }) => (
  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white min-w-[200px]">
    <div className="bg-slate-100 px-3 py-2 border-b">
      <span className="text-xs font-bold text-slate-700">Bảng {groupIndex + 1}</span>
    </div>
    <div className="p-2">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-slate-400 border-b">
            <th className="text-left py-1 w-6">#</th>
            <th className="text-left py-1">Đội</th>
            <th className="text-center py-1 w-8">ST</th>
            <th className="text-center py-1 w-8">T</th>
            <th className="text-center py-1 w-8">B</th>
            <th className="text-center py-1 w-10">HS</th>
            <th className="text-center py-1 w-8">Đ</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: teamsCount }, (_, i) => (
            <tr key={i} className="border-b border-slate-50 last:border-0">
              <td className="py-1.5 text-slate-400">{i + 1}</td>
              <td className="py-1.5 text-slate-300 italic">Chưa có đội</td>
              <td className="text-center py-1.5 text-slate-300">-</td>
              <td className="text-center py-1.5 text-slate-300">-</td>
              <td className="text-center py-1.5 text-slate-300">-</td>
              <td className="text-center py-1.5 text-slate-300">-</td>
              <td className="text-center py-1.5 text-slate-300">-</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Component hiển thị 1 trận knockout (placeholder)
const KnockoutMatch: React.FC<{ matchLabel?: string }> = ({ matchLabel }) => (
  <div className="border border-slate-200 rounded-lg p-2 bg-white min-w-[180px]">
    {matchLabel && (
      <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 text-center">{matchLabel}</div>
    )}
    <div className="space-y-1">
      <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded text-[11px]">
        <span className="text-slate-300 italic">Chưa có đội</span>
        <span className="text-slate-300 text-[10px]">-</span>
      </div>
      <div className="text-center text-[10px] text-slate-300">vs</div>
      <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded text-[11px]">
        <span className="text-slate-300 italic">Chưa có đội</span>
        <span className="text-slate-300 text-[10px]">-</span>
      </div>
    </div>
  </div>
);

// Hàm tính số trận cho mỗi vòng knockout
const getKnockoutMatchCount = (roundName: string, totalTeamsIn: number): number => {
  const roundIndex = KNOCKOUT_ROUNDS.indexOf(roundName);
  if (roundIndex === -1) return 0;
  
  // Tính số trận dựa trên quy mô
  const roundSizes = [128, 64, 32, 16, 8, 8, 4, 2];
  const maxSize = roundSizes[roundIndex];
  
  if (totalTeamsIn >= maxSize) return maxSize / 2;
  return Math.max(1, Math.floor(totalTeamsIn / Math.pow(2, roundIndex + 1)));
};

// Component chính hiển thị 1 vòng đấu
export const StageBracketView: React.FC<StageBracketViewProps> = ({ stage, depth = 0 }) => {
  const isGroup = stage.type === 'GROUP_STAGE';
  const paddingLeft = depth > 0 ? `${Math.min(depth * 24, 60)}px` : '0px';

  return (
    <div className="mb-6" style={{ paddingLeft }}>
      {/* Header vòng đấu */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-2 h-2 rounded-full ${isGroup ? 'bg-sky-500' : 'bg-red-500'}`} />
        <h3 className="text-sm font-extrabold text-slate-800">{stage.stageName}</h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
          isGroup ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {isGroup ? 'Vòng bảng' : stage.knockoutRound || 'Knockout'}
        </span>
      </div>

      {/* Nội dung vòng đấu */}
      {isGroup ? (
        // === HIỂN THỊ VÒNG BẢNG ===
        <div className="space-y-4">
          {stage.branches.map((branch) => (
            <div key={branch.id} className="border border-slate-200 rounded-xl p-4 bg-white">
              {stage.branches.length > 1 && (
                <h4 className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  {branch.name}
                </h4>
              )}
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: branch.numberOfGroups }, (_, gi) => (
                  <GroupTable key={gi} groupIndex={gi} teamsCount={branch.playersPerGroup} />
                ))}
              </div>
              
              {/* Hiển thị thông tin đi tiếp */}
              <div className="mt-3 flex items-center gap-2 text-[10px] text-green-600 font-medium">
                <ArrowRight className="h-3 w-3" />
                Đi tiếp: {branch.selectedRanks.map(r => `Hạng ${r}`).join(', ')}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // === HIỂN THỊ VÒNG KNOCKOUT ===
        <div>
          {stage.knockoutRound && (
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Swords className="h-4 w-4 text-red-500" />
                <span className="text-xs font-bold text-slate-700">
                  {stage.knockoutRound} ({getKnockoutMatchCount(stage.knockoutRound, stage.totalTeamsIn)} trận)
                </span>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: getKnockoutMatchCount(stage.knockoutRound, stage.totalTeamsIn) }, (_, i) => (
                  <KnockoutMatch key={i} matchLabel={`Trận ${i + 1}`} />
                ))}
              </div>

              {/* Wildcard nếu có */}
              {stage.hasWildcards && (
                <div className="mt-3 text-[10px] text-amber-600 font-medium">
                  🎲 Wildcard: {stage.wildcardsCount} suất từ các đội thua
                </div>
              )}

              {/* Trận tranh hạng 3 */}
              {stage.hasBronzeMatch && (
                <div className="mt-3 border-t pt-3">
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Trận tranh Hạng 3</div>
                  <KnockoutMatch />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hiển thị substages đệ quy */}
      {stage.substages && stage.substages.length > 0 && (
        <div className="mt-4 border-l-2 border-slate-200 pl-4 space-y-4">
          {stage.substages.map((sub) => (
            <StageBracketView key={sub.id} stage={sub} depth={depth + 1} />
          ))}
        </div>
      )}

      {/* Mũi tên kết nối nếu có vòng sau */}
      {stage.substages && stage.substages.length > 0 && (
        <div className="flex justify-center my-2">
          <ArrowRight className="h-5 w-5 text-slate-300 rotate-90" />
        </div>
      )}
    </div>
  );
};

// Component tổng hiển thị toàn bộ stage tree
export const TournamentBracketDisplay: React.FC<{ stageTree: IStage[] }> = ({ stageTree }) => {
  if (!stageTree || stageTree.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Trophy className="h-12 w-12 mx-auto mb-3 text-slate-200" />
        <p className="text-sm font-medium">Chưa có cấu hình vòng đấu</p>
        <p className="text-xs mt-1">Vui lòng cấu hình thể thức thi đấu trước</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-extrabold text-slate-800 uppercase">Sơ đồ thi đấu</h2>
      </div>
      
      {stageTree.map((stage) => (
        <StageBracketView key={stage.id} stage={stage} />
      ))}
    </div>
  );
};