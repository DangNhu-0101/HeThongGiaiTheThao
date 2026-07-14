import { useEffect, useState } from "react";
import { Calendar as CalIcon, CheckCircle2, Clock, Edit, MapPin, RotateCcw, Save, Search, User, X } from "lucide-react";
import type { ScheduleMatchRecord, ScheduleReferee, VenueColumn } from "@/types/orgScheduleMgmt";
import { Button } from "@/components/ui/button";

interface Props {
  match: ScheduleMatchRecord;
  venues: VenueColumn[];
  referees: ScheduleReferee[];
  saving?: boolean;
  onSave: (id: string, updates: Partial<ScheduleMatchRecord>) => Promise<void> | void;
}

const toInputDate = (value?: string) => {
  if (!value) return "";
  if (value.includes("/")) {
    const [day, month, year] = value.split("/");
    return [year, month?.padStart(2, "0"), day?.padStart(2, "0")].join("-");
  }
  return value;
};

const AssignmentEditor = ({ match, venues, referees, saving = false, onSave }: Props) => {
  const [date, setDate] = useState(toInputDate(match.date));
  const [time, setTime] = useState((match.time || "").slice(0, 5));
  const [venue, setVenue] = useState(match.venue || "");
  const [order, setOrder] = useState(match.order || 1);
  const [refereeIds, setRefereeIds] = useState<string[]>(match.refereeIds || []);
  const [refereeSearch, setRefereeSearch] = useState("");

  useEffect(() => {
    setDate(toInputDate(match.date));
    setTime((match.time || "").slice(0, 5));
    setVenue(match.venue || "");
    setOrder(match.order || 1);
    setRefereeIds(match.refereeIds || []);
    setRefereeSearch("");
  }, [match.id, match.date, match.time, match.venue, match.order, match.refereeIds]);

  const selectedReferees = referees.filter((referee) => refereeIds.includes(referee.id));
  const filteredReferees = referees.filter((referee) => {
    const keyword = refereeSearch.trim().toLowerCase();
    const text = `${referee.name} ${referee.qualification} ${referee.experience}`.toLowerCase();
    return !keyword || text.includes(keyword);
  });
  const toggleReferee = (id: string) => {
    setRefereeIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };
  const save = () => {
    void Promise.resolve(onSave(match.id, { date, time, venue, order, refereeIds })).catch(() => undefined);
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-4 shrink-0">
      <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2"><Edit className="w-4 h-4 text-primary" /> Chi tiet trận đấu</h3>
        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase">{match.code}</span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="text-center flex-1 min-w-0">
          <p className="font-bold text-sm truncate" title={match.teamA.name}>{match.teamA.name}</p>
          <p className="text-[10px] text-muted-foreground">Đội A</p>
        </div>
        <div className="text-xs font-black text-muted-foreground px-2 shrink-0">VS</div>
        <div className="text-center flex-1 min-w-0">
          <p className="font-bold text-sm truncate" title={match.teamB.name}>{match.teamB.name}</p>
          <p className="text-[10px] text-muted-foreground">Đội B</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Ngay & gio</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <CalIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-background focus:outline-none focus:border-primary"
              />
            </div>
            <div className="relative flex-1">
              <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-background focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Sân thi đấu</label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-background focus:outline-none focus:border-primary appearance-none cursor-pointer"
            >
              <option value="">Chọn san...</option>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1 font-medium"><CheckCircle2 className="w-3 h-3" /> Sân trống trong khung giờ này</p>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase text-muted-foreground">Trọng tài</label>
          <div className="space-y-2 rounded-lg border border-border bg-background p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={refereeSearch}
                onChange={(event) => setRefereeSearch(event.target.value)}
                placeholder="Tim trọng tài..."
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            {selectedReferees.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedReferees.map((referee) => (
                  <button
                    key={referee.id}
                    type="button"
                    onClick={() => toggleReferee(referee.id)}
                    className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary"
                  >
                    {referee.name}<X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}
            <div className="max-h-36 space-y-1 overflow-y-auto beautiful-scrollbar">
              {filteredReferees.map((referee) => {
                const checked = refereeIds.includes(referee.id);
                return (
                  <button
                    key={referee.id}
                    type="button"
                    onClick={() => toggleReferee(referee.id)}
                    className={`flex w-full items-center gap-2 rounded-md border px-2 py-2 text-left text-xs transition-colors ${checked ? "border-primary bg-primary/10" : "border-border hover:bg-muted/60"}`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-black text-secondary-foreground">
                      {referee.name.trim().slice(0, 1).toUpperCase() || "T"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-foreground">{referee.name}</span>
                      <span className="block truncate text-[10px] font-semibold text-muted-foreground">{referee.experience} nam KN - {referee.qualification}</span>
                    </span>
                    <User className={`h-4 w-4 ${checked ? "text-primary" : "text-muted-foreground"}`} />
                  </button>
                );
              })}
              {filteredReferees.length === 0 && (
                <div className="rounded-md border border-dashed border-border px-3 py-4 text-center text-[10px] font-bold text-muted-foreground">
                  Không có trọng tài phu hop
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block">Thu tu hien thi</label>
          <input
            type="number"
            min={1}
            value={order}
            onChange={(event) => setOrder(Number(event.target.value) || 1)}
            className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button disabled={saving} onClick={save} className="flex-1 bg-primary hover:bg-primary-hover text-white text-xs h-9 shadow-md disabled:cursor-not-allowed disabled:opacity-70">
          <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? "Đang lưu..." : "Lưu phan cong"}
        </Button>
        <Button variant="outline" className="w-9 h-9 p-0 border-border text-muted-foreground hover:text-foreground" onClick={() => {
          setDate(toInputDate(match.date));
          setTime((match.time || "").slice(0, 5));
          setVenue(match.venue || "");
          setOrder(match.order || 1);
          setRefereeIds(match.refereeIds || []);
          setRefereeSearch("");
        }}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AssignmentEditor;
