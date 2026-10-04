import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in – Shaan" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue creating your invitations."
      footer={{ text: "New to Shaan?", linkLabel: "Create an account", href: "/register" }}
    >
      <LoginForm />
    </AuthShell>
  );
}
