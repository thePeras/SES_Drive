import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export default function DashboardPage() {
  const navigate = useNavigate()
  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }
  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Aspose</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      <div className="flex-1">
        <h1>Welcome to Aspose, the best file management tool</h1>
        {/* TODO: Add file structure here */}
      </div>
    </div>
  )
} 