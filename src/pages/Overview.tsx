import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Activity, ShieldAlert, ShieldX, KeySquare, ShieldCheck, Zap } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';

const mockTrafficData = Array.from({ length: 24 }).map((_, i) => ({ time: `${i}:00`, requests: Math.floor(Math.random() * 5000) + 1000, threats: Math.floor(Math.random() * 200) + 10 }));
const mockThreatDistribution = [ { name: 'BOLA', value: 400, color: '#f59e0b' }, { name: 'Broken Auth', value: 300, color: '#ef4444' }, { name: 'Injection', value: 300, color: '#8b5cf6' }, { name: 'Rate Abuse', value: 200, color: '#3b82f6' } ];

export function Overview() {
  const trafficData = useMemo(() => mockTrafficData, []);
  const threatDist = useMemo(() => mockThreatDistribution, []);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight text-[#E4E4E7]">Security Operations Center</h1><p className="text-sm text-[#A1A1AA] mt-1">Real-time threat detection and API security posture.</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Requests Today" value="124,592" trend="+12%" icon={Activity} color="text-blue-400" />
        <KpiCard title="Threats Detected" value="1,204" trend="+4%" icon={ShieldAlert} color="text-orange-400" />
        <KpiCard title="Requests Blocked" value="892" trend="-2%" icon={ShieldX} color="text-red-400/60" />
        <KpiCard title="Critical Incidents" value="3" trend="0%" icon={AlertTriangleIcon} color="text-red-500" />
        <KpiCard title="Protected APIs" value="12" trend="+1" icon={KeySquare} color="text-green-500" />
        <KpiCard title="Security Score" value="A-" trend="Stable" icon={ShieldCheck} color="text-blue-400" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Live Traffic & Threats</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient><linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="time" stroke="#52525B" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525B" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#111111', borderColor: '#27272A', borderRadius: '8px' }} itemStyle={{ color: '#E4E4E7' }} />
                  <Area type="monotone" dataKey="requests" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRequests)" strokeWidth={2} />
                  <Area type="monotone" dataKey="threats" stroke="#ef4444" fillOpacity={1} fill="url(#colorThreats)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Threat Distribution</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={threatDist} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{threatDist.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111111', borderColor: '#27272A', borderRadius: '8px' }} itemStyle={{ color: '#E4E4E7' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full grid grid-cols-2 gap-2 mt-4">{threatDist.map(t => (<div key={t.name} className="flex items-center text-[10px] text-[#A1A1AA]"><div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: t.color }}></div>{t.name}</div>))}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AlertTriangleIcon(props: any) {
  return (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>);
}

function KpiCard({ title, value, trend, icon: Icon, color }: any) {
  const isPositive = trend.startsWith('+');
  const isZero = trend === '0%' || trend === 'Stable';
  return (
    <Card><CardContent className="p-5 flex flex-col justify-between h-full"><div className="flex justify-between items-start mb-4"><p className="text-[10px] uppercase tracking-widest text-[#52525B] font-bold">{title}</p><div className={`p-2 rounded-lg bg-[#161616] ${color}`}><Icon className="h-5 w-5" /></div></div><div><h3 className="text-2xl font-bold">{value}</h3><p className={cn("text-[10px] mt-1", isZero ? "text-[#71717A]" : (isPositive ? (title.includes('Threats') || title.includes('Blocked') || title.includes('Incidents') ? "text-red-400/60" : "text-green-500/60") : "text-green-500/60"))}>{trend} from yesterday</p></div></CardContent></Card>
  );
}
