import ModeToggle from "@/components/mode-toggle"
import { Label } from "@/components/ui/label"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { FileTable } from "@/components/file-table"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { useRef, useState, ChangeEvent, useEffect } from "react"

export type FileItem = {
    name: string;
};

export default function DashboardPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);  

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
            <Label htmlFor="picture">Picture</Label>
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
          <FileTable files={files} />
            {loading && <p>Loading...</p>}
        </div>
      </main>
    </SidebarProvider>
  )
}