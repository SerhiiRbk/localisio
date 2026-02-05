import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata = {
  title: 'Reset Password',
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <ResetPasswordForm />
    </div>
  );
}
