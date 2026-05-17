"use client";

import { useFieldArray, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SprintPlanningInput, SprintResource, SprintTaskInput } from "@/features/planner/types";
import { IconPlus, IconTrash } from "@tabler/icons-react";

const RESOURCE_LEVELS: SprintPlanningInput["fullstack_level"][] = ["junior", "mid", "senior"];
const RESOURCE_SKILLS: SprintResource["skill"][] = ["backend", "frontend", "analist", "devops", "qa"];
const PRIORITIES: SprintTaskInput["priority"][] = ["low", "medium", "high"];

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function createResource(): SprintResource {
  return {
    level: "mid",
    skill: "backend",
    quantity: 1,
  };
}

function createTask(index: number): SprintTaskInput {
  return {
    id: `TASK-${index + 1}`,
    name: "",
    description: "",
    priority: "medium",
  };
}

type PlannerFormValues = {
  sprint_name: string;
  sprint_start_date: string;
  sprint_duration_weeks: number;
  include_weekends: boolean;
  holiday_dates_raw: string;
  solo_fullstack: boolean;
  fullstack_level: SprintPlanningInput["fullstack_level"];
  resources: SprintResource[];
  tasks: SprintTaskInput[];
};

export function PlannerDashboard() {
  const { register, control, watch } = useForm<PlannerFormValues>({
    defaultValues: {
      sprint_name: "Sprint Discovery",
      sprint_start_date: getTodayIso(),
      sprint_duration_weeks: 2,
      include_weekends: false,
      holiday_dates_raw: "",
      solo_fullstack: false,
      fullstack_level: "mid",
      resources: [createResource()],
      tasks: [createTask(0)],
    },
  });

  const { fields: resourceFields, append: appendResource, remove: removeResource } = useFieldArray({ control, name: "resources" });

  const { fields: taskFields, append: appendTask, remove: removeTask } = useFieldArray({ control, name: "tasks" });

  const soloFullstack = watch("solo_fullstack");

  return (
    <main className="mx-auto grid w-[min(1180px,calc(100%-1rem))] gap-4 px-1 py-4 sm:w-[min(1180px,calc(100%-2rem))] sm:px-0 sm:py-8">
      <form className="grid gap-4">
        <section className="grid gap-4 border border-border bg-card p-4">
          <div>
            <h2 className="text-sm font-semibold">Informasi Proyek/Sprint</h2>
          </div>

          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Nama</span>
            <Input
              {...register("sprint_name")}
              placeholder="Sprint 1 - Authentication"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Tanggal dimulai</span>
              <Input
                type="date"
                {...register("sprint_start_date")}
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Durasi (minggu)</span>
              <Input
                type="number"
                min={1}
                max={12}
                {...register("sprint_duration_weeks", {
                  valueAsNumber: true,
                })}
              />
            </label>
          </div>

          <div>
            <h3 className="text-xs font-semibold">Resource</h3>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium">
            <Checkbox {...register("solo_fullstack")} />
            <span>Perusahaan saya tidak memiliki divisi</span>
          </label>

          {soloFullstack ? (
            <div className="grid gap-2 border border-border bg-muted/30 p-3">
              <label className="grid gap-1.5">
                <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Level anda</span>
                <p className="text-xs text-muted-foreground">
                  kami akan mengasumsikan bahwa anda adalah satu-satunya resource yang tersedia untuk mengerjakan semua task yang ada. Kami akan
                  menyesuaikan estimasi waktu pengerjaan berdasarkan level keahlian fullstack yang anda pilih.
                </p>
                <Select {...register("fullstack_level")}>
                  {RESOURCE_LEVELS.map((level) => (
                    <option
                      key={level}
                      value={level}
                    >
                      {level}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          ) : (
            <div className="grid gap-3">
              {resourceFields.map((resource, index) => (
                <article
                  key={resource.id}
                  className="grid gap-3 border border-border bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-xs">Resource {index + 1}</strong>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        if (resourceFields.length > 1) {
                          removeResource(index);
                        }
                      }}
                      disabled={resourceFields.length === 1}
                    >
                      <IconTrash className="size-4" />
                      Hapus
                    </Button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="grid gap-1.5">
                      <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Quantity</span>
                      <Input
                        type="number"
                        min={1}
                        {...register(`resources.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                      />
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Level</span>
                      <Select {...register(`resources.${index}.level`)}>
                        {RESOURCE_LEVELS.map((level) => (
                          <option
                            key={level}
                            value={level}
                          >
                            {level}
                          </option>
                        ))}
                      </Select>
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Keahlian</span>
                      <Select {...register(`resources.${index}.skill`)}>
                        {RESOURCE_SKILLS.map((skill) => (
                          <option
                            key={skill}
                            value={skill}
                          >
                            {skill}
                          </option>
                        ))}
                      </Select>
                    </label>
                  </div>
                </article>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendResource(createResource())}
              >
                <IconPlus className="size-4" />
                Tambah Resource
              </Button>
            </div>
          )}
        </section>

        <section className="grid gap-4 border border-border bg-card p-4">
          <div>
            <h2 className="text-sm font-semibold">Task</h2>
            <p className="text-xs text-muted-foreground">
              Jelaskan setiap task secara teknis sedetail mungkin agar analisanya lebih akurat. Sertakan framework, library, integrasi, API, flow,
              constraint, dan dependency jika ada.
            </p>
          </div>

          <div className="grid gap-3">
            {taskFields.map((task, index) => (
              <article
                key={task.id}
                className="grid gap-3 border border-border bg-muted/20 p-3"
              >
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      if (taskFields.length > 1) {
                        removeTask(index);
                      }
                    }}
                    disabled={taskFields.length === 1}
                  >
                    <IconTrash className="size-4" />
                    Hapus
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Id Task</span>
                    <Input
                      {...register(`tasks.${index}.id`)}
                      placeholder="task-auth-01"
                    />
                  </label>

                  <label className="grid gap-1.5 sm:col-span-2">
                    <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Nama Task</span>
                    <Input
                      {...register(`tasks.${index}.name`)}
                      placeholder="Implement JWT authentication"
                    />
                  </label>

                  <label className="grid gap-1.5 sm:col-span-2">
                    <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Deskripsi Teknis</span>
                    <Textarea
                      rows={4}
                      {...register(`tasks.${index}.description`)}
                      placeholder="Jelaskan framework, library, integrasi, API, flow, constraint, dan dependencynya secara lengkap."
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Prioritas</span>
                    <Select {...register(`tasks.${index}.priority`)}>
                      {PRIORITIES.map((priority) => (
                        <option
                          key={priority}
                          value={priority}
                        >
                          {priority}
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="sm"
              onClick={() => appendTask(createTask(taskFields.length))}
            >
              <IconPlus className="size-4" /> Tambah Task
            </Button>
          </div>
        </section>

        <div className="mt-5 flex justify-center">
          <Button
            type="button"
            size="lg"
            disabled
            className="w-full"
          >
            Analisa tugas sekarang
          </Button>
        </div>
      </form>
    </main>
  );
}
