import ModeToggle from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import Dropzone from "shadcn-dropzone"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { FileManager } from "@/components/FileManager"

export default function DashboardPage() {
    const navigate = useNavigate()
    const handleLogout = () => {
        localStorage.removeItem('token')
        navigate('/')
    }
    return (
        <SidebarProvider className="flex min-h-screen flex-col p-4">
            <AppSidebar />

            <div className="flex justify-between items-center mb-8">
                <div className="absolute top-4 right-4">
                    <ModeToggle />
                </div>

                <h1 className="text-2xl font-bold">Aspose</h1>
                <Button variant="outline" onClick={handleLogout}>
                    Logout
                </Button>
            </div>
            <div className="flex-1">
                <h1>Welcome to Aspose, the best file management tool</h1>
                <Dropzone />
                <FileManager /> {/* Added FileManager component */}
            </div>
        </SidebarProvider>
    )
}