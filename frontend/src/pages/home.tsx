import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">Welcome to Aspose</h1>
      <div className="flex gap-4">
        <Button onClick={() => navigate('/auth')}>
          Login
        </Button>
        <Button variant="outline" onClick={() => navigate('/auth?register=true')}>
          Register
        </Button>
      </div>
    </div>
  )
} 