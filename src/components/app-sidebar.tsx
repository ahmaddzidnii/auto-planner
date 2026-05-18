"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { IconDotsVertical, IconEdit } from "@tabler/icons-react";
import { listSprintPlans } from "@/features/planner/storage";
import type { StoredSprintPlan } from "@/features/planner/types";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "./ui/sidebar";
import { Button } from "@/components/ui/button";

export const AppSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const [history, setHistory] = useState<StoredSprintPlan[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        setHistoryLoading(true);

        const plans = await listSprintPlans();

        if (active) {
          setHistory(plans);
        }
      } finally {
        if (active) {
          setHistoryLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, [pathname]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-5">
        <SidebarTrigger className="size-12 [&_svg]:size-4!" />
        <SidebarMenuButton
          size="lg"
          tooltip="New Analysis Task"
          onClick={() => {
            if (isMobile) {
              setOpenMobile(false);
            }
            router.push("/");
          }}
          className="[&_svg]:size-4! group-data-[collapsible=icon]:size-12!  group-data-[collapsible=icon]:shrink-0 group-data-[collapsible=icon]:mx-auto p-0!"
        >
          <div className="w-12 h-12 flex items-center justify-center">
            <IconEdit className="[&_svg]:size-4!" />
          </div>
          <span className="group-data-[collapsible=icon]:hidden">New Analysis Task</span>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Riwayat Sprint</SidebarGroupLabel>
          <div>{historyLoading && <p className="px-2 py-3 text-[11px] text-sidebar-foreground/70">Memuat riwayat sprint...</p>}</div>
          <SidebarGroupContent>
            {history.length === 0 ? (
              <p className="px-2 py-3 text-[11px] text-sidebar-foreground/70">Belum ada sprint tersimpan.</p>
            ) : (
              history.map((plan) => (
                <div
                  key={plan.id}
                  className="group/item flex  gap-1 rounded-md p-1 hover:bg-sidebar-accent items-center"
                >
                  <button
                    type="button"
                    className="flex-1 overflow-hidden rounded-md px-2 py-2 text-left"
                    onClick={() => {
                      if (isMobile) {
                        setOpenMobile(false);
                      }

                      router.push(`/${plan.id}`);
                    }}
                  >
                    <span className="grid max-w-full gap-0.5">
                      <span className="truncate text-xs font-semibold">{plan.output.sprint_name}</span>

                      <span className="truncate text-[11px] text-sidebar-foreground/70">
                        {new Date(plan.created_at).toLocaleDateString("id-ID")} - {plan.output.tasks.length} task
                      </span>
                    </span>
                  </button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 transition-opacity group-hover/item:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: implement edit functionality
                    }}
                  >
                    <IconDotsVertical className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
};
