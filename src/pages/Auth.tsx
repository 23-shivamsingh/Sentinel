import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast("Supabase is not configured.", "error");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast("Successfully logged in", "success");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast("Check your email for the confirmation link!", "info");
      }
    } catch (error: any) {
      toast(error.message || "Authentication failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-[#E4E4E7] p-4 font-sans selection:bg-blue-500/30">
      <Card className="w-full max-w-md bg-[#111111] border-[#27272A] shadow-2xl">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20 mb-2">
            <ShieldCheck className="h-6 w-6 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-[#E4E4E7]">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </CardTitle>
          <p className="text-sm text-[#A1A1AA]">
            {isLogin ? 'Enter your credentials to access Sentinel' : 'Sign up to secure your APIs'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#A1A1AA]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  className="pl-9 bg-[#161616] border-[#27272A] text-[#E4E4E7] placeholder:text-[#71717A] focus:border-blue-500/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#A1A1AA]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#71717A]" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-9 bg-[#161616] border-[#27272A] text-[#E4E4E7] placeholder:text-[#71717A] focus:border-blue-500/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 mt-2"
              disabled={loading}
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-[#27272A] pt-6">
          <p className="text-sm text-[#A1A1AA]">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
