import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Auth } from '../pages/Auth';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, isConfigured } = useAuth();

  if (!isConfigured) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0A0A0A] text-[#E4E4E7] p-4 font-sans">
        <Card className="w-full max-w-md bg-[#111111] border-[#27272A] shadow-2xl">
          <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
            <h2 className="text-xl font-bold">Supabase Not Configured</h2>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              Please set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your environment variables to enable authentication.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0A0A0A] text-[#A1A1AA]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p>Initializing Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <>{children}</>;
}
