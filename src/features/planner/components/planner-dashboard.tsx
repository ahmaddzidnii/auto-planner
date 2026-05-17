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
const RESOURCE_SKILLS: SprintResource["skill"][] = ["Backend", "Frontend", "System Analyst", "DevOps", "Quality Assurance"];
const PRIORITIES: SprintTaskInput["priority"][] = ["low", "medium", "high"];

type PlannerResourceFormValue = {
  level: SprintResource["level"] | "";
  skill: SprintResource["skill"] | "";
  quantity: string;
};

type PlannerTaskFormValue = {
  id: string;
  name: string;
  description: string;
  priority: SprintTaskInput["priority"] | "";
};

function createResource(): PlannerResourceFormValue {
  return {
    level: "",
    skill: "",
    quantity: "",
  };
}

function createTask(): PlannerTaskFormValue {
  return {
    id: "",
    name: "",
    description: "",
    priority: "",
  };
}

type PlannerFormValues = {
  sprint_name: string;
  sprint_start_date: string;
  sprint_duration_weeks: string;
  include_weekends: boolean;
  holiday_dates_raw: string;
  solo_fullstack: boolean;
  fullstack_level: SprintPlanningInput["fullstack_level"] | "";
  resources: PlannerResourceFormValue[];
  tasks: PlannerTaskFormValue[];
};

export function PlannerDashboard() {
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<PlannerFormValues>({
    defaultValues: {
      sprint_name: "",
      sprint_start_date: "",
      sprint_duration_weeks: "",
      include_weekends: false,
      holiday_dates_raw: "",
      solo_fullstack: false,
      fullstack_level: "",
      resources: [createResource()],
      tasks: [createTask()],
    },
  });

  const { fields: resourceFields, append: appendResource, remove: removeResource } = useFieldArray({ control, name: "resources" });

  const { fields: taskFields, append: appendTask, remove: removeTask } = useFieldArray({ control, name: "tasks" });

  const soloFullstack = watch("solo_fullstack");

  const onSubmit = handleSubmit((values) => {
    const sprintPlanningInput: SprintPlanningInput = {
      sprint_name: values.sprint_name,
      sprint_start_date: values.sprint_start_date,
      sprint_duration_weeks: Number(values.sprint_duration_weeks),
      resources: values.solo_fullstack
        ? [
            {
              level: values.fullstack_level as SprintResource["level"],
              skill: "Fullstack",
              quantity: 1,
            },
          ]
        : values.resources.map((resource) => ({
            level: resource.level as SprintResource["level"],
            skill: resource.skill as SprintResource["skill"],
            quantity: Number(resource.quantity),
          })),
      solo_fullstack: values.solo_fullstack,
      fullstack_level: values.fullstack_level as SprintPlanningInput["fullstack_level"],
      tasks: values.tasks.map((task) => ({
        id: task.id,
        name: task.name,
        description: task.description,
        priority: task.priority as SprintTaskInput["priority"],
      })),
    };

    console.log("Sprint planning JSON:", JSON.stringify(sprintPlanningInput, null, 2));
  });

  return (
    <main className="mx-auto grid w-[min(1180px,calc(100%-1rem))] gap-4 px-1 py-4 sm:w-[min(1180px,calc(100%-2rem))] sm:px-0 sm:py-8">
      <form
        className="grid gap-4"
        onSubmit={onSubmit}
      >
        <section className="grid gap-4 border border-border bg-card p-4">
          <div>
            <h2 className="text-sm font-semibold">Informasi Proyek/Sprint</h2>
          </div>

          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Nama</span>
            <Input
              {...register("sprint_name", {
                required: "Nama sprint wajib diisi.",
                minLength: {
                  value: 3,
                  message: "Nama sprint minimal 3 karakter.",
                },
              })}
              placeholder=""
            />
            {errors.sprint_name ? <span className="text-[11px] text-destructive">{errors.sprint_name.message}</span> : null}
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Tanggal dimulai</span>
              <Input
                type="date"
                {...register("sprint_start_date", {
                  required: "Tanggal dimulai wajib diisi.",
                })}
              />
              {errors.sprint_start_date ? <span className="text-[11px] text-destructive">{errors.sprint_start_date.message}</span> : null}
            </label>

            <label className="grid gap-1.5">
              <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Durasi (minggu)</span>
              <Input
                type="number"
                min={1}
                max={12}
                {...register("sprint_duration_weeks", {
                  required: "Durasi sprint wajib diisi.",
                  validate: (value) => {
                    if (value.trim() === "") {
                      return "Durasi sprint wajib diisi.";
                    }

                    const parsedValue = Number(value);

                    if (!Number.isInteger(parsedValue)) {
                      return "Durasi sprint harus berupa angka bulat.";
                    }

                    if (parsedValue < 1 || parsedValue > 12) {
                      return "Durasi sprint harus antara 1 sampai 12 minggu.";
                    }

                    return true;
                  },
                })}
              />
              {errors.sprint_duration_weeks ? <span className="text-[11px] text-destructive">{errors.sprint_duration_weeks.message}</span> : null}
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
                <Select
                  {...register("fullstack_level", {
                    validate: (value) => !soloFullstack || value !== "" || "Pilih level fullstack anda.",
                  })}
                >
                  <option value="">Pilih level</option>
                  {RESOURCE_LEVELS.map((level) => (
                    <option
                      key={level}
                      value={level}
                    >
                      {level}
                    </option>
                  ))}
                </Select>
                {errors.fullstack_level ? <span className="text-[11px] text-destructive">{errors.fullstack_level.message}</span> : null}
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
                          validate: (value) => {
                            if (soloFullstack) {
                              return true;
                            }

                            if (value.trim() === "") {
                              return "Quantity resource wajib diisi.";
                            }

                            const parsedValue = Number(value);

                            if (!Number.isInteger(parsedValue) || parsedValue < 1) {
                              return "Quantity resource harus berupa angka bulat minimal 1.";
                            }

                            return true;
                          },
                        })}
                      />
                      {errors.resources?.[index]?.quantity ? (
                        <span className="text-[11px] text-destructive">{errors.resources[index]?.quantity?.message}</span>
                      ) : null}
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Level</span>
                      <Select
                        {...register(`resources.${index}.level`, {
                          validate: (value) => soloFullstack || value !== "" || "Level resource wajib dipilih.",
                        })}
                      >
                        <option value="">Pilih level</option>
                        {RESOURCE_LEVELS.map((level) => (
                          <option
                            key={level}
                            value={level}
                          >
                            {level}
                          </option>
                        ))}
                      </Select>
                      {errors.resources?.[index]?.level ? (
                        <span className="text-[11px] text-destructive">{errors.resources[index]?.level?.message}</span>
                      ) : null}
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Keahlian</span>
                      <Select
                        {...register(`resources.${index}.skill`, {
                          validate: (value) => soloFullstack || value !== "" || "Keahlian resource wajib dipilih.",
                        })}
                      >
                        <option value="">Pilih keahlian</option>
                        {RESOURCE_SKILLS.map((skill) => (
                          <option
                            key={skill}
                            value={skill}
                          >
                            {skill}
                          </option>
                        ))}
                      </Select>
                      {errors.resources?.[index]?.skill ? (
                        <span className="text-[11px] text-destructive">{errors.resources[index]?.skill?.message}</span>
                      ) : null}
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
                      {...register(`tasks.${index}.id`, {
                        required: "Id task wajib diisi.",
                      })}
                      placeholder=""
                    />
                    {errors.tasks?.[index]?.id ? <span className="text-[11px] text-destructive">{errors.tasks[index]?.id?.message}</span> : null}
                  </label>

                  <label className="grid gap-1.5 sm:col-span-2">
                    <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Nama Task</span>
                    <Input
                      {...register(`tasks.${index}.name`, {
                        required: "Nama task wajib diisi.",
                        minLength: {
                          value: 3,
                          message: "Nama task minimal 3 karakter.",
                        },
                      })}
                      placeholder=""
                    />
                    {errors.tasks?.[index]?.name ? <span className="text-[11px] text-destructive">{errors.tasks[index]?.name?.message}</span> : null}
                  </label>

                  <label className="grid gap-1.5 sm:col-span-2">
                    <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Deskripsi Teknis</span>
                    <Textarea
                      rows={4}
                      {...register(`tasks.${index}.description`, {
                        required: "Deskripsi teknis wajib diisi.",
                        minLength: {
                          value: 10,
                          message: "Deskripsi teknis minimal 10 karakter.",
                        },
                      })}
                      placeholder=""
                    />
                    {errors.tasks?.[index]?.description ? (
                      <span className="text-[11px] text-destructive">{errors.tasks[index]?.description?.message}</span>
                    ) : null}
                  </label>

                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-semibold  tracking-[0.08em] text-muted-foreground">Prioritas</span>
                    <Select
                      {...register(`tasks.${index}.priority`, {
                        validate: (value) => value !== "" || "Prioritas task wajib dipilih.",
                      })}
                    >
                      <option value="">Pilih prioritas</option>
                      {PRIORITIES.map((priority) => (
                        <option
                          key={priority}
                          value={priority}
                        >
                          {priority}
                        </option>
                      ))}
                    </Select>
                    {errors.tasks?.[index]?.priority ? (
                      <span className="text-[11px] text-destructive">{errors.tasks[index]?.priority?.message}</span>
                    ) : null}
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
              onClick={() => appendTask(createTask())}
            >
              <IconPlus className="size-4" /> Tambah Task
            </Button>
          </div>
        </section>

        <div className="mt-5 flex justify-center">
          <Button
            type="submit"
            size="lg"
            className="w-full"
          >
            Analisa tugas sekarang
          </Button>
        </div>
      </form>
    </main>
  );
}
