'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { signupSchema, type SignupInput, BUSINESS_TYPES } from '@revorax/shared';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export default function SignupPage() {
  const router = useRouter();
  const { setUser, setOrg } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { businessType: 'GYM' },
  });

  const selectedBusinessType = watch('businessType');

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    try {
      const result = await authApi.signup(data) as any;
      setUser(result.user);
      setOrg(result.org);
      toast.success('Account created! Welcome to Revorax 🎉');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black text-gradient">⚡ Revorax</Link>
          <p className="text-zinc-500 text-sm mt-2">Start your free 14-day trial</p>
        </div>

        <div className="card p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`flex items-center gap-2 text-sm font-medium ${step >= 1 ? 'text-brand-400' : 'text-zinc-600'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step > 1 ? 'bg-emerald-500 text-white' : step === 1 ? 'bg-brand-600 text-white' : 'bg-surface-300 text-zinc-500'}`}>
                {step > 1 ? <Check className="w-3 h-3" /> : '1'}
              </div>
              Your Details
            </div>
            <div className="flex-1 h-px bg-surface-300" />
            <div className={`flex items-center gap-2 text-sm font-medium ${step >= 2 ? 'text-brand-400' : 'text-zinc-600'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-brand-600 text-white' : 'bg-surface-300 text-zinc-500'}`}>
                2
              </div>
              Business Type
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-xl font-bold text-zinc-100 mb-1">Create your account</h2>
                <p className="text-zinc-500 text-sm mb-6">No credit card required</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Your name</label>
                    <input {...register('name')} type="text" placeholder="Raj Sharma" className="input" />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="label">Business name</label>
                    <input {...register('orgName')} type="text" placeholder="Your Business" className="input" />
                    {errors.orgName && <p className="text-red-400 text-xs mt-1">{errors.orgName.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="label">Email address</label>
                  <input {...register('email')} type="email" placeholder="you@business.com" className="input" />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Min 8 chars, 1 uppercase, 1 number" className="input pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <button type="button" onClick={() => setStep(2)} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-xl font-bold text-zinc-100 mb-1">Choose your business type</h2>
                <p className="text-zinc-500 text-sm mb-6">We'll set up the right revenue workflows for you</p>

                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(BUSINESS_TYPES).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setValue('businessType', key as any)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedBusinessType === key
                          ? 'border-brand-500 bg-brand-500/10 text-zinc-100'
                          : 'border-surface-300 bg-surface-100 text-zinc-400 hover:border-surface-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">{val.icon}</div>
                      <div className="text-sm font-medium">{val.label}</div>
                      <div className="text-xs text-zinc-500 mt-1">{val.hint}</div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">Back</button>
                  <button type="submit" disabled={isLoading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Create Account <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-zinc-500 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
