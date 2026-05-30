import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupStageTab } from "./GroupStageTab";
import { KnockoutStageTab } from "./KnockoutStageTab";
import { Trophy, Network } from "lucide-react";

export function TournamentResults({ tournamentId }: { tournamentId: string }) {
  return (
    <Tabs defaultValue="groups" className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Trophy className="h-6 w-6 text-yellow-500" /> Kết Quả Thi Đấu</h2>
        <TabsList className="bg-slate-100 p-1 rounded-xl flex w-full sm:w-max h-auto shadow-inner">
          <TabsTrigger value="groups" className="rounded-lg px-6 py-2.5 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-sky-700 data-[state=active]:shadow-sm flex-1 sm:flex-none">Vòng Bảng</TabsTrigger>
          <TabsTrigger value="knockout" className="rounded-lg px-6 py-2.5 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-rose-700 data-[state=active]:shadow-sm flex-1 sm:flex-none flex items-center gap-1.5"><Network className="h-4 w-4" /> Loại Trực Tiếp</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="groups" className="m-0 focus-visible:outline-none">
        <GroupStageTab tournamentId={tournamentId} />
      </TabsContent>
      <TabsContent value="knockout" className="m-0 focus-visible:outline-none">
        <KnockoutStageTab tournamentId={tournamentId} />
      </TabsContent>
    </Tabs>
  );
}