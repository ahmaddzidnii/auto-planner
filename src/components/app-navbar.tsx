"use client";

import { IconHelp } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const AppNavbar = () => {
  const { isMobile } = useSidebar();

  return (
    <header className="flex items-center py-5 h-20 px-3 w-full sticky top-0 z-10 backdrop-blur-sm bg-background/80 border-b">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-4">
          <SidebarTrigger className={cn("size-12 [&_svg]:size-4! hidden", isMobile && "flex!")} />
          <h1 className="text-3xl font-black tracking-tight">
            <span className="text-foreground">Auto</span>
            <span className="bg-clip-text text-primary">Planner</span>

            <span className="ml-2 align-top text-sm font-semibold text-primary">AI</span>
          </h1>
        </div>
        <div></div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9"
            >
              <IconHelp className="[&_svg]:size-4!" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-100"
            side="left"
          >
            <DropdownMenuGroup>
              <DropdownMenuItem>Ahmad Zidni Hidayat</DropdownMenuItem>
              <DropdownMenuItem>Rozin Gunagraha</DropdownMenuItem>
              <DropdownMenuItem>Syafiq Rustiawanto</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
