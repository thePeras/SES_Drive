import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Share2, Trash2 } from 'lucide-react';
import { FileItem } from '@/pages/dashboard';

interface FileTableProps {
  files: FileItem[];
}

export function FileTable({ files }: FileTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file._id}>
              <TableCell className="font-medium">{file.name}</TableCell>
              <TableCell>
                <Button size="icon" variant="ghost">
                  <Download className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="destructive">
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