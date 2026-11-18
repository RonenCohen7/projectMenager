import { LoadLevel, MemberRole, ProjectKind, ProjectStatus, LeadStatus, UserRole } from "../models/enum";
import type { ProjectModel } from "../models/project-model";
import type { TaskModel } from "../models/task-model";
import type { HeatSettingsModel } from "../models/settings-model";
import type { UserModel } from "../models/user-model";
import { appConfig } from "./app-config";


// =========================
// Dates
// =========================

export function todayISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

//2026-11-05 -> 5.11.26
export function fmtDate(iso?: string | null): string {
    if (!iso) return "";
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    return m ? `${+m[3]}.${+m[2]}.${m[1].slice(2)}` : iso;
}

export function daysSince(iso?: string | null): number | null {
    if (!iso) return null;
    const t = Date.parse(iso.slice(0, 10) + "T00:00:00");
    if (isNaN(t)) return null;
    return Math.floor((Date.now() - t) / 864e5);
}

export function relDays(n: number | null): string {
    if (n == null) return "";
    if (n <= 0) return "היום";
    if (n === 1) return "אתמול";
    if (n < 7) return `לפני ${n} ימים`;
    if (n < 14) return "לפני שבוע";
    if (n < 60) return `לפני ${Math.round(n / 7)} שבועות`;
    return `לפני ${Math.round(n / 30)} חודשים`;
}

export const dueBuckets = ["באיחור", "היום", "מחר", "השבוע", "שבוע הבא", "בהמשך", "ללא תאריך יעד"];

export function dueBucket(due?: string | null): string {
    if (!due || !/^\d{4}-\d{2}-\d{2}$/.test(due)) return "ללא תאריך יעד";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = Math.round((new Date(due + "T00:00:00").getTime() - today.getTime()) / 864e5);
    const toSaturday = 6 - today.getDay();
    if (d < 0) return "באיחור";
    if (d === 0) return "היום";
    if (d === 1) return "מחר";
    if (d <= toSaturday) return "השבוע";
    if (d <= toSaturday + 7) return "שבוע הבא";
    return "בהמשך";
}

export function currentQuarter(): string {
    const d = new Date();
    return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
}

//Previous quarter + 6 next
export function planQuarters(): string[] {
    const out: string[] = [];
    const d = new Date();
    let year = d.getFullYear();
    let q = Math.floor(d.getMonth() / 3);
    if (q < 1) { q = 4; year--; }
    for (let i = 0; i < 7; i++) {
        out.push(`Q${q} ${year}`);
        q++;
        if (q > 4) { q = 1; year++; }
    }
    return out;
}

export function quarterRank(quarter?: string | null): number {
    const m = /^Q(\d) (\d{4})$/.exec(quarter || "");
    return m ? (+m[2]) * 10 + (+m[1]) : 99999;
}


// =========================
// Errors / roles
// =========================

export function errorMessage(err: any): string {
    return err?.response?.data?.message || err?.message || "אירעה שגיאה, נסו שוב";
}

export function isPrivileged(role?: UserRole): boolean {
    return role === UserRole.Admin || role === UserRole.Manager;
}

export function fullName(user?: { firstName: string, lastName?: string | null } | null): string {
    if (!user) return "";
    return `${user.firstName} ${user.lastName || ""}`.trim();
}


// =========================
// Projects
// =========================

export type ProjectTab = "active" | "lead" | "done";

export function tabOf(project: ProjectModel): ProjectTab {
    if (project.kind === ProjectKind.Lead) return "lead";
    if (project.status === ProjectStatus.Completed) return "done";
    return "active";
}

export function isClosed(project: ProjectModel): boolean {
    return project.status === ProjectStatus.Completed || project.status === LeadStatus.Dropped;
}

export function isStale(project: ProjectModel): boolean {
    if (tabOf(project) === "done" || project.status === ProjectStatus.Frozen || project.status === LeadStatus.Dropped) return false;
    const d = daysSince(project.lastUpdateDate);
    return d == null || d > appConfig.staleDays;
}

//Frozen / not started projects don't load the team
export function isInactive(status: string): boolean {
    return status === ProjectStatus.Frozen || status === ProjectStatus.NotStarted;
}

export function projectTitle(project: { clientName?: string | null, projectName?: string | null }): string {
    return [project.clientName, project.projectName].filter(Boolean).join(" · ") || "פרויקט";
}

export function memberNames(project: ProjectModel, role?: MemberRole): string[] {
    return project.members.filter(m => !role || m.memberRole === role).map(m => m.firstName);
}

//Each client gets its own color
export function hueOf(idClient?: number | null): number {
    return Math.round((211 + (idClient || 0) * 137.508) % 360);
}

export function hoursLeftText(allocated?: number | string | null, billable?: number | string | null, done?: number | string | null): string {
    const base = Number(allocated) || Number(billable) || 0;
    if (!base) return "—";
    const left = base - (Number(done) || 0);
    return left < 0 ? `חריגה של ${-left} ש׳` : `${left} ש׳` + (Number(allocated) ? "" : " (לפי שעות לחיוב)");
}


// =========================
// Load map (same rules as the old system)
// =========================

export type Assignment = {
    project: ProjectModel;
    role: MemberRole;
    value: number;            //0..3 load points
    explicit: boolean;        //Load level set by hand
    level: LoadLevel | null;
};

const levelValue: Record<LoadLevel, number> = { none: 0, low: 1, medium: 2, high: 3 };

function autoLoad(project: ProjectModel, role: MemberRole): number {
    if (isInactive(project.status)) return 0;
    if (project.status === ProjectStatus.Delivered) return role === MemberRole.Manager ? 1 : 0.5;
    return role === MemberRole.Manager ? 2 : 1;
}

export function autoLevelName(value: number): LoadLevel {
    return value <= 0 ? LoadLevel.None : value <= 1 ? LoadLevel.Low : value <= 2 ? LoadLevel.Medium : LoadLevel.High;
}

//idUser -> all active projects of that user
export function assignments(projects: ProjectModel[]): Map<number, Assignment[]> {
    const map = new Map<number, Assignment[]>();

    for (const project of projects.filter(p => tabOf(p) === "active")) {
        for (const member of project.members) {
            const explicit = member.loadLevel != null;
            const value = isInactive(project.status) ? 0 : explicit ? levelValue[member.loadLevel!] : autoLoad(project, member.memberRole);

            if (!map.has(member.idUser)) map.set(member.idUser, []);
            map.get(member.idUser)!.push({ project, role: member.memberRole, value, explicit, level: member.loadLevel });
        }
    }

    return map;
}

export const sumLoad = (items: Assignment[]) => items.reduce((sum, a) => sum + a.value, 0);

export const cellBand = (value: number) => value <= 0 ? 0 : value <= 1 ? 1 : value <= 2 ? 2 : value <= 3 ? 3 : 4;

export const totalBands: [number, string, number][] = [[4, "פנוי/ה לעוד עבודה", 1], [8, "מאוזן", 2], [12, "עמוס", 3], [Infinity, "עומס יתר", 4]];

export const totalBand = (total: number) => totalBands.find(b => total <= b[0])!;

//Hours info: remaining hours spread over the weeks until the end date, split between the doers
export function hoursInfo(project: ProjectModel) {
    const planned = Number(project.hoursAllocated) || Number(project.hoursBillable) || 0;
    if (!planned) return null;

    const remaining = Math.max(0, planned - (Number(project.hoursDone) || 0));

    let weeks: number | null = null;
    if (project.endDate && /^\d{4}-\d{2}-\d{2}$/.test(project.endDate)) {
        const days = (new Date(project.endDate + "T00:00:00").getTime() - new Date(todayISO() + "T00:00:00").getTime()) / 864e5;
        weeks = Math.max(1, days / 7);
    }

    const executors = project.members.filter(m => m.memberRole === MemberRole.Executor);
    const doers = executors.length ? executors : project.members;

    return { planned, remaining, weeks, doers: doers.map(d => d.idUser), perWeek: weeks ? remaining / weeks : null };
}

//% of a full job one assignment takes
export function percentOf(assignment: Assignment, idUser: number, heat: HeatSettingsModel): number {
    if (isInactive(assignment.project.status) || (assignment.explicit && assignment.value <= 0)) return 0;

    const hours = hoursInfo(assignment.project);
    if (hours && hours.perWeek != null && hours.doers.includes(idUser)) {
        return (hours.perWeek / hours.doers.length) / heat.weekHours * 100;
    }

    if (assignment.value <= 0) return 0;
    if (assignment.explicit && assignment.level) {
        return assignment.level === LoadLevel.None ? 0 : heat.levels[assignment.level];
    }
    if (assignment.value <= 0.5) return heat.levels.low / 2;

    const level = autoLevelName(assignment.value);
    return level === LoadLevel.None ? 0 : heat.levels[level];
}

//% of the user's own job (job percent) in use
export function jobUsage(items: Assignment[], user: UserModel, heat: HeatSettingsModel): number {
    const used = items.reduce((sum, a) => sum + percentOf(a, user.idUser, heat), 0);
    return Math.round(used / (user.jobPercent || 100) * 100);
}


// =========================
// Project health (direction A)
// =========================

export type HealthLevel = "ok" | "risk" | "off" | "frozen";

export const healthLabel: Record<HealthLevel, string> = { ok: "במסלול", risk: "בסיכון", off: "חורג", frozen: "מוקפא" };

//off: deadline passed / task late. risk: stale, urgent, waiting for client. ok: everything else.
export function projectHealth(project: ProjectModel, tasks: TaskModel[]): { level: HealthLevel, reason: string } {
    if (project.status === ProjectStatus.Frozen || project.status === LeadStatus.Dropped) return { level: "frozen", reason: "הפרויקט מוקפא" };

    const open = tasks.filter(t => t.idProject === project.idProject && !t.isDone);
    const lateTask = open.find(t => dueBucket(t.dueDate) === "באיחור");
    const endPassed = project.endDate && dueBucket(project.endDate) === "באיחור" && project.status !== ProjectStatus.Delivered && project.status !== ProjectStatus.Completed;

    if (endPassed) return { level: "off", reason: `תאריך הסיום עבר (${fmtDate(project.endDate)})` };
    if (lateTask) return { level: "off", reason: `משימה באיחור: ${lateTask.taskText}` };

    if (project.urgency === "urgent" || project.urgency === "high") return { level: "risk", reason: `דחיפות ${project.urgency === "urgent" ? "דחוף" : "גבוה"} מול הלקוח` };
    if (isStale(project)) {
        const days = daysSince(project.lastUpdateDate);
        return { level: "risk", reason: days == null ? "אין עדיין תיעוד" : `לא עודכן ${days} ימים` };
    }
    if (project.status === ProjectStatus.WaitingClient) return { level: "risk", reason: "ממתין ללקוח" };

    return { level: "ok", reason: "במסלול" };
}

//Each team member gets his own color
const personPalette = ["#4F46E5", "#0891B2", "#DB2777", "#7C3AED", "#059669", "#D97706", "#2563EB", "#BE185D", "#0D9488", "#9333EA"];

export function personColor(idUser: number): string {
    return personPalette[idUser % personPalette.length];
}
