import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check } from 'lucide-react';

interface GeneralSettings {
  platformName: string;
  institutionName: string;
  timezone: string;
  supportEmail: string;
}

interface ExamPolicySettings {
  maxDurationMinutes: string;
  negativeMarking: boolean;
  defaultAllowedAttempts: string;
  autoSubmitOnTimeout: boolean;
  showResultImmediately: boolean;
}

interface NotificationSettings {
  emailOnExamStart: boolean;
  emailOnResult: boolean;
  emailOnEnrollment: boolean;
}

interface SecuritySettings {
  sessionTimeoutMinutes: string;
  maxLoginAttempts: string;
  requirePasswordChange: boolean;
}

export default function SettingsPage() {
  const [savedSection, setSavedSection] = useState<string | null>(null);

  const [general, setGeneral] = useState<GeneralSettings>({
    platformName: 'ExamPro',
    institutionName: 'National Institute of Technology',
    timezone: 'Asia/Kolkata',
    supportEmail: 'admin@university.edu',
  });

  const [examPolicy, setExamPolicy] = useState<ExamPolicySettings>({
    maxDurationMinutes: '180',
    negativeMarking: true,
    defaultAllowedAttempts: '1',
    autoSubmitOnTimeout: true,
    showResultImmediately: true,
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailOnExamStart: true,
    emailOnResult: true,
    emailOnEnrollment: false,
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    sessionTimeoutMinutes: '30',
    maxLoginAttempts: '5',
    requirePasswordChange: false,
  });

  const handleSave = (section: string) => {
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 2000);
  };

  const SaveButton = ({ section }: { section: string }) => (
    <Button onClick={() => handleSave(section)} data-testid={`button-save-${section}`} className="min-w-[120px]">
      {savedSection === section ? (
        <><Check className="w-4 h-4 mr-1.5" /> Saved</>
      ) : (
        'Save Changes'
      )}
    </Button>
  );

  return (
    <DashboardLayout breadcrumbs={['Admin', 'Settings']}>
      <PageHeader title="Platform Settings" subtitle="Configure system-wide settings and policies" />

      <div className="max-w-2xl">
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
            <TabsTrigger value="exam-policy" data-testid="tab-exam-policy">Exam Policies</TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general">
            <div className="bg-card border border-card-border rounded-xl p-6 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">General Settings</h3>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input id="platform-name" value={general.platformName} onChange={(e) => setGeneral((s) => ({ ...s, platformName: e.target.value }))} data-testid="input-platform-name" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="institution-name">Institution Name</Label>
                <Input id="institution-name" value={general.institutionName} onChange={(e) => setGeneral((s) => ({ ...s, institutionName: e.target.value }))} data-testid="input-institution-name" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" value={general.timezone} onChange={(e) => setGeneral((s) => ({ ...s, timezone: e.target.value }))} data-testid="input-timezone" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="support-email">Support Email</Label>
                <Input id="support-email" type="email" value={general.supportEmail} onChange={(e) => setGeneral((s) => ({ ...s, supportEmail: e.target.value }))} data-testid="input-support-email" />
              </div>
              <div className="flex justify-end mt-2">
                <SaveButton section="general" />
              </div>
            </div>
          </TabsContent>

          {/* Exam Policy */}
          <TabsContent value="exam-policy">
            <div className="bg-card border border-card-border rounded-xl p-6 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">Exam Policies</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="max-duration">Max Duration (minutes)</Label>
                  <Input id="max-duration" type="number" min="10" max="360" value={examPolicy.maxDurationMinutes} onChange={(e) => setExamPolicy((s) => ({ ...s, maxDurationMinutes: e.target.value }))} data-testid="input-max-duration" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="default-attempts">Default Allowed Attempts</Label>
                  <Input id="default-attempts" type="number" min="1" max="5" value={examPolicy.defaultAllowedAttempts} onChange={(e) => setExamPolicy((s) => ({ ...s, defaultAllowedAttempts: e.target.value }))} data-testid="input-default-attempts" />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <ToggleSetting
                  label="Enable Negative Marking"
                  description="Deduct marks for wrong answers"
                  checked={examPolicy.negativeMarking}
                  onCheckedChange={(v) => setExamPolicy((s) => ({ ...s, negativeMarking: v }))}
                  testId="toggle-negative-marking"
                />
                <ToggleSetting
                  label="Auto-submit on Timeout"
                  description="Automatically submit when the timer expires"
                  checked={examPolicy.autoSubmitOnTimeout}
                  onCheckedChange={(v) => setExamPolicy((s) => ({ ...s, autoSubmitOnTimeout: v }))}
                  testId="toggle-auto-submit"
                />
                <ToggleSetting
                  label="Show Result Immediately"
                  description="Display results right after submission"
                  checked={examPolicy.showResultImmediately}
                  onCheckedChange={(v) => setExamPolicy((s) => ({ ...s, showResultImmediately: v }))}
                  testId="toggle-show-result"
                />
              </div>
              <div className="flex justify-end mt-2">
                <SaveButton section="exam-policy" />
              </div>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <div className="bg-card border border-card-border rounded-xl p-6 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
              <ToggleSetting
                label="Notify on Exam Start"
                description="Send email when an exam begins"
                checked={notifications.emailOnExamStart}
                onCheckedChange={(v) => setNotifications((s) => ({ ...s, emailOnExamStart: v }))}
                testId="toggle-notify-exam-start"
              />
              <ToggleSetting
                label="Notify on Result Published"
                description="Send email when exam results are available"
                checked={notifications.emailOnResult}
                onCheckedChange={(v) => setNotifications((s) => ({ ...s, emailOnResult: v }))}
                testId="toggle-notify-result"
              />
              <ToggleSetting
                label="Notify on Enrollment"
                description="Send email when a student enrolls"
                checked={notifications.emailOnEnrollment}
                onCheckedChange={(v) => setNotifications((s) => ({ ...s, emailOnEnrollment: v }))}
                testId="toggle-notify-enrollment"
              />
              <div className="flex justify-end mt-2">
                <SaveButton section="notifications" />
              </div>
            </div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <div className="bg-card border border-card-border rounded-xl p-6 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">Security Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input id="session-timeout" type="number" min="5" max="480" value={security.sessionTimeoutMinutes} onChange={(e) => setSecurity((s) => ({ ...s, sessionTimeoutMinutes: e.target.value }))} data-testid="input-session-timeout" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="max-login">Max Login Attempts</Label>
                  <Input id="max-login" type="number" min="3" max="10" value={security.maxLoginAttempts} onChange={(e) => setSecurity((s) => ({ ...s, maxLoginAttempts: e.target.value }))} data-testid="input-max-login" />
                </div>
              </div>
              <ToggleSetting
                label="Require Periodic Password Change"
                description="Force users to change passwords every 90 days"
                checked={security.requirePasswordChange}
                onCheckedChange={(v) => setSecurity((s) => ({ ...s, requirePasswordChange: v }))}
                testId="toggle-password-change"
              />
              <div className="flex justify-end mt-2">
                <SaveButton section="security" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function ToggleSetting({ label, description, checked, onCheckedChange, testId }: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  testId: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-card-border">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} data-testid={testId} />
    </div>
  );
}
