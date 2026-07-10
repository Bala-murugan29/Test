import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { toApiError } from '@/lib/axios';
import { ArrowLeft } from 'lucide-react';
import { useRegister } from '@workspace/api-client-react';

export default function RegisterStudentPage() {
  const [, setLocation] = useLocation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const { mutateAsync: registerUser, isPending: loading } = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim() || !password.trim()) return;
    
    try {
      const response = await registerUser({
        data: {
          fullName,
          email,
          password,
          role: 'student'
        }
      });
      
      setSuccess(true);
      toast({
        title: 'Registration Submitted',
        description: response.message || 'Please wait for an administrator to approve your account.',
      });
    } catch (err) {
      const apiErr = toApiError(err);
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: apiErr.message,
      });
    }
  };

  if (success) {
    return (
      <AuthLayout title="Registration Successful" subtitle="Your account is pending approval">
        <div className="flex flex-col gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            Thank you for registering. An administrator will review your account soon.
            You will be able to log in once your account has been approved and academic details are linked.
          </p>
          <Button onClick={() => setLocation('/login/student')} className="mt-4">
            Return to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Register as Student" subtitle="Create your account to get started">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@university.edu"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            minLength={8}
            required
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full mt-1">
          {loading ? 'Submitting...' : 'Register'}
        </Button>
      </form>

      <div className="mt-5 text-center flex flex-col gap-2">
        <Link href="/login/student" className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
