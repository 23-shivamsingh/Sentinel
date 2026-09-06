import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Plus, Upload, KeySquare, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Input } from '../components/ui/input';

const initialApis = [
  { id: "api-prod-eu1", name: "Payment Gateway API", baseUrl: "https://api.sentinel.demo/v1/payments", environment: "Production", status: "Healthy", endpointCount: 14, requests24h: 1250000, threats24h: 312, securityScore: 92, lastActivity: "2 min ago" },
  { id: "api-prod-us1", name: "User Management API", baseUrl: "https://api.sentinel.demo/v2/users", environment: "Production", status: "Healthy", endpointCount: 28, requests24h: 840000, threats24h: 1405, securityScore: 78, lastActivity: "Just now" },
  { id: "api-stg-us1", name: "Inventory Sync API", baseUrl: "https://staging.api.sentinel.demo/v1/inventory", environment: "Staging", status: "Degraded", endpointCount: 8, requests24h: 12000, threats24h: 45, securityScore: 65, lastActivity: "1 hour ago" }
];

export function APIs() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [apis, setApis] = useState(initialApis);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const spec = JSON.parse(content);
        
        const name = spec.info?.title || "Imported API";
        const baseUrl = spec.servers?.[0]?.url || "https://api.example.com";
        const endpointCount = spec.paths ? Object.keys(spec.paths).length : 0;
        
        const newApi = {
          name,
          baseUrl,
          environment: "Production",
          status: "Healthy",
          endpointCount,
          requests24h: 0,
          threats24h: 0,
          securityScore: 100,
          lastActivity: "Just now"
        };
        
        if (supabase && user) {
          const { data, error } = await supabase
            .from('apis')
            .insert([{
              user_id: user.id,
              name: newApi.name,
              base_url: newApi.baseUrl,
              environment: newApi.environment,
              status: newApi.status,
              endpoint_count: newApi.endpointCount,
              requests_24h: newApi.requests24h,
              threats_24h: newApi.threats24h,
              security_score: newApi.securityScore,
              last_activity: newApi.lastActivity
            }])
            .select();
            
          if (error) {
            console.error("Supabase Error:", error);
            const localApi = { ...newApi, id: "api-import-" + Date.now() };
            setApis(prev => [localApi, ...prev]);
            toast("Parsed successfully but failed to save to DB. Added locally.", "warning");
          } else if (data && data[0]) {
            const savedApi = {
              id: data[0].id,
              name: data[0].name,
              baseUrl: data[0].base_url,
              environment: data[0].environment,
              status: data[0].status,
              endpointCount: data[0].endpoint_count,
              requests24h: data[0].requests_24h,
              threats24h: data[0].threats_24h,
              securityScore: data[0].security_score,
              lastActivity: data[0].last_activity
            };
            setApis(prev => [savedApi, ...prev]);
            toast(`Successfully imported ${name} with ${endpointCount} endpoints`, "success");
          }
        } else {
          const localApi = { ...newApi, id: "api-import-" + Date.now() };
          setApis(prev => [localApi, ...prev]);
          toast(`Successfully imported ${name} locally`, "success");
        }
      } catch (err) {
        console.error("OpenAPI parse error", err);
        toast("Invalid OpenAPI JSON file", "error");
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const [newApiName, setNewApiName] = useState("");
  const [newApiUrl, setNewApiUrl] = useState("");
  const [newApiEnv, setNewApiEnv] = useState("Production");

  useEffect(() => {
    fetchApis();
  }, [user]);

  const fetchApis = async () => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('apis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching APIs (table might not exist):", error);
        return;
      }
      
      if (data && data.length > 0) {
        const formattedApis = data.map(api => ({
          id: api.id,
          name: api.name,
          baseUrl: api.base_url,
          environment: api.environment,
          status: api.status,
          endpointCount: api.endpoint_count,
          requests24h: api.requests_24h,
          threats24h: api.threats_24h,
          securityScore: api.security_score,
          lastActivity: api.last_activity
        }));
        setApis(formattedApis);
      }
    } catch (err) {
      console.error("Error in fetchApis", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiName || !newApiUrl) return;
    
    const newApi = {
      name: newApiName,
      baseUrl: newApiUrl,
      environment: newApiEnv,
      status: "Healthy",
      endpointCount: 0,
      requests24h: 0,
      threats24h: 0,
      securityScore: 100,
      lastActivity: "Just now"
    };

    if (supabase && user) {
      try {
        const { data, error } = await supabase
          .from('apis')
          .insert([{
            user_id: user.id,
            name: newApiName,
            base_url: newApiUrl,
            environment: newApiEnv,
            status: "Healthy",
            endpoint_count: 0,
            requests_24h: 0,
            threats_24h: 0,
            security_score: 100,
            last_activity: "Just now"
          }])
          .select();
          
        if (error) {
          console.error("Error saving to Supabase:", error);
          toast("Failed to save to database. Is the 'apis' table created?", "error");
          const localApi = { ...newApi, id: "api-custom-" + Date.now() };
          setApis([localApi, ...apis]);
        } else if (data && data[0]) {
          const savedApi = {
            id: data[0].id,
            name: data[0].name,
            baseUrl: data[0].base_url,
            environment: data[0].environment,
            status: data[0].status,
            endpointCount: data[0].endpoint_count,
            requests24h: data[0].requests_24h,
            threats24h: data[0].threats_24h,
            securityScore: data[0].security_score,
            lastActivity: data[0].last_activity
          };
          setApis([savedApi, ...apis]);
          toast("API saved to Supabase successfully", "success");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      const localApi = { ...newApi, id: "api-custom-" + Date.now() };
      setApis([localApi, ...apis]);
      toast("API added locally", "success");
    }
    
    setShowModal(false);
    setNewApiName("");
    setNewApiUrl("");
    setNewApiEnv("Production");
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#E4E4E7]">API Inventory</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">Manage protected APIs and detect shadow endpoints.</p>
        </div>
        <div className="flex gap-3">
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <Button variant="outline" className="border-[#27272A]" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />Import OpenAPI
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />Add API
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {apis.map((api) => (
          <Card key={api.id} className="border-[#27272A] bg-[#111111] hover:border-blue-500/30 transition-colors cursor-pointer">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${api.environment === 'Production' ? 'bg-blue-500/10' : 'bg-[#161616]'}`}>
                    <KeySquare className={`h-5 w-5 ${api.environment === 'Production' ? 'text-blue-400' : 'text-[#71717A]'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{api.name}</CardTitle>
                    <p className="text-xs text-[#A1A1AA] mt-1 font-mono">{api.baseUrl}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <Badge variant={api.environment === 'Production' ? 'success' : 'secondary'}>{api.environment}</Badge>
                <Badge variant={api.status === 'Healthy' ? 'outline' : 'warning'} className={api.status === 'Healthy' ? 'border-green-500/30 text-green-500' : ''}>{api.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#52525B] font-bold">Security Score</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xl font-bold ${api.securityScore > 80 ? 'text-green-500' : 'text-orange-400'}`}>{api.securityScore}</span>
                    {api.securityScore > 80 ? <ShieldCheck className="h-4 w-4 text-green-500" /> : <ShieldAlert className="h-4 w-4 text-orange-400" />}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#52525B] font-bold">Threats (24h)</p>
                  <p className={`text-xl font-bold mt-1 ${api.threats24h > 1000 ? 'text-red-400' : 'text-[#E4E4E7]'}`}>{api.threats24h.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#52525B] font-bold">Endpoints</p>
                  <p className="text-sm font-semibold text-[#E4E4E7] mt-1">{api.endpointCount}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#52525B] font-bold">Traffic (24h)</p>
                  <p className="text-sm font-semibold text-[#E4E4E7] mt-1">{(api.requests24h / 1000000).toFixed(1)}M</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-[#27272A] bg-[#111111] mt-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Shadow API Detection</CardTitle>
              <p className="text-sm text-[#A1A1AA] mt-1">Endpoints detected in live traffic but not present in OpenAPI specifications.</p>
            </div>
            <Badge variant="warning">3 Findings</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-[#161616] border-[#27272A]">
                <TableHead className="text-[#A1A1AA]">Detected Path</TableHead>
                <TableHead className="text-[#A1A1AA]">Method</TableHead>
                <TableHead className="text-[#A1A1AA]">Associated API</TableHead>
                <TableHead className="text-[#A1A1AA]">Last Seen</TableHead>
                <TableHead className="text-[#A1A1AA]">Risk</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-[#27272A]">
                <TableCell className="font-mono text-[10px] text-[#A1A1AA]">/v1/payments/debug/bypass</TableCell>
                <TableCell><span className="text-blue-400 font-mono text-[10px]">GET</span></TableCell>
                <TableCell className="text-sm">Payment Gateway API</TableCell>
                <TableCell className="text-xs text-[#71717A]">10 mins ago</TableCell>
                <TableCell><Badge variant="destructive">CRITICAL</Badge></TableCell>
                <TableCell><Button variant="outline" size="sm" className="border-[#27272A]" onClick={() => toast("Route blocked successfully", "success")}>Block Route</Button></TableCell>
              </TableRow>
              <TableRow className="border-[#27272A]">
                <TableCell className="font-mono text-[10px] text-[#A1A1AA]">/v2/users/export_v1_old</TableCell>
                <TableCell><span className="text-green-500 font-mono text-xs">POST</span></TableCell>
                <TableCell className="text-sm">User Management API</TableCell>
                <TableCell className="text-xs text-[#71717A]">2 hours ago</TableCell>
                <TableCell><Badge variant="warning">HIGH</Badge></TableCell>
                <TableCell><Button variant="outline" size="sm" className="border-[#27272A]" onClick={() => toast("Reviewing API endpoint...", "info")}>Review</Button></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md border-[#27272A] bg-[#111111] shadow-2xl">
            <CardHeader className="border-b border-[#27272A] pb-4">
              <CardTitle className="text-xl">Add New API</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddApi} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#A1A1AA]">API Name</label>
                  <Input 
                    placeholder="e.g. Authentication Service" 
                    value={newApiName} 
                    onChange={(e) => setNewApiName(e.target.value)} 
                    required 
                    className="bg-[#161616] border-[#27272A] text-[#E4E4E7]" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#A1A1AA]">Base URL</label>
                  <Input 
                    placeholder="https://api.example.com/v1" 
                    value={newApiUrl} 
                    onChange={(e) => setNewApiUrl(e.target.value)} 
                    required 
                    className="bg-[#161616] border-[#27272A] text-[#E4E4E7]" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#A1A1AA]">Environment</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-[#27272A] bg-[#161616] px-3 py-2 text-sm text-[#E4E4E7] ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    value={newApiEnv}
                    onChange={(e) => setNewApiEnv(e.target.value)}
                  >
                    <option value="Production">Production</option>
                    <option value="Staging">Staging</option>
                    <option value="Development">Development</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#27272A] mt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="text-[#A1A1AA] hover:text-[#E4E4E7]">Cancel</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white border-0">Save API</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
