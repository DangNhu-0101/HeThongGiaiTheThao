// src/components/dashboard/SidebarTabs.tsx
import React from "react";
import { MapPinHouse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { IRefereeItem, ICourtItem } from "@/types/dashboard";

interface SidebarTabsProps {
  referees: IRefereeItem[];
  courts: ICourtItem[];
}

export const SidebarTabs: React.FC<SidebarTabsProps> = ({ referees, courts }) => {
  return (
    <Card className="shadow-xs border-slate-200 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold">Quản lý nhân sự & Cơ sở</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="referees" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="referees" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">Trọng tài</TabsTrigger>
            <TabsTrigger value="courts" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">Sân đấu</TabsTrigger>
          </TabsList>

          <TabsContent value="referees" className="flex flex-col gap-4 focus-visible:outline-none">
            {referees.map((ref) => (
              <div key={ref.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center font-bold text-amber-700 text-xs shrink-0">
                  {ref.name.split(" ").pop()?.slice(0, 2).toUpperCase()}
                </div>
                <div className="grid gap-0.5">
                  <p className="text-xs font-bold text-slate-900">{ref.name}</p>
                  <p className="text-[11px] text-muted-foreground">{ref.email} • {ref.phone}</p>
                  <p className="text-[10px] font-semibold text-amber-700">{ref.level}</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="courts" className="flex flex-col gap-4 focus-visible:outline-none">
            {courts.map((court) => (
              <div key={court.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                  <MapPinHouse className="h-4 w-4" />
                </div>
                <div className="grid gap-0.5 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{court.name}</p>
                    <Badge variant={court.status === "available" ? "outline" : "destructive"} className="text-[9px] px-1.5 py-0 scale-95 font-bold uppercase shrink-0">
                      {court.status === "available" ? "Sẵn sàng" : "Bảo trì"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{court.location}</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};