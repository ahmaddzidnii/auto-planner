import localforage from "localforage";

import type { StoredSprintPlan } from "@/features/planner/types";

const STORE_NAME = "sprint-plans";

const sprintStorage = localforage.createInstance({
    name: "ai-project-time-manager",
    storeName: STORE_NAME,
});

export async function saveSprintPlan(plan: StoredSprintPlan): Promise<void> {
    await sprintStorage.setItem(plan.id, plan);
}

export async function getSprintPlanById(
    id: string,
): Promise<StoredSprintPlan | null> {
    const plan = await sprintStorage.getItem<StoredSprintPlan>(id);
    return plan ?? null;
}

export async function listSprintPlans(): Promise<StoredSprintPlan[]> {
    const plans: StoredSprintPlan[] = [];

    await sprintStorage.iterate<StoredSprintPlan, void>((value) => {
        plans.push(value);
    });

    return plans.sort((a, b) =>
        a.created_at > b.created_at ? -1 : a.created_at < b.created_at ? 1 : 0,
    );
}
