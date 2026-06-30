import { useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/features/auth/services/authService';
import { toast } from 'sonner';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    farmName: '',
    email: '',
    password: '',
    phone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.registerOwner(formData);
      toast.success("Account created successfully!");
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Section */}
      <div
        className="pt-safe px-6 pb-16 flex flex-col items-center text-center relative overflow-hidden"
        style={{ background: 'var(--gradient-primary)' }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute top-10 left-6 w-16 h-16 bg-white/5 rounded-full blur-xl" />
        <div className="absolute top-8 right-20 w-8 h-8 bg-white/10 rounded-full blur-md" />

        <div className="mt-14 mb-6 w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center ring-4 ring-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-md relative z-10">
          <span className="text-5xl drop-shadow-lg">🐔</span>
        </div>
        <h1 className="text-white text-4xl font-extrabold tracking-tight drop-shadow-md relative z-10">PoultryPro</h1>
        <p className="text-white/80 text-sm mt-2 font-medium tracking-wide relative z-10">Join the Enterprise Platform</p>
      </div>

      {/* Form Card */}
      <div className="flex-1 bg-background dark:bg-background rounded-t-[2rem] -mt-8 px-6 pt-8 pb-10 flex flex-col gap-5" style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.08)' }}>
        <div>
          <h2 className="text-xl font-bold text-foreground">Create an Account ✨</h2>
          <p className="text-sm text-muted-foreground mt-1">Start managing your poultry farm today</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className="w-full h-13 px-4 py-3.5 rounded-2xl border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="farmName">Farm Name</label>
            <input
              id="farmName"
              required
              value={formData.farmName}
              onChange={handleChange}
              placeholder="e.g. Valley Farms"
              className="w-full h-13 px-4 py-3.5 rounded-2xl border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="phone">Phone Number (Optional)</label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +234 800 0000"
              className="w-full h-13 px-4 py-3.5 rounded-2xl border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full h-13 px-4 py-3.5 rounded-2xl border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full h-13 px-4 py-3.5 rounded-2xl border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-white rounded-2xl font-bold text-base touch-active active:scale-95 transition-all disabled:opacity-60 mt-2 shadow-lg"
            style={{ background: 'var(--gradient-primary)', boxShadow: '0 6px 20px hsl(152,65%,28% / 0.35)' }}
          >
            {isLoading ? "Creating Account..." : "Create Account →"}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-primary font-semibold">
            Log in
          </Link>
        </p>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground/60 mt-4">
          Powered by Loopvora | +2349052249906
        </p>
      </div>
    </div>
  );
}
