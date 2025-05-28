import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import ReactPlayer from "react-player";
import Editor from "@monaco-editor/react";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { FileItem } from "@/pages/dashboard";

interface FileViewerProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FileViewerDialog({ file, isOpen, onClose }: FileViewerProps) {
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [viewerType, setViewerType] = useState<string>("");

  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const getFileType = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();
    return extension || "";
  };

  const getMonacoLanguage = (filename: string) => {
    const extension = getFileType(filename);
    const languageMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      json: "json",
      html: "html",
      css: "css",
      scss: "scss",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      xml: "xml",
      yaml: "yaml",
      yml: "yaml",
      md: "markdown",
      sql: "sql",
      txt: "plaintext",
      log: "plaintext",
    };
    return languageMap[extension] || "plaintext";
  };

  const determineViewerType = (filename: string) => {
    const extension = getFileType(filename);

    if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension)) {
      return "image";
    }

    if (["mp4", "webm", "ogg", "mp3", "wav", "m4a"].includes(extension)) {
      return "media";
    }

    if (extension === "pdf") {
      return "pdf";
    }

    if ([
      "js", "jsx", "ts", "tsx", "json", "html", "css", "scss",
      "py", "java", "cpp", "c", "xml", "yaml", "yml", "md",
      "sql", "txt", "log", "csv"
    ].includes(extension)) {
      return "code";
    }

    return "unsupported";
  };

  useEffect(() => {
    if (!file || !isOpen) {
      setFileUrl("");
      setFileContent("");
      setError("");
      setViewerType("");
      return;
    }

    const type = determineViewerType(file.name);
    setViewerType(type);

    if (type === "unsupported") {
      setError("Something went wrong. Verify your file format.");
      return;
    }

    const fetchFile = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/files/view/${file.name}?path=${encodeURIComponent(file.path || "")}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch file");
        }

        if (type === "code") {
          const text = await response.text();
          setFileContent(text);
        } else {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setFileUrl(url);
        }
      } catch (err) {
        setError("Error loading file");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFile();

    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [file, isOpen]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-red-500 space-y-2">
          <p>{error}</p>
        </div>
      );
    }

    if (!file) return null;

    switch (viewerType) {
      case "image":
        return (
          <div className="flex justify-center p-4">
            <img
              src={fileUrl}
              alt={file.name}
              className="max-w-full max-h-[70vh] object-contain rounded-md"
            />
          </div>
        );

      case "media":
        return (
          <div className="flex justify-center p-4">
            <ReactPlayer
              url={fileUrl}
              controls
              width="100%"
              height="auto"
              style={{ maxHeight: "70vh" }}
            />
          </div>
        );

      case "pdf":
        return (
          <div className="h-[70vh]">
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer fileUrl={fileUrl} plugins={[defaultLayoutPluginInstance]} />
            </Worker>
          </div>
        );

      case "code":
        return (
          <div className="h-[70vh] border rounded-md">
            <Editor
              height="100%"
              language={getMonacoLanguage(file.name)}
              value={fileContent}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: "on",
              }}
              theme="vs-dark"
            />
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-2">
            <p>Preview not available for this file type</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {file?.name || "File Viewer"}
          </DialogTitle>
          {viewerType && viewerType !== "unsupported" && (
            <p className="text-sm text-muted-foreground capitalize">
              {viewerType} viewer
            </p>
          )}
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
