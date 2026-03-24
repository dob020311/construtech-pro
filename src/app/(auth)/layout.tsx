import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthLayoutClient } from "@/components/layout/auth-layout-client";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <AuthLayoutClient>{children}</AuthLayoutClient>;
}
