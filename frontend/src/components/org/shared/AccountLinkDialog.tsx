import { useEffect, useState } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { accountLinkService, type AccountSearchResult } from "@/services/accountLinkService";

interface Props {
  open: boolean;
  title: string;
  role?: "player" | "referee";
  onClose: () => void;
  onSelect: (account: AccountSearchResult) => Promise<void>;
}

const AccountLinkDialog = ({ open, title, role, onClose, onSelect }: Props) => {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<AccountSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setKeyword("");
        setResults([]);
        setLoading(false);
        setSavingId("");
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const term = keyword.trim();
    if (term.length < 2) {
      queueMicrotask(() => setResults([]));
      return;
    }
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await accountLinkService.searchAccounts(term, role));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [keyword, open, role]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-primary">Liên kết tài khoản</p>
            <h3 className="font-bold text-foreground">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Đóng hộp thoại"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Nhập tên, email hoặc username..."
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </div>

          <div className="beautiful-scrollbar max-h-80 space-y-2 overflow-y-auto">
            {keyword.trim().length < 2 && (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-xs font-bold text-muted-foreground">
                Nhập từ khóa để tìm tài khoản. Danh sách sẽ không được tải sẵn.
              </div>
            )}
            {keyword.trim().length >= 2 && loading && (
              <div className="rounded-lg border border-border bg-muted/30 p-6 text-center text-xs font-bold text-muted-foreground">
                Đang tìm...
              </div>
            )}
            {keyword.trim().length >= 2 && !loading && results.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-xs font-bold text-muted-foreground">
                Không có tài khoản phù hợp
              </div>
            )}
            {results.map((account) => (
              <button
                key={account.id}
                type="button"
                disabled={Boolean(savingId)}
                onClick={async () => {
                  setSavingId(account.id);
                  try {
                    await onSelect(account);
                  } finally {
                    setSavingId("");
                  }
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {account.username.trim().slice(0, 1).toUpperCase() || "U"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground">{account.username}</span>
                  <span className="block truncate text-xs font-semibold text-muted-foreground">
                    {account.email || account.phoneNumber || "Chưa có liên hệ"}
                  </span>
                </span>
                <span className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">
                  <UserPlus className="h-3 w-3" /> {savingId === account.id ? "Đang liên kết" : "Chọn"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border p-4">
          <Button type="button" variant="outline" onClick={onClose} className="w-full">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountLinkDialog;
