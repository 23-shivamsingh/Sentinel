import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LogOut, Search, Bell, ShieldCheck, HardHat, PlayCircle, AlertTriangle, Clock, X } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { TrafficSimulator } from '../lib/simulator';
import { useNavigate, Link } from 'react-router-dom';

export function Topbar({ judgeMode, setJudgeMode }: { judgeMode: boolean, setJudgeMode: (v: boolean) => void }) {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<{ type: string, title: string, id: string, detail: string }[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: { type: string, title: string, id: string, detail: string }[] = [];

    // Search Incidents
    try {
      const incidents = JSON.parse(localStorage.getItem('app_incidents') || '[]');
      incidents.forEach((inc: any) => {
        if (
          inc.title?.toLowerCase().includes(query) ||
          inc.id?.toLowerCase().includes(query) ||
          inc.threatType?.toLowerCase().includes(query) ||
          inc.endpoint?.toLowerCase().includes(query) ||
          inc.sourceIp?.toLowerCase().includes(query)
        ) {
          results.push({ type: 'Incident', title: inc.title || inc.threatType, id: inc.id, detail: `${inc.threatType} on ${inc.endpoint}` });
        }
      });
    } catch (e) {}

    // Search Endpoints
    try {
      const endpoints = JSON.parse(localStorage.getItem('app_endpoints') || '[]');
      endpoints.forEach((ep: any) => {
        if (ep.path?.toLowerCase().includes(query) || ep.method?.toLowerCase().includes(query)) {
          results.push({ type: 'Endpoint', title: `${ep.method} ${ep.path}`, id: ep.id, detail: `Status: ${ep.status}` });
        }
      });
    } catch (e) {}

    setSearchResults(results.slice(0, 8)); // Max 8 results
    setShowSearchResults(true);
  }, [searchQuery]);

  useEffect(() => {
    let interval: any;
    if (showNotifications) {
      // Load initially
      const loadIncidents = () => {
        try {
          const stored = localStorage.getItem('app_incidents');
          if (stored) {
            const parsed = JSON.parse(stored);
            setRecentIncidents(parsed.slice(0, 5)); // Get top 5 recent
          }
        } catch (e) { }
      };
      loadIncidents();
      // Poll while open so demo traffic shows up live
      interval = setInterval(loadIncidents, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showNotifications]);

  const handleDemo = async () => {
    setIsDemoRunning(true);
    // 1. Start the live traffic UI simulator
    TrafficSimulator.getInstance().start();
    toast("Security Demo Started. Live traffic stream active.", "success");
    
    // Redirect to live traffic to see the stream
    navigate('/traffic');
    
    // 2. Fire a real request to the backend to trigger the Express middleware
    try {
      // Fire a normal request
      await fetch('/api/v1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: "demo_user" })
      });
      
      // Fire a malicious request (SQLi)
      const res = await fetch('/api/v1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: "admin\" OR 1=1 --" })
      });
      
      if (res.status === 403 || res.status === 429) {
        toast("Backend Engine successfully intercepted a real SQL Injection payload!", "success");
      }
      
      // Fire a broken auth request
      await fetch('/api/v1/admin/users', {
        method: 'GET'
      });
    } catch (e) {
      console.error("Demo requests failed", e);
    }
    
    setTimeout(() => setIsDemoRunning(false), 5000);
  };

  return (
    <header className="flex h-16 items-center gap-4 border-b border-[#27272A] bg-[#0D0D0D] px-6 shrink-0 z-10 sticky top-0">
      <div className="flex-1 flex items-center gap-4">
        <div className="relative w-96 hidden md:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A]" />
          <Input 
            id="global-search"
            type="text" 
            placeholder="Search endpoints, IPs, threats (Cmd+K)" 
            className="pl-10 bg-[#161616] border-[#27272A] h-9" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim()) setShowSearchResults(true);
            }}
          />
          {showSearchResults && (
            <div className="absolute top-full left-0 mt-2 w-full bg-[#0D0D0D] border border-[#27272A] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
              <div className="max-h-[400px] overflow-y-auto py-2">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-4 text-center text-[#A1A1AA] text-sm">
                    No results found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {searchResults.map((res, idx) => (
                      <Link 
                        key={idx}
                        to={res.type === 'Incident' ? '/incidents' : '/endpoints'}
                        state={res.type === 'Incident' ? { selectedIncidentId: res.id } : {}}
                        onClick={() => {
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="px-4 py-2.5 hover:bg-[#161616] transition-colors flex gap-3 group items-center"
                      >
                        <div className="shrink-0">
                          {res.type === 'Incident' ? (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          ) : (
                            <ShieldCheck className="h-4 w-4 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#E4E4E7] truncate">{res.title}</p>
                          <p className="text-[10px] text-[#A1A1AA] truncate mt-0.5">{res.detail}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] h-4 leading-3 uppercase text-[#71717A] border-[#27272A]">
                          {res.type}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 border-r border-[#27272A] pr-4">
          <span className="text-xs text-[#71717A]">Environment:</span>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Production</Badge>
        </div>
        <div className="flex items-center gap-2 border-r border-[#27272A] pr-4">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          <span className="text-xs font-medium text-[#A1A1AA]">System Healthy</span>
        </div>
        
        {judgeMode && (
          <Button 
            variant="default" 
            size="sm" 
            className="bg-red-600 hover:bg-red-500 text-white border-0" 
            onClick={handleDemo}
            disabled={isDemoRunning}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            {isDemoRunning ? 'Simulating...' : 'Start Security Demo'}
          </Button>
        )}

        <Button variant={judgeMode ? "default" : "outline"} size="sm" className={judgeMode ? "bg-blue-600 hover:bg-blue-500 text-[#E4E4E7] border-0" : "border-[#27272A] text-[#A1A1AA] hover:text-[#E4E4E7] hover:bg-[#161616]"} onClick={() => setJudgeMode(!judgeMode)}>
          <HardHat className="h-4 w-4 mr-2" />
          Judge Mode {judgeMode ? 'ON' : 'OFF'}
        </Button>
        <Button variant="ghost" size="icon" className="text-[#71717A] hover:text-[#E4E4E7]" onClick={signOut}>
          <LogOut className="h-5 w-5" />
        </Button>
        <div className="relative" ref={dropdownRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`text-[#71717A] hover:text-[#E4E4E7] relative ${showNotifications ? 'bg-[#161616] text-[#E4E4E7]' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0D0D0D]"></span>
          </Button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0D0D0D] border border-[#27272A] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-[#27272A] flex items-center justify-between bg-[#111111]">
                <h3 className="font-semibold text-sm text-[#E4E4E7]">Notifications</h3>
                <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/20">
                  {recentIncidents.length} New
                </Badge>
              </div>
              
              <div className="max-h-[320px] overflow-y-auto">
                {recentIncidents.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[#A1A1AA] text-sm">
                    No recent alerts.
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {recentIncidents.map((incident, idx) => (
                      <Link 
                        key={incident.id || idx}
                        to="/incidents"
                        state={{ selectedIncidentId: incident.id }}
                        onClick={() => setShowNotifications(false)}
                        className="px-4 py-3 border-b border-[#27272A] hover:bg-[#161616] transition-colors flex gap-3 group"
                      >
                        <div className="mt-0.5 shrink-0">
                          {incident.severity === 'CRITICAL' ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : incident.severity === 'HIGH' ? (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#E4E4E7] truncate">{incident.title}</p>
                          <p className="text-xs text-[#A1A1AA] truncate mt-0.5">{incident.endpoint}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-[#71717A]">{incident.threatType}</span>
                            <span className="text-[10px] font-mono text-red-400">{incident.actionTaken}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-2 bg-[#111111] border-t border-[#27272A]">
                <Button 
                  variant="ghost" 
                  className="w-full text-xs text-[#A1A1AA] hover:text-[#E4E4E7]"
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/incidents');
                  }}
                >
                  View All Incidents
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="h-8 w-8 rounded-full bg-[#27272A] flex items-center justify-center text-sm font-medium text-[#E4E4E7] shadow-inner">AS</div>
      </div>
    </header>
  );
}
