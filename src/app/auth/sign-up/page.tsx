import { SignUpForm } from '@/components/auth/SignUpForm';

export const metadata = {
  title: 'Sign Up',
};

export default function SignUpPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <SignUpForm />
    </div>
  );
}
