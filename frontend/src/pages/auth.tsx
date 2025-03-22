import { useState } from 'react'
import { LoginForm } from '@/components/login-form'
import RegisterForm from '@/components/register-form'
import { cn } from '@/lib/utils'
import ModeToggle from '@/components/mode-toggle'
export default function AuthPage() {
    const [showLogin, setShowLogin] = useState(true)



    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <ModeToggle />
            </div>
            <div className="w-full max-w-[1000px] grid grid-cols-2 gap-8">
                <div
                    className={cn(
                        "transition-all duration-500",
                        showLogin ? "animate-fadeInLeft" : "animate-fadeOutLeft opacity-0"
                    )}
                >
                    <LoginForm setShowLogin={setShowLogin} />
                </div>
                <div
                    className={cn(
                        "transition-all duration-500",
                        !showLogin ? "animate-fadeInRight" : "animate-fadeOutRight opacity-0"
                    )}
                >
                    <RegisterForm setShowLogin={setShowLogin} />
                </div>
            </div>
        </div>
    )
}
