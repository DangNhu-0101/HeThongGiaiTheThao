import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { toast } from "sonner"; 

import { useTournamentStore } from '@/stores/useTournamentStore';

import BasicInfoSection from './basic-info-section';
import TimelineContactSection from './timeline-contact-section';
import SportsConfigSection from './sports-config-section';
import type { SportsConfigData } from './sports-config-section'; 
import GalaConfigSection from './gala-config-section';
import MediaPrizesSection from './media-prizes-section';

// --- Khai báo Interface chuẩn ---
interface CreateTournamentModalProps {
  onSuccess?: () => void;
  children: React.ReactNode;
}

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

const SPORTS_LIST = ["Pickleball", "Tennis", "Badminton", "Table Tennis", "Football", "Volleyball"];
const CATEGORIES_LIST = [
  { id: 'MS', label: 'Đơn Nam (MS)' }, { id: 'WS', label: 'Đơn Nữ (WS)' },
  { id: 'MD', label: 'Đôi Nam (MD)' }, { id: 'WD', label: 'Đôi Nữ (WD)' }, { id: 'XD', label: 'Đôi Nam Nữ (XD)' },
];

const CreateTournamentModal = ({ onSuccess, children }: CreateTournamentModalProps) => {

  // --- STATE QUẢN LÝ ĐÓNG/MỞ MODAL ---
  const [isOpen, setIsOpen] = useState(false);

  const { 
    organizations, 
    loading, 
    fetchOrganizations, 
    submitTournament, 
  } = useTournamentStore();

  const [formData, setFormData] = useState({ name: '', slogan: '', targetParticipants: '', location: '', description: '', prizes: '', organizer: '' });
  const [contactPerson, setContactPerson] = useState({ name: '', phone: '' });
  const [timeLine, setTimeLine] = useState({ registrationStart: '', registrationEnd: '', tournamentStart: '', tournamentEnd: '' });
  
  const [sportsConfig, setSportsConfig] = useState<SportsConfigData>(
    SPORTS_LIST.reduce((acc: SportsConfigData, sport) => {
      acc[sport] = { selected: false, feePerAthlete: '', maxTeams: '', categories: [] };
      return acc;
    }, {})
  );

  const [galaConfig, setGalaConfig] = useState({ hasGala: false, time: '', location: '', description: '' });
  const [files, setFiles] = useState<FileState>({ logo: null, paymentQR: null, banners: [] });
  const [previews, setPreviews] = useState<PreviewState>({ logo: null, paymentQR: null, banners: [] });

  // Gọi API lấy Organizations khi Modal mở
  useEffect(() => {
    if (isOpen) {
      fetchOrganizations();
    }
  }, [isOpen, fetchOrganizations]);

  // Hàm reset lại form khi đóng Modal (Rất quan trọng vì DialogTrigger giữ state)
  const resetForm = () => {
    setFormData({ name: '', slogan: '', targetParticipants: '', location: '', description: '', prizes: '', organizer: '' });
    setContactPerson({ name: '', phone: '' });
    setTimeLine({ registrationStart: '', registrationEnd: '', tournamentStart: '', tournamentEnd: '' });
    setSportsConfig(SPORTS_LIST.reduce((acc: SportsConfigData, sport) => {
      acc[sport] = { selected: false, feePerAthlete: '', maxTeams: '', categories: [] };
      return acc;
    }, {}));
    setGalaConfig({ hasGala: false, time: '', location: '', description: '' });
    setFiles({ logo: null, paymentQR: null, banners: [] });
    setPreviews({ logo: null, paymentQR: null, banners: [] });
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
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

  const removeBanner = (index: number) => {
    setFiles(p => ({ ...p, banners: p.banners.filter((_, i) => i !== index) }));
    setPreviews(p => ({ ...p, banners: p.banners.filter((_, i) => i !== index) }));
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const payload = new FormData();
    payload.append('displayName', formData.name);
    payload.append('venue', formData.location);
    payload.append('targetAudience', formData.targetParticipants);
    payload.append('description', formData.description);
    payload.append('prizes', formData.prizes);
    payload.append('organizer', formData.organizer); 
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
    payload.append('sportType', JSON.stringify(activeSports.map(s => s.sport)));

    if (files.logo) payload.append('logo', files.logo);
    if (files.paymentQR) payload.append('paymentQR', files.paymentQR);
    files.banners.forEach(b => payload.append('banners', b));

    // Vì Component này ĐỘC LẬP TẠO MỚI (Trigger từ 1 nút) nên mặc định mode là 'create'
    const isSuccess = await submitTournament('create', null, payload);
    if (isSuccess) {
      if (onSuccess) onSuccess();
      handleClose();
    }
  };


  const mappedOrganizations = organizations.map((org) => {
    // Tìm ID an toàn không dùng any
    const orgId = '_id' in org 
      ? String(org._id) 
      : ('id' in org ? String((org as unknown as { id: string | number }).id) : '');

    return {
      ...org,         
      _id: orgId,      
      name: org.name   
    };
  });

  return (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogTrigger asChild>
      {children}
    </DialogTrigger>

    {/* 🆕 CẬP NHẬT LẠI CLASS ĐỂ FIX LỖI CO RÚM FORM */}
    <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 bg-slate-50 gap-0 overflow-hidden outline-none">
      <DialogHeader className="px-6 py-4 border-b bg-white shrink-0">
        <DialogTitle className="text-xl font-bold uppercase flex items-center gap-2" style={{ color: "var(--foreground)" }}>
           🏆 KHỞI TẠO GIẢI ĐẤU MỚI
        </DialogTitle>
      </DialogHeader>

      {/* 🆕 ÉP CHIỀU CAO CỐ ĐỊNH CHO SCROLLAREA ĐỂ BUNG THANH CUỘN DỌC */}
      <ScrollArea className="h-full flex-1 px-6 py-6 min-h-0">
        <form id="tour-form" onSubmit={handleSubmit} className="flex flex-col gap-6 pb-8">
          <BasicInfoSection formData={formData} handleTextChange={handleTextChange} organizations={mappedOrganizations} />
          <TimelineContactSection contactPerson={contactPerson} handleContactChange={handleContactChange} timeLine={timeLine} handleTimeChange={handleTimeChange} />
          <SportsConfigSection sportsConfig={sportsConfig} SPORTS_LIST={SPORTS_LIST} CATEGORIES_LIST={CATEGORIES_LIST} toggleSport={toggleSport} handleSportFieldChange={handleSportFieldChange} toggleCategory={toggleCategory} />
          <GalaConfigSection galaConfig={galaConfig} handleGalaChange={handleGalaChange} />
          <MediaPrizesSection formData={formData} handleTextChange={handleTextChange} previews={previews} handleFileChange={handleFileChange} removeBanner={removeBanner} />
        </form>
      </ScrollArea>

      <DialogFooter className="px-10 py-9 border-t bg-white flex justify-end gap-3 shrink-0">
        <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>Hủy bỏ</Button>
        <Button type="submit" form="tour-form" disabled={loading} className="font-bold min-w-[150px]" style={{ backgroundColor: "oklch(0.33 0.05 240)" }}>
          {loading ? 'Đang xử lý...' : ' KHỞI TẠO GIẢI ĐẤU'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
};

export default CreateTournamentModal; 