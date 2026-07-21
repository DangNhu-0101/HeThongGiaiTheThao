import { Fragment, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Plus, Trash2, Trophy } from "lucide-react";
import { competitionFormatService } from "@/services/competitionFormatService";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/libs/utils";
import TournamentItemInheritanceFields, { type TournamentInheritancePreview } from "./TournamentItemInheritanceFields";
import TournamentOperationsSection from "./TournamentOperationsSection";
import type { TournamentKind, TournamentRuleRef } from "@/types/orgTournamentMgmt";
import { createEmptyTournamentOperations, createEmptyTournamentRule } from "./tournamentRuleDefaults";

interface Props {
  kind: TournamentKind;
  rules: TournamentRuleRef[];
  inherited: TournamentInheritancePreview;
  onChange: (rules: TournamentRuleRef[]) => void;
}

interface CategoryOption {
  id: string;
  categoryTemplateId?: string;
  name: string;
  displayName?: string;
  sportType: string;
  description?: string;
  playerSlotsPerTeam?: { min?: number; max?: number };
}

const normalizeSport = (value: string) => value.trim().toLowerCase();

const emptyRuleForSport = (sport: string): TournamentRuleRef => ({
  ...createEmptyTournamentRule(sport),
  categoryRuleId: "",
  categoryTemplateId: undefined,
  categoryName: "",
  itemName: "",
});

const RuleRefsSection = ({ kind, rules, inherited, onChange }: Props) => {
  const normalized = rules.length ? rules : [emptyRuleForSport("pickleball")];
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>(["rule-0"]);

  useEffect(() => {
    competitionFormatService
      .getCategoryTemplates()
      .then((items) => {
        const seen = new Set<string>();
        setCategoryOptions(
          items
            .map((item) => ({
              id: item.id,
              categoryTemplateId: item.categoryTemplateId,
              name: item.name,
              displayName: item.displayName,
              sportType: item.sportType,
              description: item.description,
              playerSlotsPerTeam: item.playerSlotsPerTeam,
            }))
            .filter((item) => {
              const key = item.categoryTemplateId || item.id;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            }),
        );
      })
      .catch((error) => console.warn("Không tải được danh sách nội dung thi đấu", error));
  }, []);

  const sportOptions = useMemo(() => {
    const byKey = new Map<string, string>();
    categoryOptions.forEach((item) => {
      const key = normalizeSport(item.sportType);
      if (!byKey.has(key)) byKey.set(key, item.sportType);
    });
    const values = Array.from(byKey.values());
    return values.length ? values : ["pickleball"];
  }, [categoryOptions]);

  const updateRule = (index: number, patch: Partial<TournamentRuleRef>) => {
    onChange(normalized.map((rule, current) => (current === index ? { ...rule, ...patch } : rule)));
  };

  const selectSport = (sport: string) => {
    if (kind === "single") {
      onChange([emptyRuleForSport(sport)]);
      setOpenKeys(["rule-0"]);
      return;
    }
    const exists = normalized.some((rule) => normalizeSport(rule.sport) === normalizeSport(sport));
    if (exists) {
      const next = normalized.filter((rule) => normalizeSport(rule.sport) !== normalizeSport(sport));
      onChange(next.length ? next : [emptyRuleForSport("pickleball")]);
    } else {
      onChange([...normalized, emptyRuleForSport(sport)]);
      setOpenKeys((current) => [...current, `rule-${normalized.length}`]);
    }
  };

  const selectCategory = (index: number, optionId: string) => {
    const ruleSport = normalized[index]?.sport || "pickleball";
    const option = categoryOptions.find((item) => normalizeSport(item.sportType) === normalizeSport(ruleSport) && item.id === optionId);
    if (!option) {
      updateRule(index, { categoryRuleId: "", categoryTemplateId: undefined, categoryName: "", itemName: "" });
      return;
    }
    const contentName = option.displayName || option.name;
    updateRule(index, {
      categoryRuleId: "",
      categoryTemplateId: option.categoryTemplateId,
      categoryName: contentName,
      itemName: normalized[index]?.itemName?.trim() || `${ruleSport} - ${contentName}`,
      itemDescription: normalized[index]?.itemDescription || option.description || "",
    });
  };

  const addContent = (sport: string) => {
    let insertAt = normalized.length;
    normalized.forEach((rule, index) => {
      if (normalizeSport(rule.sport) === normalizeSport(sport)) insertAt = index + 1;
    });
    const next = [...normalized];
    next.splice(insertAt, 0, emptyRuleForSport(sport));
    onChange(next);
    setOpenKeys((current) => [...current, `rule-${insertAt}`]);
  };

  const removeContent = (index: number) => {
    const next = normalized.filter((_, current) => current !== index);
    onChange(next.length ? next : [emptyRuleForSport("pickleball")]);
  };

  const toggleOpen = (key: string) => {
    setOpenKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const selectedSports = new Set(normalized.map((rule) => normalizeSport(rule.sport)));

  return (
    <section className="space-y-5">
      <div>
        <h3 className="font-bold text-foreground">{kind === "single" ? "Môn và nội dung giải đơn" : "Môn và nội dung thi đấu"}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Chọn môn trước, sau đó chọn nội dung thi đấu trong từng ô nội dung: đơn nam, đơn nữ, đôi nam, đôi nữ, đôi nam nữ...
        </p>
      </div>

      <div className="space-y-2">
        <Label>{kind === "single" ? "Chọn 1 môn thi đấu *" : "Chọn môn thi đấu *"}</Label>
        <div className="flex flex-wrap gap-2">
          {sportOptions.map((sport) => {
            const selected = selectedSports.has(normalizeSport(sport));
            return (
              <button
                key={sport}
                type="button"
                onClick={() => (kind === "multi" || !selected) && selectSport(sport)}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-bold transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {selected ? <Check className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
                {sport}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        {normalized.map((rule, index) => {
          const key = `rule-${index}`;
          const open = openKeys.includes(key);
          const firstForSport = normalized.findIndex((item) => normalizeSport(item.sport) === normalizeSport(rule.sport)) === index;
          const sportContentIndex = normalized
            .slice(0, index + 1)
            .filter((item) => normalizeSport(item.sport) === normalizeSport(rule.sport)).length;
          const usedTemplateIds = new Set(
            normalized
              .filter((_, current) => current !== index)
              .map((item) => item.categoryTemplateId)
              .filter(Boolean),
          );
          const options = categoryOptions
            .filter((option) => normalizeSport(option.sportType) === normalizeSport(rule.sport))
            .filter((option) => !usedTemplateIds.has(option.categoryTemplateId));

          return (
            <Fragment key={key}>
              {firstForSport && (
                <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <Label>Nội dung thi đấu của {rule.sport} *</Label>
                    <p className="mt-1 text-xs text-muted-foreground">Môn thứ {Array.from(selectedSports).findIndex((sport) => sport === normalizeSport(rule.sport)) + 1} theo thứ tự đã chọn.</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => addContent(rule.sport)}>
                    <Plus className="mr-1 h-4 w-4" /> Thêm nội dung
                  </Button>
                </div>
              )}
            <Collapsible open={open} onOpenChange={() => toggleOpen(key)} className="overflow-hidden rounded-lg border border-border">
              <div className="flex items-center bg-muted/25">
              <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 font-black text-primary">{sportContentIndex}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{rule.itemName || `${rule.sport} - nội dung ${sportContentIndex}`}</p>
                  <p className="truncate text-xs text-muted-foreground">{rule.categoryName || "Chưa chọn nội dung thi đấu"}</p>
                </div>
                {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </CollapsibleTrigger>
                {normalized.length > 1 && (
                  <button
                    type="button"
                    className="mr-2 rounded-md p-2 text-red-600 hover:bg-red-50"
                    onClick={() => removeContent(index)}
                    aria-label="Xóa nội dung"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <CollapsibleContent>
                <div className="space-y-5 border-t border-border p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tên giải {kind === "single" ? "" : "thành phần"} *</Label>
                      <Input required value={rule.itemName || ""} onChange={(event) => updateRule(index, { itemName: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Nội dung thi đấu *</Label>
                      <select
                        required
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={rule.categoryTemplateId ? `template:${rule.categoryTemplateId}` : ""}
                        onChange={(event) => selectCategory(index, event.target.value)}
                      >
                        <option value="">Chọn nội dung thi đấu...</option>
                        {options.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.displayName || option.name}
                          </option>
                        ))}
                      </select>
                      {options.length === 0 && !rule.categoryTemplateId && (
                        <p className="text-xs text-amber-700">Chưa tải được nội dung thi đấu thật từ backend. Kiểm tra API /rules/categories hoặc thử tải lại trang.</p>
                      )}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Mô tả riêng</Label>
                      <Input value={rule.itemDescription || ""} onChange={(event) => updateRule(index, { itemDescription: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Số đội tối đa</Label>
                      <Input type="number" min={2} value={rule.maxTeams || 0} onChange={(event) => updateRule(index, { maxTeams: Number(event.target.value) })} />
                    </div>
                  </div>

                  <TournamentItemInheritanceFields rule={rule} inherited={inherited} onChange={(patch) => updateRule(index, patch)} />

                  <Collapsible className="overflow-hidden rounded-lg border border-border">
                    <CollapsibleTrigger className="flex w-full items-center justify-between bg-muted/20 px-4 py-3 text-left">
                      <span>
                        <span className="block text-sm font-bold">Vận hành mở rộng riêng của nội dung</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">Đăng ký, thanh toán, QR, gala và tài trợ lưu theo TournamentItem.</span>
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-border p-4">
                        <TournamentOperationsSection
                          value={rule.operations || createEmptyTournamentOperations()}
                          onChange={(operations) => updateRule(index, { operations })}
                          feePerAthlete={rule.feePerAthlete || 0}
                          onFeePerAthleteChange={(feePerAthlete) => updateRule(index, { feePerAthlete })}
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CollapsibleContent>
            </Collapsible>
            </Fragment>
          );
        })}
      </div>
    </section>
  );
};

export default RuleRefsSection;
