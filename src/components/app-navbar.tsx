"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IconHelp } from "@tabler/icons-react";
import { usePathname } from "next/navigation";

export const AppNavbar = () => {
  const pathname = usePathname();
  return (
    <header className="flex items-center py-5 h-20 px-3 w-full sticky top-0 z-10 backdrop-blur-sm bg-background/80 border-b">
      <div className="flex justify-between items-center w-full">
        <h1>Auto Planner</h1>
        <div>{pathname !== "/" && <span>Ini nanti nama sprint nya</span>}</div>
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
