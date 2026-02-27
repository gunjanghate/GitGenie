import { useEffect } from "react"

type ShortcutHandlers = {
  onGenerate?: () => void
  onStage?: () => void
  onCopy?: () => void
  onCommit?: () => void
  onRefresh?: () => void
  onToggleAI?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC")
      const ctrl = isMac ? e.metaKey : e.ctrlKey

      //  Don’t trigger inside input fields
      const target = e.target as HTMLElement
      const tag = target.tagName.toLowerCase()
      if (tag === "input" || tag === "textarea") return

      //  Ctrl/Cmd + Enter → Generate
      if (ctrl && !e.shiftKey && e.key === "Enter") {
        e.preventDefault()
        handlers.onGenerate?.()
      }

      //  Ctrl + Shift + S → Stage
      if (ctrl && e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault()
        handlers.onStage?.()
        }

      //  Ctrl + Shift + C → Copy
      if (ctrl && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault()
        handlers.onCopy?.()
      }

      //  Ctrl + Shift + Enter → Commit
      if (ctrl && e.shiftKey && e.key === "Enter") {
        e.preventDefault()
        handlers.onCommit?.()
      }

      //  Ctrl + R → Refresh
      if (ctrl && e.key.toLowerCase() === "r") {
        e.preventDefault()
        handlers.onRefresh?.()
      }

      // Ctrl + Shift + A → Toggle AI
      if (ctrl && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault()
        handlers.onToggleAI?.()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handlers])
}