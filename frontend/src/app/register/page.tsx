import RegisterForm from '@/components/auth/RegisterForm';
import AuthLayout from '@/components/auth/AuthLayout';

export const metadata = {
  title: 'Create Account - AI Companion',
  description: 'Create a new AI Companion account',
};

export default function RegisterPage() {
  return (
    <AuthLayout 
      title="Create Your Account"
      subtitle="Join AI Companion and start your journey"
      showBackButton={true}
    >
      <RegisterForm />
    </AuthLayout>
  );
}
