// src/components/team/MemberItem.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Member } from "@/types/member"; 

interface MemberItemProps {
    member: Member;
}

export function MemberItem({ member }: MemberItemProps) {
    const { userId, role, status } = member;
    const username = userId?.username || "Người dùng";
    const email = userId?.email || "";
    const avatar = userId?.avatar;

    const roleLabel = role === "Captain" ? "Đội trưởng" : "Thành viên";
    const isActive = status === "Active";

    return (
        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors">
            <Avatar className="h-10 w-10">
                <AvatarImage src={avatar} />
                <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{username}</span>
                    <Badge variant={role === "Captain" ? "default" : "secondary"}>
                        {roleLabel}
                    </Badge>
                    {!isActive && (
                        <Badge variant="outline" className="text-yellow-600">
                            {status === "Invited" ? "Đã mời" : "Đang chờ"}
                        </Badge>
                    )}
                </div>
                {email && <div className="text-xs text-muted-foreground">{email}</div>}
            </div>
        </div>
    );
}