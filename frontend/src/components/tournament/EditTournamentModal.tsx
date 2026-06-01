import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

import { useTournamentStore } from "@/stores/useTournamentStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Tournament } from "./TournamentDetail";

import BasicInfoSection from './CreateTournamentModal/basic-info-section';
import TimelineContactSection from './CreateTournamentModal/timeline-contact-section';
import SportsConfigSection from './CreateTournamentModal/sports-config-section';
import type { SportsConfigData } from './CreateTournamentModal/sports-config-section';
import GalaConfigSection from './CreateTournamentModal/gala-config-section';
import MediaPrizesSection from './CreateTournamentModal/media-prizes-section';

const SPORTS_LIST = ["Pickleball", "Tennis", "Badminton", "Table Tennis", "Football", "Volleyball"];
const CATEGORIES_LIST = [
  { id: 'MS', label: 'Đơn Nam (MS)' }, { id: 'WS', label: 'Đơn Nữ (WS)' },
  { id: 'MD', label: 'Đôi Nam (MD)' }, { id: 'WD', label: 'Đôi Nữ (WD)' }, { id: 'XD', label: 'Đôi Nam Nữ (XD)' },
];

interface FileState {
  logo: File | null;
  paymentQR: File | null;
  banners: File[];
}

interface PreviewState {
  logo: string | null;
  paymentQR: string | null;
  banners: string[];
}

interface EditTournamentModalProps {
  tournament: Tournament;
  onSuccess: () => Promise<void>;
  children: React.ReactNode;
}

export function EditTournamentModal({ tournament, onSuccess, children }: EditTournamentModalProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();
  const { submitTournament } = useTournamentStore() as { 
    submitTournament: (mode: "create" | "edit", id: string | null, payload: FormData) => Promise<boolean> 
  };

  const [formData, setFormData] = useState({ 
    name: '', slogan: '', targetParticipants: '', location: '', description: '', prizes: '', organizer: '' 
  });
  const [contactPerson, setContactPerson] = useState({ name: '', phone: '' });
  const [timeLine, setTimeLine] = useState({ registrationStart: '', registrationEnd: '', tournamentStart: '', tournamentEnd: '' });
  const [sportsConfig, setSportsConfig] = useState<SportsConfigData>({});
  const [galaConfig, setGalaConfig] = useState({ hasGala: false, time: '', location: '', description: '' });
  const [files, setFiles] = useState<FileState>({ logo: null, paymentQR: null, banners: [] });
  const [previews, setPreviews] = useState<PreviewState>({ logo: null, paymentQR: null, banners: [] });

  const toDateTimeLocal = (value?: string) => value ? value.slice(0, 16) : "";

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && tournament) {
      // Map data từ tournament vào các state form
      setFormData({
        name: tournament.displayName || tournament.name || "",
        slogan: tournament.slogan || "",
        targetParticipants: tournament.targetAudience || "",
        location: tournament.location || "",
        description: tournament.description || "",
        prizes: tournament.prizes || "",
        organizer: tournament.organizer?.name || user?._id || "",
      });

      const timeline = tournament.timeLine || tournament.timeline;
      setTimeLine({
        registrationStart: toDateTimeLocal(timeline?.registrationStart),
        registrationEnd: toDateTimeLocal(timeline?.registrationEnd),
        tournamentStart: toDateTimeLocal(timeline?.tournamentStart),
        tournamentEnd: toDateTimeLocal(timeline?.tournamentEnd),
      });
      setContactPerson({
        name: tournament.contactPerson?.name || "",
        phone: tournament.contactPerson?.phone || "",
      });

      // Map sports config
      const initialSports: SportsConfigData = SPORTS_LIST.reduce((acc: SportsConfigData, sport) => {
        const existing = tournament.sportsConfig?.find(s => (s.sportName || s.sport) === sport);
        acc[sport] = { 
          selected: !!existing, 
          feePerAthlete: (existing?.feeEntry ?? existing?.feePerAthlete ?? '').toString(), 
          maxTeams: existing?.maxTeams?.toString() || '', 
          categories: existing?.categories || [] 
        };
        return acc;
      }, {});
      setSportsConfig(initialSports);

      const gala = tournament.galaInfo || tournament.galaConfig;
      if (gala) {
        setGalaConfig({
          hasGala: Boolean(tournament.galaConfig?.hasGala ?? true),
          time: toDateTimeLocal(gala.time),
          location: gala.venue || "",
          description: gala.description || "",
        });
      } else {
        setGalaConfig({ hasGala: false, time: '', location: '', description: '' });
      }

      setPreviews({
        logo: tournament.logoUrl ? `http://localhost:5001/${tournament.logoUrl}` : null,
        paymentQR: tournament.paymentInfo?.qrCodeUrl ? `http://localhost:5001/${tournament.paymentInfo.qrCodeUrl}` : null,
        banners: tournament.bannerUrl ? [`http://localhost:5001/${tournament.bannerUrl}`] : [],
      });
    }
    setOpen(isOpen);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactPerson(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeLine(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleGalaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; type?: string; checked?: boolean; value?: string } }) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setGalaConfig(p => ({ ...p, [target.name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: inputFiles } = e.target;
    if (!inputFiles) return;

    if (name === 'banners') {
      const arr = Array.from(inputFiles);
      setFiles(p => ({ ...p, banners: [...p.banners, ...arr] }));
      setPreviews(p => ({ ...p, banners: [...p.banners, ...arr.map(x => URL.createObjectURL(x))] }));
    } else {
      if (inputFiles[0]) {
        setFiles(p => ({ ...p, [name]: inputFiles[0] }));
        setPreviews(p => ({ ...p, [name]: URL.createObjectURL(inputFiles[0]) }));
      }
    }
  };

  const toggleSport = (sport: string) => setSportsConfig(p => ({ ...p, [sport]: { ...p[sport], selected: !p[sport].selected } }));
  const handleSportFieldChange = (sport: string, field: string, val: string) => setSportsConfig(p => ({ ...p, [sport]: { ...p[sport], [field]: val } }));
  const toggleCategory = (sport: string, catId: string) => {
    setSportsConfig(p => {
      const ObjectCats = p[sport];
      if (!ObjectCats) return p;
      const cats = ObjectCats.categories;
      const newCats = cats.includes(catId) ? cats.filter(c => c !== catId) : [...cats, catId];
      return { ...p, [sport]: { ...ObjectCats, categories: newCats } };
    });
  };

  const handleSave = async () => {
    const payload = new FormData();
    payload.append('displayName', formData.name);
    payload.append('slogan', formData.slogan);
    payload.append('venue', formData.location);
    payload.append('targetAudience', formData.targetParticipants);
    payload.append('description', formData.description);
    payload.append('prizes', formData.prizes);
    payload.append('contactPerson', JSON.stringify(contactPerson));
    payload.append('timeRegister', timeLine.registrationStart);
    payload.append('timeCloseRegister', timeLine.registrationEnd);
    payload.append('timeOpen', timeLine.tournamentStart);
    payload.append('timeClose', timeLine.tournamentEnd);
    payload.append('galaConfig', JSON.stringify(galaConfig));

    const activeSports = Object.keys(sportsConfig)
      .filter(k => sportsConfig[k]?.selected)
      .map(k => ({
        sport: k,
        feePerAthlete: Number(sportsConfig[k]?.feePerAthlete) || 0,
        maxTeams: sportsConfig[k]?.maxTeams ? Number(sportsConfig[k]?.maxTeams) : null,
        categories: sportsConfig[k]?.categories || []
      }));

    if (activeSports.length === 0) {
      toast.error("Vui lòng cấu hình ít nhất 1 môn thi đấu!");
      return; 
    }
    
    payload.append('sportsConfig', JSON.stringify(activeSports));

    if (files.logo) payload.append('logo', files.logo);
    if (files.paymentQR) payload.append('paymentQR', files.paymentQR);
    files.banners.forEach(b => payload.append('banners', b));

    const isSuccess = await submitTournament('edit', tournament._id, payload);
    if (isSuccess) {
      await onSuccess();
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 bg-slate-50 gap-0 overflow-hidden outline-none">
        <DialogHeader className="px-6 py-4 border-b bg-white shrink-0">
          <DialogTitle className="text-xl font-bold uppercase flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            🏆 CHỈNH SỬA THÔNG TIN GIẢI ĐẤU
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-full flex-1 px-6 py-6 min-h-0">
          <form id="edit-tour-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex flex-col gap-6 pb-8">
            <BasicInfoSection 
              formData={formData} 
              handleTextChange={handleTextChange} 
              organizerName={user?.username || "Tài khoản của bạn"} 
            />
            <TimelineContactSection contactPerson={contactPerson} handleContactChange={handleContactChange} timeLine={timeLine} handleTimeChange={handleTimeChange} />
            <SportsConfigSection sportsConfig={sportsConfig} SPORTS_LIST={SPORTS_LIST} CATEGORIES_LIST={CATEGORIES_LIST} toggleSport={toggleSport} handleSportFieldChange={handleSportFieldChange} toggleCategory={toggleCategory} />
            <GalaConfigSection galaConfig={galaConfig} handleGalaChange={handleGalaChange} />
            <MediaPrizesSection formData={formData} handleTextChange={handleTextChange} previews={previews} handleFileChange={handleFileChange} removeBanner={() => {}} />
          </form>
        </ScrollArea>

        <DialogFooter className="px-10 py-9 border-t bg-white flex justify-end gap-3 shrink-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy bỏ</Button>
          <Button type="submit" form="edit-tour-form" className="font-bold min-w-[150px]" style={{ backgroundColor: "oklch(0.33 0.05 240)" }}>
            LƯU THAY ĐỔI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
