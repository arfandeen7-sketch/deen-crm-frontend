"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { 
  Building2, Eye, EyeOff, Calendar, Clock, Shield, Quote, 
  Activity, Database, Users, TrendingUp, Lock, Mail, ChevronRight 
} from "lucide-react";
import { loginSchema, type LoginValues } from "@/schemas/auth.schema";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api/client";
import { APP_NAME } from "@/constants";
import { DEMO_AUTH_ENABLED, DEMO_CREDENTIALS } from "@/services/auth/demo";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, hydrated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  function fillDemo() {
    setValue("email", DEMO_CREDENTIALS.email);
    setValue("password", DEMO_CREDENTIALS.password);
  }

  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace("/dashboard/overview");
  }, [hydrated, isAuthenticated, router]);

  async function onSubmit(values: LoginValues) {
    try {
      await login(values.email, values.password);
      toast.success("Welcome back!");
      router.replace("/dashboard/overview");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="flex w-full flex-col lg:flex-row min-h-screen">
      {/* Left Column */}
      <div className="hidden lg:flex w-7/12 flex-col justify-between p-12 lg:pr-8">
        {/* Top: Logo */}
        <div>
           <Image
             src="/deen-new-logo.png"
             alt="Deen Properties"
             width={240}
             height={80}
             className="w-auto h-16 object-contain"
             priority
           />
        </div>

        {/* Middle: Text & Tags */}
        <div className="max-w-xl">
           <div className="mb-6 inline-flex items-center gap-2 border border-slate-800 bg-[#0a0a0a]/50 px-3 py-1.5 text-[9px] uppercase tracking-widest text-slate-400">
              <div className="h-1.5 w-1.5 bg-orange-500" />
              <span>Real Estate Management Platform</span>
           </div>
           
           <h1 className="mt-4 text-[56px] font-light text-white leading-[1.1] tracking-tight">
             MANAGE PROPERTIES.<br />
             TRACK LEADS.<br />
             CLOSE <span className="text-orange-500 font-normal">DEALS.</span>
           </h1>
           
           <p className="mt-8 text-sm text-slate-500 leading-relaxed max-w-lg font-sans">
             A unified platform for property management, CRM operations and lead tracking designed for contemporary enterprise real estate teams.
           </p>

           <div className="mt-12 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 border border-slate-800/80 bg-[#0a0a0a]/40 px-4 py-2.5 text-[10px] font-mono tracking-widest uppercase text-slate-300">
                 <Database className="h-3.5 w-3.5 text-slate-500" />
                 Property Management
              </div>
              <div className="flex items-center gap-2 border border-slate-800/80 bg-[#0a0a0a]/40 px-4 py-2.5 text-[10px] font-mono tracking-widest uppercase text-slate-300">
                 <Users className="h-3.5 w-3.5 text-slate-500" />
                 CRM Tracking
              </div>
              <div className="flex items-center gap-2 border border-slate-800/80 bg-[#0a0a0a]/40 px-4 py-2.5 text-[10px] font-mono tracking-widest uppercase text-slate-300">
                 <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
                 Lead Monitoring
              </div>
           </div>
        </div>

        {/* Bottom: Quote and Footer */}
        <div>
          <div className="border-l-2 border-orange-500/80 pl-6 py-2 mb-16">
            <div className="flex items-center gap-2 text-[10px] font-bold text-orange-500 tracking-widest mb-4 uppercase">
              <Quote className="h-3 w-3" />
              Thoughts That Matter
            </div>
            <p className="text-lg text-white font-sans max-w-lg mb-6 leading-snug">
              "The best investment we make is in the people and relationships that build DEEN."
            </p>
            <div className="text-[10px] tracking-widest text-slate-500 uppercase flex items-center gap-2">
              <span className="w-4 h-[1px] bg-slate-700"></span>
              DEEN PROPERTIES
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600 font-mono mt-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-white font-serif italic text-sm">N</div>
            <span className="tracking-widest text-[10px] uppercase">DEEN PROPERTIES CRM <span className="text-slate-800 mx-2">|</span> Internal Use Only Operational Core</span>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex w-full lg:w-5/12 flex-col justify-between p-8 lg:p-12 lg:pl-16 border-l border-slate-800/50 bg-[#020202]/40 backdrop-blur-sm relative z-10">
        {/* Top Right: Date/Time */}
        <div className="flex justify-end gap-6 text-[10px] text-slate-500 font-mono tracking-widest uppercase">
           <div className="flex items-center gap-2">
             <Calendar className="h-3.5 w-3.5 text-orange-500/80" />
             JUL 2, 2026
           </div>
           <div className="flex items-center gap-2">
             <Clock className="h-3.5 w-3.5 text-orange-500/80" />
             20:37:24
           </div>
        </div>

        {/* Center: Login Form */}
        <div className="w-full max-w-[440px] mx-auto my-auto relative mt-20 mb-20">
          {/* Corner borders for the form box */}
          <div className="absolute -top-px -left-px w-8 h-8 border-t-[1.5px] border-l-[1.5px] border-orange-500/80 z-20" />
          
          <div className="border border-slate-800/80 bg-[#070707] p-8 lg:p-10 relative z-10 shadow-2xl">
            <div className="mb-10 flex items-start justify-between">
              <div>
                <h2 className="text-[22px] font-light text-white mb-2">WELCOME BACK</h2>
                <p className="text-[11px] text-slate-500 font-sans">Sign in to continue to your account workspace</p>
              </div>
              <div className="border border-orange-900/50 bg-orange-500/10 px-2.5 py-1 text-[8px] text-orange-500 tracking-widest uppercase">
                Secure Access
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] tracking-widest text-slate-500 uppercase flex items-center gap-1 font-mono">
                  Username / Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-600" />
                  </div>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="name@deen.ae"
                    className="block w-full bg-[#0a0a0a] border border-slate-800 py-3.5 pl-11 pr-3 text-sm text-slate-300 placeholder-slate-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-colors font-mono"
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] tracking-widest text-slate-500 uppercase flex items-center gap-1 font-mono">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-600" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="block w-full bg-[#0a0a0a] border border-slate-800 py-3.5 pl-11 pr-10 text-sm text-slate-300 placeholder-slate-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-colors font-mono"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-600 hover:text-slate-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="mt-4 w-full bg-orange-500 hover:bg-orange-400 text-black text-[11px] font-bold tracking-[0.2em] uppercase py-4 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Authenticating...' : 'Authenticate Operator'}
              </button>
            </form>

            {DEMO_AUTH_ENABLED && (
              <div className="mt-8 pt-6 border-t border-slate-800/50">
                <div className="flex items-center gap-2 text-[9px] text-orange-500 tracking-widest uppercase mb-4">
                  <Activity className="h-3 w-3" />
                  Enterprise Simulation Matrix
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-[#0a0a0a] border border-slate-800 px-4 py-3 mb-2">
                  <span>{DEMO_CREDENTIALS.email}</span>
                  <span className="text-slate-700">|</span>
                  <span>{DEMO_CREDENTIALS.password}</span>
                </div>
                <button
                  type="button"
                  onClick={fillDemo}
                  className="w-full border border-slate-800 bg-[#0a0a0a] hover:bg-slate-900 py-3 text-[9px] text-slate-400 hover:text-slate-300 tracking-widest uppercase flex items-center justify-center gap-2 transition-colors mt-3"
                >
                  Mount Automated Keypair <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Right: Status */}
        <div className="flex justify-end items-center gap-2 text-[9px] text-slate-600 font-mono tracking-widest uppercase">
          <Shield className="h-3 w-3" />
          Secure SSL Multi-Layer Execution Active
        </div>
      </div>
    </div>
  );
}
