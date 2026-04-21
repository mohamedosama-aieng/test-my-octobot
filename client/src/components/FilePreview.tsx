import { motion } from "framer-motion";
import { FileText, Download, File, FileSpreadsheet, FileArchive, FileCode, FileVideo, FileAudio } from "lucide-react";

type ChatTheme = "dark" | "light";

/** File type definitions with icon and color */
const FILE_TYPES: Record<string, { icon: typeof FileText; label: string; color: string; darkColor: string }> = {
  pdf: { icon: FileText, label: "PDF", color: "text-red-600 bg-red-50 border-red-200", darkColor: "text-red-400 bg-red-500/10 border-red-500/20" },
  doc: { icon: FileText, label: "Word", color: "text-blue-600 bg-blue-50 border-blue-200", darkColor: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  docx: { icon: FileText, label: "Word", color: "text-blue-600 bg-blue-50 border-blue-200", darkColor: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  xls: { icon: FileSpreadsheet, label: "Excel", color: "text-green-600 bg-green-50 border-green-200", darkColor: "text-green-400 bg-green-500/10 border-green-500/20" },
  xlsx: { icon: FileSpreadsheet, label: "Excel", color: "text-green-600 bg-green-50 border-green-200", darkColor: "text-green-400 bg-green-500/10 border-green-500/20" },
  csv: { icon: FileSpreadsheet, label: "CSV", color: "text-green-600 bg-green-50 border-green-200", darkColor: "text-green-400 bg-green-500/10 border-green-500/20" },
  ppt: { icon: FileText, label: "PowerPoint", color: "text-orange-600 bg-orange-50 border-orange-200", darkColor: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  pptx: { icon: FileText, label: "PowerPoint", color: "text-orange-600 bg-orange-50 border-orange-200", darkColor: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  zip: { icon: FileArchive, label: "ZIP", color: "text-amber-600 bg-amber-50 border-amber-200", darkColor: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  rar: { icon: FileArchive, label: "RAR", color: "text-amber-600 bg-amber-50 border-amber-200", darkColor: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  "7z": { icon: FileArchive, label: "7Z", color: "text-amber-600 bg-amber-50 border-amber-200", darkColor: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  txt: { icon: FileCode, label: "Text", color: "text-gray-600 bg-gray-50 border-gray-200", darkColor: "text-gray-400 bg-white/5 border-white/10" },
  json: { icon: FileCode, label: "JSON", color: "text-yellow-600 bg-yellow-50 border-yellow-200", darkColor: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  xml: { icon: FileCode, label: "XML", color: "text-purple-600 bg-purple-50 border-purple-200", darkColor: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  mp4: { icon: FileVideo, label: "Video", color: "text-pink-600 bg-pink-50 border-pink-200", darkColor: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  avi: { icon: FileVideo, label: "Video", color: "text-pink-600 bg-pink-50 border-pink-200", darkColor: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  mov: { icon: FileVideo, label: "Video", color: "text-pink-600 bg-pink-50 border-pink-200", darkColor: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  mp3: { icon: FileAudio, label: "Audio", color: "text-violet-600 bg-violet-50 border-violet-200", darkColor: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  wav: { icon: FileAudio, label: "Audio", color: "text-violet-600 bg-violet-50 border-violet-200", darkColor: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
};

const DEFAULT_FILE_TYPE = { icon: File, label: "ملف", color: "text-gray-600 bg-gray-50 border-gray-200", darkColor: "text-gray-400 bg-white/5 border-white/10" };

/** Extract filename from URL */
function getFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/");
    const filename = parts[parts.length - 1];
    return decodeURIComponent(filename) || "ملف";
  } catch {
    // Fallback: try to get last segment
    const parts = url.split("/");
    const last = parts[parts.length - 1]?.split("?")[0];
    return decodeURIComponent(last) || "ملف";
  }
}

/** Extract file extension from URL */
function getExtension(url: string): string {
  const filename = getFilenameFromUrl(url);
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return ext;
}

/** Check if a URL is a Google Drive file link */
function isGoogleDriveUrl(url: string): boolean {
  return /drive\.google\.com/i.test(url);
}

/** Get Google Drive direct download link */
function getGoogleDriveDownloadUrl(url: string): string {
  const match = url.match(/\/file\/d\/([^/\s]+)\//);
  if (match) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
}

/** Single file preview card — compact design for chat bubbles */
export function FilePreviewCard({ url, theme = "dark" }: { url: string; theme?: ChatTheme }) {
  const isDark = theme === "dark";
  const ext = getExtension(url);
  const fileType = FILE_TYPES[ext] || DEFAULT_FILE_TYPE;
  const Icon = fileType.icon;
  const filename = getFilenameFromUrl(url);
  const isGDrive = isGoogleDriveUrl(url);
  const downloadUrl = isGDrive ? getGoogleDriveDownloadUrl(url) : url;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 my-1.5 max-w-[280px] cursor-pointer no-underline transition-all duration-200 ${isDark
        ? `${fileType.darkColor} hover:bg-white/[0.06]`
        : `${fileType.color} hover:brightness-95`
        }`}
    >
      {/* Icon */}
      <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${isDark ? "bg-white/[0.08]" : "bg-white/90"}`}>
        <Icon className="h-4 w-4" />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate leading-tight ${isDark ? "text-white/90" : "text-gray-900"}`}>
          {filename}
        </p>
        <p className={`text-[10px] leading-tight mt-0.5 ${isDark ? "text-white/35" : "text-gray-400"}`}>
          {fileType.label}{isGDrive ? " • Drive" : ""}
        </p>
      </div>

      {/* Download button */}
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        download
        onClick={(e) => e.stopPropagation()}
        className={`p-1.5 rounded-md shrink-0 transition-all duration-200 ${isDark
          ? "hover:bg-white/[0.1] text-white/40 hover:text-white/70"
          : "hover:bg-black/5 text-gray-400 hover:text-gray-600"
          }`}
        title="تحميل"
      >
        <Download className="h-3.5 w-3.5" />
      </a>
    </motion.a>
  );
}

// ============ SUPPORTED FILE EXTENSIONS (non-image, non-voice) ============
const FILE_EXTENSIONS = "pdf|doc|docx|xls|xlsx|csv|ppt|pptx|zip|rar|7z|txt|json|xml|mp4|avi|mov|mp3|wav";

/** Regex to match file URLs (non-image files) */
export const FILE_URL_REGEX = new RegExp(
  `(https?:\\/\\/[^\\s<)"]+\\.(?:${FILE_EXTENSIONS}))(?:\\?[^\\s<)"]*)?`,
  "gi"
);

/** Regex to also match Google Drive file links that may not have file extension */
export const GOOGLE_DRIVE_FILE_REGEX = /https?:\/\/drive\.google\.com\/file\/d\/[^\s/]+\/(?:view|preview)(?:\?[^\s]*)?/gi;

/**
 * Parse message content and extract file URLs.
 * Returns ordered segments of text and file.
 */
export function parseFileContent(text: string): Array<{ type: "text" | "file"; content: string }> {
  const segments: Array<{ type: "text" | "file"; content: string }> = [];

  // Combine file extension URLs and Google Drive links
  const allMatches: Array<{ index: number; end: number; url: string }> = [];

  // Find file extension URLs
  const fileRegex = new RegExp(FILE_URL_REGEX.source, "gi");
  let match: RegExpExecArray | null;
  while ((match = fileRegex.exec(text)) !== null) {
    allMatches.push({ index: match.index, end: match.index + match[0].length, url: match[0] });
  }

  // Sort by position
  allMatches.sort((a, b) => a.index - b.index);

  // Remove overlapping matches
  const uniqueMatches: typeof allMatches = [];
  for (const m of allMatches) {
    const last = uniqueMatches[uniqueMatches.length - 1];
    if (!last || m.index >= last.end) {
      uniqueMatches.push(m);
    }
  }

  if (uniqueMatches.length === 0) {
    return [{ type: "text", content: text }];
  }

  let lastIndex = 0;
  for (const m of uniqueMatches) {
    const before = text.slice(lastIndex, m.index).trim();
    if (before) segments.push({ type: "text", content: before });
    segments.push({ type: "file", content: m.url });
    lastIndex = m.end;
  }

  const remaining = text.slice(lastIndex).trim();
  if (remaining) segments.push({ type: "text", content: remaining });

  return segments;
}

/** Check if text contains file URLs */
export function hasFileUrls(text: string): boolean {
  const regex1 = new RegExp(FILE_URL_REGEX.source, "gi");
  return regex1.test(text);
}
