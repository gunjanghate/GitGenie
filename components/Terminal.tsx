import {
    Terminal
} from "@/components/ui/terminal"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

export default function TerminalDemo() {

        // Handlers for shortcuts

        const handleGenerate = () => {
        alert("Generate commit triggered")
        }

        const handleCommit = () => {
        alert("Commit triggered")
        }

        const handleStage = () => {
        alert("Stage all triggered")
        }

        const handleCopy = () => {
        alert("Copy triggered")
        }

        const handleRefresh = () => {
        window.location.reload()
       }

        const handleToggleAI = () => {
        alert("Toggle AI triggered")
        }

        // Hook usage
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
            <div className="whitespace-pre font-mono text-sm flex flex-col justify-center items-center ">
                <div className="text-xl flex justify-center items-center">

                <span className="text-cyan-400"> 🔮 </span>
                <span className="text-pink-400">Git</span>
                <span className="text-yellow-400">Genie</span>
                <span className="text-cyan-400"> 🔮</span>
                </div>
                {'\n'}
                <br />
                <div >

                <span className="text-gray-400">    ┌─────────────────┐</span>
                {'\n'}
                <span className="text-gray-400">    │ </span>
                <span className="text-green-400">✨ AI-Powered Git ✨</span>
                <span className="text-gray-400"> │</span>
                {'\n'}
                <span className="text-gray-400">    │ </span>
                <span className="text-blue-400">Smart Commit Magic</span>
                <span className="text-gray-400"> │</span>
                {'\n'}
                <span className="text-gray-400">    └─────────────────┘</span>
                </div>
                {'\n'}
                <span>       </span>
                <div className="text-lg">

                <span className="text-yellow-400">⚡ </span>
                <span className="text-red-400">Ready to code!</span>
                <span className="text-yellow-400"> ⚡</span>
                </div>
                <br />
            
                <div>

                <span className="text-neutral-400">
                    {" $$$$$$\\   $$$$$$\\  \n$$  __$$\\ $$  __$$\\ \n$$ /  \\__|$$ /  \\__|\n$$ |$$$$\\ $$ |$$$$\\ \n$$ | \\_$$ |$$ |\\_$$ |\n$$ |  $$  |$$ |  $$ |\n\\$$$$$$  |\\$$$$$$  |\n \\______/  \\______/  \n"}
                </span>
                </div>
            
                <div className="hidden md:block absolute right-6 bottom-24 w-64 border border-zinc-700 rounded-lg bg-black/70 px-4 py-3 text-xs text-zinc-300 backdrop-blur">
                <p className="text-green-400 mb-2">$ shortcuts</p>

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