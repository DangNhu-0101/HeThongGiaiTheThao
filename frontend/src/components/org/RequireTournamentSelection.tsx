import { Trophy } from "lucide-react";

interface Props {
  title?: string;
  description?: string;
}

const RequireTournamentSelection = ({
  title = "Chưa chọn giải đấu",
  description = "Hãy chọn một giải trong ComboBox ở Sidebar để tải dữ liệu của trang này.",
}: Props) => (
  <div className="mx-auto flex min-h-[360px] max-w-3xl flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-10 text-center">
    <Trophy className="mb-3 h-10 w-10 text-muted-foreground" />
    <h1 className="text-2xl font-black text-foreground">{title}</h1>
    <p className="mt-2 text-sm text-muted-foreground">{description}</p>
  </div>
);

export default RequireTournamentSelection;
