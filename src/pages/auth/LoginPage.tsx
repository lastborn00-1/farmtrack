import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/features/auth/services/authService';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.login(formData.email, formData.password);
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      await authService.signInWithGoogle();
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google');
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
        <p className="text-white/80 text-sm mt-2 font-medium tracking-wide relative z-10">Layers Poultry Management</p>
        <div className="mt-4 px-4 py-1.5 bg-white/15 rounded-full backdrop-blur-sm border border-white/20 shadow-inner relative z-10">
          <p className="text-white/90 text-[10px] font-bold uppercase tracking-widest">Enterprise Farm Platform</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="flex-1 bg-background dark:bg-background rounded-t-[2rem] -mt-8 px-6 pt-8 pb-10 flex flex-col gap-5" style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.08)' }}>
        <div>
          <h2 className="text-xl font-bold text-foreground">Welcome back! 👋</h2>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage your farm</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="email">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                className="w-full h-13 pl-11 pr-4 py-3.5 rounded-2xl border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="password">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full h-13 pl-11 pr-12 py-3.5 rounded-2xl border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-right">
              <a href="#" className="text-xs text-primary font-medium">Forgot password?</a>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-white rounded-2xl font-bold text-base touch-active active:scale-95 transition-all disabled:opacity-60 mt-2 shadow-lg"
            style={{ background: 'var(--gradient-primary)', boxShadow: '0 6px 20px hsl(152,65%,28% / 0.35)' }}
          >
            {isLoading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or continue with</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={isLoading}
          className="w-full h-13 flex items-center justify-center gap-3 rounded-2xl border-2 border-border bg-card font-semibold text-foreground touch-active active:scale-98 transition-transform disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Register Link */}
        <p className="text-center text-sm text-muted-foreground">
          New farmer?{' '}
          <Link to="/auth/register" className="text-primary font-semibold">
            Create account
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
