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
  const labelA = labels[0] && !isDefaultSlotLabel(labels[0]) ? labels[0] : previousLabels[0];
  const labelB = labels[1] && !isDefaultSlotLabel(labels[1]) ? labels[1] : previousLabels[1];
  const previousWinnerForLabel = (label: string) => {
    const normalized = cleanSourceLabel(label).toUpperCase();
    const index = previousLabels.findIndex((previousLabel) => cleanSourceLabel(previousLabel).toUpperCase() === normalized);
    return index >= 0 ? asRecord(previousWinners[index]) : {};
  };
  const sparseParticipants = labels.length >= 2 && participants.length < labels.length;
  const dependencyWinnerIds = new Set(labels
    .map((label) => previousWinnerForLabel(label))
    .map((winner) => String(winner._id || winner.id || ""))
    .filter(Boolean));
  const compactParticipantsAreDependencies = sparseParticipants && participants.length > 0 && participants.every((participant) => {
    const record = asRecord(participant);
    return dependencyWinnerIds.has(String(record._id || record.id || ""));
  });
  const participantAt = (index: number, label: string) => {
    const dependencyWinner = previousWinnerForLabel(label);
    if (hasDisplayName(dependencyWinner)) return dependencyWinner;
    if (compactParticipantsAreDependencies || (sparseParticipants && /^M\d+$/i.test(label))) return {};
    return asRecord(participants[index]);
  };
  const rawTeamA = asRecord(raw.teamA || raw.participantA || raw.team1 || raw.homeParticipant || participantAt(0, labelA));
  const rawTeamB = asRecord(raw.teamB || raw.participantB || raw.team2 || raw.awayParticipant || participantAt(1, labelB));
  const teamA = hasDisplayName(rawTeamA) ? rawTeamA : previousWinnerForLabel(labelA);
  const teamB = hasDisplayName(rawTeamB) ? rawTeamB : previousWinnerForLabel(labelB);
  const nameA = cleanSourceLabel(teamA.name, labelA || "Seed 1");
  const nameB = cleanSourceLabel(teamB.name, labelB || "Seed 2");
  return {
    teamA,
    teamB,
    nameA: isDefaultSlotLabel(nameA) && labelA ? labelA : nameA,
    nameB: isDefaultSlotLabel(nameB) && labelB ? labelB : nameB,
  };
};
