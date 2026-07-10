import { useState } from 'react';
import { useLocation } from 'wouter';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { toApiError } from '@/lib/axios';
import { ArrowLeft } from 'lucide-react';
import { useCreateUser } from '@workspace/api-client-react';

export default function AddFacultyPage() {
  const [, setLocation] = useLocation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { mutateAsync: createUser, isPending: loading } = useCreateUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim() || !password.trim()) return;
    
    try {
      const response = await createUser({
        data: {
          fullName,
          email,
          password,
          role: 'faculty'
        }
      });
      
      // Note: Ideally we would also call a POST /faculty API here to create the profile.
      
      toast({
        title: 'Faculty Added',
        description: 'The faculty account has been created successfully.',
      });
      setLocation('/admin/dashboard');
    } catch (err) {
      const apiErr = toApiError(err);
      toast({
        variant: 'destructive',
        title: 'Failed to add faculty',
        description: apiErr.message,
      });
    }
  };

  return (
    <DashboardLayout breadcrumbs={['Admin', 'Add Faculty']}>
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" className="mb-4 -ml-4" onClick={() => setLocation('/admin/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
        <PageHeader title="Add Faculty" subtitle="Create a new faculty account" />
        
        <div className="bg-card border border-card-border rounded-xl p-6 mt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Jane Smith"
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
                placeholder="faculty@university.edu"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Temporary Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                minLength={8}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="mt-4">
              {loading ? 'Creating...' : 'Create Faculty'}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
