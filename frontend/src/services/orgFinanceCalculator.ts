import type { FeeProgressData } from "@/types/orgFinanceMgmt";
import type { Participant } from "@/types/participant";

type FinanceParticipant = Participant & {
  registrationStatus?: "pending" | "approved" | "rejected" | "suspended";
  paymentStatus?: "paid" | "unpaid" | "exempted";
};

export const calculateFeeProgress = (participants: FinanceParticipant[], feePerPlayer: number): FeeProgressData => {
  const teams = participants.filter((item) => item.type === "team");
  const countPlayers = (item: FinanceParticipant) => item.lineup?.length || 0;
  const feeOfTeam = (item: FinanceParticipant) => {
    const memberFees = item.memberFees || [];
    const memberTotal = memberFees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
    if (memberTotal > 0) return memberTotal;
    return countPlayers(item) * feePerPlayer;
  };

  const totalPlayers = teams.reduce((sum, item) => sum + countPlayers(item), 0);
  const freeTeams = teams.filter((item) => item.paymentStatus === "exempted");
  const paidTeams = teams.filter((item) => item.paymentStatus !== "exempted");
  const approvedTeams = teams.filter((item) => item.registrationStatus === "approved");
  const approvedPaidTeams = approvedTeams.filter((item) => item.paymentStatus !== "exempted");
  const approvedFreeTeams = approvedTeams.filter((item) => item.paymentStatus === "exempted");

  const freePlayers = freeTeams.reduce((sum, item) => sum + countPlayers(item), 0);
  const approvedPlayers = approvedTeams.reduce((sum, item) => sum + countPlayers(item), 0);
  const approvedPaidPlayers = approvedPaidTeams.reduce((sum, item) => sum + countPlayers(item), 0);
  const approvedFreePlayers = approvedFreeTeams.reduce((sum, item) => sum + countPlayers(item), 0);
  const allEligiblePaidPlayers = paidTeams.reduce((sum, item) => sum + countPlayers(item), 0);

  const expectedAmount = paidTeams.reduce((sum, item) => sum + feeOfTeam(item), 0);
  const collectedAmount = approvedPaidTeams.reduce((sum, item) => sum + feeOfTeam(item), 0);

  return {
    expectedAmount,
    collectedAmount,
    progressPercentage: expectedAmount > 0 ? Math.round((collectedAmount / expectedAmount) * 100) : 0,
    feePerPlayer,
    totalPlayers,
    approvedPlayers,
    approvedPaidPlayers,
    approvedFreePlayers,
    allEligiblePaidPlayers,
    freePlayers,
    paidTeams: paidTeams.length,
    freeTeams: freeTeams.length,
  };
};
