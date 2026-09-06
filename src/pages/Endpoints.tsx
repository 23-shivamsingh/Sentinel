import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Endpoints() {
  const [endpoints, setEndpoints] = useState<any[]>([]);

  useEffect(() => {
    const loadEndpoints = () => {
      try {
        const stored = localStorage.getItem('app_endpoints');
        if (stored) {
          const parsed = JSON.parse(stored);
          setEndpoints(parsed);
        } else {
          setEndpoints([
            { id: 1, method: 'POST', path: '/api/v1/auth/login', status: 'Secured', score: 95 },
            { id: 2, method: 'GET', path: '/api/v1/users/profile', status: 'Warning', score: 72 },
            { id: 3, method: 'PUT', path: '/api/v1/payments', status: 'Secured', score: 98 },
            { id: 4, method: 'DELETE', path: '/api/v1/data/clear', status: 'Critical', score: 45 },
          ]);
        }
      } catch (e) {}
    };

    loadEndpoints();
    const interval = setInterval(loadEndpoints, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-8 w-8 text-blue-400" />
        <h1 className="text-3xl font-bold text-[#E4E4E7]">Endpoints</h1>
      </div>
      <p className="text-[#A1A1AA]">Monitor and manage the security posture of your discovered endpoints in real-time.</p>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Discovered Endpoints
            <span className="relative flex h-3 w-3 ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Security Score</TableHead>
                <TableHead className="text-right">Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.map((ep) => (
                <TableRow key={ep.id} className="hover:bg-[#161616] transition-colors">
                  <TableCell className="font-mono text-xs text-[#A1A1AA]">{ep.method}</TableCell>
                  <TableCell className="font-mono text-sm text-[#E4E4E7]">{ep.path}</TableCell>
                  <TableCell>
                    <Badge variant={ep.status === 'Critical' ? 'destructive' : ep.status === 'Warning' ? 'warning' : 'success'}>
                      {ep.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{ep.score}/100</TableCell>
                  <TableCell className="text-right text-xs text-[#A1A1AA]">
                    {ep.lastSeen ? formatDistanceToNow(new Date(ep.lastSeen), { addSuffix: true }) : 'Just now'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
