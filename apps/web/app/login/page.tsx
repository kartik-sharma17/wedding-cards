"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLoginMutation } from "@/redux/service/authService";

export default function LoginPage() {
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Disable form after submit
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (submitting || isLoading) return;

    const userEmail = email.trim();

    // Email validation
    if (!userEmail) {
      toast.error("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(userEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Password validation
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    // Disable inputs immediately after validation
    setSubmitting(true);

    try {
      const res = await login({
        email: userEmail,
        password,
      }).unwrap();

      const {
        token,
        name,
        email: userEmailResponse,
        last_login,
      } = res.data;

      // Token goes in a cookie so middleware.ts can verify it
      // on the server for protected routes.
      Cookies.set("token", token, {
        expires: 7,
        path: "/",
        sameSite: "lax",
        secure: window.location.protocol === "https:",
      });

      // Display-only information
      localStorage.setItem("user_name", name);
      localStorage.setItem("user_email", userEmailResponse);

      if (last_login) {
        localStorage.setItem("user_last_login", last_login);
      }

      toast.success(res.message);

      router.push("/dashboard");
    } catch (err) {
      // Re-enable the form if login fails
      setSubmitting(false);

      const message =
        (
          err as {
            data?: {
              detail?: {
                message?: string;
              };
            };
          }
        )?.data?.detail?.message ??
        "Invalid email or password";

      toast.error(message);
    }
  };

  // Form is disabled while submitting/API request is running
  const isDisabled = submitting || isLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="font-display text-3xl tracking-tight"
          >
            VAULT
          </Link>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-xl">
              Log in
            </CardTitle>

            <CardDescription>
              Enter your credentials to access your documents.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email
                </Label>

                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isDisabled}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password
                </Label>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isDisabled}
                    className="pr-10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    disabled={isDisabled}
                    className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={isDisabled}
              >
                {isDisabled && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                {submitting
                  ? "Logging in..."
                  : "Log in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}