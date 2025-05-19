import ModeToggle from "@/components/mode-toggle"
import { Label } from "@/components/ui/label"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { FileTable } from "@/components/file-table"
import { Button } from "@/components/ui/button"
import { Folder, Upload } from "lucide-react"
import { useRef, useState, ChangeEvent, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Terminal } from "@/components/terminal"

export type FileItem = {
  name: string;
  type: string;
};

export default function DashboardPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [directoryName, setDirectoryName] = useState('');

  const fetchFiles = () => {
    setLoading(true);
    fetch('/api/files', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((res) => res.json())
      .then((data) => setFiles(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
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
    const input = document.getElementById("picture") as HTMLInputElement;
    if (!input.files?.length) return;

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

  const newDirectory = async () => {
    if (!directoryName) {
      setError("Directory name cannot be empty");
      return;
    }
    const payload = {
      name: directoryName,
      parent: null,
    };
    console.log(payload);
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
  }


  return (
    <SidebarProvider className="flex flex-row min-h-screen">
      <AppSidebar />
      <main className="flex flex-col h-screen w-full">
        <div className="w-full flex items-center justify-between p-4">
          <SidebarTrigger />
          <ModeToggle />
        </div>
        <div className="flex-1 p-4">
          <h1>Welcome to Aspose, the best file management tool</h1>
          <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
            <Dialog>
              <DialogTrigger className="w-full flex justify-start">
                <Button variant="outline">
                  <Folder className="mr-2" />
                  New Directory
                </Button>
              </DialogTrigger>
              <DialogContent>
                <div className="grid gap-4">
                  <Label htmlFor="directory-name">Directory Name</Label>
                  <Input
                    id="directory-name"
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    placeholder="Enter directory name"
                    value={directoryName}
                    onChange={(e) => setDirectoryName(e.target.value)}
                  />
                  <Button onClick={newDirectory}>Create Directory</Button>
                </div>
              </DialogContent>
            </Dialog>
            <div className="w-full flex flex-row items-center justify-between">
              <div className="relative flex-1">
                <input
                  id="picture"
                  type="file"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>
              <Button className="ml-2" onClick={uploadFile}>
                <Upload className="mr-2" />
                Upload
              </Button>
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground mt-1">Selected: {selectedFile.name}</p>
            )}
          </div>
          {error && <p className="text-red-500">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <FileTable files={files} />
            <Terminal />
          </div>
          {loading && <p>Loading...</p>}
        </div>
      </main>
    </SidebarProvider>
  )
}