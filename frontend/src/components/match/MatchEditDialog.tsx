import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Match } from "@/types/automator";

interface MatchEditDialogProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: { scheduledStartTime: string; courtName: string }) => Promise<void>;
  isProcessing: boolean;
}

export const MatchEditDialog: React.FC<MatchEditDialogProps> = ({ 
  match, 
  isOpen, 
  onClose, 
  onSave, 
  isProcessing 
}) => {
  const [startTime, setStartTime] = React.useState('');
  const [court, setCourt] = React.useState('');
  const [prevMatchId, setPrevMatchId] = React.useState<string | null>(null);

  // Sync prop to state during render
  if (match && match._id !== prevMatchId) {
    setPrevMatchId(match._id);
    setStartTime(match.scheduledStartTime ? new Date(match.scheduledStartTime).toISOString().slice(0, 16) : '');
    setCourt(match.courtName || '');
  }

  const handleSave = () => {
    if (match) {
      void onSave(match._id, { scheduledStartTime: startTime, courtName: court });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa lịch thi đấu - Trận {match?.matchNumber}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="startTime">Thời gian bắt đầu</Label>
            <Input id="startTime" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="court">Tên sân</Label>
            <Input id="court" placeholder="VD: Sân số 1" value={court} onChange={(e) => setCourt(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Hủy</Button>
          <Button onClick={handleSave} disabled={isProcessing}>{isProcessing ? "Đang lưu..." : "Lưu thay đổi"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};