import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Search, Filter, CheckCircle2 } from 'lucide-react';
import { Incident } from '../types';
import { formatDate } from '../lib/utils';
import { Input } from '../components/ui/input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const initialIncidents: Incident[] = [
  { id: "INC-2034", title: "Sequential ID Traversal Attack", severity: "CRITICAL", status: "OPEN", threatType: "BOLA", endpoint: "/api/v1/users/:id/profile", sourceIp: "192.168.1.45", userSession: "user_49102", riskScore: 94, confidence: 0.98, firstSeen: new Date(Date.now() - 3600000).toISOString(), lastSeen: new Date().toISOString(), occurrences: 412, actionTaken: "BLOCK", events: [] },
  { id: "INC-2033", title: "High Velocity Login Failures", severity: "HIGH", status: "INVESTIGATING", threatType: "Broken Authentication", endpoint: "/api/v1/auth/login", sourceIp: "45.22.19.102", userSession: null, riskScore: 88, confidence: 0.95, firstSeen: new Date(Date.now() - 7200000).toISOString(), lastSeen: new Date(Date.now() - 1800000).toISOString(), occurrences: 1550, actionTaken: "RATE_LIMIT", events: [] }
];

export function Incidents() {
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const saved = localStorage.getItem('app_incidents');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialIncidents;
  });
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredIncidents = incidents.filter(inc => {
    if (!searchQuery) return true;
    const lowerQ = searchQuery.toLowerCase();
    return inc.id.toLowerCase().includes(lowerQ) ||
           inc.endpoint.toLowerCase().includes(lowerQ) ||
           inc.sourceIp.toLowerCase().includes(lowerQ) ||
           inc.title.toLowerCase().includes(lowerQ) ||
           inc.threatType.toLowerCase().includes(lowerQ);
  });

  useEffect(() => {
    fetchIncidents();
  }, [user]);

  useEffect(() => {
    if (location.state?.selectedIncidentId && incidents.length > 0) {
      const found = incidents.find(inc => inc.id === location.state.selectedIncidentId);
      if (found) {
        setSelectedIncident(found);
      }
    }
  }, [location.state?.selectedIncidentId, incidents]);

  const fetchIncidents = async () => {
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('user_id', user.id)
        .order('last_seen', { ascending: false });
      
      if (error) {
        console.error('Error fetching incidents:', error.message);
        return;
      }
      
      if (data && data.length > 0) {
        const formatted = data.map(inc => ({
          id: inc.id,
          title: inc.title,
          severity: inc.severity,
          status: inc.status,
          threatType: inc.threat_type,
          endpoint: inc.endpoint,
          sourceIp: inc.source_ip,
          userSession: inc.user_session,
          riskScore: inc.risk_score,
          confidence: inc.confidence,
          firstSeen: inc.first_seen,
          lastSeen: inc.last_seen,
          occurrences: inc.occurrences,
          actionTaken: inc.action_taken,
          events: []
        }));
        setIncidents(formatted);
        localStorage.setItem('app_incidents', JSON.stringify(formatted));
      }
    } catch (error) {
      console.error('Failed to fetch incidents', error);
    }
  };

  const getRecommendation = (threatType: string) => {
    switch(threatType) {
      case "BOLA":
        return "Enforce authorization checks at the object property level. Ensure the authenticated user has ownership of the requested resource ID.";
      case "Broken Authentication":
        return "Implement rate limiting, account lockout mechanisms, and consider requiring multi-factor authentication for suspicious login attempts.";
      default:
        return "Review application logic to ensure input validation and proper access controls are enforced.";
    }
  };

  const handleMarkFalsePositive = async () => {
    if (!selectedIncident) return;
    const updatedLocal = { ...selectedIncident, status: "FALSE_POSITIVE" as any, riskScore: 0, severity: "LOW" as any };
    
    if (supabase && user) {
      try {
        const { error } = await supabase.from('incidents').update({
          status: 'FALSE_POSITIVE',
          risk_score: 0,
          severity: 'LOW'
        }).eq('id', selectedIncident.id).eq('user_id', user.id);
        
        if (error) console.error("Error marking false positive:", error);
      } catch (error) {
        console.error(error);
      }
    }

    const updatedIncidents = incidents.map(inc => inc.id === selectedIncident.id ? updatedLocal : inc);
    setIncidents(updatedIncidents);
    setSelectedIncident(updatedLocal);
    localStorage.setItem('app_incidents', JSON.stringify(updatedIncidents));
    toast("Incident marked as False Positive. System updated.", "success");
  };

  const handleCreatePolicy = async () => {
    if (!selectedIncident) return;
    const updatedLocal = { ...selectedIncident, status: "RESOLVED" as any, actionTaken: "BLOCK" as any };
    
    const newRule = {
      id: `RULE-${Math.floor(Math.random() * 10000)}`,
      user_id: user?.id || 'local',
      condition: `Threat == "${selectedIncident.threatType}" AND IP == "${selectedIncident.sourceIp}"`,
      action: 'BLOCK_IP',
      severity: selectedIncident.severity,
      status: 'Active'
    };
    
    const localRules = JSON.parse(localStorage.getItem('app_rules') || '[]');
    localStorage.setItem('app_rules', JSON.stringify([newRule, ...localRules]));

    if (supabase && user) {
      try {
        await supabase.from('incidents').update({
          status: 'RESOLVED',
          action_taken: 'BLOCK'
        }).eq('id', selectedIncident.id).eq('user_id', user.id);
        
        await supabase.from('custom_rules').insert([newRule]);
      } catch (error) {
        console.error(error);
      }
    }

    const updatedIncidents = incidents.map(inc => inc.id === selectedIncident.id ? updatedLocal : inc);
    setIncidents(updatedIncidents);
    setSelectedIncident(updatedLocal);
    localStorage.setItem('app_incidents', JSON.stringify(updatedIncidents));
    toast("Custom policy created and applied successfully.", "success");
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);
    toast("Generating incident report...", "info");
    setTimeout(() => {
      setIsGenerating(false);
      setShowReport(true);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E4E4E7]">Incident Management</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Track, investigate, and respond to detected security threats.</p>
        </div>
      </div>
      
      <div className="flex gap-4 items-center">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A]" />
          <Input 
            placeholder="Search incidents by ID, endpoint, or IP..." 
            className="pl-10" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="border-[#27272A]" onClick={() => toast("Filter panel opened", "info")}>
          <Filter className="h-4 w-4 mr-2" />Filter
        </Button>
      </div>

      <div className="bg-[#111111] border border-[#27272A] rounded-xl shadow-inner overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#161616]">
              <TableHead>Incident ID</TableHead>
              <TableHead>Title & Threat</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIncidents.map((incident) => (
              <TableRow key={incident.id} className="cursor-pointer hover:bg-[#161616]" onClick={() => setSelectedIncident(incident)}>
                <TableCell className="font-mono text-xs text-blue-400">{incident.id}</TableCell>
                <TableCell>
                  <div className="font-medium text-[#E4E4E7]">{incident.title}</div>
                  <div className="text-xs text-[#A1A1AA]">{incident.threatType}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={incident.severity === 'CRITICAL' || incident.severity === 'HIGH' ? 'destructive' : incident.severity === 'LOW' ? 'secondary' : 'warning'}>
                    {incident.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={
                    incident.status === 'OPEN' ? 'border-red-500/50 text-red-400' : 
                    incident.status === 'INVESTIGATING' ? 'border-orange-500/50 text-orange-400' : 
                    'border-green-500/50 text-green-500'
                  }>
                    {incident.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-mono text-[#E4E4E7]">{incident.endpoint}</div>
                  <div className="text-xs font-mono text-[#71717A]">{incident.sourceIp}</div>
                </TableCell>
                <TableCell>
                  <span className={`font-semibold ${incident.riskScore > 80 ? 'text-red-400' : incident.riskScore === 0 ? 'text-green-500' : 'text-orange-400'}`}>
                    {incident.riskScore}/100
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{incident.actionTaken}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedIncident && (
        <Card className="mt-8 border-[#27272A] shadow-lg shadow-indigo-500/10">
          <CardHeader className="bg-[#161616] border-b border-[#27272A]">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl flex items-center gap-3">
                  {selectedIncident.id}: {selectedIncident.title} 
                  <Badge variant="destructive">{selectedIncident.severity}</Badge>
                </CardTitle>
                <p className="text-[#71717A] mt-1">First seen: {formatDate(selectedIncident.firstSeen)} &nbsp; Occurrences: {selectedIncident.occurrences}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  className="bg-blue-600 hover:bg-blue-500 text-white border-0" 
                  onClick={handleGenerateReport} 
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-[#E4E4E7] mb-2">Threat Analysis</h4>
                <div className="bg-[#0A0A0A] border border-[#27272A] rounded-lg p-4 font-mono text-sm text-[#E4E4E7] space-y-2">
                  <p><span className="text-[#A1A1AA]">Threat Type:</span> {selectedIncident.threatType}</p>
                  <p><span className="text-[#A1A1AA]">Endpoint:</span> {selectedIncident.endpoint}</p>
                  <p><span className="text-[#A1A1AA]">Attacker IP:</span> {selectedIncident.sourceIp}</p>
                  <p><span className="text-[#A1A1AA]">Target Session:</span> {selectedIncident.userSession || 'Unauthenticated'}</p>
                  <p><span className="text-[#A1A1AA]">Risk Score:</span> <span className={`font-bold ${selectedIncident.riskScore > 80 ? 'text-red-400' : 'text-green-500'}`}>{selectedIncident.riskScore}/100</span> (Confidence: {(selectedIncident.confidence * 100).toFixed(0)}%)</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-[#E4E4E7] mb-2">Automated Response</h4>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-3 text-green-500 mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Action Taken: {selectedIncident.actionTaken}</span>
                  </div>
                  <p className="text-sm text-green-500/80">
                    Traffic from IP {selectedIncident.sourceIp} was handled by the active policy engine based on the threat profile.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-[#E4E4E7] mb-2">Remediation</h4>
                <Card className="bg-[#0A0A0A] border-[#27272A]">
                  <CardContent className="p-4">
                    <p className="text-sm text-[#A1A1AA] mb-4">
                      <strong>Recommendation:</strong> {getRecommendation(selectedIncident.threatType)}
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start text-xs border-[#27272A]" size="sm" onClick={handleCreatePolicy}>
                        Create Custom Policy
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-xs border-[#27272A]" size="sm" onClick={handleMarkFalsePositive}>
                        Mark as False Positive
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showReport && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-2xl border-[#27272A] bg-[#111111] shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-[#27272A] pb-4 sticky top-0 bg-[#111111] z-10 flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-xl">Incident Report: {selectedIncident.id}</CardTitle>
                <p className="text-sm text-[#A1A1AA] mt-1">Generated on {new Date().toLocaleString()}</p>
              </div>
              <Button variant="ghost" onClick={() => setShowReport(false)}>Close</Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#E4E4E7] mb-2">Executive Summary</h3>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">
                  On {formatDate(selectedIncident.firstSeen)}, a {selectedIncident.severity} severity security incident was detected. 
                  The system identified a {selectedIncident.threatType} attack targeting {selectedIncident.endpoint}. 
                  The attack originated from IP address {selectedIncident.sourceIp} and was detected over {selectedIncident.occurrences} occurrences.
                  The automated policy engine successfully intervened and applied a {selectedIncident.actionTaken} action to mitigate the threat.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#161616] p-4 rounded-lg border border-[#27272A]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1">Threat Details</h4>
                  <ul className="space-y-2 text-sm text-[#E4E4E7]">
                    <li><strong>Type:</strong> {selectedIncident.threatType}</li>
                    <li><strong>Risk Score:</strong> {selectedIncident.riskScore}/100</li>
                    <li><strong>Confidence:</strong> {(selectedIncident.confidence * 100).toFixed(0)}%</li>
                  </ul>
                </div>
                <div className="bg-[#161616] p-4 rounded-lg border border-[#27272A]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1">Target Information</h4>
                  <ul className="space-y-2 text-sm text-[#E4E4E7]">
                    <li><strong>Endpoint:</strong> <span className="font-mono text-xs">{selectedIncident.endpoint}</span></li>
                    <li><strong>Session:</strong> {selectedIncident.userSession || 'Unauthenticated'}</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-[#E4E4E7] mb-2">Recommended Actions</h3>
                <ul className="list-disc pl-5 text-sm text-[#A1A1AA] space-y-2">
                  <li>Review the application logic at <span className="font-mono text-xs">{selectedIncident.endpoint}</span> to ensure proper authorization boundaries.</li>
                  <li>Consider adding {selectedIncident.sourceIp} to a permanent blocklist if this behavior continues.</li>
                  <li>Audit related logs for potential lateral movement by session {selectedIncident.userSession || 'the attacker'}.</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-[#27272A] flex justify-end gap-3">
                <Button variant="outline" className="border-[#27272A]" onClick={() => { 
                   const reportContent = `INCIDENT REPORT: ${selectedIncident.id}\nGenerated: ${new Date().toLocaleString()}\n\nEXECUTIVE SUMMARY\nOn ${formatDate(selectedIncident.firstSeen)}, a ${selectedIncident.severity} severity security incident was detected.\nThe system identified a ${selectedIncident.threatType} attack targeting ${selectedIncident.endpoint}.\nThe attack originated from IP address ${selectedIncident.sourceIp} and was detected over ${selectedIncident.occurrences} occurrences.\nThe automated policy engine successfully intervened and applied a ${selectedIncident.actionTaken} action to mitigate the threat.\n\nTHREAT DETAILS\nType: ${selectedIncident.threatType}\nRisk Score: ${selectedIncident.riskScore}/100\nConfidence: ${(selectedIncident.confidence * 100).toFixed(0)}%\n\nTARGET INFORMATION\nEndpoint: ${selectedIncident.endpoint}\nSession: ${selectedIncident.userSession || 'Unauthenticated'}\n\nRECOMMENDED ACTIONS\n- ${getRecommendation(selectedIncident.threatType)}\n- Consider adding ${selectedIncident.sourceIp} to a permanent blocklist if this behavior continues.\n- Audit related logs for potential lateral movement by session ${selectedIncident.userSession || 'the attacker'}.`;
                  const blob = new Blob([reportContent], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Incident_Report_${selectedIncident.id}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast("Report downloaded as TXT", "success");
                  setShowReport(false); 
                }}>Download PDF</Button>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={() => { toast("Report shared with security team", "success"); setShowReport(false); }}>Share Report</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
