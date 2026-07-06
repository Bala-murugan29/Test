import { toast } from '@/hooks/use-toast';
import { toApiError } from '@/lib/axios';

/** Show a success toast for a mutation. */
export function notifySuccess(title: string, description?: string) {
  toast({ title, description });
}

/** Show an error toast from any thrown error. */
export function notifyError(err: unknown, title = 'Operation failed') {
  const apiErr = toApiError(err);
  toast({ variant: 'destructive', title, description: apiErr.message });
}

/** Generic on-success/on-error pair for mutations. */
export const mutationToast = {
  success(message: string, description?: string) {
    return () => notifySuccess(message, description);
  },
  error(title = 'Operation failed') {
    return (err: unknown) => notifyError(err, title);
  },
};
