import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Eye,
  Folder,
  Share2,
  Trash2,
  ChevronDown,
  User,
} from "lucide-react";
import { FileItem } from "@/pages/dashboard";

interface FileTableProps {
  files: FileItem[];
  onViewFile?: (file: FileItem) => void;
  onEnterDirectory?: (file: FileItem) => void;
  onShareFile?: (file: FileItem) => void;
  isSharedView?: boolean;
  onDeleteFile?: (file: FileItem) => void;
}

export function FileTable({
  files,
  onViewFile,
  onEnterDirectory,
  onShareFile,
  isSharedView = false,
  onDeleteFile,
}: FileTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            {isSharedView && <TableHead>Shared From</TableHead>}
            {isSharedView && <TableHead>Permission</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={isSharedView ? 4 : 2}
                className="text-center text-muted-foreground py-8"
              >
                {isSharedView
                  ? "No files have been shared with you yet."
                  : "No files found."}
              </TableCell>
            </TableRow>
          ) : (
            files.map((file, index) => (
              <TableRow key={`${file.name}-${index}`}>
                <TableCell className="font-medium flex flex-row items-center gap-2">
                  {file.type === "directory" && <Folder className="w-4 h-4" />}
                  {file.shared && <User className="w-4 h-4 text-blue-500" />}
                  {file.name}
                </TableCell>
                {isSharedView && (
                  <TableCell className="text-sm text-muted-foreground">
                    {file.sharedFrom || file.owner}
                  </TableCell>
                )}
                {isSharedView && (
                  <TableCell className="text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        file.permission === "read-write"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {file.permission === "read-write"
                        ? "Read/Write"
                        : "Read Only"}
                    </span>
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {file.type !== "directory" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewFile?.(file)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    ) : (
                      !isSharedView && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEnterDirectory?.(file)}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      )
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8 p-0">
                      <Download className="w-4 h-4" />
                    </Button>
                    {onShareFile && !isSharedView && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => onShareFile(file)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    )}
                    {!isSharedView && (
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        onClick={() => onDeleteFile(file)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
