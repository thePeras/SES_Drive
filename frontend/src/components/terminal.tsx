import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ChevronRight, X } from "lucide-react"

type CommandType = {
    id: number
    command: string
    output: React.ReactNode
}

type Props = {
    fetchFiles: () => void
}

// fetchFiles from parent
export function Terminal({ fetchFiles }: Props) {
    const [input, setInput] = useState("")
    const [commands, setCommands] = useState<CommandType[]>([
        {
            id: 0,
            command: "help",
            output: (
                <div className="text-muted-foreground">
                    <p>Available commands:</p>
                    <ul className="ml-4 mt-2">
                        <li>
                            <span className="text-primary">help</span> - Show this help message
                        </li>
                        <li>
                            <span className="text-primary">clear</span> - Clear the terminal
                        </li>
                        <li>
                            <span className="text-primary">echo [text]</span> - Echo text back to the terminal
                        </li>
                        <li>
                            <span className="text-primary">date</span> - Show current date and time
                        </li>
                        <li>
                            <span className="text-primary">whoami</span> - Display current user
                        </li>
                    </ul>
                </div>
            ),
        },
    ])
    const [history, setHistory] = useState<string[]>([]) // TODO: History can be saved in local storage
    const [historyIndex, setHistoryIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    const processCommand = async (cmd: string): Promise<React.ReactNode> => {
        const trimmedCmd = cmd.trim()
        const args = trimmedCmd.split(" ")
        const command = args[0].toLowerCase()

        switch (command) {
            // TODO: Add the most relevant commands, which are the binnaries associated with 
            // cat, ls, cd, mkdir, rm, touch, cp, mv, echo, date, whoami?

            case "help":
                return (
                    <div className="text-muted-foreground">
                        <p>Available commands:</p>
                        <ul className="ml-4 mt-2">
                            <li>
                                <span className="text-primary">help</span> - Show this help message
                            </li>
                            <li>
                                <span className="text-primary">clear</span> - Clear the terminal
                            </li>
                            <li>
                                <span className="text-primary">echo [text]</span> - Echo text back to the terminal
                            </li>
                            <li>
                                <span className="text-primary">whoami</span> - Display current user
                            </li>
                        </ul>
                    </div>
                )
            case "clear":
                setTimeout(() => {
                    setCommands([])
                }, 100)
                return null

            default:
                return executeRemoteCommand(trimmedCmd)

                return (
                    <p className="text-destructive">
                        Command not found: {command}. Type &apos;help&apos; to see available commands.
                    </p>
                )
        }
    }

    const executeRemoteCommand = async (cmd: string) => {
        const response = await fetch("/api/files/ci", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ command: cmd }),
        })

        if (response.status !== 200) {
            const body = await response.json()
            console.error(body.message)
            return <p className="text-destructive">
                Command failed, check the command and try again.
            </p>
        }

        const data = await response.json()

        if (data.error) return <p className="text-destructive whitespace-pre-wrap">{data.error}</p>

        fetchFiles();

        return <p className="text-muted-foreground whitespace-pre-wrap">{data.output}</p>
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const newCommand = {
            id: commands.length,
            command: input,
            output: await processCommand(input),
        }

        if (input.trim().toLowerCase() !== "clear") {
            setCommands((prev) => [...prev, newCommand])
        } else {
            await processCommand(input)
        }

        // Add to history
        setHistory((prev) => [input, ...prev])
        setHistoryIndex(-1)
        setInput("")
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowUp") {
            e.preventDefault()
            if (historyIndex < history.length - 1) {
                const newIndex = historyIndex + 1
                setHistoryIndex(newIndex)
                setInput(history[newIndex])
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault()
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1
                setHistoryIndex(newIndex)
                setInput(history[newIndex])
            } else {
                setHistoryIndex(-1)
                setInput("")
            }
        }
    }

    // Auto-scroll to bottom when commands change
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
        }
    }, [commands])

    // Focus input on mount and when clicking the terminal
    useEffect(() => {
        focusInpput()
    }, [])

    const focusInpput = () => {
        inputRef.current?.focus()
    }

    return (
        <Card className="border border-border bg-black text-white shadow-md py-0 gap-0" onClick={focusInpput}>
            <div className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-2">
                <div className="text-sm font-medium">Terminal</div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setCommands([])}
                        className="rounded-full p-1 hover:bg-muted/20"
                        aria-label="Clear terminal"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
            <CardContent className="p-0">
                <ScrollArea className="h-[400px] p-4 font-mono text-sm" ref={scrollAreaRef}>
                    {commands.map((cmd) => (
                        <div key={cmd.id} className="mb-2">
                            <div className="flex items-start">
                                <span className="mr-2 text-green-500">
                                    <ChevronRight className="h-4 w-4" />
                                </span>
                                <span className="font-bold">{cmd.command}</span>
                            </div>
                            <div className="ml-6 mt-1">{cmd.output}</div>
                        </div>
                    ))}

                    {/* TODO: Set current path before the > */}
                    <form onSubmit={handleSubmit} className="mt-2 flex items-center">
                        <span className="mr-2 text-green-500">
                            <ChevronRight className="h-4 w-4" />
                        </span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={cn("flex-1 bg-transparent outline-none", "caret-primary")}
                            autoFocus
                            aria-label="Terminal input"
                        />
                    </form>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
