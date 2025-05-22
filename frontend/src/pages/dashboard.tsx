import ModeToggle from "@/components/mode-toggle";
import { Label } from "@/components/ui/label";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { FileTable } from "@/components/file-table";
import { Button } from "@/components/ui/button";
import { Folder, Upload } from "lucide-react";
import { useRef, useState, ChangeEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Terminal } from "@/components/terminal";

export type FileItem = {
  name: string;
  type: string;
  owner: string;
  permission?: 'owner' | 'write' | 'read' | null;
};

export default function DashboardPage() {
  const generalFileRef = useRef<HTMLInputElement>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState('');
  const [directoryName, setDirectoryName] = useState('');
  const [shareIdentifier, setShareIdentifier] = useState('');
  const [sharePermission, setSharePermission] = useState<'read' | 'write'>('read');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const fetchFiles = () => {
    fetch('/api/files', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
        .then((res) => res.json())
        .then((data) => setFiles(data))
        .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const uploadFile = async () => {
    const input = generalFileRef.current;
    if (!input?.files?.length) return;

    const formData = new FormData();
    formData.append("file", input.files[0]);

    const res = await fetch("/api/files/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    await res.json();
    fetchFiles();
  };

  const uploadProfileFile = async () => {
    const input = profileFileRef.current;
    if (!input?.files?.length) return;

    const formData = new FormData();
    formData.append("file", input.files[0]);

    const res = await fetch("/api/files/profile/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    await res.json();
    fetchFiles();
  };

  const newDirectory = async () => {
    if (!directoryName) {
      setError("Directory name cannot be empty");
      return;
    }
    const payload = {
      name: directoryName,
      parent: null,
    };
    const res = await fetch("/api/files/mkdir", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    await res.json();
    fetchFiles();
  };

  const shareFile = async () => {
    if (!selectedFileId || !shareIdentifier) return;

    const payload = {
      identifier: shareIdentifier,
      access: sharePermission,
    };

    const res = await fetch(`/api/files/${selectedFileId}/share`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShareMessage('File shared successfully!');
      setShareIdentifier('');
      setSelectedFileId(null);
      fetchFiles();
    } else {
      const errorData = await res.json();
      setShareMessage(`Error: ${errorData.message || 'Failed to share file'}`);
    }
  };

  const deleteFile = async (fileId: string) => {
    const res = await fetch(`/api/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (res.ok) {
      fetchFiles();
    } else {
      console.error('Error deleting file');
    }
  };

  const handleShare = (fileId: string) => {
    setSelectedFileId(fileId);
  };

  return (
      <SidebarProvider className="flex flex-row min-h-screen">
        <AppSidebar />
        <main className="flex flex-col h-screen w-full">
          <div className="w-full flex items-center justify-between p-4">
            <SidebarTrigger />
            <ModeToggle />
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <h1 className="text-2xl font-semibold mb-6">Welcome to Aspose, your file management tool.</h1>

            <div className="grid w-full max-w-xl items-start gap-6 mb-10">
              <Dialog>
                <DialogTrigger className="w-full flex justify-start">
                  <Button variant="outline">
                    <Folder className="mr-2" />
                    New Directory
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <div className="grid gap-4">
                    <Label htmlFor="directory-name" className="text-base font-medium">Directory Name</Label>
                    <Input
                        id="directory-name"
                        type="text"
                        value={directoryName}
                        onChange={(e) => setDirectoryName(e.target.value)}
                        placeholder="Enter directory name"
                    />
                    <Button onClick={newDirectory}>Create Directory</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="grid gap-2">
                <Label htmlFor="general-upload" className="text-base font-medium">Upload files for your file structure</Label>
                <div className="flex items-center gap-4">
                  <input
                      id="general-upload"
                      type="file"
                      onChange={handleFileChange}
                      className="w-full text-base px-4 py-2 border border-input rounded-md bg-background"
                      ref={generalFileRef}
                  />
                  <Button onClick={uploadFile} className="h-10">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="profile-upload" className="text-base font-medium">Upload an HTML file for your profile</Label>
                <div className="flex items-center gap-4">
                  <input
                      id="profile-upload"
                      type="file"
                      accept=".html"
                      onChange={handleFileChange}
                      className="w-full text-base px-4 py-2 border border-input rounded-md bg-background"
                      ref={profileFileRef}
                  />
                  <Button onClick={uploadProfileFile} className="h-10">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
              </div>

              {selectedFile && (
                  <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>
              )}
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="grid grid-cols-2 gap-4">
              <FileTable files={files} onShare={handleShare} onDelete={deleteFile} />
              <Terminal />
            </div>

            <Dialog open={!!selectedFileId} onOpenChange={() => setSelectedFileId(null)}>
              <DialogContent>
                <div className="grid gap-4">
                  <Label htmlFor="share-identifier">Email</Label>
                  <Input
                      id="share-identifier"
                      type="text"
                      placeholder="Enter user email"
                      value={shareIdentifier}
                      onChange={(e) => setShareIdentifier(e.target.value)}
                  />
                  <Label htmlFor="share-permission">Permission</Label>
                  <select
                      id="share-permission"
                      value={sharePermission}
                      onChange={(e) => setSharePermission(e.target.value as 'read' | 'write')}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="read">Read</option>
                    <option value="write">Write</option>
                  </select>
                  {shareMessage && (
                      <p className={`text-sm ${shareMessage.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
                        {shareMessage}
                      </p>
                  )}
                  <DialogFooter>
                    <Button onClick={shareFile}>Share</Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </SidebarProvider>
  );
}
