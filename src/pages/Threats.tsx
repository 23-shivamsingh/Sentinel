import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Threats() {
  const [threats, setThreats] = useState<any[]>([]);

  useEffect(() => {
    const loadThreats = () => {
      try {
        const stored = localStorage.getItem('app_incidents');
        if (stored) {
          const parsed = JSON.parse(stored);
          setThreats(parsed);
        } else {
          setThreats([
            { id: "1", threatType: 'SQL Injection', sourceIp: '192.168.1.100', endpoint: '/api/v1/auth', severity: 'CRITICAL', lastSeen: new Date(Date.now() - 600000).toISOString() },
            { id: "2", threatType: 'Rate Limit Abuse', sourceIp: '10.0.0.45', endpoint: '/api/v1/products', severity: 'HIGH', lastSeen: new Date(Date.now() - 3600000).toISOString() },
            { id: "3", threatType: 'BOLA Attempt', sourceIp: '172.16.0.5', endpoint: '/api/v1/users/5/profile', severity: 'CRITICAL', lastSeen: new Date(Date.now() - 7200000).toISOString() },
          ]);
        }
      } catch (e) {}
    };
    
    loadThreats();
    const interval = setInterval(loadThreats, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-8 w-8 text-orange-400" />
        <h1 className="text-3xl font-bold text-[#E4E4E7]">Threat Intelligence</h1>
      </div>
      <p className="text-[#A1A1AA]">Review active and historical threats targeting your APIs in real-time.</p>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Recent Threats
            <span className="relative flex h-3 w-3 ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Threat Type</TableHead><TableHead>Source IP</TableHead><TableHead>Target Endpoint</TableHead><TableHead>Severity</TableHead><TableHead className="text-right">Time</TableHead></TableRow></TableHeader>
            <TableBody>
              {threats.map((threat) => (
                <TableRow key={threat.id} className="hover:bg-[#161616] transition-colors">
                  <TableCell className="font-medium text-[#E4E4E7]">{threat.threatType}</TableCell>
                  <TableCell className="font-mono text-xs text-[#A1A1AA]">{threat.sourceIp}</TableCell>
                  <TableCell className="font-mono text-sm text-[#A1A1AA]">{threat.endpoint}</TableCell>
                  <TableCell><Badge variant={threat.severity === 'CRITICAL' ? 'destructive' : 'warning'}>{threat.severity}</Badge></TableCell>
                  <TableCell className="text-right text-[#A1A1AA] text-sm">{threat.lastSeen ? formatDistanceToNow(new Date(threat.lastSeen), { addSuffix: true }) : 'Just now'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
