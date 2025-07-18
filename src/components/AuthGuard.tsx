"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  useEffect(() => {
    const user = typeof window !== 'undefined' ? localStorage.getItem("user") : null;
    if (!user) {
      router.replace("/login");
    } else {
      setIsAuth(true);
    }
  }, [router]);
  if (!isAuth) return null;
  return <>{children}</>;
} 