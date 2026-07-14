import { cn } from "@/libs/utils";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

interface RichTextRendererProps {
  html?: string;
  className?: string;
  emptyText?: string;
}

const stripTags = (value: string) => value.replace(/<[^>]*>/g, "").trim();

const normalizeHtml = (value?: string) => {
  const html = String(value || "").trim();
  if (!html) return "";
  return html;
};

export const RichTextRenderer = ({ html, className, emptyText = "Chưa có nội dung." }: RichTextRendererProps) => {
  const content = sanitizeHtml(normalizeHtml(html));
  if (!content || !stripTags(content)) {
    return <p className={cn("text-sm leading-7 text-muted-foreground", className)}>{emptyText}</p>;
  }

  return (
    <div
      className={cn("rich-text-content", className)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
