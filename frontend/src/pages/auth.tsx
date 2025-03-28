import { useState, useEffect } from 'react'
import { LoginForm } from '@/components/login-form'
import { RegisterForm } from '@/components/register-form'
import ModeToggle from '@/components/mode-toggle'
import { motion } from 'framer-motion'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'

export default function AuthPage() {
    const [showLogin, setShowLogin] = useState(true)
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams] = useSearchParams()

    useEffect(() => {
        // Check URL parameter for register
        const register = searchParams.get('register')
        if (register === 'true') {
            setShowLogin(false)
        }
    }, [searchParams])

    const handleAuthSuccess = () => {
        // Redirect to the attempted location or dashboard
        const from = location.state?.from?.pathname || '/dashboard'
        navigate(from, { replace: true })
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <ModeToggle />
            </div>
            <motion.div
                className="w-1/2 max-w-[1000px]"
            >
                {showLogin ? (
                    <LoginForm setShowLogin={setShowLogin} onSuccess={handleAuthSuccess} />
                ) : (
                    <RegisterForm setShowLogin={setShowLogin} onSuccess={handleAuthSuccess} />
                )}
            </motion.div>
        </div>
    )
}
