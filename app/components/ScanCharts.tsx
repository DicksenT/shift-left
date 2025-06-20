import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { normalizedResult } from '../api/scan/route';
import { sortSeverity } from '../utils/scanHelper';

export const COLORS: Record<string, string> = {
  critical:'#DC2626', // red-600
  high:'#F97316',     // orange-500
  medium:'#FACC15',   // yellow-400
  low:'#4ADE80',      // green-400
  info:'#A3A3A3'      // gray-400
};


export default function ScanCharts({scanResult}: {scanResult: normalizedResult[]}) {
  const severity: Record<string,number> = {}
  const source: Record<string, number> ={}
  scanResult.map((r) =>{
    severity[r.severity] = (severity[r.severity] || 0) + 1
    source[r.source] = (source[r.source] || 0) + 1
  })
  const severityData = Object.entries(severity).map(([key, count]) =>{
    return {
      name: key[0].toUpperCase() + key.slice(1,),
      count,
      key
    }
  })
  sortSeverity(severityData)
  const sourceData = Object.entries((source)).map(([name, count]) =>{
    return {
      name,
      count
    }
  })
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-slate-900 p-4 rounded-2xl shadow">
        <h2 className="text-lg font-semibold mb-2">Severity Breakdown</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={severityData} layout="vertical">
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="count">
              {severityData.map((entry) => (
                <Cell key={entry.key} fill={COLORS[entry.key]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-900 p-4 rounded-2xl shadow">
        <h2 className="text-lg font-semibold mb-2">Source Breakdown</h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={sourceData}
              dataKey="count"
              nameKey="name"
              outerRadius={80}
              fill="#0f172b"
              label
            >
              {sourceData.map((entry, index) => (
                <Cell key={index} fill={["#60A5FA", "#34D399", "#FBBF24"][index]} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
