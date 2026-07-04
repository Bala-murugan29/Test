import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Info } from 'lucide-react';

export default function StudentLoginPage() {
  const { loginAs } = useAuth();
  const [, setLocation] = useLocation();
  const [rollNumber, setRollNumber] = useState('CS2021001');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    loginAs('student');
    setLocation('/student/dashboard');
  };

  return (
    <AuthLayout title="Student Sign In" subtitle="Enter your credentials to access your exams">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" data-testid="form-student-login">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rollNumber">Roll Number</Label>
          <Input
            id="rollNumber"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            placeholder="e.g. CS2021001"
            required
            data-testid="input-roll-number"
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
          {loading ? 'Signing in...' : 'Sign in as Student'}
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
