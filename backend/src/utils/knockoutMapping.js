const nextPowerOfTwo = (value) => Math.pow(2, Math.ceil(Math.log2(Math.max(2, value))));

const makeSeedOrder = (numberOfGroups, advanceTeamsPerGroup, branch = 1) => {
  const seeds = [];

  if (advanceTeamsPerGroup === 1) {
    for (let group = 1; group <= numberOfGroups; group++) {
      seeds.push(`R1-B${branch}-G${group}-P1`);
    }
    return seeds;
  }

  for (let group = 1; group <= numberOfGroups; group++) {
    const oppositeGroup = ((group + Math.floor(numberOfGroups / 2) - 1) % numberOfGroups) + 1;
    seeds.push(`R1-B${branch}-G${group}-P1`);
    seeds.push(`R1-B${branch}-G${oppositeGroup}-P2`);
  }

  for (let rank = 3; rank <= advanceTeamsPerGroup; rank++) {
    for (let group = 1; group <= numberOfGroups; group++) {
      seeds.push(`R1-B${branch}-G${group}-P${rank}`);
    }
  }

  return [...new Set(seeds)];
};

/**
 * Map slot đi tiếp từ vòng bảng sang slot vòng knockout đầu tiên.
 * Ví dụ: R1-B1-G1-P1 -> R2-B1-M1-1.
 */
export const generateDefaultMapping = (numberOfGroups, advanceTeamsPerGroup = 2, branch = 1, knockoutRound = 2) => {
  const mapping = {};
  const totalTeams = numberOfGroups * advanceTeamsPerGroup;
  const bracketSize = nextPowerOfTwo(totalTeams);
  const seeds = makeSeedOrder(numberOfGroups, advanceTeamsPerGroup, branch);

  for (let index = 0; index < bracketSize; index++) {
    const sourceSlot = seeds[index];
    if (!sourceSlot) continue;

    const matchNumber = Math.floor(index / 2) + 1;
    const side = index % 2 === 0 ? 1 : 2;
    mapping[sourceSlot] = `R${knockoutRound}-B${branch}-M${matchNumber}-${side}`;
  }

  return mapping;
};
