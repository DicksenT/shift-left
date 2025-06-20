import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { normalizedResult } from "../api/scan/route";
import { COLORS } from "./ScanCharts";
import Image from "next/image";
import SimulatedHack from "./SimulatedHack";



export default function VulnDetails({vuln, setOpen} : {vuln: normalizedResult, setOpen: Dispatch<SetStateAction<boolean>>}){
    const baseClamp = 'line-clamp-2 sm:line-clamp-3 md:line-clamp-4 lg:line-clamp-6'
    const [isExpand, setIsExpand] = useState<boolean>(false)
    const [explanation, setExplanation] = useState<string>('')
    const cardRef = useRef<HTMLDivElement | null>(null)

    //to call function that generate AI-Explanation based in vuln description
    const handleExplain = async() =>{
        console.log('start')
        setExplanation('')
        const response = await fetch('/api/explain',{
            method: 'POST',
            body: JSON.stringify({desc: vuln.desc}),
            headers:{
                'Content-Type': 'application/json'
            }
        })
       if(response.ok){
        const {data} = await response.json()
        setExplanation(data)
       }
    }
    //auto call when mounted
    useEffect(() =>{
        handleExplain()
    },[])

    useEffect(() =>{
        const handleClick = (e: any) =>{
            console.log(e.target)
            if(cardRef.current && !cardRef.current.contains(e.target)){
                setOpen(false)
            }
        }
        const timeout = setTimeout(() => {
                    window.addEventListener('click', handleClick)
        }, 0);

        return() =>{
            clearTimeout(timeout)
            window.removeEventListener('click', handleClick)
        }
    },[])
    

    return(
       <section className="fixed inset-0 bg-black/50 p-4 md:p-10 z-50 w-full flex items-center justify-center">
        <div ref={cardRef} className="bg-white dark:bg-slate-300 text-slate-900 w-full h-full max-h-[1024px] max-w-[720px] relative overflow-y-scroll rounded-xl shadow-2xl p-6 space-y-6 transition-all">
            
            <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-slate-500 hover:text-black transition">
            <Image src="/close.svg" width={32} height={32} alt="Close" />
            </button>

            {vuln.title && (
            <h3 className="text-2xl font-bold" style={{ color: COLORS[vuln.severity] }}>
                {vuln.title}
            </h3>
            )}

            <div className="space-y-2">
            <h4 className="text-lg font-medium">Description</h4>
            <p className={`transition-all duration-300 ${isExpand ? '' : baseClamp}`}>
                {vuln.desc}
            </p>
            <button
                onClick={() => setIsExpand(prev => !prev)}
                className="text-blue-600 underline text-sm cursor-pointer"
            >
                {isExpand ? 'Collapse' : 'Expand'}
            </button>
            </div>

            <h4 className="text-lg">
            <span className="font-medium">Scanned by:</span> {vuln.source}
            </h4>

            <div className="space-y-2">
            <h4 className="text-lg font-medium">What this vulnerability means</h4>
            <p className="text-sm leading-relaxed whitespace-pre-line">{explanation ? explanation : 'Generating...'}</p>
            </div>

            <SimulatedHack desc={vuln.desc}/>
        </div>
        </section>
        )
}