import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import TiptapLink from "@tiptap/extension-link";
import UnderlineExtension from "@tiptap/extension-underline";
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Code2, ImagePlus, Italic, Link,
  List, ListOrdered, Quote, Redo2, RemoveFormatting, Table2, Underline, Undo2,
} from "lucide-react";
import { cn } from "@/libs/utils";

interface Props { value: string; onChange: (value: string) => void; placeholder?: string; className?: string; minHeight?: number; }

interface ToolButtonProps { title: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode; }
const ToolButton = ({ title, active, disabled, onClick, children }: ToolButtonProps) => (
  <button type="button" title={title} disabled={disabled} onClick={onClick} className={cn("rounded p-1.5 transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40", active && "bg-primary text-primary-foreground hover:bg-primary")}>{children}</button>
);

export const RichTextEditor = ({ value, onChange, placeholder, className, minHeight = 140 }: Props) => {
  const [visualMode, setVisualMode] = useState(true);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false, underline: false }),
      TiptapLink.configure({ openOnClick: false, autolink: true }),
      UnderlineExtension,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ allowBase64: true }),
      TableKit.configure({ table: { resizable: true } }),
    ],
    content: value || "",
    immediatelyRender: true,
    editorProps: {
      attributes: {
        class: "min-h-[inherit] px-4 py-3 text-sm leading-6 outline-none",
        "aria-label": placeholder || "Trình soạn thảo nội dung",
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === value) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Nhập URL liên kết", previousUrl || "https://");
    if (url === null) return;
    if (!url.trim()) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const insertImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 3 * 1024 * 1024) {
        window.alert("Ảnh tối đa 3 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => editor.chain().focus().setImage({ src: String(reader.result || "") }).run();
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return <div className={cn("overflow-hidden rounded-lg border border-input bg-background shadow-sm", className)}>
    <div className="flex items-center justify-between border-b border-border bg-muted/60 px-2 py-1.5">
      <button type="button" onClick={() => setVisualMode((current) => !current)} className="rounded border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-primary-light/25">{visualMode ? "Ẩn trình soạn thảo" : "Hiện trình soạn thảo"}</button>
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase text-muted-foreground"><Code2 className="h-3 w-3" />{visualMode ? "Tiptap WYSIWYG" : "HTML"}</span>
    </div>

    {visualMode ? <>
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-2">
        <select aria-label="Định dạng đoạn" className="h-8 rounded border border-input bg-background px-2 text-xs" value={editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : editor.isActive("codeBlock") ? "pre" : "p"} onChange={(event) => { const format = event.target.value; if (format === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run(); else if (format === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run(); else if (format === "pre") editor.chain().focus().toggleCodeBlock().run(); else editor.chain().focus().setParagraph().run(); }}><option value="p">Đoạn văn</option><option value="h2">Tiêu đề 2</option><option value="h3">Tiêu đề 3</option><option value="pre">Mã / văn bản định dạng</option></select>
        <span className="mx-1 h-6 w-px bg-border" />
        <ToolButton title="Hoàn tác" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></ToolButton>
        <ToolButton title="Làm lại" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></ToolButton>
        <ToolButton title="In đậm" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></ToolButton>
        <ToolButton title="In nghiêng" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></ToolButton>
        <ToolButton title="Gạch chân" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline className="h-4 w-4" /></ToolButton>
        <ToolButton title="Căn trái" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-4 w-4" /></ToolButton>
        <ToolButton title="Căn giữa" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-4 w-4" /></ToolButton>
        <ToolButton title="Căn phải" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="h-4 w-4" /></ToolButton>
        <ToolButton title="Danh sách" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></ToolButton>
        <ToolButton title="Danh sách số" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></ToolButton>
        <ToolButton title="Trích dẫn" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></ToolButton>
        <ToolButton title="Chèn liên kết" active={editor.isActive("link")} onClick={setLink}><Link className="h-4 w-4" /></ToolButton>
        <ToolButton title="Chèn bảng" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 className="h-4 w-4" /></ToolButton>
        <ToolButton title="Tải ảnh từ máy" onClick={insertImage}><ImagePlus className="h-4 w-4" /></ToolButton>
        <select aria-label="Ký tự đặc biệt" className="h-8 rounded border border-input bg-background px-2 text-xs" defaultValue="" onChange={(event) => { if (event.target.value) editor.chain().focus().insertContent(event.target.value).run(); event.target.value = ""; }}><option value="">Ký tự</option><option value="©">©</option><option value="®">®</option><option value="™">™</option><option value="±">±</option><option value="×">×</option><option value="→">→</option><option value="🥇">🥇</option><option value="🥈">🥈</option><option value="🥉">🥉</option></select>
        <ToolButton title="Xóa định dạng" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><RemoveFormatting className="h-4 w-4" /></ToolButton>
      </div>
      <div style={{ minHeight }} className="max-h-[360px] overflow-y-auto [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-primary/40 [&_.tiptap_blockquote]:pl-3 [&_.tiptap_img]:max-w-full [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_td]:border [&_.tiptap_td]:border-border [&_.tiptap_td]:p-2 [&_.tiptap_th]:border [&_.tiptap_th]:border-border [&_.tiptap_th]:bg-muted [&_.tiptap_th]:p-2">
        <EditorContent editor={editor} />
      </div>
    </> : <textarea aria-label="Mã HTML" value={value} onChange={(event) => onChange(event.target.value)} style={{ minHeight }} className="w-full resize-y bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-100 outline-none" placeholder="Nhập HTML..." />}
  </div>;
};
