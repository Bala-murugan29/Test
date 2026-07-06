import { useQuery } from '@tanstack/react-query';

interface AllSettings {
  general: {
    platformName: string;
    institutionName: string;
    timezone: string;
    supportEmail: string;
  };
  examPolicy: {
    maxDurationMinutes: string;
    negativeMarking: boolean;
    defaultAllowedAttempts: string;
    autoSubmitOnTimeout: boolean;
    showResultImmediately: boolean;
  };
  notifications: {
    emailOnExamStart: boolean;
    emailOnResult: boolean;
    emailOnEnrollment: boolean;
  };
  security: {
    sessionTimeoutMinutes: string;
    maxLoginAttempts: string;
    requirePasswordChange: boolean;
  };
}

export function useAllSettings() {
  return useQuery<AllSettings>({
    queryKey: ['settings', 'all'],
    queryFn: async () => ({
      general: {
        platformName: 'ExamPro',
        institutionName: 'National Institute of Technology',
        timezone: 'Asia/Kolkata',
        supportEmail: 'admin@university.edu',
      },
      examPolicy: {
        maxDurationMinutes: '180',
        negativeMarking: true,
        defaultAllowedAttempts: '1',
        autoSubmitOnTimeout: true,
        showResultImmediately: true,
      },
      notifications: {
        emailOnExamStart: true,
        emailOnResult: true,
        emailOnEnrollment: false,
      },
      security: {
        sessionTimeoutMinutes: '30',
        maxLoginAttempts: '5',
        requirePasswordChange: false,
      },
    }),
  });
}
