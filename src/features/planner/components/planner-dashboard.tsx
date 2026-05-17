"use client";

import { useMemo, useState } from "react";

import { GanttChart } from "@/features/planner/components/gantt-chart";
import { buildSequentialTimeline } from "@/features/planner/timeline";
import type { EstimateOutput, PlannerInput, SprintOutput } from "@/features/planner/types";

const defaultForm: PlannerInput = {
  task_name: "",
  description: "",
  complexity: 5,
  priority: "medium",
  developer_level: "mid",
};

export function PlannerDashboard() {
  const [form, setForm] = useState<PlannerInput>(defaultForm);
  const [teamCapacity, setTeamCapacity] = useState(40);
  const [sprintDays, setSprintDays] = useState(7);

  const [estimate, setEstimate] = useState<EstimateOutput | null>(null);
  const [breakdownOnly, setBreakdownOnly] = useState<EstimateOutput["breakdown"] | null>(null);
  const [sprintPlan, setSprintPlan] = useState<SprintOutput | null>(null);

  const [loading, setLoading] = useState<"estimate" | "breakdown" | "sprint" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ganttTasks = useMemo(() => {
    const source = estimate?.breakdown ?? breakdownOnly ?? [];
    return buildSequentialTimeline(source);
  }, [estimate, breakdownOnly]);

  async function postJson<T>(url: string, payload: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as T & { error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Terjadi kesalahan saat memproses data.");
    }

    return data;
  }

  async function handleEstimate() {
    setLoading("estimate");
    setError(null);
    setSprintPlan(null);

    try {
      const data = await postJson<EstimateOutput>("/api/estimate", form);
      setEstimate(data);
      setBreakdownOnly(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses estimasi.");
    } finally {
      setLoading(null);
    }
  }

  async function handleBreakdown() {
    setLoading("breakdown");
    setError(null);
    setSprintPlan(null);

    try {
      const data = await postJson<{ breakdown: EstimateOutput["breakdown"] }>("/api/breakdown", form);
      setBreakdownOnly(data.breakdown);
      setEstimate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses breakdown.");
    } finally {
      setLoading(null);
    }
  }

  async function handleSprint() {
    const tasks = estimate?.breakdown ?? breakdownOnly;
    if (!tasks || tasks.length === 0) {
      setError("Generate estimation atau breakdown dulu sebelum sprint recommendation.");
      return;
    }

    setLoading("sprint");
    setError(null);

    try {
      const data = await postJson<SprintOutput>("/api/sprint", {
        team_capacity_hours: teamCapacity,
        sprint_days: sprintDays,
        tasks,
      });

      setSprintPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses sprint recommendation.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="planner-shell">
      <header className="hero-block">
        <p className="hero-block__kicker">AI-Based Software Project Time Estimation System</p>
        <h1>AI Project Planner</h1>
        <p>Estimasi task, breakdown otomatis, sprint recommendation, dan visualisasi Gantt chart dalam satu workflow.</p>
      </header>

      <section className="planner-grid">
        <section className="planner-panel">
          <div className="planner-panel__header">
            <h2>Task Input</h2>
            <p>Masukkan task software utama untuk dianalisis oleh AI.</p>
          </div>

          <label className="field">
            <span>Task Name</span>
            <input
              value={form.task_name}
              onChange={(event) => setForm((prev) => ({ ...prev, task_name: event.target.value }))}
              placeholder="Implement JWT Authentication"
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              value={form.description ?? ""}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Tambahkan konteks requirement agar estimasi lebih realistis"
              rows={4}
            />
          </label>

          <div className="field-grid">
            <label className="field">
              <span>Complexity (1-10)</span>
              <input
                type="number"
                min={1}
                max={10}
                value={form.complexity}
                onChange={(event) => setForm((prev) => ({ ...prev, complexity: Number(event.target.value) || 1 }))}
              />
            </label>

            <label className="field">
              <span>Priority</span>
              <select
                value={form.priority}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: event.target.value as PlannerInput["priority"],
                  }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label className="field">
              <span>Developer Level</span>
              <select
                value={form.developer_level}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    developer_level: event.target.value as PlannerInput["developer_level"],
                  }))
                }
              >
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
              </select>
            </label>
          </div>

          <div className="actions">
            <button
              type="button"
              onClick={handleEstimate}
              disabled={loading !== null}
            >
              {loading === "estimate" ? "Generating..." : "Generate Estimate"}
            </button>
            <button
              type="button"
              onClick={handleBreakdown}
              disabled={loading !== null}
            >
              {loading === "breakdown" ? "Generating..." : "Generate Breakdown"}
            </button>
          </div>
        </section>

        <section className="planner-panel">
          <div className="planner-panel__header">
            <h2>Sprint Recommendation</h2>
            <p>Gunakan output breakdown untuk memilih task yang masuk sprint.</p>
          </div>

          <div className="field-grid">
            <label className="field">
              <span>Team Capacity (hours)</span>
              <input
                type="number"
                min={1}
                value={teamCapacity}
                onChange={(event) => setTeamCapacity(Number(event.target.value) || 1)}
              />
            </label>
            <label className="field">
              <span>Sprint Days</span>
              <input
                type="number"
                min={1}
                max={30}
                value={sprintDays}
                onChange={(event) => setSprintDays(Number(event.target.value) || 1)}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleSprint}
            disabled={loading !== null}
          >
            {loading === "sprint" ? "Generating..." : "Generate Sprint Recommendation"}
          </button>

          {sprintPlan ? (
            <div className="result-card">
              <h3>Sprint Plan</h3>
              <p>
                Total: <strong>{sprintPlan.total_hours} jam</strong> | Remaining: {sprintPlan.remaining_hours} jam
              </p>
              <ul>
                {sprintPlan.recommended_tasks.map((task) => (
                  <li key={task.name}>
                    {task.name} ({task.duration_hours} jam)
                  </li>
                ))}
              </ul>
              <p>{sprintPlan.rationale}</p>
            </div>
          ) : null}
        </section>
      </section>

      {error ? <p className="error-text">{error}</p> : null}

      {estimate ? (
        <section className="planner-panel">
          <div className="planner-panel__header">
            <h2>AI Estimation Result</h2>
          </div>
          <div className="kpi-grid">
            <article className="result-card">
              <h3>Estimated Hours</h3>
              <p>{estimate.estimated_hours} jam</p>
            </article>
            <article className="result-card">
              <h3>Risk Level</h3>
              <p>{estimate.risk}</p>
            </article>
            <article className="result-card">
              <h3>Rationale</h3>
              <p>{estimate.rationale}</p>
            </article>
          </div>
        </section>
      ) : null}

      {(estimate?.breakdown ?? breakdownOnly) ? (
        <section className="planner-panel">
          <div className="planner-panel__header">
            <h2>Task Breakdown</h2>
          </div>
          <ul className="breakdown-list">
            {(estimate?.breakdown ?? breakdownOnly ?? []).map((task) => (
              <li key={task.name}>
                <span>{task.name}</span>
                <span>
                  {task.duration_hours} jam · risiko {task.risk}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <GanttChart tasks={ganttTasks} />
    </main>
  );
}
