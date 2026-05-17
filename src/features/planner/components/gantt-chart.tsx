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
    <section className="planner-panel">
      <div className="planner-panel__header">
        <h2>Project Timeline (Gantt Chart)</h2>
        <p>Timeline disusun otomatis dari durasi subtask AI.</p>
      </div>
      <div className="gantt-scroll">
        <div
          ref={hostRef}
          className="gantt-host"
        />
      </div>
    </section>
  );
}
