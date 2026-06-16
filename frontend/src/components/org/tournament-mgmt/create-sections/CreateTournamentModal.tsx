import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy } from "lucide-react";
import { toast } from "sonner";


import BasicInfoSection from '@/components/org/tournament-mgmt/create-sections/BasicInfoSection';
import type { BasicInfoState } from '@/components/org/tournament-mgmt/create-sections/BasicInfoSection';

import TimelineContactSection from '@/components/org/tournament-mgmt/create-sections/TimelineContactSection';
import type { TimeLineState } from '@/components/org/tournament-mgmt/create-sections/TimelineContactSection';

import SportsConfigSection from '@/components/org/tournament-mgmt/create-sections/SportsConfigSection';
import type { SportsConfigData } from '@/components/org/tournament-mgmt/create-sections/SportsConfigSection';

const SPORTS_LIST = ["Pickleball", "Tennis", "Badminton", "Football", "Volleyball"];
const CATEGORIES_LIST = [{ id: 'MS', label: 'Đơn Nam' }, { id: 'WS', label: 'Đơn Nữ' }, { id: 'MD', label: 'Đôi Nam' }, { id: 'WD', label: 'Đôi Nữ' }];

interface Props { onSuccess?: () => void; children: React.ReactNode; }

const CreateTournamentModal = ({ onSuccess, children }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<BasicInfoState>({ name: '', slogan: '', targetParticipants: '', location: '', description: '', prizes: '', organizer: 'System' });
  const [contactPerson, setContactPerson] = useState({ name: '', phone: '' });
  const [timeLine, setTimeLine] = useState<TimeLineState>({ registrationStart: '', registrationEnd: '', tournamentStart: '', tournamentEnd: '' });
  const [sportsConfig, setSportsConfig] = useState<SportsConfigData>(
    SPORTS_LIST.reduce((acc: SportsConfigData, sport) => { acc[sport] = { selected: false, feePerAthlete: '', maxTeams: '', categories: [] }; return acc; }, {})
  );
  // const [files, setFiles] = useState({ logo: null as File|null, paymentQR: null as File|null, banners: [] as File[] });
  // const [previews, setPreviews] = useState({ logo: null as string|null, paymentQR: null as string|null, banners: [] as string[] });

  const handleClose = () => setIsOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Tạo giải đấu thành công!");
      if(onSuccess) onSuccess();
      handleClose();
      setLoading(false);
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger >{children}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 bg-muted/10 gap-0 overflow-hidden outline-none">
        <DialogHeader className="px-6 py-4 border-b border-border bg-card shrink-0">
          <DialogTitle className="text-xl font-black uppercase flex items-center gap-2"><Trophy className="w-5 h-5 text-primary"/> KHỞI TẠO GIẢI ĐẤU MỚI</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full flex-1 px-4 md:px-6 py-6 min-h-0">
          <form id="tour-form" onSubmit={handleSubmit} className="flex flex-col gap-6 pb-8">
            <BasicInfoSection formData={formData} handleTextChange={e => setFormData(p => ({...p, [e.target.name]: e.target.value}))} />
            <TimelineContactSection contactPerson={contactPerson} handleContactChange={e => setContactPerson(p => ({...p, [e.target.name]: e.target.value}))} timeLine={timeLine} handleTimeChange={e => setTimeLine(p => ({...p, [e.target.name]: e.target.value}))} />
            <SportsConfigSection sportsConfig={sportsConfig} SPORTS_LIST={SPORTS_LIST} CATEGORIES_LIST={CATEGORIES_LIST} 
              toggleSport={s => setSportsConfig(p => ({...p, [s]: {...p[s], selected: !p[s].selected}}))} 
              handleSportFieldChange={(s, f, v) => setSportsConfig(p => ({...p, [s]: {...p[s], [f]: v}}))} 
              toggleCategory={(s, cId) => setSportsConfig(p => { const cats = p[s].categories; return {...p, [s]: {...p[s], categories: cats.includes(cId) ? cats.filter(c => c !== cId) : [...cats, cId]}}; })} 
            />
            {/* <GalaMediaSection formData={formData} handleTextChange={e => setFormData(p => ({...p, [e.target.name]: e.target.value}))} previews={previews} handleFileChange={() => {}} removeBanner={() => {}} /> */}
          </form>
        </ScrollArea>
        <DialogFooter className="px-6 py-4 border-t border-border bg-card flex justify-end gap-3 shrink-0">
          <Button type="button" variant="outline" onClick={handleClose}>Hủy bỏ</Button>
          <Button type="submit" form="tour-form" disabled={loading} className="font-bold bg-primary text-primary-foreground min-w-[150px]">LƯU GIẢI ĐẤU</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default CreateTournamentModal;
