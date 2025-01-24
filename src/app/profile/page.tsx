import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  // Get user from database to ensure they exist and get their username
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { username: true },
  });

  if (!user) {
    // User doesn't exist in database, redirect to sign-in
    redirect("/sign-in");
  }

  // Encode the username for the URL
  const encodedUsername = encodeURIComponent(user.username);
  redirect(`/profile/${encodedUsername}`);
} 