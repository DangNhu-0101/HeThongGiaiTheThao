// src/components/InvitationItem.tsx
import { useState } from "react";
import { Check, X, Trash2, UserPlus, CalendarDays, MapPin } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTeamStore } from "@/stores/useTeamStore";
import type {Invitation} from "@/types/invitation"
import type { Team } from "@/types/Team";




interface InvitationItemProps {
    invitation: Invitation;
    type: "sent" | "received"; // sent: tôi là người gửi, received: tôi là người nhận
    onActionComplete?: () => void; // callback sau khi thực hiện (để refresh danh sách)
}


// Helper để lấy tên giải đấu và môn thể thao từ teamId (nếu có)
const getTournamentInfo = (team: Team) => {
    const tournament = team?.tournamentId;
    return {
        tournamentName: tournament?.name || "Đang cập nhật",
        sportCategory: team?.sportCategory || "Pickleball",
    };
};


export function InvitationItem({ invitation, type, onActionComplete }: InvitationItemProps) {
    const { acceptInvitation, rejectInvitation, loading } = useTeamStore();
    const [isProcessing, setIsProcessing] = useState(false);


    const { senderId, receiverId, teamId, status, message, createdAt } = invitation;
    const isPending = status === "pending";


    // Xác định người gửi và người nhận hiển thị
    const otherUser = type === "received" ? senderId : receiverId;
    const userName = otherUser?.username || "Người dùng";
    const userAvatar = (otherUser as { avatarUrl?: string })?.avatarUrl || (otherUser as { avatar?: string })?.avatar;


    // Thông tin đội / giải đấu
    const { tournamentName, sportCategory } = getTournamentInfo(teamId);


    // Format thời gian
    const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString("vi-VN") : "";


    const handleAccept = async () => {
        if (!isPending) return;
        setIsProcessing(true);
        try {
            await acceptInvitation(invitation._id);
            toast.success(`Đã chấp nhận lời mời vào đội "${teamId?.name || ""}"`);
            onActionComplete?.();
        } catch  {
            toast.error("Chấp nhận thất bại");
        } finally {
            setIsProcessing(false);
        }
    };


    const handleReject = async () => {
        if (!isPending) return;
        setIsProcessing(true);
        try {
            await rejectInvitation(invitation._id);
            toast.success(type === "received" ? "Đã từ chối lời mời" : "Đã thu hồi lời mời");
            onActionComplete?.();
        } catch  {
            toast.error("Thao tác thất bại");
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <Card className="w-full overflow-hidden transition-all hover:shadow-md">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {/* Avatar người gửi/nhận */}
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={userAvatar} />
                        <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>


                    <div className="flex-1 space-y-1">
                        {/* Header: tên + badge trạng thái */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="font-semibold">
                                {type === "received" ? (
                                    <span>
                                        <span className="text-foreground">{userName}</span>{" "}
                                        <span className="text-muted-foreground">đã mời bạn vào đội</span>
                                    </span>
                                ) : (
                                    <span>
                                        <span className="text-foreground">Bạn</span>{" "}
                                        <span className="text-muted-foreground">đã mời</span>{" "}
                                        <span className="text-foreground">{userName}</span>
                                    </span>
                                )}
                            </div>
                            {!isPending && (
                                <Badge variant={status === "accepted" ? "default" : "secondary"}>
                                    {status === "accepted" ? "Đã chấp nhận" : "Đã từ chối"}
                                </Badge>
                            )}
                        </div>


                        {/* Thông tin đội, giải đấu, môn thể thao */}
                        <div className="text-sm text-muted-foreground space-y-0.5">
                            <div className="flex items-center gap-1">
                                <UserPlus className="h-3.5 w-3.5" />
                                <span>Đội: <span className="font-medium text-foreground">{teamId?.name || "Không xác định"}</span></span>
                            </div>
                            <div className="flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                <span>Giải đấu: {tournamentName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>Môn: {sportCategory}</span>
                            </div>
                        </div>


                        {/* Tin nhắn kèm theo (nếu có) */}
                        {message && (
                            <p className="text-sm italic text-muted-foreground mt-1 border-l-2 pl-2">
                                “{message}”
                            </p>
                        )}


                        {/* Thời gian gửi */}
                        <div className="text-xs text-muted-foreground mt-1">{formattedDate}</div>
                    </div>
                </div>
            </CardContent>


            {/* Footer nút hành động (chỉ hiện nếu trạng thái pending) */}
            {isPending && (
                <CardFooter className="flex gap-2 justify-end p-3 pt-0">
                    {type === "received" ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={handleReject}
                                disabled={isProcessing || loading}
                            >
                                <X className="h-4 w-4" />
                                Từ chối
                            </Button>
                            <Button
                                size="sm"
                                className="gap-1 bg-green-600 hover:bg-green-700"
                                onClick={handleAccept}
                                disabled={isProcessing || loading}
                            >
                                <Check className="h-4 w-4" />
                                Chấp nhận
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="gap-1"
                            onClick={handleReject}
                            disabled={isProcessing || loading}
                        >
                            <Trash2 className="h-4 w-4" />
                            Thu hồi lời mời
                        </Button>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
