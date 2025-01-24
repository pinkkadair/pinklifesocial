"use client";

import {
  BellIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
  MessageCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Logo } from "./Logo";

function MobileNavbar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex md:hidden items-center space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="mr-2"
      >
        <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <MenuIcon className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px]">
          <SheetHeader>
            <SheetTitle>
              <Logo size="lg" />
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-4 mt-6">
            <Button variant="ghost" className="justify-start" asChild>
              <Link href="/" onClick={() => setShowMobileMenu(false)}>
                <HomeIcon className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>

            <Button variant="ghost" className="justify-start" asChild>
              <Link href="/kris-says" onClick={() => setShowMobileMenu(false)}>
                <MessageCircleIcon className="mr-2 h-4 w-4" />
                Kris Says
              </Link>
            </Button>

            {session?.user ? (
              <>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/notifications" onClick={() => setShowMobileMenu(false)}>
                    <BellIcon className="mr-2 h-4 w-4" />
                    Notifications
                  </Link>
                </Button>

                <Button variant="ghost" className="justify-start" asChild>
                  <Link
                    href={`/profile/${session.user.username}`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    signOut();
                    setShowMobileMenu(false);
                  }}
                >
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                className="justify-start"
                onClick={() => {
                  signIn();
                  setShowMobileMenu(false);
                }}
              >
                Sign In
              </Button>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default MobileNavbar;
