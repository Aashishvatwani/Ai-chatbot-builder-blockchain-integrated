'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

// ShadCN Components
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Icons from lucide-react
import {
  PanelLeft,
  Bot,
  History,
  LayoutGrid,
  Settings,
} from "lucide-react";

const navLinks = [
  { href: "/create-chatpod", label: "Create Chatbot", icon: Bot },
  { href: "/view-chatpods", label: "View Chatbots", icon: LayoutGrid },
  { href: "/review-session", label: "Review Sessions", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  // NavLinks component, handles layout based on isCollapsed
  const NavLinks = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <nav className={`gap-2 ${isCollapsed ? "flex flex-row" : "flex flex-col"}`}>
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        const LinkIcon = link.icon;

        if (isCollapsed) {
          return (
            <Tooltip key={link.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant={isActive ? "secondary" : "ghost"}
                  size="icon"
                  className="bg-gray-300 rounded-lg mr-14 w-30 "
                >
                  <Link href={link.href}>
                    <LinkIcon className="h-5 w-10" />
                    <span className="sr-only">{link.label}</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{link.label}</TooltipContent>
            </Tooltip>
          );
        }

        return (
          <Button
            key={link.href}
            asChild
            variant={isActive ? "secondary" : "ghost"}
            className="justify-start gap-4 rounded-lg"
          >
            <Link href={link.href}>
              <LinkIcon className="h-5 w-5" />
              {link.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );

  return (
    <TooltipProvider>
      {/* Mobile Sidebar (Sheet) */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="fixed top-2 left-2 z-50 bg-gray-500 text-white hover:text-white hover:bg-gray-600 border border-black shadow-md transition-colors duration-300 ease-in-out"
            >
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="sm:max-w-xs p-4 flex flex-col">
            <h2 className="text-xl font-bold mb-4">Chatbot AI</h2>
            <NavLinks isCollapsed={false} />
            <div className="mt-auto">
              {/* User profile can go here */}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Tablet Collapsed Sidebar */}
      <aside className="hidden md:flex lg:hidden h-full flex-col border-r bg-background">
        {/* Centered top 🤖 button */}


        {/* NavLinks in a row */}
        <div className="p-6 flex justify-center">
          <NavLinks isCollapsed={true} />
        </div>
      </aside>

      {/* Desktop Expanded Sidebar */}
      <aside className="hidden lg:flex h-full w-64 min-h-screen flex-col border-r bg-background">
        <div className="p-4 border-b h-[65px] flex items-center">
          <h2 className="text-xl font-bold">Chatbot AI</h2>
        </div>
        <div className="p-4 flex-grow">
          <NavLinks isCollapsed={false} />
        </div>
        <div className="p-4 mt-auto border-t">
      
        </div>
      </aside>
    </TooltipProvider>
  );
}
