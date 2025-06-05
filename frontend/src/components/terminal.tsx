import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ChevronRight, X } from "lucide-react"
import { Button } from "./ui/button"

type CommandType = {
    id: number
    command: string
    output: React.ReactNode
}

type Props = {
    fetchFiles: () => void,
    hideTerminal: () => void,
    currentPath?: string 
}

export function Terminal({ fetchFiles, hideTerminal, currentPath = '' }: Props) {
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
                        <li>
                            <span className="text-primary">ls</span> - List directory contents
                        </li>
                        <li>
                            <span className="text-primary">pwd</span> - Print working directory
                        </li>
                        <li>
                            <span className="text-primary">cat [file]</span> - Display file contents
                        </li>
                        <li>
                            <span className="text-primary">mkdir [dir]</span> - Create directory
                        </li>
                        <li>
                            <span className="text-primary">touch [file]</span> - Create empty file
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
                            <li>
                                <span className="text-primary">ls</span> - List directory contents
                            </li>
                            <li>
                                <span className="text-primary">pwd</span> - Print working directory
                            </li>
                            <li>
                                <span className="text-primary">cat [file]</span> - Display file contents
                            </li>
                            <li>
                                <span className="text-primary">mkdir [dir]</span> - Create directory
                            </li>
                            <li>
                                <span className="text-primary">touch [file]</span> - Create empty file
                            </li>
                        </ul>
                    </div>
                )
            case "clear":
                setTimeout(() => {
                    setCommands([])
                }, 100)
                return null

            case "pwd":
                return (
                    <p className="text-muted-foreground">
                        /home/{localStorage.getItem('username') || 'user'}/{currentPath}
                    </p>
                )

            default:
                return executeRemoteCommand(trimmedCmd)
        }
    }

    const executeRemoteCommand = async (cmd: string) => {
        const response = await fetch("/api/files/ci", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ 
                command: cmd,
                workingDir: currentPath
            }),
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
        focusInput()
    }, [])

    const focusInput = () => {
        inputRef.current?.focus()
    }

    const getPromptPath = () => {
        if (!currentPath) return '~'
        return `~/${currentPath}`
    }

    return (
        <Card className="border border-border bg-black text-white shadow-md py-0 gap-0" onClick={focusInput}>
            <div className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-2">
                <div className="text-sm font-medium">Terminal - {getPromptPath()}</div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={hideTerminal}
                        className="rounded-full p-1 hover:bg-muted/20"
                        aria-label="Close terminal"
                    >
                        <X className="h-4 w-4" />
                    </Button>
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
                                <span className="text-blue-400 mr-2">
                                    {localStorage.getItem('username') || 'user'}@aspose:{getPromptPath()}$
                                </span>
                                <span className="font-bold">{cmd.command}</span>
                            </div>
                            <div className="ml-6 mt-1">{cmd.output}</div>
                        </div>
                    ))}

                    <form onSubmit={handleSubmit} className="mt-2 flex items-center">
                        <span className="mr-2 text-green-500">
                            <ChevronRight className="h-4 w-4" />
                        </span>
                        <span className="text-blue-400 mr-2">
                            {localStorage.getItem('username') || 'user'}@aspose:{getPromptPath()}$
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
