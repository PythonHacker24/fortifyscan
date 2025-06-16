'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Github, Mail } from 'lucide-react';
import Image from 'next/image';
import Stars from '@/components/Stars';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signInWithGoogle, signInWithGithub } = useAuth();
  const router = useRouter();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signUp(email, password);
      router.push('/dashboard'); // Redirect to dashboard after successful signup
    } catch (error: any) {
      setError(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setIsLoading(true);

    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSignUp = async () => {
    setError('');
    setIsLoading(true);

    try {
      await signInWithGithub();
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with GitHub');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-4">
      <Stars />
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-100">Create your account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/signin" className="text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image
                src="/google.svg"
                alt="Google"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              Continue with Google
            </button>

            <button
              onClick={handleGithubSignUp}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Github className="w-5 h-5" />
              Continue with GitHub
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-950 text-gray-400">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="w-5 h-5" />
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-xs text-center text-gray-400">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-blue-400 hover:text-blue-300">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-400 hover:text-blue-300">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 