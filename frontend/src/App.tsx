import './App.css'
import AuthPage from './pages/auth'
import { ThemeProvider } from "@/components/theme-provider"
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthPage />
    </ThemeProvider>
  )
}

export default App
