import ModeToggle from "@/components/mode-toggle";
import { Label } from "@/components/ui/label";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Folder,
  Upload,
  Home,
  ChevronUp,
  Users,
  FolderOpen,
} from "lucide-react";
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
  shared?: boolean;
  sharedFrom?: string;
  owner?: string;
  fullPath?: string;
  permission?: string;
  filePath?: string;
  sharedAt?: string;
};

type ViewMode = "myFiles" | "sharedFiles";

export default function DashboardPage() {
  const generalFileRef = useRef<HTMLInputElement>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState("");
  const [directoryName, setDirectoryName] = useState("");
  const [viewerFile, setViewerFile] = useState<FileItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [fileToShare, setFileToShare] = useState<FileItem | null>(null);
  const [isSharingDialogOpen, setIsSharingDialogOpen] = useState(false);
  const [targetUsername, setTargetUsername] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [viewMode, setViewMode] = useState<ViewMode>("myFiles");

  const shareFile = async () => {
    if (!fileToShare || !targetUsername) return;

    const res = await fetch("/api/files/share", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        recipient: targetUsername,
        filePath: fileToShare.path
          ? `${fileToShare.path}/${fileToShare.name}`
          : fileToShare.name,
        permission: permission === "edit" ? "read-write" : "read",
      }),
    });

    if (res.ok) {
      toast("File shared successfully", {
        description: `${fileToShare.name} shared with ${targetUsername}`,
      });
    } else {
      const errorText = await res.text();
      toast("Failed to share file", { description: errorText });
    }

    closeShareDialog();
    setTargetUsername("");
    setPermission("view");
  };

  const openShareDialog = (file: FileItem) => {
    setFileToShare(file);
    setIsSharingDialogOpen(true);
  };

  const closeShareDialog = () => {
    setIsSharingDialogOpen(false);
    setFileToShare(null);
  };

  const fetchSharedFiles = () => {
    fetch("/api/files/shared", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Shared files response:", data);

        const transformedFiles = data.map((sharedFile: any) => {
          const pathParts = sharedFile.filePath.split("/");
          const fileName = pathParts[pathParts.length - 1];

          return {
            name: fileName,
            type: "file",
            shared: true,
            sharedFrom: sharedFile.owner,
            owner: sharedFile.owner,
            permission: sharedFile.permission,
            filePath: sharedFile.filePath,
            sharedAt: sharedFile.sharedAt,
            path:
              sharedFile.filePath.substring(
                0,
                sharedFile.filePath.lastIndexOf("/"),
              ) || "",
          };
        });

        setFiles(transformedFiles);
      })
      .catch((err) => {
        console.error("Error fetching shared files:", err);
        toast("Failed to fetch shared files", {
          description: err.message || "Unknown error occurred",
        });
        setFiles([]);
      });
  };

  const fetchFiles = (path = currentPath) => {
    const queryParam = path ? `?path=${encodeURIComponent(path)}` : "";
    fetch(`/api/files${queryParam}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setFiles(
          data.map((item: FileItem) => ({
            ...item,
            path: currentPath,
            shared: false,
          })),
        );
      })
      .catch((err) => {
        console.error("Error fetching files:", err);
        toast("Failed to fetch files", { description: err.message });
      });
  };

  useEffect(() => {
    if (viewMode === "myFiles") {
      fetchFiles();
    } else {
      fetchSharedFiles();
    }
  }, [currentPath, viewMode]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setCurrentPath("");
  };

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
    if (viewMode === "myFiles") {
      const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      setCurrentPath(newPath);
    }
  };

  const handleGoToRoot = () => {
    setCurrentPath("");
  };

  const handleGoUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split("/");
    parts.pop();
    setCurrentPath(parts.join("/"));
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
    setDirectoryName("");

    toast("Directory created", {
      description: `Directory "${directoryName}" created successfully.`,
    });
  };

  const onDeleteFile = async (file: FileItem) => {
    const command =
      file.type !== "directory" ? `rm ${file.name}` : `rmdir ${file.name}`;
    const response = await fetch("/api/files/ci", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        command: command,
        workingDir: `${file.path}`,
      }),
    });
    if (!response.ok) {
      toast.error("Failed to delete " + file.type + " " + file.name);
    } else {
      const body = await response.json();
      if (body.error) {
        toast.error(body.error);
      } else if (body.success) {
        toast.success(
          file.type === "directory"
            ? "Directory deleted successfully."
            : "File deleted successfully.",
        );
      } else {
        toast.error("Unknown error occurred");
      }
    }
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
        <div className="flex-1 p-4 overflow-y-auto">
          <h1 className="text-2xl font-semibold mb-6">
            Welcome to Aspose, your file management tool.
          </h1>

          {/* View Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={viewMode === "myFiles" ? "default" : "outline"}
              onClick={() => handleViewModeChange("myFiles")}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              My Files
            </Button>
            <Button
              variant={viewMode === "sharedFiles" ? "default" : "outline"}
              onClick={() => handleViewModeChange("sharedFiles")}
            >
              <Users className="mr-2 h-4 w-4" />
              Shared with Me
            </Button>
          </div>

          {/* Only show upload/create options in "My Files" mode */}
          {viewMode === "myFiles" && (
            <div className="grid w-full max-w-xl items-start gap-6 mb-10">
              <Dialog
                open={isSharingDialogOpen}
                onOpenChange={setIsSharingDialogOpen}
              >
                <DialogContent>
                  <div className="grid gap-4">
                    <Label htmlFor="username">Share with (username)</Label>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={targetUsername}
                      onChange={(e) => setTargetUsername(e.target.value)}
                    />

                    <Label htmlFor="permission">Permission</Label>
                    <select
                      id="permission"
                      className="border rounded px-2 py-1"
                      value={permission}
                      onChange={(e) =>
                        setPermission(e.target.value as "view" | "edit")
                      }
                    >
                      <option value="view">View</option>
                      <option value="edit">Edit</option>
                    </select>

                    <Button onClick={shareFile}>Share</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger className="w-full flex justify-start">
                  <Button variant="outline">
                    <Folder className="mr-2" />
                    New Directory
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <div className="grid gap-4">
                    <Label
                      htmlFor="directory-name"
                      className="text-base font-medium"
                    >
                      Directory Name
                    </Label>
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
                <Label
                  htmlFor="general-upload"
                  className="text-base font-medium"
                >
                  Upload files for your file structure
                </Label>
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
                <Label
                  htmlFor="profile-upload"
                  className="text-base font-medium"
                >
                  Upload an HTML file for your profile
                </Label>
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
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          )}

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="flex justify-end mb-5">
            {!showTerminal && (
              <Button onClick={() => setShowTerminal((prev) => !prev)}>
                Open Terminal
              </Button>
            )}
          </div>

          {/* Only show path navigation in "My Files" mode */}
          {viewMode === "myFiles" && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                Current path:
              </span>
              <span className="font-mono">/{currentPath || "root"}</span>
              <div className="flex gap-2 ml-auto">
                {currentPath && (
                  <>
                    <Button size="sm" variant="outline" onClick={handleGoUp}>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Up
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGoToRoot}
                    >
                      <Home className="w-4 h-4 mr-1" />
                      Root
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          <div
            className={`grid ${showTerminal ? "grid-cols-2" : "grid-cols-1"} gap-4`}
          >
            <FileTable
              files={files}
              onViewFile={handleViewFile}
              onEnterDirectory={handleEnterDirectory}
              onShareFile={viewMode === "myFiles" ? openShareDialog : undefined}
              isSharedView={viewMode === "sharedFiles"}
              onDeleteFile={onDeleteFile}
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
