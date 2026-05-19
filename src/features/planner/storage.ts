import localforage from "localforage";

import type { StoredSprintPlan } from "@/features/planner/types";

const STORE_NAME = "sprint-plans";
export const SPRINT_PLANS_CHANGED_EVENT = "sprint-plans-changed";

const sprintStorage = localforage.createInstance({
    name: "ai-project-time-manager",
    storeName: STORE_NAME,
});

export async function saveSprintPlan(plan: StoredSprintPlan): Promise<void> {
    await sprintStorage.setItem(plan.id, plan);
}

export async function updateSprintPlanName(id: string, sprintName: string): Promise<StoredSprintPlan | null> {
    const plan = await getSprintPlanById(id);

    if (!plan) {
        return null;
    }

    const updatedPlan: StoredSprintPlan = {
        ...plan,
        input: {
            ...plan.input,
            sprint_name: sprintName,
        },
        output: {
            ...plan.output,
            sprint_name: sprintName,
        },
    };

    await saveSprintPlan(updatedPlan);

    return updatedPlan;
}

export async function deleteSprintPlan(id: string): Promise<void> {
    await sprintStorage.removeItem(id);
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
