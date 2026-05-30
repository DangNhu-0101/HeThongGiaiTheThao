// src/components/team/MemberList.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { MemberItem } from "./member-item";
import type { Member } from "@/types/member";


interface MemberListProps {
    members: Member[];
    isLoading?: boolean;
}


export function MemberList({ members, isLoading }: MemberListProps) {
    if (isLoading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }


    if (members.length === 0) {
        return <p className="text-muted-foreground text-sm">Chưa có thành viên nào.</p>;
    }


    return (
        <div className="space-y-3">
            {members.map((member, idx) => (
                <MemberItem key={member.userId || idx} member={member} />
            ))}
        </div>
    );
}



