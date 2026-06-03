import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/libs/utils";

interface BackToHomeButtonProps {
  className?: string;
}

export function BackToHomeButton({ className }: BackToHomeButtonProps) {
  return (
    <Button variant="ghost" size="sm" asChild className={cn("mb-2 -ml-2 text-slate-500 hover:text-slate-900", className)}>
      <Link to="/" className="flex items-center gap-1 font-medium">
        <ChevronLeft className="h-4 w-4" />
        Quay lại trang chủ
      </Link>
    </Button>
  );
}