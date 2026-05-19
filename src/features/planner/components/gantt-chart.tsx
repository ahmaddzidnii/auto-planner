"use client";

import { useEffect, useRef } from "react";

import type { TimelineTask } from "@/features/planner/types";

type GanttChartProps = {
  tasks: TimelineTask[];
  title?: string;
  description?: string;
  emptyMessage?: string;
};

export function GanttChart({
  tasks,
  title = "Project Timeline (Gantt Chart)",
  description = "Timeline disusun otomatis berdasarkan hasil analisis sprint.",
  emptyMessage = "Tidak ada task pada rentang tanggal yang dipilih.",
}: GanttChartProps) {
  const MINIMUM_ROWS = 10;
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let disposed = false;
    const hostNode = hostRef.current;

    async function renderChart() {
      if (!hostNode) {
        return;
      }

      hostNode.innerHTML = "";

      // Prepare tasks for the chart. Do not mutate the original `tasks` prop.
      const originalTasks = tasks ?? [];
      const chartTasks: TimelineTask[] = originalTasks.map((t) => ({ ...t }));

      // If there are fewer than MINIMUM_ROWS, append dummy tasks so the
      // rendered SVG grid contains at least MINIMUM_ROWS rows.
      if (chartTasks.length < MINIMUM_ROWS) {
        // Choose a safe reference start/end date. Prefer a real task's dates
        // when available, otherwise fall back to today/today+1.
        const refStart = chartTasks[0]?.start ? new Date(chartTasks[0].start) : new Date();
        const refEnd = chartTasks[0]?.end ? new Date(chartTasks[0].end) : new Date(refStart.getTime() + 24 * 60 * 60 * 1000);

        const missing = MINIMUM_ROWS - chartTasks.length;
        for (let i = 0; i < missing; i++) {
          chartTasks.push({
            id: `dummy-${Date.now().toString(36)}-${i}`,
            name: "",
            start: new Date(refStart),
            end: new Date(refEnd),
            progress: 0,
            custom_class: "dummy-row",
          });
        }
      }

      const { default: Gantt } = await import("frappe-gantt");

      if (disposed) {
        return;
      }

      new Gantt(hostNode, chartTasks, {
        view_mode: "Day",
        language: "id",
      });
    }

    void renderChart();

    return () => {
      disposed = true;
      if (hostNode) {
        hostNode.innerHTML = "";
      }
    };
  }, [tasks]);

  return (
    <section className="grid gap-3 border border-border bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <div
            ref={hostRef}
            className="min-w-180"
          />
        </div>
      )}
    </section>
  );
}
