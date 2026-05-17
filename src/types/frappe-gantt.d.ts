declare module "frappe-gantt" {
    export type GanttTask = {
        id: string;
        name: string;
        start: Date;
        end: Date;
        progress: number;
        dependencies?: string;
        custom_class?: string;
    };

    export type GanttOptions = {
        view_mode?: "Quarter Day" | "Half Day" | "Day" | "Week" | "Month";
        language?: string;
    };

    export default class Gantt {
        constructor(selector: string | HTMLElement, tasks: GanttTask[], options?: GanttOptions);
    }
}
