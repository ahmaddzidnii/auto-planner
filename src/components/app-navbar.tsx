"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsVertical, IconHelp } from "@tabler/icons-react";

export const AppNavbar = () => {
  return (
    <header className="flex items-center py-5 h-20 px-3 w-full sticky top-0 z-10 backdrop-blur-sm bg-background/80 border-b">
      <div className="flex justify-between items-center w-full">
        <h1>Auto Planner</h1>
        <div>
          <span>Ini nanti nama sprint nya</span>
        </div>
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
