import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { toApiError } from '@/lib/axios';
import { ArrowLeft } from 'lucide-react';

export default function StudentLoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('arjun.sharma@university.edu');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await login(email, password);
      setLocation('/student/dashboard');
    } catch (err) {
      const apiErr = toApiError(err);
      toast({
        variant: 'destructive',
        title: 'Sign in failed',
        description: apiErr.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Student Sign In" subtitle="Enter your credentials to access your exams">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" data-testid="form-student-login">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@university.edu"
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

        <Button type="submit" disabled={loading} className="w-full mt-1" data-testid="button-login">
          {loading ? 'Signing in...' : 'Sign in as Student'}
        </Button>
      </form>

      <div className="mt-5 text-center flex flex-col gap-2">
        <Link href="/register/student" className="inline-flex items-center justify-center gap-1.5 text-sm text-primary hover:underline transition-colors">
          Don't have an account? Register here
        </Link>
        <Link href="/" className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-to-landing">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </Link>
      </div>
    </AuthLayout>
  );
}
