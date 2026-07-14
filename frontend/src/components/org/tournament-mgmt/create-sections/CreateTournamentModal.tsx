import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Layers3,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/libs/utils";
import BasicInfoSection, { type BasicInfoState } from "./BasicInfoSection";
import TimelineContactSection, { type TimeLineState } from "./TimelineContactSection";
import TournamentTypeSelector from "./TournamentTypeSelector";
import type { TournamentOperationsState } from "./TournamentOperationsSection";
import RuleRefsSection from "./RuleRefsSection";
import { createEmptyTournamentRule } from "./tournamentRuleDefaults";
import { useOrgTournamentMgmtStore } from "@/stores/useOrgTournamentMgmtStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { getApiErrorMessage } from "@/libs/axios";
import type {
  TournamentKind,
  TournamentRecord,
  TournamentRuleRef,
  TournamentUpsertPayload,
} from "@/types/orgTournamentMgmt";

interface Props {
  mode?: "create" | "edit";
  record?: TournamentRecord;
  onSuccess?: () => void;
  children: React.ReactNode;
}

interface SectionCardProps {
  icon: typeof Trophy;
  title: string;
  description: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const SectionCard = ({
  icon: Icon,
  title,
  description,
  badge,
  defaultOpen = false,
  children,
}: SectionCardProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3.5 text-left md:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-black text-foreground">{title}</span>
            {badge && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                {badge}
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{description}</span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border px-4 py-5 md:px-5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const emptyBasicInfo: BasicInfoState = {
  name: "",
  slogan: "",
  purpose: "",
  targetParticipants: "",
  location: "",
  description: "",
  prizes: "",
  organizer: "",
};

const emptyTimeline: TimeLineState = {
  registrationStart: "",
  registrationEnd: "",
  tournamentStart: "",
  tournamentEnd: "",
};

const emptyOperations: TournamentOperationsState = {
  registrationMode: "system",
  registrationFormUrl: "",
  zaloGroupUrl: "",
  maxRegistrations: 0,
  registrationInstructions: "",
  supportContacts: "",
  feeIncludes: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  transferContent: "",
  paymentInstructions: "",
  refundPolicy: "",
  mediaConsent: false,
  mediaUsageTerms: "",
  logo: "",
  banner: [],
  paymentQR: "",
  hasGala: false,
  galaStart: "",
  galaEnd: "",
  galaVenue: "",
  galaDescription: "",
  sponsorContact: "",
  sponsorTiers: [],
};

const dateTimeLocalValue = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  if (offsetDays === 0) date.setHours(date.getHours() + 1);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const CreateTournamentModal = ({ mode = "create", record, onSuccess, children }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedKind, setSelectedKind] = useState<TournamentKind | null>(record?.kind ?? null);
  const [formData, setFormData] = useState<BasicInfoState>(emptyBasicInfo);
  const [contactPerson, setContactPerson] = useState({ name: "", phone: "" });
  const [timeLine, setTimeLine] = useState<TimeLineState>(emptyTimeline);
  const [operations, setOperations] = useState<TournamentOperationsState>(emptyOperations);
  const [ruleRefs, setRuleRefs] = useState<TournamentRuleRef[]>([createEmptyTournamentRule()]);
  const { createTournament, updateTournament, saving } = useOrgTournamentMgmtStore();
  const currentUser = useAuthStore((state) => state.user);
  const organizerName = currentUser?.username || "Tổ chức hiện tại";

  const isEditing = mode === "edit" && Boolean(record);
  const showTypeStep = mode === "create" && !selectedKind;
  const isMulti = selectedKind === "multi";

  const initializeForm = () => {
    const defaultTimeline = {
      registrationStart: dateTimeLocalValue(),
      registrationEnd: dateTimeLocalValue(7),
      tournamentStart: dateTimeLocalValue(14),
      tournamentEnd: dateTimeLocalValue(16),
    };
    if (record) {
      setSelectedKind(record.kind);
      setFormData({
        ...emptyBasicInfo,
        name: record.name,
        description: record.format,
        organizer: organizerName,
      });
      setTimeLine(defaultTimeline);
      setRuleRefs([createEmptyTournamentRule()]);
      return;
    }
    setSelectedKind(null);
    setFormData({ ...emptyBasicInfo, organizer: organizerName });
    setTimeLine(defaultTimeline);
    setOperations(emptyOperations);
    setContactPerson({ name: "", phone: "" });
    setRuleRefs([createEmptyTournamentRule()]);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) initializeForm();
    setIsOpen(nextOpen);
  };

  const title = useMemo(() => {
    if (isEditing) return `Sửa ${record?.kind === "multi" ? "hội thao" : "giải đấu"}`;
    if (showTypeStep) return "Chọn loại giải cần tạo";
    return selectedKind === "multi" ? "Khởi tạo hội thao" : "Khởi tạo giải đấu một môn";
  }, [isEditing, record?.kind, selectedKind, showTypeStep]);

  const handleKindChange = (kind: TournamentKind) => {
    setSelectedKind(kind);
    setRuleRefs([createEmptyTournamentRule()]);
  };

  const normalizedRules = () =>
    ruleRefs.map((rule) => ({
      ...rule,
      registrationStart: rule.registrationStart || timeLine.registrationStart,
      registrationEnd: rule.registrationEnd || timeLine.registrationEnd,
      tournamentStart: rule.tournamentStart || timeLine.tournamentStart,
      tournamentEnd: rule.tournamentEnd || timeLine.tournamentEnd,
      inheritTimeline: false,
      inheritLocation: false,
      inheritMedia: false,
      inheritPrizes: false,
    }));

  const toPayload = (): TournamentUpsertPayload => {
    const rules = normalizedRules();
    const firstRule = rules[0];
    const itemOperations = firstRule?.operations || operations;
    return {
      kind: selectedKind ?? "single",
      name: isMulti ? formData.name : firstRule?.itemName || "",
      description: isMulti ? formData.description : firstRule?.itemDescription,
      prizes: isMulti ? undefined : firstRule?.prizes,
      format: isMulti
        ? `Hội thao ${rules.length} môn`
        : firstRule?.categoryName || "Nội dung thi đấu",
      sportType: firstRule?.sport || "",
      categoryRuleId: !isMulti ? firstRule?.categoryRuleId : undefined,
      categoryRuleIds: rules.map((rule) => rule.categoryRuleId).filter(Boolean),
      sportRules: rules,
      registrationStart: isMulti ? timeLine.registrationStart : firstRule?.registrationStart || "",
      registrationEnd: isMulti ? timeLine.registrationEnd : firstRule?.registrationEnd || "",
      tournamentStart: isMulti ? timeLine.tournamentStart : firstRule?.tournamentStart || "",
      tournamentEnd: isMulti ? timeLine.tournamentEnd : firstRule?.tournamentEnd || "",
      location: { detail: isMulti ? formData.location : firstRule?.location || "" },
      maxTeams: firstRule?.maxTeams || 0,
      overview: { organizerName },
      registrationConfig: isMulti
        ? undefined
        : {
            mode: itemOperations.registrationMode,
            formUrl: itemOperations.registrationMode === "external" ? itemOperations.registrationFormUrl : "",
            zaloGroupUrl: itemOperations.registrationMode === "external" ? itemOperations.zaloGroupUrl : "",
            maxRegistrations: itemOperations.maxRegistrations,
            instructions: itemOperations.registrationMode === "external" ? itemOperations.registrationInstructions : "",
            supportContacts: itemOperations.registrationMode === "external" ? itemOperations.supportContacts : "",
          },
      paymentConfig: isMulti
        ? undefined
        : {
            feeIncludes: itemOperations.feeIncludes.split(",").map((item) => item.trim()).filter(Boolean),
            bankName: itemOperations.bankName,
            accountName: itemOperations.accountName,
            accountNumber: itemOperations.accountNumber,
            transferContent: itemOperations.transferContent,
            instructions: itemOperations.paymentInstructions,
            refundPolicy: itemOperations.refundPolicy,
          },
      sponsorshipConfig: isMulti
        ? undefined
        : { contact: itemOperations.sponsorContact, tiers: itemOperations.sponsorTiers },
      mediaConfig: {
        consent: isMulti ? false : itemOperations.mediaConsent,
        usageTerms: isMulti ? "" : itemOperations.mediaUsageTerms,
        logoUrl: isMulti ? operations.logo : firstRule?.itemLogo || firstRule?.operations?.logo || "",
        bannerUrls: isMulti ? operations.banner : firstRule?.itemBanners || firstRule?.operations?.banner || [],
        paymentQRUrl: isMulti ? "" : firstRule?.operations?.paymentQR || "",
      },
      galaConfig: isMulti
        ? undefined
        : {
            hasGala: itemOperations.hasGala,
            start: itemOperations.galaStart,
            end: itemOperations.galaEnd,
            venue: itemOperations.galaVenue,
            description: itemOperations.galaDescription,
          },
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedKind) return;

    const rules = normalizedRules();
    const invalidRule = rules.find(
      (rule) =>
        !rule.sport.trim() ||
        !rule.itemName?.trim() ||
        !rule.categoryName?.trim() ||
        (!rule.categoryRuleId.trim() && !rule.categoryTemplateId?.trim()) ||
        !rule.registrationStart ||
        !rule.registrationEnd ||
        !rule.tournamentStart ||
        !rule.tournamentEnd
    );
    if (invalidRule) {
      toast.error("Hãy mở từng môn và nhập đủ nội dung thi đấu cùng lịch thi đấu riêng.");
      return;
    }
    const missingExternalLink = rules.some(
      (rule) =>
        rule.operations?.registrationMode === "external" &&
        !rule.operations.registrationFormUrl.trim(),
    );
    if (missingExternalLink) {
      toast.error("Môn dùng link đăng ký riêng cần nhập link form đăng ký.");
      return;
    }

    try {
      const payload = toPayload();
      if (isEditing && record) {
        await updateTournament(record.id, payload);
        toast.success("Đã cập nhật giải đấu.");
      } else {
        await createTournament(payload);
        toast.success(isMulti ? "Đã tạo hội thao và các môn thi đấu." : "Đã tạo giải đấu.");
      }
      onSuccess?.();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Lỗi khi lưu giải đấu. Vui lòng thử lại."));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="flex h-[94vh] w-[min(1180px,96vw)] max-w-[96vw] flex-col gap-0 overflow-hidden bg-muted/20 p-0 outline-none sm:max-w-[96vw]">
        <DialogHeader className="shrink-0 border-b border-border bg-card px-5 py-4 md:px-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-black">
            <Trophy className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {showTypeStep ? (
          <div className="flex-1 p-5 md:p-8">
            <div className="mx-auto max-w-3xl">
              <p className="mb-5 text-sm text-muted-foreground">
                Hội thao gồm nhìều TournamentItem; giải một môn là một TournamentItem độc lập.
              </p>
              <TournamentTypeSelector value={selectedKind} onChange={handleKindChange} />
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full min-h-0 flex-1">
            <form
              id="tour-form"
              onSubmit={handleSubmit}
              className="mx-auto grid max-w-6xl gap-5 p-4 pb-8 "
            >
              

              <div className="min-w-0 space-y-3">
                {isMulti && <SectionCard
                  icon={CalendarDays}
                  title={isMulti ? "Thông tin chung hội thao" : "Thông tin cơ bản"}
                  description={isMulti ? "Đúng phạm vi Tournament schema" : "Tên, hình ảnh và thời gian"}
                  badge="Bắt buộc"
                  defaultOpen
                >
                  <div className="space-y-6">
                    <BasicInfoSection
                      kind={selectedKind ?? "single"}
                      organizerName={organizerName}
                      formData={formData}
                      handleTextChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          [event.target.name]: event.target.value,
                        }))
                      }
                    />
                    {isMulti && (
                      <TimelineContactSection
                        commonOnly
                        contactPerson={contactPerson}
                        handleContactChange={(event) =>
                          setContactPerson((current) => ({
                            ...current,
                            [event.target.name]: event.target.value,
                          }))
                        }
                        timeLine={timeLine}
                        handleTimeChange={(event) =>
                          setTimeLine((current) => ({
                            ...current,
                            [event.target.name]: event.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                </SectionCard>}

                <SectionCard
                  icon={Layers3}
                  title={isMulti ? "Môn thi đấu và giải thành phần" : "Cấu hình giải đấu một môn"}
                  description={
                    isMulti
                      ? `${ruleRefs.length} môn đã chọn · mỗi môn có dữ liệu riêng`
                      : "Nội dung thi đấu, lịch và vận hành giải"
                  }
                  badge={isMulti ? `${ruleRefs.length} môn` : "1 môn"}
                  defaultOpen
                >
                  <RuleRefsSection
                    kind={selectedKind ?? "single"}
                    rules={ruleRefs}
                    inherited={{
                      location: formData.location,
                      prizes: "",
                      registrationStart: "",
                      registrationEnd: "",
                      tournamentStart: timeLine.tournamentStart,
                      tournamentEnd: timeLine.tournamentEnd,
                    }}
                    onChange={setRuleRefs}
                  />
                </SectionCard>

              </div>
            </form>
          </ScrollArea>
        )}

        <DialogFooter className="flex shrink-0 justify-between gap-3 border-t border-border bg-card px-5 py-3.5 md:px-6">
          <div>
            {!showTypeStep && mode === "create" && (
              <Button type="button" variant="ghost" onClick={() => setSelectedKind(null)}>
                Đổi loại giải
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Hủy
            </Button>
            {!showTypeStep && (
              <Button
                type="submit"
                form="tour-form"
                disabled={saving}
                className="min-w-[140px] font-bold"
              >
                {saving ? "Đang lưu..." : isEditing ? "Cập nhật" : isMulti ? "Lưu hội thao" : "Lưu giải đấu"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTournamentModal;
