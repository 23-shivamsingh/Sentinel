import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, Activity, KeySquare, Network, AlertTriangle, Search, Shield, FileText, PieChart, CheckSquare, Settings, Bot, BrainCircuit, ShieldCheck, AlignLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const links = [
    { to: '/', label: 'Overview', icon: Activity },
    { to: '/traffic', label: 'Live Traffic', icon: Network },
    { to: '/apis', label: 'APIs', icon: KeySquare },
    { to: '/endpoints', label: 'Endpoints', icon: ShieldAlert },
    { to: '/threats', label: 'Threats', icon: AlertTriangle },
    { to: '/incidents', label: 'Incidents', icon: Shield },
    { to: '/scanner', label: 'Scanner', icon: Search },
    { to: '/policies', label: 'Policies', icon: ShieldCheck },
    { to: '/owasp', label: 'OWASP Coverage', icon: CheckSquare },
  ];
  return (
    <div className={cn("flex flex-col border-r border-[#27272A] bg-[#0D0D0D] transition-all duration-300 h-screen sticky top-0", collapsed ? "w-[72px]" : "w-[240px]")}>
      <div className="flex h-16 items-center px-4 border-b border-[#27272A] shrink-0">
        <Shield className="h-6 w-6 text-blue-500 shrink-0" />
        {!collapsed && <span className="ml-3 font-bold text-[#E4E4E7] tracking-wider">API SENTINEL</span>}
        <Button variant="ghost" size="icon" className="ml-auto text-[#71717A] hover:text-[#E4E4E7]" onClick={() => setCollapsed(!collapsed)}><AlignLeft className="h-5 w-5" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="space-y-1 px-2">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => cn("flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors", isActive ? "bg-blue-500/10 text-blue-400" : "text-[#A1A1AA] hover:bg-[#161616] hover:text-[#E4E4E7]")} title={collapsed ? link.label : undefined}>
              <link.icon className={cn("h-5 w-5 shrink-0", !collapsed && "mr-3")} />
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
