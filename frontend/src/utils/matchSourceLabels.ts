const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

const isDefaultSlotLabel = (value: string) => /^slot\s+\d+$/i.test(value.trim()) || /^team\s+[ab]$/i.test(value.trim());

const hasDisplayName = (value: Record<string, unknown>) => String(value.name || "").trim().length > 0;

export const cleanSourceLabel = (value: unknown, fallback = "") => {
  const label = String(value || "").trim();
  if (!label) return fallback;
  return label;
};

export const initialsFromSource = (value: string) => {
  const cleaned = cleanSourceLabel(value, "-");
  const matchCode = cleaned.match(/\bM\d+\b/i)?.[0];
  if (matchCode) return matchCode.toUpperCase();
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "-";
};

export const readMatchSourceLabels = (raw: Record<string, unknown>) => {
  const participants = Array.isArray(raw.participants) ? raw.participants : [];
  const labels = Array.isArray(raw.formatSlotLabels) ? raw.formatSlotLabels.map((item) => cleanSourceLabel(item)) : [];
  const previousMatches = Array.isArray(raw.previousMatches) ? raw.previousMatches : [];
  const previousWinners = previousMatches.map((item) => {
    const entry = asRecord(item);
    const match = asRecord(entry.matchId);
    const winner = asRecord(match.winnerParticipantId);
    return String(match.status || "").toLowerCase() === "completed" && hasDisplayName(winner) ? winner : {};
  });
  const previousLabels = previousMatches
    .map((item) => {
      const entry = asRecord(item);
      const match = asRecord(entry.matchId);
      return cleanSourceLabel(match.name || entry.label || entry.sourceLabel);
    });
  const rawTeamA = asRecord(raw.teamA || raw.participantA || raw.team1 || raw.homeParticipant || participants[0]);
  const rawTeamB = asRecord(raw.teamB || raw.participantB || raw.team2 || raw.awayParticipant || participants[1]);
  const teamA = hasDisplayName(rawTeamA) ? rawTeamA : asRecord(previousWinners[0]);
  const teamB = hasDisplayName(rawTeamB) ? rawTeamB : asRecord(previousWinners[1]);
  const labelA = labels[0] && !isDefaultSlotLabel(labels[0]) ? labels[0] : previousLabels[0];
  const labelB = labels[1] && !isDefaultSlotLabel(labels[1]) ? labels[1] : previousLabels[1];
  const nameA = cleanSourceLabel(teamA.name, labelA || "Seed 1");
  const nameB = cleanSourceLabel(teamB.name, labelB || "Seed 2");
  return {
    teamA,
    teamB,
    nameA: isDefaultSlotLabel(nameA) && labelA ? labelA : nameA,
    nameB: isDefaultSlotLabel(nameB) && labelB ? labelB : nameB,
  };
};
