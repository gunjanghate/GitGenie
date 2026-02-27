"use client"

import { Terminal } from "@/components/ui/terminal"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useCallback, useState } from "react"

export default function TerminalDemo() {
  // State for output + AI toggle
  const [output, setOutput] = useState("")
  const [aiEnabled, setAiEnabled] = useState(false)

  // Handlers (REAL behavior)

  const handleGenerate = useCallback(() => {
    setOutput("✨ Generated commit: feat: add keyboard shortcuts")
  }, [])

  const handleCommit = useCallback(() => {
    setOutput(" Commit successful")
  }, [])

  const handleStage = useCallback(() => {
    setOutput(" Changes staged")
  }, [])

 const handleCopy = useCallback(async () => {
  try {
    await navigator.clipboard.writeText("feat: add keyboard shortcuts")
    setOutput("Copied commit message")
  } catch (error) {
    setOutput("Failed to copy")
  }
}, [])

  const handleRefresh = useCallback(() => {
    setOutput(" Refreshed changes")
  }, [])

  const handleToggleAI = useCallback(() => {
    setAiEnabled((prev) => {
      const newState = !prev
      setOutput(newState ? " AI Enabled" : "❌ AI Disabled")
      return newState
    })
  }, [])

  // Keyboard shortcuts hook
  useKeyboardShortcuts({
    onGenerate: handleGenerate,
    onStage: handleStage,
    onCopy: handleCopy,
    onCommit: handleCommit,
    onRefresh: handleRefresh,
    onToggleAI: handleToggleAI,
  })

  return (
    <Terminal>
      <div className="relative whitespace-pre font-mono text-sm flex flex-col justify-center items-center">
        
        {/* Header */}
        <div className="text-xl flex justify-center items-center">
          <span className="text-cyan-400"> 🔮 </span>
          <span className="text-pink-400">Git</span>
          <span className="text-yellow-400">Genie</span>
          <span className="text-cyan-400"> 🔮</span>
        </div>

        {"\n"}
        <br />

        {/* Box */}
        <div>
          <span className="text-gray-400">    ┌─────────────────┐</span>
          {"\n"}
          <span className="text-gray-400">    │ </span>
          <span className="text-green-400">✨ AI-Powered Git ✨</span>
          <span className="text-gray-400"> │</span>
          {"\n"}
          <span className="text-gray-400">    │ </span>
          <span className="text-blue-400">Smart Commit Magic</span>
          <span className="text-gray-400"> │</span>
          {"\n"}
          <span className="text-gray-400">    └─────────────────┘</span>
        </div>

        {"\n"}
        <span>       </span>

        <div className="text-lg">
          <span className="text-yellow-400">⚡ </span>
          <span className="text-red-400">Ready to code!</span>
          <span className="text-yellow-400"> ⚡</span>
        </div>

        <br />

        {/* ASCII */}
        <div>
          <span className="text-neutral-400">
            {" $$$$$$\\   $$$$$$\\  \n$$  __$$\\ $$  __$$\\ \n$$ /  \\__|$$ /  \\__|\n$$ |$$$$\\ $$ |$$$$\\ \n$$ | \\_$$ |$$ |\\_$$ |\n$$ |  $$  |$$ |  $$ |\n\\$$$$$$  |\\$$$$$$  |\n \\______/  \\______/  \n"}
          </span>
        </div>

        {/*  OUTPUT DISPLAY (IMPORTANT) */}
        {output && (
          <div className="mt-4 text-green-400 text-sm">
            {output}
          </div>
        )}

        {/* Shortcuts Panel */}
        <div className="hidden md:block fixed right-10 top-1/2 -translate-y-1/2 w-64 border border-zinc-700 rounded-lg bg-black/70 px-4 py-3 text-xs text-zinc-300 backdrop-blur">

          <div className="space-y-1">
            <p><span className="text-zinc-500">generate</span> → Ctrl/Cmd + Enter</p>
            <p><span className="text-zinc-500">commit</span> → Ctrl/Cmd + Shift + Enter</p>
            <p><span className="text-zinc-500">stage</span> → Ctrl/Cmd + Alt + S</p>
            <p><span className="text-zinc-500">copy</span> → Ctrl/Cmd + Shift + C</p>
            <p><span className="text-zinc-500">refresh</span> → Ctrl/Cmd + R</p>
            <p><span className="text-zinc-500">toggle-ai</span> → Ctrl/Cmd + Shift + A</p>
          </div>
        </div>

      </div>
    </Terminal>
  )
}