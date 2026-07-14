const allowedTags = new Set([
  "A",
  "B",
  "BLOCKQUOTE",
  "BR",
  "CODE",
  "DIV",
  "EM",
  "H1",
  "H2",
  "H3",
  "H4",
  "HR",
  "I",
  "IMG",
  "LI",
  "OL",
  "P",
  "PRE",
  "S",
  "SPAN",
  "STRONG",
  "TABLE",
  "TBODY",
  "TD",
  "TH",
  "THEAD",
  "TR",
  "U",
  "UL",
]);

const allowedAttributes: Record<string, Set<string>> = {
  A: new Set(["href", "target", "rel", "title"]),
  IMG: new Set(["src", "alt", "title", "width", "height"]),
  TD: new Set(["colspan", "rowspan"]),
  TH: new Set(["colspan", "rowspan"]),
  "*": new Set(["style", "class"]),
};

const allowedStyleProperties = new Set([
  "text-align",
  "margin-left",
  "padding-left",
  "line-height",
]);

const isSafeUrl = (value: string) => {
  const url = value.trim().toLowerCase();
  return url.startsWith("http://")
    || url.startsWith("https://")
    || url.startsWith("mailto:")
    || url.startsWith("tel:")
    || url.startsWith("/")
    || url.startsWith("data:image/");
};

const sanitizeStyle = (style: string) => style
  .split(";")
  .map((rule) => rule.trim())
  .filter(Boolean)
  .map((rule) => {
    const [rawProperty, ...rawValue] = rule.split(":");
    const property = rawProperty?.trim().toLowerCase();
    const value = rawValue.join(":").trim();
    if (!allowedStyleProperties.has(property) || !value) return "";
    if (/url\s*\(|expression\s*\(|javascript:/i.test(value)) return "";
    return `${property}: ${value}`;
  })
  .filter(Boolean)
  .join("; ");

const cleanNode = (node: Node) => {
  if (node.nodeType === Node.COMMENT_NODE) {
    node.parentNode?.removeChild(node);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    Array.from(node.childNodes).forEach(cleanNode);
    return;
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toUpperCase();

  if (!allowedTags.has(tagName)) {
    const parent = element.parentNode;
    if (!parent) return;
    while (element.firstChild) parent.insertBefore(element.firstChild, element);
    parent.removeChild(element);
    return;
  }

  Array.from(element.attributes).forEach((attribute) => {
    const name = attribute.name.toLowerCase();
    const value = attribute.value;
    const tagAllowed = allowedAttributes[tagName]?.has(attribute.name) || allowedAttributes[tagName]?.has(name);
    const globalAllowed = allowedAttributes["*"].has(name);

    if (!tagAllowed && !globalAllowed) {
      element.removeAttribute(attribute.name);
      return;
    }

    if ((name === "href" || name === "src") && !isSafeUrl(value)) {
      element.removeAttribute(attribute.name);
      return;
    }

    if (name === "style") {
      const safeStyle = sanitizeStyle(value);
      if (safeStyle) element.setAttribute("style", safeStyle);
      else element.removeAttribute("style");
    }
  });

  if (tagName === "A") {
    element.setAttribute("rel", "noopener noreferrer");
    if (!element.getAttribute("target")) element.setAttribute("target", "_blank");
  }

  Array.from(element.childNodes).forEach(cleanNode);
};

export const sanitizeHtml = (html?: string) => {
  const input = String(html || "").trim();
  if (!input) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") return input;

  const doc = new DOMParser().parseFromString(input, "text/html");
  Array.from(doc.body.childNodes).forEach(cleanNode);
  return doc.body.innerHTML;
};
