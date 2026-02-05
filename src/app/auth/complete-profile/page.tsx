import { CompleteProfileForm } from '@/components/auth/CompleteProfileForm';

export const metadata = {
  title: 'Complete Your Profile',
};

export default function CompleteProfilePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <CompleteProfileForm />
    </div>
  );
}
