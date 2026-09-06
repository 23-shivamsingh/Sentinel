import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { ShieldCheck, Plus, Trash2, Edit2, Zap, Globe, Lock, Activity, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';

const Toggle = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
  <button 
    role="switch" 
    aria-checked={active}
    onClick={onToggle}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#111111] ${active ? 'bg-blue-600' : 'bg-[#27272A]'}`}
  >
    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-1'}`} />
  </button>
);

export function Policies() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [globalSafeguards, setGlobalSafeguards] = useState([
    { id: 'g1', name: 'BOLA Protection', description: 'Automatically detect and block sequential ID enumeration attempts.', icon: <Lock className="w-5 h-5 text-purple-400" />, active: true },
    { id: 'g2', name: 'Global Rate Limiting', description: 'Enforce strict 100 req/min baseline limit on all unauthenticated endpoints.', icon: <Activity className="w-5 h-5 text-blue-400" />, active: true },
    { id: 'g3', name: 'Geo-Fencing (High Risk)', description: 'Block inbound traffic originating from known high-risk geographical regions.', icon: <Globe className="w-5 h-5 text-orange-400" />, active: false },
    { id: 'g4', name: 'Strict Schema Validation', description: 'Drop payloads that contain unexpected properties not defined in the OpenAPI spec.', icon: <ShieldCheck className="w-5 h-5 text-green-400" />, active: true },
  ]);

  const defaultRules = [
    { id: 'r1', condition: 'Threat == "SQL Injection"', action: 'BLOCK_IP', severity: 'CRITICAL', status: 'Active' },
    { id: 'r2', condition: 'Failed Logins > 10 per min', action: 'RATE_LIMIT', severity: 'HIGH', status: 'Active' },
    { id: 'r3', condition: 'Endpoint == "/api/v1/admin/*" AND Auth == "None"', action: 'ALERT_SOC', severity: 'CRITICAL', status: 'Active' },
    { id: 'r4', condition: 'Risk Score >= 90', action: 'SESSION_REVOKE', severity: 'HIGH', status: 'Inactive' },
  ];

  const [customRules, setCustomRules] = useState<any[]>(() => {
    const saved = localStorage.getItem('app_rules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return defaultRules;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [formData, setFormData] = useState({ condition: '', action: 'BLOCK_IP', severity: 'HIGH', status: 'Active' });

  useEffect(() => {
    fetchRules();
  }, [user]);

  const syncRulesToEngine = async (rules: any[]) => {
    try {
      await fetch('/api/internal/sync-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules })
      });
    } catch (e) {
      console.error('Failed to sync rules to engine', e);
    }
  };

  const fetchRules = async () => {
    let currentRules = customRules;
    if (supabase && user) {
      try {
        const { data, error } = await supabase
          .from('custom_rules')
          .select('*')
          .eq('user_id', user.id);
        
        if (!error && data && data.length > 0) {
          setCustomRules(prev => {
            const newRules = data.filter(d => !prev.find(p => p.id === d.id));
            const updated = [...prev, ...newRules];
            localStorage.setItem('app_rules', JSON.stringify(updated));
            currentRules = updated;
            return updated;
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    syncRulesToEngine(currentRules);
  };

  const toggleSafeguard = (id: string) => {
    const safeguard = globalSafeguards.find(sg => sg.id === id);
    if (!safeguard) return;
    
    const newState = !safeguard.active;
    toast(`${safeguard.name} ${newState ? 'enabled' : 'disabled'}`, newState ? 'success' : 'info');
    
    setGlobalSafeguards(prev => prev.map(sg => {
      if (sg.id === id) {
        return { ...sg, active: newState };
      }
      return sg;
    }));
  };

  const deleteRule = async (id: string) => {
    if (supabase && user) {
      try {
        await supabase.from('custom_rules').delete().eq('id', id).eq('user_id', user.id);
      } catch (e) {
        console.error(e);
      }
    }
    const updated = customRules.filter(r => r.id !== id);
    setCustomRules(updated);
    localStorage.setItem('app_rules', JSON.stringify(updated));
    syncRulesToEngine(updated);
    toast("Custom rule deleted successfully", "success");
  };

  const openCreateModal = () => {
    setEditingRule(null);
    setFormData({ condition: '', action: 'BLOCK_IP', severity: 'HIGH', status: 'Active' });
    setIsModalOpen(true);
  };

  const openEditModal = (rule: any) => {
    setEditingRule(rule);
    setFormData({ condition: rule.condition, action: rule.action, severity: rule.severity, status: rule.status });
    setIsModalOpen(true);
  };

  const saveRule = async () => {
    if (!formData.condition.trim()) {
      toast("Condition is required", "error");
      return;
    }

    const newRule = {
      id: editingRule ? editingRule.id : `RULE-${Math.floor(Math.random() * 10000)}`,
      user_id: user?.id || 'local',
      ...formData
    };

    let updatedRules = [];
    if (editingRule) {
      updatedRules = customRules.map(r => r.id === newRule.id ? newRule : r);
      if (supabase && user) {
        try {
          await supabase.from('custom_rules').update({
            condition: newRule.condition,
            action: newRule.action,
            severity: newRule.severity,
            status: newRule.status
          }).eq('id', newRule.id).eq('user_id', user.id);
        } catch (e) {
          console.error(e);
        }
      }
      toast("Rule updated successfully", "success");
    } else {
      updatedRules = [newRule, ...customRules];
      if (supabase && user) {
        try {
          await supabase.from('custom_rules').insert([newRule]);
        } catch (e) {
          console.error(e);
        }
      }
      toast("Rule created successfully", "success");
    }

    setCustomRules(updatedRules);
    localStorage.setItem('app_rules', JSON.stringify(updatedRules));
    syncRulesToEngine(updatedRules);
    setIsModalOpen(false);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'BLOCK_IP': return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">BLOCK IP</Badge>;
      case 'RATE_LIMIT': return <Badge variant="warning" className="bg-orange-500/10 text-orange-500 border-orange-500/20">RATE LIMIT</Badge>;
      case 'SESSION_REVOKE': return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">REVOKE SESSION</Badge>;
      case 'ALERT_SOC': return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">ALERT SOC</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Zap className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#E4E4E7]">Control & Safeguard Policies</h1>
            <p className="text-sm text-[#A1A1AA] mt-1">Configure automated safeguards, rate limits, and incident response rules.</p>
          </div>
        </div>
      </div>

      {/* Global Safeguards Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#E4E4E7]">Global Safeguards</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {globalSafeguards.map((safeguard) => (
            <Card key={safeguard.id} className={`border-[#27272A] bg-[#111111] transition-colors ${safeguard.active ? 'border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.05)]' : ''}`}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-2">
                  {safeguard.icon}
                  <CardTitle className="text-md">{safeguard.name}</CardTitle>
                </div>
                <Toggle active={safeguard.active} onToggle={() => toggleSafeguard(safeguard.id)} />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">{safeguard.description}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    {safeguard.active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${safeguard.active ? 'bg-green-500' : 'bg-[#52525B]'}`}></span>
                  </span>
                  <span className="text-xs font-medium text-[#A1A1AA]">
                    {safeguard.active ? 'Enforcing across all APIs' : 'Disabled'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Custom Rules Engine Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#E4E4E7]">Custom Response Rules</h2>
            <p className="text-sm text-[#A1A1AA]">Granular "If X, then Y" policies triggered by live threat metrics.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        </div>
        
        <Card className="border-[#27272A] bg-[#111111]">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#161616] hover:bg-[#161616] border-b-[#27272A]">
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Condition (If...)</TableHead>
                  <TableHead>Automated Response (Then...)</TableHead>
                  <TableHead>Severity Match</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customRules.map((rule) => (
                  <TableRow key={rule.id} className="border-b-[#27272A] hover:bg-[#161616]/50">
                    <TableCell>
                      <Badge variant="outline" className={rule.status === 'Active' ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-[#52525B] text-[#A1A1AA]'}>
                        {rule.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#E4E4E7]">
                      {rule.condition}
                    </TableCell>
                    <TableCell>
                      {getActionBadge(rule.action)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.severity === 'CRITICAL' ? 'destructive' : 'warning'}>
                        {rule.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#A1A1AA] hover:text-white" onClick={() => openEditModal(rule)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#A1A1AA] hover:text-red-400" onClick={() => deleteRule(rule.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Create/Edit Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg bg-[#111111] border-[#27272A] shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[#27272A] pb-4">
              <CardTitle className="text-xl">{editingRule ? 'Edit Custom Rule' : 'Create Custom Rule'}</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#A1A1AA] hover:text-white" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#E4E4E7]">Condition</label>
                <Input 
                  value={formData.condition} 
                  onChange={(e) => setFormData({...formData, condition: e.target.value})} 
                  placeholder='e.g., Threat == "SQL Injection"'
                  className="bg-[#161616] border-[#27272A] text-white placeholder:text-[#52525B]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#E4E4E7]">Action</label>
                <select 
                  value={formData.action}
                  onChange={(e) => setFormData({...formData, action: e.target.value})}
                  className="w-full rounded-md border border-[#27272A] bg-[#161616] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BLOCK_IP">BLOCK_IP</option>
                  <option value="RATE_LIMIT">RATE_LIMIT</option>
                  <option value="SESSION_REVOKE">SESSION_REVOKE</option>
                  <option value="ALERT_SOC">ALERT_SOC</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#E4E4E7]">Severity</label>
                  <select 
                    value={formData.severity}
                    onChange={(e) => setFormData({...formData, severity: e.target.value})}
                    className="w-full rounded-md border border-[#27272A] bg-[#161616] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#E4E4E7]">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full rounded-md border border-[#27272A] bg-[#161616] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-[#27272A] mt-6">
                <Button variant="outline" className="border-[#27272A] text-[#E4E4E7] hover:bg-[#161616]" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0" onClick={saveRule}>
                  {editingRule ? 'Save Changes' : 'Create Rule'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
