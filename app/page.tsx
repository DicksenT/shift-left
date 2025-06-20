import TypewriterComp from "./components/TypewriterComp";
import ScanInput from "./components/ScanInput";
import SimulatedHack from "./components/SimulatedHack";
const simulatedVuln = {
  title: "Remote Code Execution via User Input (RCE)",
  desc: `An attacker can execute arbitrary system commands on the server by exploiting unsanitized user input passed to a shell execution function.`
}
export default function Homepage() {
  
  return (
    <main className="bg-slate-900 min-h-screen text-slate-200">
      {/* Header */}
      <section className="mb-12 h-screen flex items-center justify-center flex-col gap-8 md:gap-12">
         <h1 className="top-[15vh] left-0 w-full text-center px-8 text-5xl md:text-7xl font-bold tracking-tight">
          <span className="text-cyan-400">YOUR CODE</span> IS 
          <span className="text-red-500 mx-2"> ALREADY</span>
          <TypewriterComp/>
          </h1>

        {/* CTA */}
        <div className=" w-full max-w-80">
          <ScanInput btnText="FIND YOUR VULNERABILITY"/>
        </div>

          {/* 3. Personalized Threat Counter */}
        <div className="text-center">
        <h2 className="text-5xl font-bold text-red-500 mb-2 animate-[pulse_3s_ease-in-out_infinite]">
          30,891
        </h2>
          <p className="text-slate-400">
            websites hacked today
            <span className="block text-slate-700">Based on Crowdstrike breach data</span>
          </p>
        </div>

        {/* 4. Scroll Indicator (Only shows if JS loads) */}
        <div className="absolute bottom-[5vh] left-1/2 -translate-x-1/2">
          <div className="animate-bounce text-slate-600">
            ▼ SCROLL TO SEE MORE ▼
          </div>
        </div>
      </section>


      <section className="py-20 bg-slate-800 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-6">
          <span className="text-cyan-400">HOW HACKERS</span> EXPLOIT YOUR CODE
        </h2>
    
          {/* Vulnerability Context */}
          <div className="bg-slate-900/50 border-l-4 border-red-500 px-4 py-3 mb-8">
            <p className="font-semibold">
              LET&rsquoS SAY YOUR CODE HAS:  
              <span className="text-red-400 ml-2 font-mono">{simulatedVuln.title}</span>
            </p>
            <p className="text-slate-400 mt-1 text-sm">
              {simulatedVuln.desc}
            </p>
          </div>

          <SimulatedHack desc={simulatedVuln.desc} />
        </div>
      </section>
    </main>
  );
}
