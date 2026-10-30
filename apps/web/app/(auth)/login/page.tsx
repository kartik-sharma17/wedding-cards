import type { Metadata } from "next";
import AuthShell from "../../../components/auth/AuthShell";
import LoginForm from "../../../components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in – Festa Cards" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue creating your invitations."
      footer={{ text: "New to Festa Cards?", linkLabel: "Create an account", href: "/register" }}
    >
      <LoginForm />
    </AuthShell>
  );
}
