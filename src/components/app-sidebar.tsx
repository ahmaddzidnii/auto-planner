"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react";
import { SPRINT_PLANS_CHANGED_EVENT, deleteSprintPlan, listSprintPlans, updateSprintPlanName } from "@/features/planner/storage";
import type { StoredSprintPlan } from "@/features/planner/types";
import { toast } from "sonner";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

  function broadcastSprintPlanChange(message: string) {
    toast.success(message);
    window.dispatchEvent(new Event(SPRINT_PLANS_CHANGED_EVENT));
  }

  async function handleRenameSprint(plan: StoredSprintPlan) {
    const nextName = window.prompt("Ubah nama sprint", plan.output.sprint_name)?.trim();

    if (!nextName || nextName === plan.output.sprint_name) {
      return;
    }

    const updatedPlan = await updateSprintPlanName(plan.id, nextName);

    if (!updatedPlan) {
      toast.error("Sprint tidak ditemukan.");
      return;
    }

    setHistory((currentHistory) => currentHistory.map((item) => (item.id === updatedPlan.id ? updatedPlan : item)));

    broadcastSprintPlanChange("Nama sprint berhasil diperbarui.");
  }

  async function handleDeleteSprint(plan: StoredSprintPlan) {
    const confirmed = window.confirm(`Hapus analisis sprint \"${plan.output.sprint_name}\"? Tindakan ini tidak bisa dibatalkan.`);

    if (!confirmed) {
      return;
    }

    await deleteSprintPlan(plan.id);
    setHistory((currentHistory) => currentHistory.filter((item) => item.id !== plan.id));

    broadcastSprintPlanChange("Analisis sprint dihapus.");
  }

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

  useEffect(() => {
    function handleSprintPlanChange() {
      void (async () => {
        const plans = await listSprintPlans();
        setHistory(plans);
      })();
    }

    window.addEventListener(SPRINT_PLANS_CHANGED_EVENT, handleSprintPlanChange);

    return () => {
      window.removeEventListener(SPRINT_PLANS_CHANGED_EVENT, handleSprintPlanChange);
    };
  }, []);

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

                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="opacity-0 transition-opacity group-hover/item:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <IconDotsVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="bottom"
                      align="start"
                      className="w-48"
                    >
                      <DropdownMenuItem
                        onSelect={() => {
                          void handleRenameSprint(plan);
                        }}
                      >
                        <IconEdit className="size-4" />
                        Edit nama sprint
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          void handleDeleteSprint(plan);
                        }}
                      >
                        <IconTrash className="size-4" />
                        Hapus analisis sprint
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
