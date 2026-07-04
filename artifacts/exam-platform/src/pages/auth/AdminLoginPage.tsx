import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Info } from 'lucide-react';

export default function AdminLoginPage() {
  const { loginAs } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('rajesh.kumar@university.edu');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    loginAs('admin');
    setLocation('/admin/dashboard');
  };

  return (
    <AuthLayout title="Admin Sign In" subtitle="Access the administration dashboard">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" data-testid="form-admin-login">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@university.edu"
            required
            data-testid="input-email"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            data-testid="input-password"
          />
        </div>

        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-accent text-accent-foreground text-xs">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Demo mode — any credentials will sign you in.</span>
        </div>

        <Button type="submit" disabled={loading} className="w-full mt-1" data-testid="button-login">
          {loading ? 'Signing in...' : 'Sign in as Admin'}
        </Button>
      </form>

      <div className="mt-5 text-center">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-to-landing">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </Link>
      </div>
    </AuthLayout>
  );
}
