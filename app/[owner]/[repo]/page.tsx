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
    const repoUrl = `https://github.com/${owner}/${repo}.git`

    const handleScan = async() =>{
        if(loading) return
        setLoading(true)
        const response = await fetch('http://159.223.195.110/api/scan',{
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({repoUrl})
        })
        if(response.ok){
            console.log('success')
            const {scanId} = await response.json()
            console.log(scanId)
            setScanId(scanId)
        }
    }
    useEffect(() =>{
        const timeout = setTimeout(() => {
            handleScan()            
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
            const url = `http://159.223.195.110/api/scan?scanId=${scanId}`
            const response = await fetch(url)
            if(response.ok && response.status === 200){
                const {data} = await response.json()
                setScanResult(sortSeverity(data))
                setLoading(false)
            }
        },5000)
        return() =>{clearInterval(interval)}        
    },[loading, scanId])
    return(
        <section className="overflow-y-scroll py-2 px-3 h-screen w-screen text-text bg-slate-900 text-slate-200">
            <h2 className='text-2xl font-bold pt-2 w-full text-clip overflow-hidden whitespace-nowrap text-center my-4'>{repo}</h2>
            <h3 className="w-full text-center pb-2">by {owner}</h3>
            <button onClick={handleScan} className='bg-green-500 px-2 py-1 rounded w-full font-bold text-slate-900 cursor-pointer'>{loading ?'Scanning... 🔎' :'Scan 🔎'}</button>
            {scanResult.length > 0 &&  <ScanCharts scanResult={scanResult}/>}
            <VulnLists vulns={scanResult}/>
        </section>
    )
}