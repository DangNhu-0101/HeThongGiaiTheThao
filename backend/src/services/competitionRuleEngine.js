import TournamentItem from '../models/tournamentItem.js';
import StageRule from '../models/rules/stageRules.js';

const asNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const readScore = (scores, key, fallback = 0) => {
  if (!scores) return fallback;
  if (scores[key] !== undefined) return asNumber(scores[key], fallback);
  if (scores.details && scores.details[key] !== undefined) return asNumber(scores.details[key], fallback);
  return fallback;
};

export const getTournamentFormatConfig = async (tournamentItemId, session) => {
  const query = TournamentItem.findById(tournamentItemId).select('competitionFormat');
  const item = session ? await query.session(session) : await query;
  return item?.competitionFormat?.config || null;
};

export const getStageRuleContext = async (match, session) => {
  const stageQuery = StageRule.findById(match.stageId);
  const stageRule = session ? await stageQuery.session(session) : await stageQuery;
  const formatConfig = await getTournamentFormatConfig(match.tournamentItemId, session);
  const stages = Array.isArray(formatConfig?.stages) ? formatConfig.stages : [];
  const formatStage = stages.find((stage) => String(stage.id || '') === String(match.formatStageId || ''))
    || stages.find((stage) => Number(stage.order) === Number(stageRule?.number))
    || null;

  const scoring = {
    ...(stageRule?.pointsConfig
      ? { winPoints: stageRule.pointsConfig.win, drawPoints: stageRule.pointsConfig.draw, lossPoints: stageRule.pointsConfig.loss }
      : {}),
    ...(formatStage?.scoring || {}),
  };

  return {
    stageRule,
    formatStage,
    scoring,
    rankingCriteria: formatStage?.rankingCriteria?.length ? formatStage.rankingCriteria : (stageRule?.rankingCriteria || []),
  };
};

export const assertStageStandingsPublished = (stageRule) => {
  if (!stageRule || stageRule.standingsStatus !== 'published') {
    return {
      ok: false,
      title: 'Chưa thể cập nhật kết quả',
      message: 'Giai đoạn này chưa được công bố bảng xếp hạng. Hãy hoàn tất bước Công bố BXH trước rồi thử lại.',
    };
  }
  return { ok: true };
};

export const validateMatchScores = ({ match, winnerParticipantId, participantScores, context }) => {
  const participantIds = (match.participants || []).map((participant) => String(participant?._id || participant));
  if (participantIds.length < 2) {
    return {
      ok: false,
      title: 'Chưa đủ đội thi đấu',
      message: 'Trận đấu nay chua co du 2 doi/slot hop le theo cấu hình thể thức. Hay kiểm tra lai tab Gán đội.',
    };
  }
  if (!winnerParticipantId || !participantIds.includes(String(winnerParticipantId))) {
    return {
      ok: false,
      title: 'Đội thắng khong hop le',
      message: 'Đội thắng phai la mot trong hai doi cua trận đấu hien tai.',
    };
  }

  const winnerScore = readScore(participantScores, 'winner');
  const loserScore = readScore(participantScores, 'loser');
  const scoreA = readScore(participantScores, 'teamA', winnerScore);
  const scoreB = readScore(participantScores, 'teamB', loserScore);
  const highScore = Math.max(scoreA, scoreB);
  const lowScore = Math.min(scoreA, scoreB);
  const diff = highScore - lowScore;
  const scoring = context.scoring || {};
  const targetScore = asNumber(scoring.targetScore || scoring.pointsPerSet || scoring.setPoint, 0);
  const winBy = asNumber(scoring.winBy || scoring.winByGap || (scoring.winByTwo ? 2 : 0), 0);
  const maxScore = asNumber(scoring.maxScore || scoring.maxPoints || scoring.pointCap, 0);
  const goldenPoint = Boolean(scoring.goldenPoint);
  const allowDraw = Boolean(scoring.allowDraw || scoring.drawAllowed);

  if (scoreA === scoreB && !allowDraw) {
    return {
      ok: false,
      title: 'Diem so chua hop le',
      message: 'Theo thể thức hien tai, trận đấu khong cho phep hoa. Vui lòng nhap doi thạng hop le.',
    };
  }
  if (targetScore > 0 && highScore < targetScore) {
    return {
      ok: false,
      title: 'Diem so chua hop le',
      message: `Theo thể thức hien tai, doi thạng phai dat toi thieu ${targetScore} điểm.`,
    };
  }
  if (winBy > 0 && diff < winBy) {
    const capped = maxScore > 0 && highScore >= maxScore && (goldenPoint || diff >= 1);
    if (!capped) {
      return {
        ok: false,
        title: 'Diem so chua hop le',
        message: `Theo thể thức hien tai, doi thạng phai hon doi thua it nhất ${winBy} điểm.`,
      };
    }
  }

  return { ok: true, winnerScore: highScore, loserScore: lowScore, isDraw: scoreA === scoreB };
};

export const getStandingPoints = (outcome, context) => {
  const scoring = context.scoring || {};
  const map = {
    win: scoring.winPoints,
    draw: scoring.drawPoints,
    loss: scoring.lossPoints,
    walkover: scoring.walkoverPoints,
    forfeited: scoring.forfeitPoints,
    bye: scoring.byePoints,
    noShow: scoring.noShowPoints,
  };
  const fallback = outcome === 'win' ? 1 : 0;
  const points = asNumber(map[outcome], fallback);
  return outcome === 'win' && points <= 0 ? 1 : points;
};

export const compareStandingRows = (a, b, criteria = []) => {
  for (const criterion of criteria) {
    if (criterion === 'points' || criterion === 'matchPoints') {
      if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
    }
    if (criterion === 'pointDiff' || criterion === 'scoreDifference' || criterion === 'goalDifference') {
      const diffB = b.pointDiff ?? b.goalDifference ?? 0;
      const diffA = a.pointDiff ?? a.goalDifference ?? 0;
      if (diffB !== diffA) return diffB - diffA;
    }
    if (criterion === 'pointsFor' || criterion === 'goalsFor') {
      const forB = b.pointsFor ?? b.goalsFor ?? 0;
      const forA = a.pointsFor ?? a.goalsFor ?? 0;
      if (forB !== forA) return forB - forA;
    }
    if (criterion === 'pointsAgainst' || criterion === 'goalsAgainst') {
      const againstA = a.pointsAgainst ?? a.goalsAgainst ?? 0;
      const againstB = b.pointsAgainst ?? b.goalsAgainst ?? 0;
      if (againstA !== againstB) return againstA - againstB;
    }
    if (criterion === 'wins') {
      if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
    }
  }
  return String(a.name || '').localeCompare(String(b.name || ''));
};
