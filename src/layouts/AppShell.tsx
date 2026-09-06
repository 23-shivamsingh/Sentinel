import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AnimatePresence, motion } from 'framer-motion';
import { Info } from 'lucide-react';

export function AppShell() {
  const [judgeMode, setJudgeMode] = useState(false);
  const location = useLocation();

  let judgeText = "Dashboard loaded. Press \"Start Security Demo\" to generate simulated attacks and test the backend engine.";
  if (location.pathname === '/traffic') {
    judgeText = "Live Traffic: The simulator streams synthetic requests here. If a threat is generated, it is automatically logged to Incidents.";
  } else if (location.pathname === '/policies') {
    judgeText = "Policies Engine: Creating a rule here syncs instantly to the Node.js backend via /api/internal/sync-rules. The backend middleware intercepts matching requests in real time.";
  } else if (location.pathname === '/incidents') {
    judgeText = "Incidents Dashboard: Threats caught by the engine or simulator appear here for investigation. You can adjust policies based on these events.";
  } else if (location.pathname === '/scanner') {
    judgeText = "Scanner: Proactively analyzes your OpenAPI schema for missing rate limits, weak auth, and CORS issues before code hits production.";
  } else if (location.pathname === '/') {
    judgeText = "Overview: High-level API security metrics. Toggle 'Judge Mode' to see context, and click 'Start Security Demo' to fire real malicious requests against the Express backend.";
  }

  return (
    <div className="flex h-screen w-full bg-[#0A0A0A] text-[#E4E4E7] overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen min-w-0">
        <Topbar judgeMode={judgeMode} setJudgeMode={setJudgeMode} />
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <Outlet />
          <AnimatePresence>
            {judgeMode && (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 right-6 w-96 bg-[#111111]/90 border border-[#27272A] rounded-xl p-4 shadow-2xl backdrop-blur-md z-50">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5"><Info className="h-5 w-5 text-blue-400" /></div>
                  <div>
                    <h4 className="font-semibold text-[#E4E4E7] text-sm mb-1">Judge Mode Narration</h4>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">{judgeText}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
