'use client'

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function ScanInput({btnText} : {btnText: string}){
    const [repoUrl, setRepoUrl] = useState<string>('')
    const router = useRouter()
    const handleClick = () =>{
        const splitted = repoUrl.split('/')
        console.log(splitted)
        router.push(`/${splitted[splitted.length -2]}/${splitted[splitted.length - 1]}`)
        
    }
    return(
        <article className="w-full px-5">
            <input 
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.currentTarget.value) }
            className="w-full mb-2 px-4 py-3 bg-slate-800 border border-slate-600 focus:border-cyan-400 rounded-lg outline-none transition-colors"
            placeholder="github.com/name/repo" 
            onKeyDown={(e) =>{
                if(e.key === 'Enter' && !e.shiftKey){
                    handleClick()
                }
            }}/>
            <button onClick={handleClick} className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-cyan-400/20">{btnText}</button>
        </article>
    )
}