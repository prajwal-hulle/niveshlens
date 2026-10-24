"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, UserPlus, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/supabase/errors";
import { AuthToast } from "@/components/auth-toast";

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Full name must be at least 2 characters"),
    email: z.string().trim().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password");
  const isLengthValid = passwordValue?.length >= 8;

  const onSubmit = async (values: RegisterFormValues) => {
    setToast(null);
    const supabase = createClient();
    if (!supabase) {
      setToast({
        type: "error",
        message: "Sign-in is not configured. Please contact the administrator.",
      });
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
        },
      });

      if (error) {
        setToast({
          type: "error",
          message: mapAuthError(error),
        });
        return;
      }

      // If user is returned and session is established, redirect to account
      if (data.session) {
        setToast({
          type: "success",
          message: "Account created successfully! Redirecting to your account...",
        });
        router.push("/account");
        router.refresh();
      } else {
        // Email confirmation is required
        setEmailSent(true);
      }
    } catch (err: any) {
      setToast({
        type: "error",
        message: mapAuthError(err),
      });
    }
  };

  return (
    <div className="w-full py-8 sm:py-12 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-semibold text-text tracking-tight">
            Create an account
          </h1>
          <p className="text-xs text-text-muted">
            Save comparison scenarios, risk profiles, and insurance analysis.
          </p>
        </div>

        {/* Not Configured Warning */}
        {!isConfigured && (
          <div className="p-3.5 rounded-xl bg-surface border border-border border-l-4 border-l-amber-500 text-text-muted text-xs space-y-1">
            <div className="font-semibold text-text flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Sign-in is not configured</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Set <code className="font-mono bg-surface-muted px-1 py-0.5 rounded border border-border">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="font-mono bg-surface-muted px-1 py-0.5 rounded border border-border">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable registration.
            </p>
          </div>
        )}

        {/* Toast / Notification */}
        {toast && (
          <AuthToast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}

        {/* Email confirmation message if active */}
        {emailSent ? (
          <div className="p-6 sm:p-8 rounded-xl bg-surface border border-border shadow-sm text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-text">
                Check your inbox to confirm your email
              </h2>
              <p className="text-xs text-text-muted leading-relaxed">
                We sent a confirmation link to your email address. Click the link to complete your account setup and sign in.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-xs bg-surface-muted text-text hover:bg-surface border border-border transition-colors"
              >
                Back to Sign in
              </Link>
            </div>
          </div>
        ) : (
          /* Form Card */
          <div className="p-6 rounded-xl bg-surface border border-border shadow-sm space-y-5 transition-colors">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="block text-xs font-medium text-text"
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  disabled={!isConfigured || isSubmitting}
                  {...register("name")}
                  placeholder="Rahul Sharma"
                  className={`w-full px-3 py-2 rounded-lg border text-xs bg-surface text-text placeholder:text-text-muted transition-colors focus:outline-none focus:ring-1 focus:ring-primary ${
                    errors.name
                      ? "border-danger focus:border-danger"
                      : "border-border focus:border-primary"
                  } disabled:opacity-50`}
                />
                {errors.name && (
                  <p className="text-xs text-danger">{errors.name.message}</p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-text"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={!isConfigured || isSubmitting}
                  {...register("email")}
                  placeholder="name@example.com"
                  className={`w-full px-3 py-2 rounded-lg border text-xs bg-surface text-text placeholder:text-text-muted transition-colors focus:outline-none focus:ring-1 focus:ring-primary ${
                    errors.email
                      ? "border-danger focus:border-danger"
                      : "border-border focus:border-primary"
                  } disabled:opacity-50`}
                />
                {errors.email && (
                  <p className="text-xs text-danger">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-text"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    disabled={!isConfigured || isSubmitting}
                    {...register("password")}
                    placeholder="••••••••"
                    className={`w-full px-3 py-2 rounded-lg border text-xs bg-surface text-text placeholder:text-text-muted transition-colors focus:outline-none focus:ring-1 focus:ring-primary pr-10 ${
                      errors.password
                        ? "border-danger focus:border-danger"
                        : "border-border focus:border-primary"
                    } disabled:opacity-50`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength hint */}
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-text-muted">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isLengthValid ? "bg-primary" : "bg-border"
                    }`}
                  />
                  <span>Strength hint: minimum 8 characters</span>
                </div>
                {errors.password && (
                  <p className="text-xs text-danger">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-medium text-text"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    disabled={!isConfigured || isSubmitting}
                    {...register("confirmPassword")}
                    placeholder="••••••••"
                    className={`w-full px-3 py-2 rounded-lg border text-xs bg-surface text-text placeholder:text-text-muted transition-colors focus:outline-none focus:ring-1 focus:ring-primary pr-10 ${
                      errors.confirmPassword
                        ? "border-danger focus:border-danger"
                        : "border-border focus:border-primary"
                    } disabled:opacity-50`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isConfigured || isSubmitting}
                className="w-full mt-2 h-10 px-4 rounded-lg font-medium text-xs bg-primary hover:bg-primary-hover text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create account</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer Link */}
            <div className="pt-1 text-center text-xs text-text-muted">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
