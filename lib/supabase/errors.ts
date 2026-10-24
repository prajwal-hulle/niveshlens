export function mapAuthError(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  const msg = (typeof error === "string" ? error : error.message || "").toLowerCase();

  if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  if (
    msg.includes("user already registered") ||
    msg.includes("already registered") ||
    msg.includes("already exists")
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (
    msg.includes("password should be at least") ||
    msg.includes("weak_password") ||
    msg.includes("password is too weak")
  ) {
    return "Password is too weak. Please choose a password with at least 8 characters.";
  }
  if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) {
    return "Please verify your email address before signing in. Check your inbox for the confirmation link.";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Too many attempts. Please wait a moment before trying again.";
  }
  if (msg.includes("user not found")) {
    return "No account found with this email.";
  }

  return error.message || "Authentication failed. Please try again.";
}
