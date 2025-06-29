'use client'
import { normalizedResult } from "@/app/api/scan/route";
import ScanCharts from "@/app/components/ScanCharts";
import VulnLists from "@/app/components/VulnLists";
import { sortSeverity } from "@/app/utils/scanHelper";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function RepoPage(){
    const { owner, repo } = useParams()
    const [scanResult, setScanResult] = useState<normalizedResult[]>([])
    const [scanId, setScanId] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>('')
    const [scanMsg, setScanMsg] = useState<string>('Scan 🔎')
    const handleScan = async() =>{
        if(loading) return
        setLoading(true)
        setError('')
        setScanMsg('Scanning... 🔎')
        const response = await fetch('https://scan.dicksentan.com/api/scan',{
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({owner, repo})
        })
        if(response.ok){
            const {scanId} = await response.json()
            setScanId(scanId)
            localStorage.setItem('lastScan', JSON.stringify({scanId, owner, repo}))
            if(response.status === 200) setScanMsg('Scanning...🔎')
            else setScanMsg('Queueing, position: ...')
        }else{
            const {error} = await response.json()
            setError(error)
            setLoading(false)
            setScanMsg('Scan 🔎')
        }
    }
    useEffect(() =>{
        const timeout = setTimeout(() => {
            const saved = JSON.parse(localStorage.getItem('lastScan') ?? '{}')
            if(saved.owner === owner && saved.repo === repo){
             setLoading(true)
             setScanId(saved.scanId)
             console.log(saved)
             setScanMsg('Scanning...🔎')
            }else handleScan()            
        }, 300);
        return() =>{
            clearTimeout(timeout)
        }
    },[])

     
    useEffect(() =>{
        if(!loading || !scanId) return
        const interval = setInterval(async() =>{
            console.log('here')
            if(!loading) return
            const url = `https://scan.dicksentan.com/api/scan?scanId=${scanId}`
            const response = await fetch(url)
            if(response.ok){
                switch(response.status){
                    case 200:
                        const {data} = await response.json()
                        setScanResult(sortSeverity(data))
                        setLoading(false)
                        setScanMsg('Scan 🔎')
                        localStorage.clear()
                        break
                    
                    case 202:
                        const {msg, position} = await response.json()
                        if(msg === 'Scanning') setScanMsg('Scanning... 🔎')
                        else setScanMsg(`Queueing, position: ${position}`)
                }
                
            }
        },3000)
        return() =>{clearInterval(interval)}        
    },[loading, scanId])
    return(
        <section className="overflow-y-scroll py-2 px-3 h-screen w-screen text-text bg-slate-900 text-slate-200">
            <h2 className='text-2xl font-bold pt-2 w-full text-clip overflow-hidden whitespace-nowrap text-center my-4'>{repo}</h2>
            <h3 className="w-full text-center pb-2">by {owner}</h3>
            <button onClick={handleScan} className='bg-green-500 px-2 py-1 rounded w-full font-bold text-slate-900 cursor-pointer'>{scanMsg}</button>
            {error && <p className="w-full text-center mt-2 pb-2 text-red-500 text-xs">{error}</p>}
            {scanResult.length > 0 &&  <ScanCharts scanResult={scanResult}/>}
            <VulnLists vulns={scanResult}/>
        </section>
    )
}