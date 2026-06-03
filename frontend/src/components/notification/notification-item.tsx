// src/components/	
import {  CreditCard, Info, Trophy, Users } from "lucide-react";
import { cn } from "@/libs/utils";
import type { Notification } from "@/types/notification";


interface NotificationItemProps {
    notification: Notification;
    onRead?: (id: string) => void;
}


const getIcon = (type: string) => {
    switch (type) {
        case "INVITATION":
            return <Users className="h-4 w-4 text-blue-500" />;
        case "PAYMENT":
            return <CreditCard className="h-4 w-4 text-green-500" />;
        case "MATCH":
            return <Trophy className="h-4 w-4 text-yellow-500" />;
        default:
            return <Info className="h-4 w-4 text-gray-500" />;
    }
};


const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);


    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
};


export function NotificationItem({ notification, onRead }: NotificationItemProps) {
    const { _id, title, message, type, isRead, createdAt } = notification;


    const handleClick = () => {
        if (!isRead && onRead) {
            onRead(_id);
        }
    };


    return (
        <div
            className={cn(
                "flex gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-muted/50",
                !isRead ? "bg-primary/5" : ""
            )}
            onClick={handleClick}
        >
            <div className="shrink-0 mt-0.5">{getIcon(type)}</div>
            <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTime(createdAt)}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{message}</p>
            </div>
            {!isRead && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />}
        </div>
    );
}

