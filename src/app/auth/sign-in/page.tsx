import { SignInForm } from '@/components/auth/SignInForm';

export const metadata = {
  title: 'Sign In',
};

export default function SignInPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <SignInForm />
    </div>
  );
}
