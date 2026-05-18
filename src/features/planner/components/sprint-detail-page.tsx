"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { GanttChart } from "@/features/planner/components/gantt-chart";
import { getSprintPlanById } from "@/features/planner/storage";
import { buildSprintTimeline } from "@/features/planner/timeline";
import type { StoredSprintPlan, TimelineTask } from "@/features/planner/types";
import { toast } from "sonner";

function getMonthRange(dateValue: string): { monthStart: Date; monthEnd: Date } {
  const monthStart = new Date(`${dateValue}T00:00:00`);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  return { monthStart, monthEnd };
}

function clipTaskToRange(task: TimelineTask, monthStart: Date, monthEnd: Date): TimelineTask | null {
  if (task.end < monthStart || task.start > monthEnd) {
    return null;
  }

  const start = task.start < monthStart ? new Date(monthStart) : task.start;
  const end = task.end > monthEnd ? new Date(monthEnd) : task.end;

  return {
    ...task,
    start,
    end,
  };
}

export function SprintDetailPage() {
  const params = useParams<{ id: string }>();
  const sprintId = params?.id;

  const [plan, setPlan] = useState<StoredSprintPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadPlan() {
      if (!sprintId) {
        if (active) {
          setPlan(null);
          setIsLoading(false);
        }
        return;
      }

      const foundPlan = await getSprintPlanById(sprintId);

      if (active) {
        setPlan(foundPlan);
        setIsLoading(false);
      }
    }

    void loadPlan();

    return () => {
      active = false;
    };
  }, [sprintId]);

  const monthBoundTimeline = useMemo(() => {
    if (!plan) {
      return [] as TimelineTask[];
    }

    const timeline = buildSprintTimeline(plan.output.tasks, {
      sprintStartDate: plan.output.sprint_start_date,
      teamCapacityHours: plan.output.total_resource_capacity_hours,
      sprintDurationWeeks: plan.output.sprint_duration_weeks,
      includeWeekends: plan.input.include_weekends,
      holidayDates: plan.input.holiday_dates,
    });

    const { monthStart, monthEnd } = getMonthRange(plan.output.sprint_start_date);

    return timeline.map((task) => clipTaskToRange(task, monthStart, monthEnd)).filter((task): task is TimelineTask => task !== null);
  }, [plan]);

  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !plan) {
      toast.error("Sprint tidak ditemukan.");

      router.replace("/");
    }
  }, [isLoading, plan, router]);

  if (isLoading) {
    return (
      <main className="mx-auto w-[min(1180px,calc(100%-1rem))] px-1 py-4 sm:w-[min(1180px,calc(100%-2rem))] sm:px-0 sm:py-8">
        <p className="text-sm text-muted-foreground">Memuat detail sprint...</p>
      </main>
    );
  }

  if (!plan) {
    return null;
    //   <main className="mx-auto grid w-[min(1180px,calc(100%-1rem))] gap-4 px-1 py-4 sm:w-[min(1180px,calc(100%-2rem))] sm:px-0 sm:py-8">
    //     <section className="grid gap-3 border border-border bg-card p-4">
    //       <h1 className="text-base font-semibold">Sprint tidak ditemukan</h1>
    //       <p className="text-sm text-muted-foreground">Data sprint tidak tersedia di IndexedDB untuk id ini.</p>
    //       <Link href="/">
    //         <Button
    //           type="button"
    //           variant="outline"
    //           size="sm"
    //         >
    //           Kembali ke Dashboard
    //         </Button>
    //       </Link>
    //     </section>
    //   </main>
    // );
  }

  return (
    <main className="mx-auto grid w-[min(1180px,calc(100%-1rem))] gap-4 px-1 py-4 sm:w-[min(1180px,calc(100%-2rem))] sm:px-0 sm:py-8">
      <section className="grid gap-2 border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-base font-semibold">{plan.output.sprint_name}</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Mulai: {plan.output.sprint_start_date} | Durasi: {plan.output.sprint_duration_weeks} minggu | Status kapasitas: {plan.output.fit_status}
        </p>
        <p className="text-xs text-muted-foreground">{plan.output.sprint_rationale}</p>
      </section>

      <section className="grid gap-3 border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Ringkasan Kapasitas</h2>
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <p>Total kapasitas: {plan.output.total_resource_capacity_hours} jam</p>
          <p>Total estimasi: {plan.output.total_estimated_hours} jam</p>
          <p>Sisa kapasitas: {plan.output.remaining_capacity_hours} jam</p>
        </div>
        <p className="text-xs text-muted-foreground">{plan.output.resource_summary}</p>
      </section>

      <section className="grid gap-3 border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Daftar Task Sprint</h2>
        <div className="grid gap-3">
          {plan.output.tasks.map((task) => (
            <article
              key={task.id}
              className="grid gap-2 border border-border bg-muted/20 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-xs">
                  [{task.id}] {task.name}
                </strong>
                <span className="border border-border px-2 py-0.5 text-[11px] uppercase">{task.priority}</span>
              </div>

              <p className="text-xs text-muted-foreground">{task.description}</p>

              <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                <p>Estimasi: {task.estimated_hours} jam</p>
                <p>Kesulitan: {task.complexity}</p>
                <p>Minimum level: {task.minimum_level}</p>
                <p>Skill minimum: {task.minimum_skill}</p>
                <p className="sm:col-span-2">Dependency: {task.dependencies.length > 0 ? task.dependencies.join(", ") : "Tidak ada"}</p>
              </div>

              <p className="text-xs text-muted-foreground">Alasan analisis: {task.rationale}</p>
            </article>
          ))}
        </div>
      </section>

      <GanttChart
        tasks={monthBoundTimeline}
        title="Gantt Chart"
        description="Timeline di bawah difokuskan hanya pada task yang berada di bulan tanggal mulai sprint."
        emptyMessage="Tidak ada task yang jatuh pada bulan ini."
      />
    </main>
  );
}
