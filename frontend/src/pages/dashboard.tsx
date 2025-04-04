import ModeToggle from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { FileInput } from "@/components/file-input";
import { Toaster } from 'sonner';

export default function DashboardPage() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };
  return (
    <SidebarProvider className="flex min-h-screen"> 
      <AppSidebar />
      <div className="flex-1 flex flex-col p-4">
        <div className="flex justify-between items-center mb-8">
          <div className="absolute top-4 right-4">
            <ModeToggle />
          </div>
          <h1 className="text-2xl font-bold">Aspose</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1>Welcome to Aspose, the best file management tool</h1>
          <FileInput />
        </div>
        <Toaster />
      </div>
      
    </SidebarProvider>
  );
}