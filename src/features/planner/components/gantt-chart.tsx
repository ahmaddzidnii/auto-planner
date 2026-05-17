"use client";

import { useEffect, useRef } from "react";

import type { TimelineTask } from "@/features/planner/types";

type GanttChartProps = {
  tasks: TimelineTask[];
};

export function GanttChart({ tasks }: GanttChartProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let disposed = false;
    const hostNode = hostRef.current;

    async function renderChart() {
      if (!hostNode) {
        return;
      }

      hostNode.innerHTML = "";

      if (tasks.length === 0) {
        return;
      }

      const { default: Gantt } = await import("frappe-gantt");

      if (disposed) {
        return;
      }

      new Gantt(hostNode, tasks, {
        view_mode: "Day",
        language: "en",
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
        <h2 className="text-sm font-semibold">
          Project Timeline (Gantt Chart)
        </h2>
        <p className="text-xs text-muted-foreground">
          Timeline disusun otomatis berdasarkan hasil analisis sprint.
        </p>
      </div>
      <div className="overflow-x-auto">
        <div ref={hostRef} className="min-w-180" />
      </div>
    </section>
  );
}
