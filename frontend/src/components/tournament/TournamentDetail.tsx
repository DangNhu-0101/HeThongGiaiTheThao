import { useEffect, useState} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailHeader } from "@/components/tournament/Detail/DetailHeader";
// import { DetailStats } from "@/components/tournament/Detail/DetailStats";
import { DetailOverviewTab } from "@/components/tournament/Detail/DetailOverviewTab";
import { DetailConfigTab } from "@/components/tournament/Detail/DetailConfigTab";
import { Loader2 } from "lucide-react";
import api from "@/api/axiosConfig";

// Assuming a DashboardLayout component exists
const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="p-4 sm:p-6 lg:p-8">{children}</div>
);

export interface Team { _id: string; name: string; isPaid?: boolean; }
export interface Court { _id: string; name: string; status?: string; }
export interface Referee { _id: string; name: string; }
export interface Prize { title: string; amount: number; description?: string; }
export interface GalaInfo { venue: string; time: string; description: string; }
export interface PaymentInfo { qrCodeUrl: string; }

// A comprehensive Tournament type based on the request and context
export interface Tournament {
  _id: string;
  name: string;
  displayName?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  sports: string[];
  sportType: string[];
  registeredTeams: Team[];
  teams: Team[];
  courts: Court[];
  referees: Referee[];
  bannerUrl?: string;
  logoUrl?: string;
  videoUrl?: string;
  slogan?: string;
  venue: string;
  description: string;
  rules: string;
  targetAudience: string;
  organizerInfo: string;
  prizes: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  organizer: {
    name: string;
  };
  location: string;
  sportsConfig: {
    sport?: string;
    sportName: string;
    categories: string[];
    feeEntry: number;
    feePerAthlete?: number;
    maxTeams: number | null;
  }[];
  galaInfo?: GalaInfo;
  galaConfig?: GalaInfo & { hasGala?: boolean };
  paymentInfo?: PaymentInfo;
  contactPerson?: {
    name: string;
    phone: string;
  };
  timeLine: {
    registrationStart: string; // ISO date string
    registrationEnd: string; // ISO date string
    tournamentStart: string; // ISO date string
    tournamentEnd: string; // ISO date string
  };
  timeline: {
    registrationStart: string;
    registrationEnd: string;
    tournamentStart: string;
    tournamentEnd: string;
  };
  gameRules: unknown[];
}

export default function TournamentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!id) return;
        let isMounted = true;
        
        const loadData = async () => {
            try {
                const response = await api.get(`/tournaments/${id}`);
                if (isMounted) setTournament(response.data.data);
            } catch (error) {
                if (isMounted) {
                    console.error("Failed to fetch tournament", error);
                    toast.error("Không thể tải thông tin giải đấu.");
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        void loadData();

        return () => {
            isMounted = false;
        };
    }, [id]);

    const handleRefresh = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await api.get(`/tournaments/${id}`);
            setTournament(response.data.data);
        } catch (error) {
            console.error("Failed to fetch tournament", error);
            toast.error("Không thể tải thông tin giải đấu.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        const confirmed = window.confirm("Bạn có chắc chắn muốn xóa giải đấu này? Hành động này không thể hoàn tác.");
        if (confirmed) {
            setIsDeleting(true);
            try {
                await api.delete(`/tournaments/${id}`);
                toast.success("Giải đấu đã được xóa thành công.");
                navigate("/tournaments"); // Navigate back to the list
            } catch (error) {
                console.error("Failed to delete tournament", error);
                toast.error("Xóa giải đấu thất bại.");
            } finally {
                setIsDeleting(false);
            }
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Đang tải dữ liệu...</span>
                </div>
            </DashboardLayout>
        );
    }

    if (!tournament) {
        return (
            <DashboardLayout>
                <div className="text-center">
                    <h2 className="text-xl font-semibold">Không tìm thấy giải đấu</h2>
                    <p className="text-muted-foreground">Giải đấu bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            
            <DetailHeader
                tournament={tournament}
                onDelete={handleDelete}
                isDeleting={isDeleting}
                onRefresh={handleRefresh}
            />
            {/* <DetailStats tournament={tournament} /> */}
            
            <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                    <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                    <TabsTrigger value="config">Cấu hình & Lịch trình</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                    <DetailOverviewTab tournament={tournament} />
                </TabsContent>
                <TabsContent value="config" className="mt-4">
                    <DetailConfigTab tournament={tournament} onRefresh={handleRefresh} />
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    );
}
