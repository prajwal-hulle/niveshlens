"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Calendar,
  LogOut,
  Loader2,
  ShieldCheck,
  Bookmark,
  Scale,
  Compass,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      router.push("/login?error=not_configured");
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login?next=/account");
      } else {
        setUser(user);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs text-slate-400">Loading your account...</span>
      </div>
    );
  }

  const fullName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Investor";
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recent";

  return (
    <div className="w-full py-6 space-y-6 max-w-4xl mx-auto">
      {/* Account Overview Header */}
      <div className="p-6 rounded-xl bg-surface border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary text-white font-semibold text-lg flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-text">
                {fullName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Member since {createdAt}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border text-xs font-medium text-danger hover:bg-surface-muted transition-colors shrink-0 disabled:opacity-50"
        >
          {signingOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          <span>Sign out</span>
        </button>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Saved Profile Card */}
        <div className="p-5 rounded-xl bg-surface border border-border shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-muted text-text-muted border border-border">
              In Development
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-base text-text">
              Saved profile
            </h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Sync risk scores, tax brackets, and shortlisted comparisons to your account.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-5 rounded-xl bg-surface border border-border shadow-sm space-y-3 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-text">
              Tools
            </h3>
            <p className="text-xs text-text-muted">
              Run comparative models with live data feeds:
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/compare"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-surface border border-border text-xs font-medium text-text transition-colors"
            >
              <Scale className="w-3.5 h-3.5 text-primary" />
              <span>Comparator</span>
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-surface border border-border text-xs font-medium text-text transition-colors"
            >
              <User className="w-3.5 h-3.5 text-text-muted" />
              <span>Risk profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
