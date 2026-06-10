import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <SignIn afterSignInUrl="/freeai/chat" signUpUrl="/freeai/sign-up" />
    </div>
  );
}
