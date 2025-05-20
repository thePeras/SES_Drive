import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Folder, Share2, Trash2 } from 'lucide-react';
import { FileItem } from '@/pages/dashboard';

interface FileTableProps {
  files: FileItem[];
  onShare: (fileId: string) => void;
  onDelete: (fileId: string) => void;
}

export function FileTable({ files, onShare, onDelete }: FileTableProps) {
  return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
                <TableRow key={file._id}>
                  <TableCell className="font-medium flex flex-row items-center gap-2">
                    {file.type === 'directory' && <Folder className="w-4 h-4" />}
                    {file.name}
                  </TableCell>
                  <TableCell>
                    {file.owner}
                  </TableCell>
                  <TableCell>
                    {file.permission === 'owner' && <span className="accent-green-700 font-semibold">Owner</span>}
                    {file.permission === 'write' && <span className="text-blue-700">Write</span>}
                    {file.permission === 'read' && <span className="text-gray-600">Read</span>}
                    {!file.permission && <span className="text-gray-400">-</span>}
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onShare(file._id)}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => onDelete(file._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
  )
}

