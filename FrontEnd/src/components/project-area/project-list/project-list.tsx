import "./project-list.css";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { MenuItem, TextField } from "@mui/material";
import type { RootState } from "../../redux/store";
import type { ProjectModel } from "../../models/project-model";
import { leadStatuses, MemberRole, priorityRank, ProjectStatus, statusLabel, statusStyle, urgencyRank } from "../../models/enum";
import { useTitle } from "../../utils/UseTitle";
import { useProjectDrawer } from "../../utils/UseProjectDrawer";
import { appConfig } from "../../utils/app-config";
import { daysSince, fmtDate, isStale, memberNames, relDays, tabOf, type ProjectTab } from "../../utils/utils";
import { ClientChip, StageProgress, StatusPill, UrgencyTag, PriorityTag } from "../../shared-area/tags/tags";


const titles: Record<ProjectTab, [string, string]> = {
    active: ["פרויקטים פעילים", "סטטוסים, החלטות ותיעוד פגישות לכל פרויקט במקום אחד"],
    lead: ["לידים", "פניות והצעות מחיר שעוד לא הפכו לפרויקט"],
    done: ["פרויקטים שהסתיימו", "ארכיון הפרויקטים שנסגרו"]
};

type SortKey = "last" | "stale" | "client" | "status" | "urgency";


export function ProjectList({ tab }: { tab: ProjectTab }) {

    useTitle(titles[tab][0]);

    const projects = useSelector((state: RootState) => state.data.projects);
    const tasks = useSelector((state: RootState) => state.data.tasks);
    const loaded = useSelector((state: RootState) => state.data.loaded);

    const { openProject } = useProjectDrawer();
    const [searchParams, setSearchParams] = useSearchParams();

    const [search, setSearch] = useState("");
    const [person, setPerson] = useState("");
    const [sort, setSort] = useState<SortKey>("last");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const clientFilter = searchParams.get("client") || "";

    const inTab = useMemo(() => projects.filter(p => tabOf(p) === tab), [projects, tab]);


    // =========================
    // Filters
    // =========================

    const clients = [...new Map(inTab.filter(p => p.idClient).map(p => [p.idClient!, p.clientName || ""])).entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "he"));

    const persons = [...new Set(inTab.flatMap(p => memberNames(p)))].sort((a, b) => a.localeCompare(b, "he"));

    const statuses = tab === "lead" ? leadStatuses : tab === "done" ? [ProjectStatus.Completed as string] : Object.values(ProjectStatus).filter(s => s !== ProjectStatus.Completed) as string[];

    //Next open task of each project
    const nextTask = (idProject: number) => tasks
        .filter(t => t.idProject === idProject && !t.isDone)
        .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || (a.dueDate || "9999").localeCompare(b.dueDate || "9999"))[0];

    const filtered = inTab.filter(p =>
        (!clientFilter || String(p.idClient) === clientFilter) &&
        (!person || memberNames(p).includes(person)) &&
        (!statusFilter || (statusFilter === "__stale" ? isStale(p) : p.status === statusFilter)) &&
        (!search || [p.clientName, p.projectName, p.notes, p.lastSummary, nextTask(p.idProject)?.taskText, ...memberNames(p)].join(" ").includes(search))
    );

    const sorters: Record<SortKey, (a: ProjectModel, b: ProjectModel) => number> = {
        last: (a, b) => (b.lastUpdateDate || "").localeCompare(a.lastUpdateDate || "") || b.updatedAt.localeCompare(a.updatedAt),
        stale: (a, b) => (a.lastUpdateDate || "").localeCompare(b.lastUpdateDate || ""),
        client: (a, b) => (a.clientName || "").localeCompare(b.clientName || "", "he"),
        status: (a, b) => statuses.indexOf(a.status) - statuses.indexOf(b.status),
        urgency: (a, b) => urgencyRank[a.urgency] - urgencyRank[b.urgency]
    };

    const shown = [...filtered].sort(sorters[sort]);

    const staleCount = inTab.filter(isStale).length;


    function setClient(value: string) {
        setSearchParams(params => {
            if (value) params.set("client", value);
            else params.delete("client");
            return params;
        });
    }


    // =========================
    // JSX
    // =========================

    return (
        <section className="page">

            <header className="page-head">
                <div>
                    <h1>{titles[tab][0]}</h1>
                    <p>{titles[tab][1]}</p>
                </div>
            </header>

            {/* Status strip */}
            {tab !== "done" && (
                <div className="strip">
                    {statuses.map(status => {
                        const count = inTab.filter(p => p.status === status).length;
                        if (!count && statusFilter !== status) return null;
                        return (
                            <button key={status} type="button" className={`chip s-${statusStyle[status]}`} aria-pressed={statusFilter === status}
                                onClick={() => setStatusFilter(statusFilter === status ? null : status)}>
                                <span className="dot" />{statusLabel[status]} <b>{count}</b>
                            </button>
                        );
                    })}
                    {!!staleCount && (
                        <button type="button" className="chip alert" aria-pressed={statusFilter === "__stale"}
                            onClick={() => setStatusFilter(statusFilter === "__stale" ? null : "__stale")}>
                            <span className="dot" />לא עודכנו {appConfig.staleDays}+ ימים <b>{staleCount}</b>
                        </button>
                    )}
                </div>
            )}

            {/* Toolbar */}
            <div className="toolbar">
                <TextField type="search" placeholder="חיפוש לקוח, פרויקט או מילה מתוך התיעוד" value={search} onChange={e => setSearch(e.target.value)} className="grow" />

                <TextField select label="לקוח" value={clientFilter} onChange={e => setClient(e.target.value)}>
                    <MenuItem value="">כל הלקוחות</MenuItem>
                    {clients.map(([id, name]) => <MenuItem key={id} value={String(id)}>{name}</MenuItem>)}
                </TextField>

                <TextField select label="איש צוות" value={person} onChange={e => setPerson(e.target.value)}>
                    <MenuItem value="">כל הצוות</MenuItem>
                    {persons.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                </TextField>

                <TextField select label="מיון" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
                    <MenuItem value="last">עודכן לאחרונה</MenuItem>
                    <MenuItem value="stale">הכי מזמן לא עודכן</MenuItem>
                    <MenuItem value="client">לפי לקוח</MenuItem>
                    <MenuItem value="status">לפי סטטוס</MenuItem>
                    <MenuItem value="urgency">לפי דחיפות מול הלקוח</MenuItem>
                </TextField>
            </div>

            {/* Rows */}
            <div className="list">
                {!loaded && <div className="empty"><strong>טוען את הפרויקטים…</strong></div>}

                {loaded && !shown.length && (
                    <div className="empty">
                        <strong>{inTab.length ? "אין פרויקטים שמתאימים לסינון" : "אין כאן פרויקטים"}</strong>
                        {inTab.length ? "נסו לנקות את החיפוש או את הסינון." : "פרויקט שתשויכו אליו יופיע כאן."}
                    </div>
                )}

                {shown.map(project => {
                    const task = nextTask(project.idProject);
                    const days = daysSince(project.lastUpdateDate);
                    const managers = memberNames(project, MemberRole.Manager);
                    const doers = project.members.filter(m => m.memberRole !== MemberRole.Manager).map(m => m.firstName);

                    return (
                        <button key={project.idProject} type="button" className="prow" onClick={() => openProject(project.idProject)}>

                            <div className="prow-main">
                                <div className="prow-title">
                                    <ClientChip idClient={project.idClient} clientName={project.clientName} />
                                    <span className="prow-name">{project.projectName || "פרויקט כללי"}</span>
                                </div>
                                <div className="prow-meta">
                                    {managers.length > 0 && <span>אחראי/ת: {managers.join(", ")}</span>}
                                    {doers.length > 0 && <span>צוות: {doers.join(", ")}</span>}
                                    {project.deadline && <span>דדליין: {/^\d{4}-/.test(project.deadline) ? fmtDate(project.deadline) : project.deadline}</span>}
                                    <UrgencyTag urgency={project.urgency} />
                                </div>
                                <StageProgress project={project} />
                            </div>

                            <div className="prow-next">
                                {task ? (
                                    <>
                                        <span className="prow-label">הצעד הבא{task.withClient ? " · מול הלקוח" : task.withName ? ` · מול ${task.withName}` : ""}</span>
                                        <span className="prow-task">{task.taskText} {task.priority !== "normal" && <PriorityTag priority={task.priority} />}</span>
                                    </>
                                ) : <span className="prow-label">אין משימה פתוחה</span>}

                                {project.lastSummary && <span className="prow-last" title={project.lastSummary}>{project.lastSummary}</span>}
                            </div>

                            <div className="prow-side">
                                <StatusPill status={project.status} />
                                <span className={isStale(project) ? "prow-days stale" : "prow-days"}>
                                    {project.lastUpdateDate ? `עודכן ${relDays(days)}` : "עדיין אין תיעוד"}
                                </span>
                            </div>

                        </button>
                    );
                })}
            </div>

        </section>
    );
}
