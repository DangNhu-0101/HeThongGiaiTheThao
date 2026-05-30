import React from "react";
import { Badge } from "@/components/ui/badge";
import { Inbox } from "lucide-react";

interface ResourceGridSectionProps<T> {
    items: T[];
    title: string;
    count?: number;
    emptyMessage: string;
    headerAction?: React.ReactNode;
    renderCard: (item: T) => React.ReactNode;
    // Sử dụng hàm trích xuất key để React không báo lỗi thiếu key trên danh sách
    keyExtractor?: (item: T, index: number) => React.Key;
}

export function ResourceGridSection<T>({
    items,
    title,
    count,
    emptyMessage,
    headerAction,
    renderCard,
    keyExtractor = (_, index) => index,
}: ResourceGridSectionProps<T>) {
    return (
        <section className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                    {count !== undefined && (
                        <Badge variant="secondary" className="rounded-full px-2.5">
                            {count}
                        </Badge>
                    )}
                </div>
                {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
            </div>

            {/* Content / Empty State */}
            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center bg-muted/30">
                    <Inbox className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                    <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((item, index) => (
                        <React.Fragment key={keyExtractor(item, index)}>
                            {renderCard(item)}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </section>
    );
}