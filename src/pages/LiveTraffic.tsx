import React, { useEffect, useState, memo } from 'react';
import { useToast } from '../contexts/ToastContext';
import { TrafficSimulator } from '../lib/simulator';
import { RequestEvent } from '../types';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { formatDate } from '../lib/utils';
import { Shield, ShieldAlert, Activity } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const EventRow = memo(({ event }: { event: RequestEvent }) => {
  return (
    <TableRow className="cursor-pointer hover:bg-[#161616]">
      <TableCell className="text-[#A1A1AA] text-xs">
        {formatDate(event.timestamp)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className={
            event.method === 'GET' ? 'text-blue-400' :
            event.method === 'POST' ? 'text-green-500' :
            'text-orange-400'
          }>{event.method}</span>
          <span className="text-[#E4E4E7]">{event.path}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={event.status >= 400 ? 'destructive' : 'success'}>
          {event.status}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-xs text-[#A1A1AA]">
        {event.sourceIp}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-[#161616] rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                event.riskScore > 80 ? 'bg-red-500' :
                event.riskScore > 40 ? 'bg-orange-400' :
                'bg-green-500'
              }`}
              style={{ width: `${event.riskScore}%` }}
            ></div>
          </div>
          <span className="text-xs text-[#A1A1AA] w-6">{event.riskScore}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={
          event.decision === 'BLOCK' ? 'destructive' :
          event.decision === 'RATE_LIMIT' ? 'warning' :
          event.decision === 'MONITOR' ? 'secondary' :
          'outline'
        }>
          {event.decision === 'BLOCK' && <ShieldAlert className="w-3 h-3 mr-1" />}
          {event.decision === 'ALLOW' && <Shield className="w-3 h-3 mr-1 text-[#71717A]" />}
          {event.decision}
        </Badge>
      </TableCell>
    </TableRow>
  );
});

export function LiveTraffic() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [events, setEvents] = useState<RequestEvent[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [showHighRiskOnly, setShowHighRiskOnly] = useState(false);
  const [showBlockedOnly, setShowBlockedOnly] = useState(false);

  useEffect(() => {
    const simulator = TrafficSimulator.getInstance();
    if (isLive) {
      simulator.start();
    } else {
      simulator.stop();
    }
    const unsubscribe = simulator.subscribe(async (event) => {
      setEvents((prev) => [event, ...prev].slice(0, 100));
      
      if (event.threats && event.threats.length > 0) {
        const threat = event.threats[0];
        const newIncident = {
          id: `INC-${Math.floor(Math.random() * 10000)}`,
          title: `${threat.category} Detected`,
          severity: threat.severity,
          status: 'OPEN',
          threatType: threat.category,
          endpoint: event.path,
          sourceIp: event.sourceIp,
          userSession: event.session,
          riskScore: event.riskScore,
          confidence: threat.confidence,
          firstSeen: event.timestamp,
          lastSeen: event.timestamp,
          occurrences: 1,
          actionTaken: event.decision,
          events: []
        };
        
        const localIncidents = JSON.parse(localStorage.getItem('app_incidents') || '[]');
        localStorage.setItem('app_incidents', JSON.stringify([newIncident, ...localIncidents]));

        if (supabase && user) {
          try {
            await supabase.from('incidents').insert([{
              id: newIncident.id,
              user_id: user.id,
              title: newIncident.title,
              severity: newIncident.severity,
              status: newIncident.status,
              threat_type: newIncident.threatType,
              endpoint: newIncident.endpoint,
              source_ip: newIncident.sourceIp,
              user_session: newIncident.userSession,
              risk_score: newIncident.riskScore,
              confidence: newIncident.confidence,
              first_seen: newIncident.firstSeen,
              last_seen: newIncident.lastSeen,
              occurrences: newIncident.occurrences,
              action_taken: newIncident.actionTaken
            }]);
          } catch (error) {
            console.error("Failed to save generated incident", error);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [isLive, user]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E4E4E7] flex items-center gap-3">
            Live Traffic Viewer
            {isLive && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            )}
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Real-time API gateway request logging and analysis.</p>
        </div>
        <div className="flex gap-3">
          <Button variant={isLive ? "destructive" : "default"} onClick={() => { setIsLive(!isLive); toast(isLive ? "Live monitoring paused" : "Live monitoring resumed", isLive ? "warning" : "success"); }}>
            {isLive ? 'Pause Stream' : 'Start Stream'}
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <Input 
          placeholder="Filter by endpoint, IP, method, or status..." 
          className="max-w-md" 
          value={filterText} 
          onChange={(e) => setFilterText(e.target.value)} 
        />
        <Button variant={showHighRiskOnly ? "default" : "outline"} className={showHighRiskOnly ? "bg-blue-600 border-0 text-white" : "border-[#27272A]"} onClick={() => setShowHighRiskOnly(!showHighRiskOnly)}>Filter Risk {'>'} 50</Button>
        <Button variant={showBlockedOnly ? "default" : "outline"} className={showBlockedOnly ? "bg-blue-600 border-0 text-white" : "border-[#27272A]"} onClick={() => setShowBlockedOnly(!showBlockedOnly)}>Show Blocked Only</Button>
      </div>

      <div className="bg-[#111111] border border-[#27272A] rounded-xl shadow-inner overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#161616] hover:bg-[#161616]">
              <TableHead>Timestamp</TableHead>
              <TableHead>Method/Path</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source IP</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center text-[#71717A]">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  No traffic captured. Start the stream to view live requests.
                </TableCell>
              </TableRow>
            ) : (
              events
                .filter(e => {
                  const matchesHighRisk = !showHighRiskOnly || e.riskScore > 50;
                  const matchesBlocked = !showBlockedOnly || e.decision === 'BLOCK';
                  const searchUpper = filterText.toUpperCase();
                  const matchesSearch = e.path.includes(filterText) || e.sourceIp.includes(filterText) || e.method.includes(searchUpper) || e.status.toString().includes(filterText);
                  return matchesHighRisk && matchesBlocked && matchesSearch;
                })
                .map((event) => <EventRow key={event.id} event={event} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
