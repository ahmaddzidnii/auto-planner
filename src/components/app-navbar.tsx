"use client";

import { IconHelp } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ModeToggle } from "./mode-toggle";

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
        <div className="flex gap-4 items-center">
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full"
              >
                <IconHelp className="size-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="left"
              align="start"
              className="w-72 rounded-xl p-2"
            >
              <div className="px-2 py-1.5">
                <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">Tentang Aplikasi</p>

                <h3 className="mt-1 text-sm font-semibold">AutoPlanner AI</h3>

                <p className="text-xs text-muted-foreground">Sistem perencanaan sprint berbasis AI</p>
              </div>

              <div className="my-2 h-px bg-border" />

              <DropdownMenuGroup>
                {[
                  {
                    name: "Ahmad Zidni Hidayat",
                    nim: "21120119130071",
                  },
                  {
                    name: "Rozin Gunagraha",
                    nim: "21120119130072",
                  },
                  {
                    name: "Syafiq Rustiawanto",
                    nim: "21120119130073",
                  },
                ].map((author) => (
                  <DropdownMenuItem
                    key={author.nim}
                    className="flex items-center gap-3 rounded-lg px-3 py-2"
                  >
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {author.name
                        .split(" ")
                        .map((word) => word[0])
                        .slice(0, 2)
                        .join("")}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{author.name}</span>

                      <span className="text-xs text-muted-foreground">{author.nim}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
