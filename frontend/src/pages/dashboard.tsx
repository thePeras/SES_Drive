import ModeToggle from "@/components/mode-toggle";
import { Label } from "@/components/ui/label";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Folder, Upload, Home, ChevronUp } from "lucide-react";
import { useRef, useState, ChangeEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Terminal } from "@/components/terminal";
import { FileViewerDialog } from "@/components/file-viewer";
import { toast, Toaster } from "sonner";
import { FileTable } from "@/components/folder-structure-table";

export type FileItem = {
  name: string;
  type: string;
  path?: string;
};

export default function DashboardPage() {
  const generalFileRef = useRef<HTMLInputElement>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState('');
  const [directoryName, setDirectoryName] = useState('');
  const [viewerFile, setViewerFile] = useState<FileItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  
  const [currentPath, setCurrentPath] = useState('');

  const fetchFiles = (path = currentPath) => {
    const queryParam = path ? `?path=${encodeURIComponent(path)}` : '';
    fetch(`/api/files${queryParam}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setFiles(data.map((item: FileItem) => ({
          ...item,
          path: currentPath, 
        })));
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchFiles();
  }, [currentPath]);

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
    formData.append("parent", currentPath);
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
    
    toast("Upload successful", {
      description: `File "${input.files[0].name}" uploaded successfully.`,
    });
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
    
    toast("Profile upload successful", {
      description: `Profile file "${input.files[0].name}" uploaded successfully.`,
    });
  };

  const handleViewFile = (file: FileItem) => {
    setViewerFile(file);
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
    setViewerFile(null);
  };

  const handleEnterDirectory = (file: FileItem) => {
    const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
    setCurrentPath(newPath);
  };

  const handleGoToRoot = () => {
    setCurrentPath('');
  };

  const handleGoUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const newDirectory = async () => {
    if (!directoryName) {
      setError("Directory name cannot be empty");
      return;
    }
    
    const payload = {
      name: directoryName,
      parent: currentPath, 
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
    setDirectoryName(''); 
    
    toast("Directory created", {
      description: `Directory "${directoryName}" created successfully.`,
    });
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

          <div className="flex justify-end mb-5">
            {!showTerminal &&
              <Button onClick={() => setShowTerminal(prev => !prev)}>
                Open Terminal
              </Button>
            }
          </div>
          
          <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Current path:</span>
            <span className="font-mono">/{currentPath || 'root'}</span>
            <div className="flex gap-2 ml-auto">
              {currentPath && (
                <>
                  <Button size="sm" variant="outline" onClick={handleGoUp}>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Up
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleGoToRoot}>
                    <Home className="w-4 h-4 mr-1" />
                    Root
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className={`grid ${showTerminal ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
            <FileTable 
              files={files} 
              onViewFile={handleViewFile}
              onEnterDirectory={handleEnterDirectory}
            />
            <FileViewerDialog
              file={viewerFile} 
              isOpen={isViewerOpen}
              onClose={closeViewer}
            />
            {showTerminal && (
              <Terminal 
                fetchFiles={fetchFiles} 
                hideTerminal={() => setShowTerminal(false)}
                currentPath={currentPath} 
              />
            )}
          </div>
        </div>
      </main>
      <Toaster />
    </SidebarProvider>
  );
}
