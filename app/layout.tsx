import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shift-Left Security",
  description: "Scan Vulnerabilities",
   keywords: [
    'DevSecOps', 
    'ShiftLeft Security',
    'Snyk Alternative',
    'Trivy',
    'Semgrep',
    'OWASP Top 10',
    'SAST/DAST',
    'CI/CD Security',
    'Scan Vulnerability',
    'Scan repo',
    'Scan GitHub'
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
