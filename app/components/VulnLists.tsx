import { useState } from "react";
import { normalizedResult } from "../api/scan/route";
import { COLORS } from "./ScanCharts";
import VulnDetails from "./VulnDetails";

function getContrastTextColor(bgColor: string) {
  const [r, g, b] = bgColor.match(/\w\w/g)!.map(c => parseInt(c, 16));
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#0f172a' : '#f8fafc'; // dark bg -> light text, light bg -> dark text
}

export default function VulnLists({vulns} : {vulns: normalizedResult[]}){
    const [vuln, setVuln] = useState<normalizedResult>()
    const [openDetail, setOpenDetail] = useState<boolean>(false)
    const handleShowDetail =(v: normalizedResult) =>{
        setVuln(v)
        setOpenDetail(true)
    }
    return(
        <ul className="flex flex-col gap-5 w-full items-center justify-center relative p-5 mt-10 border">
            <p className="font-bold text-2xl border-b-4 pb-5">Vulnerabilites we found</p>
            <p>{vulns.length > 0 && '(Click To See Details)'}</p>
            {vulns.length > 0 ?vulns.map((v) =>(
                <li key={v.desc} onClick={() => handleShowDetail(v)} style={{ backgroundColor: COLORS[v.severity] , color: getContrastTextColor(COLORS[v.severity])}} className={`cursor-pointer rounded px-4 py-2 max-w-[1024px] w-full`}>
                    {v.title || v.desc.slice(0, 80)}
                </li>
            )) : (<p className="font-bold text-xl">You are safe, so far...</p>)}
            {openDetail && vuln && <VulnDetails vuln={vuln} setOpen={setOpenDetail}/>}
        </ul>
    )
}