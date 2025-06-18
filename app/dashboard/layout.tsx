import Header from "../components/Header";

export default function DashboardLayout({children} : {children: React.ReactNode}){
    return(
        <main className="py-2 px-3 h-screen w-screen text-text bg-slate-900 text-slate-200">
            <Header/> 
            {children}
        </main>
    )
}