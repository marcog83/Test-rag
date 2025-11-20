/**
 * Parses TypeDoc comment objects into readable text
 * Handles all comment part types including code, links, inline tags
 */

export function extractCommentParts(parts?: any[]): string {
  if (!parts) return "";
  
  return parts
    .map((part) => {
      if (part.kind === "text") {
        return part.text;
      }
      
      if (part.kind === "code") {
        return `\`${part.text}\``;
      }
      
      if (part.kind === "inline-tag") {
        return parseInlineTag(part);
      }
      
      if (part.kind === "code-span") {
        return `\`${part.text}\``;
      }
      
      return "";
    })
    .join("");
}

function parseInlineTag(tag: any): string {
  switch (tag.tag) {
    case "@link":
    case "@linkcode":
      return `[${tag.text || tag.name}](${tag.target || tag.name})`;
    
    case "@linkplain":
      return tag.text || tag.name;
    
    case "@tutorial":
      return `[Tutorial: ${tag.name}]`;
    
    default:
      return tag.text || tag.name || "";
  }
}

export function extractAuthorTags(comment: any): string[] {
  if (!comment.blockTags) return [];
  
  return comment.blockTags
    .filter((t: any) => t.tag === "@author")
    .map((t: any) => extractCommentParts(t.content));
}

export function extractCodeBlocks(text: string): string[] {
  const regex = /```(?:typescript|ts|javascript|js|tsx|jsx)?\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    blocks.push(match[1].trim());
  }
  
  return blocks;
}

export function isCodeExample(text: string): boolean {
  return /```|function |const |let |var |\{|\}|\(\)|=>|async|await|import|export/.test(text);
}

export function detectLanguage(text: string): string {
  if (
    text.includes("async") ||
    text.includes("=>") ||
    text.includes("function") ||
    text.includes("interface") ||
    text.includes("type") ||
    text.includes("class")
  ) {
    return "typescript";
  }
  
  if (text.includes("<!--")) {
    return "html";
  }
  
  if (text.includes("@")) {
    return "typescript";
  }
  
  return "text";
}
