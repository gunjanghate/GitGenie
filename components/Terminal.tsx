import {
    AnimatedSpan,
    Terminal,
    TypingAnimation,
} from "@/components/ui/terminal"

export default function TerminalDemo() {
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
            </div>

        </Terminal>
    )
}