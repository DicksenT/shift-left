import { useEffect, useState } from "react"
import Link from "next/link"

export default function ReposLists(){
    const [repos, setRepos] = useState<any[]>()
    useEffect(() =>{
        const getData = async()=>{
            const response = await fetch('/api/repos')
            if(response.ok){
                const {data} = await response.json()
                setRepos(data) 
            }
        }
    getData()
    },[])
    useEffect(() =>{
        console.log(repos)
    },[repos])


    return(
        <ul className=" p-3 rounded overflow-y-scroll min-h-80 flex-1 flex flex-col gap-3">
            {repos ? repos.map((repo) =>(
                <li key={repo.name} className="border py-1 px-2 w-full">
                    <Link href={`/dashboard/${repo.owner.login}/${repo.name}`}>
                    {repo.name}
                    </Link>
                </li>
            )) : <p>You got no repositories to show</p>}
        </ul>
    )
}