// src/components/dashboard/StatsCards.tsx
import React from "react";
import { Activity, Trophy, Users, MapPinHouse } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";

interface StatsCardsProps {
  totalTournaments: number;
  ongoingTournaments: number;
  totalReferees: number;
  totalCourts: number;
  loading: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalTournaments,
  ongoingTournaments,
  totalReferees,
  totalCourts,
  loading,
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <StatCard
        title="Tổng giải đấu"
        value={loading ? "..." : totalTournaments}
        icon={Trophy}
        iconColor="text-sky-600"
      />
      <StatCard
        title="Đang diễn ra"
        value={loading ? "..." : ongoingTournaments}
        icon={Activity}
        iconColor="text-emerald-600"
      />
      <StatCard
        title="Tổng trọng tài"
        value={totalReferees}
        icon={Users}
        iconColor="text-amber-600"
      />
      <StatCard
        title="Tổng sân đấu"
        value={totalCourts}
        icon={MapPinHouse}
        iconColor="text-indigo-600"
      />
    </div>
  );
};