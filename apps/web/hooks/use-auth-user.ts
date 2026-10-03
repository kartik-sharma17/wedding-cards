"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { getInitials } from "@/lib/utils";

export type AuthUser = {
  name: string;
  email: string;
  last_login?: string | null;
};

export function useAuthUser() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const name = localStorage.getItem("user_name");
    const email = localStorage.getItem("user_email");
    const last_login = localStorage.getItem("user_last_login");
    if (name && email) {
      setUser({ name, email, last_login });
    }
    setIsLoading(false);
  }, []);

  const signOut = useCallback(() => {
    Cookies.remove("token", { path: "/" });
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_last_login");
    router.push("/login");
  }, [router]);

  return {
    user,
    isLoading,
    initials: getInitials(user?.name),
    signOut,
  };
}