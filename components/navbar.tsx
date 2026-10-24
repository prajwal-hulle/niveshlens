"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCurrency } from "./currency-context";
import {
  Compass,
  Scale,
  Target,
  ShieldAlert,
  BookOpen,
  Landmark,
  PiggyBank,
  ChevronDown,
  Sun,
  Moon,
  Search,
  Menu,
  X,
  ExternalLink,
  User,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { compact, toggleCompact } = useCurrency();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Listen to Supabase auth state changes
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close dropdown on outside click or escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Command palette shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search debounced query
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/mf/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.warn("Search error", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const primaryNavLinks = [
    { href: "/compare", label: "Compare", icon: Scale },
    { href: "/goal", label: "Goal planner", icon: Target },
    { href: "/btir", label: "LIC check", icon: ShieldAlert },
    { href: "/learn", label: "Learn", icon: BookOpen },
  ];

  const userName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Account";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-surface/95 backdrop-blur-md border-b border-border transition-colors">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Tagline (Left) */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="font-heading font-semibold text-base tracking-tight text-text leading-none whitespace-nowrap">
                Nivesh<span className="text-primary font-bold">Lens</span>
              </div>
              <div className="text-[10px] text-text-muted font-normal tracking-tight whitespace-nowrap">
                See what your investment hides
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links (Centered) */}
          <nav className="hidden lg:flex items-center justify-center gap-1 flex-1">
            {primaryNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "text-primary bg-primary/10 font-semibold"
                      : "text-text-muted hover:text-text hover:bg-surface-muted"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Modals */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Scheme Search (Cmd+K) */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-normal text-text-muted hover:text-text hover:bg-surface-muted transition-colors whitespace-nowrap"
              aria-label="Search Mutual Funds"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline whitespace-nowrap">Search scheme</span>
              <kbd className="inline-block px-1.5 py-0.5 rounded bg-surface-muted text-[10px] font-mono border border-border whitespace-nowrap text-text-muted">
                ⌘K
              </kbd>
            </button>

            {/* Currency Unit Toggle: Standard ₹ vs Compact L/Cr */}
            <button
              onClick={toggleCompact}
              title={compact ? "Switch to standard (₹ 12,34,567)" : "Switch to compact (Lakhs / Crores)"}
              className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-text hover:bg-surface-muted transition-colors whitespace-nowrap"
            >
              <span className="whitespace-nowrap"><span className="text-primary font-semibold">₹</span> L/Cr</span>
            </button>

            {/* Dark/Light Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg border border-border text-text-muted hover:text-text hover:bg-surface-muted transition-colors whitespace-nowrap shrink-0"
              aria-label="Toggle color theme"
            >
              <Sun className="w-3.5 h-3.5 hidden dark:block text-warning shrink-0" />
              <Moon className="w-3.5 h-3.5 block dark:hidden text-text shrink-0" />
            </button>

            {/* Auth State Button / Dropdown (Desktop) */}
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-surface-muted border border-border animate-pulse shrink-0" />
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-label="User account menu"
                  className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity"
                >
                  {userInitials}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface border border-border shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-border">
                      <div className="text-xs font-semibold text-text truncate">
                        {userName}
                      </div>
                      <div className="text-[11px] text-text-muted truncate">{user.email}</div>
                    </div>
                    <div className="py-1 space-y-0.5">
                      <Link
                        href="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-text hover:bg-surface-muted transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-primary" />
                        <span>Account</span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-danger hover:bg-danger-bg transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-text hover:bg-surface-muted transition-colors whitespace-nowrap"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary-hover transition-colors whitespace-nowrap shadow-sm"
                >
                  Get started
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Sheet Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-surface px-4 py-3 space-y-1 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
            {primaryNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "text-primary bg-primary/10 font-semibold"
                      : "text-text hover:bg-surface-muted"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-text-muted" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            {/* Mobile Auth Actions */}
            <div className="pt-3 border-t border-border">
              {user ? (
                <div className="space-y-1">
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-text hover:bg-surface-muted"
                  >
                    <User className="w-4 h-4 text-primary" />
                    <span>My Account ({user.email})</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-danger hover:bg-danger-bg"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2 text-center rounded-lg text-xs font-medium border border-border text-text hover:bg-surface-muted"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2 text-center rounded-lg text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary-hover shadow-sm"
                  >
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Command Palette / Search Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div className="w-full max-w-xl bg-surface text-text rounded-xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Search className="w-4 h-4 text-text-muted" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mutual fund schemes (e.g. Parag Parikh, HDFC)..."
                className="w-full bg-transparent border-0 focus:outline-none text-text placeholder-text-muted text-sm"
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                className="p-1 rounded-md text-text-muted hover:text-text"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {isSearching && (
                <div className="p-4 text-center text-xs text-text-muted">
                  Searching live database...
                </div>
              )}

              {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                <div className="p-4 text-center text-xs text-text-muted">
                  No mutual fund schemes found matching &quot;{searchQuery}&quot;.
                </div>
              )}

              {searchResults.map((item) => (
                <button
                  key={item.schemeCode}
                  onClick={() => {
                    setSearchModalOpen(false);
                    router.push(`/mf/${item.schemeCode}`);
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-surface-muted transition-colors flex items-center justify-between group"
                >
                  <div className="truncate pr-3">
                    <div className="text-sm font-medium text-text truncate group-hover:text-primary">
                      {item.schemeName}
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
                      <span className="px-1.5 py-0.2 rounded bg-surface-muted border border-border text-[10px] font-mono">
                        {item.planType}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 shrink-0" />
                </button>
              ))}

              {searchQuery.length < 2 && (
                <div className="p-6 text-center text-xs text-text-muted space-y-1">
                  <p>Try searching: <strong>Parag Parikh Flexi Cap</strong>, <strong>Mirae Large Cap</strong>, or <strong>SBI Bluechip</strong>.</p>
                  <p className="text-[11px] text-text-muted">Queries thousands of AMFI mutual fund schemes directly.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
