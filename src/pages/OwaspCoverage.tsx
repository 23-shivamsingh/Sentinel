import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { CheckSquare } from 'lucide-react';

export function OwaspCoverage() {
  const categories = [
    { id: 'API1:2023', name: 'Broken Object Level Authorization', coverage: 100 },
    { id: 'API2:2023', name: 'Broken Authentication', coverage: 95 },
    { id: 'API3:2023', name: 'Broken Object Property Level Authorization', coverage: 80 },
    { id: 'API4:2023', name: 'Unrestricted Resource Consumption', coverage: 100 },
    { id: 'API5:2023', name: 'Broken Function Level Authorization', coverage: 90 },
    { id: 'API6:2023', name: 'Unrestricted Access to Sensitive Business Flows', coverage: 75 },
    { id: 'API7:2023', name: 'Server Side Request Forgery', coverage: 85 },
    { id: 'API8:2023', name: 'Security Misconfiguration', coverage: 95 },
    { id: 'API9:2023', name: 'Improper Inventory Management', coverage: 100 },
    { id: 'API10:2023', name: 'Unsafe Consumption of APIs', coverage: 60 },
  ];
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3"><CheckSquare className="h-8 w-8 text-purple-400" /><h1 className="text-3xl font-bold text-[#E4E4E7]">OWASP API Top 10 Coverage</h1></div>
      <p className="text-[#A1A1AA]">Current protection coverage against the OWASP API Security Top 10 (2023).</p>
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((cat) => (
          <Card key={cat.id}><CardContent className="p-6"><div className="flex items-center justify-between mb-2"><div><h3 className="font-bold text-[#E4E4E7]">{cat.id}</h3><p className="text-sm text-[#A1A1AA]">{cat.name}</p></div><div className="text-2xl font-semibold" style={{ color: cat.coverage >= 90 ? '#4ade80' : cat.coverage >= 75 ? '#fbbf24' : '#f87171' }}>{cat.coverage}%</div></div><div className="w-full bg-[#161616] rounded-full h-2 mt-4"><div className="h-2 rounded-full" style={{ width: `${cat.coverage}%`, backgroundColor: cat.coverage >= 90 ? '#4ade80' : cat.coverage >= 75 ? '#fbbf24' : '#f87171' }}></div></div></CardContent></Card>
        ))}
      </div>
    </div>
  );
}
