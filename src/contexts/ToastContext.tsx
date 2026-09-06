import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast { id: string; message: string; type: ToastType; }
interface ToastContextType { toast: (message: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => { setToasts((prev) => prev.filter((t) => t.id !== id)); }, 3000);
  }, []);
  const removeToast = (id: string) => { setToasts((prev) => prev.filter((t) => t.id !== id)); };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg border backdrop-blur-md text-sm ${t.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : t.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : t.type === 'warning' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
              {t.type === 'success' && <CheckCircle className="h-4 w-4" />}
              {t.type === 'error' && <AlertTriangle className="h-4 w-4" />}
              {t.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
              {t.type === 'info' && <Info className="h-4 w-4" />}
              <span className="font-medium text-[#E4E4E7]">{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="ml-2 hover:opacity-70 transition-opacity text-[#A1A1AA]"><X className="h-4 w-4" /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => { const context = useContext(ToastContext); if (context === undefined) { throw new Error('useToast must be used within a ToastProvider'); } return context; }
