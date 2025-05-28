import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Eye, Folder, Share2, Trash2, ChevronDown } from 'lucide-react';
import { FileItem } from '@/pages/dashboard';

interface FileTableProps {
  files: FileItem[];
  onViewFile?: (file: FileItem) => void;
  onEnterDirectory?: (file: FileItem) => void;
}

export function FileTable({ files, onViewFile, onEnterDirectory }: FileTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.name}>
              <TableCell className="font-medium flex flex-row items-center gap-2">
                {file.type === 'directory' && <Folder className="w-4 h-4" />}
                {file.name}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {file.type !== 'directory' ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewFile?.(file)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEnterDirectory?.(file)}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8 p-0">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 p-0">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8 p-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}