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
    const [loading, setLoading] = useState<boolean>(false)
    const repoUrl = `https://github.com/${owner}/${repo}.git`

    const handleScan = async() =>{
        if(loading) return
        console.log('start scanning')
        console.log(repoUrl)
        setLoading(true)
        const response = await fetch('https://essential-vevay-dicksent-574a08b7.koyeb.app/api/scan',{
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({repoUrl})
        })
        if(response.ok){
            console.log('success')
            const {data} = await response.json() 
            setScanResult(sortSeverity(data))
            setLoading(false)
        }
        setLoading(false)

    }
    useEffect(() =>{
        const timeout = setTimeout(() => {
                    handleScan()            
        }, 300);
        return() =>{
            clearTimeout(timeout)
        }
    },[])
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