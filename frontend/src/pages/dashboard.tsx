import ModeToggle from "@/components/mode-toggle"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { FileManager } from "@/components/FileManager"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

export default function DashboardPage() {
    const uploadFile = () => {
        // Handle file upload logic here
        console.log("File uploaded");
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
                            <Input id="picture" type="file" />
                            <Button  className="ml-2" onClick={uploadFile}>
                            <Upload className="mr-2" />
                                Upload
                            </Button>
                        </div>
                    </div>

                    <FileManager /> {/* Added FileManager component */}
                </div>            
            </main>
        </SidebarProvider>
    )
}