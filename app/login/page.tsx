"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2, LogIn, AlertTriangle, ShieldCheck } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/supabase/errors";
import { AuthToast } from "@/components/auth-toast";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";
  const errorParam = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
    if (errorParam === "not_configured") {
      setToast({
        type: "info",
        message:
          "Sign-in is not configured yet. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable authentication.",
      });
    } else if (errorParam === "auth_callback_failed") {
      setToast({
        type: "error",
        message: "Authentication verification failed or session expired. Please try signing in again.",
      });
    }
  }, [errorParam]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setToast({
          type: "error",
          message: mapAuthError(error),
        });
        return;
      }

      if (data.user) {
        setToast({
          type: "success",
          message: "Signed in successfully. Redirecting...",
        });
        router.push(next);
        router.refresh();
      }
    } catch (err: any) {
      setToast({
        type: "error",
        message: mapAuthError(err),
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-semibold text-text tracking-tight">
          Sign in to NiveshLens
        </h1>
        <p className="text-xs text-text-muted">
          Access your investor profile and tailored comparisons.
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
            Set{" "}
            <code className="font-mono bg-surface-muted px-1 py-0.5 rounded border border-border">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            and{" "}
            <code className="font-mono bg-surface-muted px-1 py-0.5 rounded border border-border">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            to enable authentication.
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

      {/* Form Card */}
      <div className="p-6 rounded-xl bg-surface border border-border shadow-sm space-y-5 transition-colors">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
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

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-text"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
            {errors.password && (
              <p className="text-xs text-danger">{errors.password.message}</p>
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
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-1 text-center text-xs text-text-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="w-full py-8 sm:py-12 flex items-center justify-center">
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
