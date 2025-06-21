'use client'

import { useState } from "react"

export default function SimulatedHack({desc} : {desc: string}){
    const [hack, setHack] = useState<string>('')
    const handleHacking = async() =>{
        const response = await fetch('https://shift-left.fly.dev/api/hack',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({desc})
        })
        const reader = response.body?.getReader()
        const decoder = new TextDecoder('utf-8')
        if(!reader) return
        while(true){
            const {value, done} = await reader.read()
            if(done) break
            const chunk = decoder.decode(value)
            setHack(prev => prev + chunk)
        }
    }
    return(
        <div className="pt-4">
            <button
                onClick={handleHacking}
                className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition cursor-pointer mb-2"
            >
                🚨 SIMULATE HACK & HOW TO PREVENT IT 🛡️
            </button>
            {hack && 
            <pre className="bg-black scrollbar-thin text-green-400 font-mono p-4 rounded-md overflow-x-auto w-full text-sm leading-relaxed">
                {hack}
                </pre>}
            </div>
    )
}