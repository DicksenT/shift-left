'use client'
import { useEffect, useState } from "react"
import ReposLists from "../components/ReposLists"

export default function Dashboard(){
    return(
        <section className="py-5 flex flex-col max-h-[calc(100vh-87px)]">
            <p className="text-3xl">Repositories</p>
            <ReposLists/>
        </section>
    )
}