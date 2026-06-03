
// services/slotGenerator.js
import Slot from '../models/Slot.js';
import { generateDefaultMapping } from '../utils/knockoutMapping.js';

/**
 * Tạo slot vòng bảng
 */
export const generateGroupSlots = async (tournamentId, sportType, stageConfig, branch = 1, options = {}) => {
  const numberOfGroups = Number(stageConfig.numberOfGroups || 1);
  const advanceTeamsPerGroup = Number(stageConfig.advanceTeamsPerGroup || stageConfig.selectedRanks?.length || 2);
  const mapping = generateDefaultMapping(numberOfGroups, advanceTeamsPerGroup, branch);
  const slots = [];

  for (let group = 1; group <= numberOfGroups; group++) {
    for (let pos = 1; pos <= advanceTeamsPerGroup; pos++) {
      const code = `R1-B${branch}-G${group}-P${pos}`;
      slots.push({
        code,
        tournamentId,
        sportType,
        stage: 1,
        branch,
        group,
        position: pos,
        nextSlotCode: mapping[code] || null,
        status: 'empty'
      });
    }
  }

  if (slots.length) await Slot.insertMany(slots, options);
  return slots;
};

/**
 * Tạo slot knockout dựa trên tổng số đội tham gia
 */
export const generateKnockoutSlots = async (tournamentId, sportType, totalTeams, startRound = 2, options = {}, branch = 1) => {
  if (totalTeams < 2) return [];
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalTeams)));
  const totalRounds = Math.ceil(Math.log2(bracketSize));
  const slots = [];
  const roundPlans = [];
  let nextMatchNumber = 1;

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
    const matchesThisRound = Math.pow(2, totalRounds - roundIndex - 1);
    roundPlans.push({
      round: startRound + roundIndex,
      matchesThisRound,
      firstMatchNumber: nextMatchNumber,
    });
    nextMatchNumber += matchesThisRound;
  }

  for (let roundIndex = 0; roundIndex < roundPlans.length; roundIndex++) {
    const plan = roundPlans[roundIndex];
    const nextPlan = roundPlans[roundIndex + 1];

    for (let matchIndex = 0; matchIndex < plan.matchesThisRound; matchIndex++) {
      const matchNumber = plan.firstMatchNumber + matchIndex;
      const nextSlotCode = nextPlan
        ? `R${nextPlan.round}-B${branch}-M${nextPlan.firstMatchNumber + Math.floor(matchIndex / 2)}-${matchIndex % 2 === 0 ? 1 : 2}`
        : null;

      slots.push({
        code: `R${plan.round}-B${branch}-M${matchNumber}-1`,
        tournamentId,
        sportType,
        stage: plan.round,
        branch,
        round: plan.round,
        matchNumber,
        side: '1',
        nextSlotCode,
        status: 'empty'
      });
      slots.push({
        code: `R${plan.round}-B${branch}-M${matchNumber}-2`,
        tournamentId,
        sportType,
        stage: plan.round,
        branch,
        round: plan.round,
        matchNumber,
        side: '2',
        nextSlotCode,
        status: 'empty'
      });
    }
  }

  if (slots.length) await Slot.insertMany(slots, options);
  return slots;
};

export const resetSlots = async (tournamentId, sportType, options = {}) => {
  await Slot.deleteMany({ tournamentId, sportType }, options);
};

