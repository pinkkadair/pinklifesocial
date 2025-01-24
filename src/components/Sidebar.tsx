'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Home,
  MessageCircle,
  Bell,
  User,
  Coffee,
  Globe2,
} from "lucide-react";

const routes = [
  {
    label: "Home",
    icon: Home,
    href: "/",
    color: "text-sky-500",
  },
  {
    label: "Kris Says...",
    icon: MessageCircle,
    href: "/kris-says",
    color: "text-violet-500",
  },
  {
    label: "GlobalTea",
    icon: Globe2,
    href: "/global-tea",
    color: "text-pink-700",
  },
  {
    label: "Notifications",
    icon: Bell,
    href: "/notifications",
    color: "text-green-700",
  },
  {
    label: "Profile",
    icon: User,
    href: "/profile",
    color: "text-orange-700",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full">
      <div className="px-3 py-2 flex-1">
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition",
                pathname === route.href
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
