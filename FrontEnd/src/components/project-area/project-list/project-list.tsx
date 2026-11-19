import "./project-list.css";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { MenuItem, TextField, Tooltip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import type { RootState } from "../../redux/store";
import type { ProjectModel } from "../../models/project-model";
import type { TaskModel } from "../../models/task-model";
import { InvoiceStatus, leadStatuses, MemberRole, priorityRank, ProjectStatus, statusLabel, statusStyle, urgencyRank } from "../../models/enum";
import { useTitle } from "../../utils/UseTitle";
import { useProjectDrawer } from "../../utils/UseProjectDrawer";
import { appConfig } from "../../utils/app-config";
import {
    assignments, daysSince, dueBucket, fmtDate, fullName, healthLabel, hueOf, isPrivileged, isStale, jobUsage,
    memberNames, personColor, projectHealth, relDays, tabOf, type HealthLevel, type ProjectTab
} from "../../utils/utils";
import { settingsService } from "../../service/settingsService";
import { StatusPill } from "../../shared-area/tags/tags";


const titles: Record<ProjectTab, [string, string]> = {
    active: ["פרויקטים פעילים", ""],
    lead: ["לידים", "פניות והצעות מחיר שעוד לא הפכו לפרויקט"],
    done: ["פרויקטים שהסתיימו", "ארכיון הפרויקטים שנסגרו"]
};

type SortKey = "attention" | "last" | "stale" | "client" | "status" | "urgency";
type ViewMode = "list" | "cards";

const healthRank: Record<HealthLevel, number> = { off: 0, risk: 1, ok: 2, frozen: 3 };

const monthNames = ["ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני", "יולי", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳"];


//Greeting by the hour
function greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? "בוקר טוב" : h < 17 ? "צהריים טובים" : h < 21 ? "ערב טוב" : "לילה טוב";
}

//Due date chip: text + color class
function dueChip(due: string | null): { text: string, cls: string } {
    if (!due) return { text: "ללא תאריך", cls: "none" };
    const bucket = dueBucket(due);
    if (bucket === "באיחור") return { text: `באיחור · ${fmtDate(due)}`, cls: "late" };
    if (bucket === "היום" || bucket === "מחר") return { text: bucket, cls: "soon" };
    return { text: fmtDate(due), cls: "ok" };
}


//Projects screen - "control center": greeting, KPIs, smart list and insights rail
export function ProjectList({ tab }: { tab: ProjectTab }) {

    useTitle(titles[tab][0]);

    const me = useSelector((state: RootState) => state.auth.user);
    const users = useSelector((state: RootState) => state.data.users);
    const projects = useSelector((state: RootState) => state.data.projects);
    const tasks = useSelector((state: RootState) => state.data.tasks);
    const loaded = useSelector((state: RootState) => state.data.loaded);

    const { openProject } = useProjectDrawer();
    const [searchParams, setSearchParams] = useSearchParams();

    const [search, setSearch] = useState("");
    const [person, setPerson] = useState("");
    const [sort, setSort] = useState<SortKey>(tab === "active" ? "attention" : "last");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [view, setView] = useState<ViewMode>(() => (localStorage.getItem("projectsView") as ViewMode) || "list");
    const heat = useSelector((state: RootState) => state.data.heat);

    const privileged = isPrivileged(me?.role);
    const clientFilter = searchParams.get("client") || "";


    //Load map settings (team load in the rail)
    useEffect(() => {
        if (tab === "active" && privileged) settingsService.getHeat().catch(() => undefined);
    }, [tab, privileged]);

    function changeView(mode: ViewMode) {
        setView(mode);
        localStorage.setItem("projectsView", mode);
    }


    // =========================
    // Data
    // =========================

    const inTab = useMemo(() => projects.filter(p => tabOf(p) === tab), [projects, tab]);

    const healthOf = useMemo(() => {
        const map = new Map<number, ReturnType<typeof projectHealth>>();
        for (const p of inTab) map.set(p.idProject, projectHealth(p, tasks));
        return map;
    }, [inTab, tasks]);

    const level = (p: ProjectModel) => healthOf.get(p.idProject)?.level ?? "ok";

    //Next open task of each project
    const nextTask = (idProject: number): TaskModel | undefined => tasks
        .filter(t => t.idProject === idProject && !t.isDone)
        .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || (a.dueDate || "9999").localeCompare(b.dueDate || "9999"))[0];

    const persons = [...new Set(inTab.flatMap(p => memberNames(p)))].sort((a, b) => a.localeCompare(b, "he"));

    const statuses = tab === "lead" ? leadStatuses : tab === "done" ? [ProjectStatus.Completed as string] : Object.values(ProjectStatus).filter(s => s !== ProjectStatus.Completed) as string[];

    const sorters: Record<SortKey, (a: ProjectModel, b: ProjectModel) => number> = {
        attention: (a, b) => healthRank[level(a)] - healthRank[level(b)] || urgencyRank[a.urgency] - urgencyRank[b.urgency],
        last: (a, b) => (b.lastUpdateDate || "").localeCompare(a.lastUpdateDate || "") || b.updatedAt.localeCompare(a.updatedAt),
        stale: (a, b) => (a.lastUpdateDate || "").localeCompare(b.lastUpdateDate || ""),
        client: (a, b) => (a.clientName || "").localeCompare(b.clientName || "", "he"),
        status: (a, b) => statuses.indexOf(a.status) - statuses.indexOf(b.status),
        urgency: (a, b) => urgencyRank[a.urgency] - urgencyRank[b.urgency]
    };

    const needsAttention = (p: ProjectModel) => level(p) === "off" || level(p) === "risk";

    const filtered = inTab.filter(p =>
        (!clientFilter || String(p.idClient) === clientFilter) &&
        (!person || memberNames(p).includes(person)) &&
        (!statusFilter || (statusFilter === "__stale" ? isStale(p) : statusFilter === "__attention" ? needsAttention(p) : p.status === statusFilter)) &&
        (!search || [p.clientName, p.projectName, p.notes, p.lastSummary, nextTask(p.idProject)?.taskText, ...memberNames(p)].join(" ").includes(search))
    );

    const shown = [...filtered].sort(sorters[sort]);

    const staleCount = inTab.filter(isStale).length;
    const attention = inTab.filter(needsAttention).sort(sorters.attention);


    // =========================
    // KPIs + rail (active tab)
    // =========================

    const openTasks = tasks.filter(t => !t.isDone);
    const lateTasks = openTasks.filter(t => dueBucket(t.dueDate) === "באיחור");
    const readyToBill = projects.filter(p => p.invoiceStatus === InvoiceStatus.Ready);
    const myOpenTasks = openTasks.filter(t => t.idOwner === me?.idUser);
    const pct = (n: number, total: number) => `${total && n ? Math.max(4, Math.round(n / total * 100)) : 0}%`;

    const kpis = [
        { label: "פרויקטים פעילים", value: inTab.length, pct: "100%", cls: "accent", hint: `${inTab.filter(p => p.status === ProjectStatus.InProgress).length} בעבודה · ${inTab.filter(p => p.status === ProjectStatus.Delivered).length} נמסרו`, filter: null as string | null },
        { label: "דורשים תשומת לב", value: attention.length, pct: pct(attention.length, inTab.length), cls: "risk", hint: `${inTab.filter(p => level(p) === "off").length} חורגים · ${staleCount} לא עודכנו`, filter: "__attention" },
        { label: "משימות באיחור", value: lateTasks.length, pct: pct(lateTasks.length, openTasks.length), cls: "off", hint: `מתוך ${openTasks.length} משימות פתוחות`, filter: null },
        privileged
            ? { label: "מוכנים לחיוב", value: readyToBill.length, pct: pct(readyToBill.length, projects.length), cls: "ok", hint: "ממתינים להוצאת חשבונית", filter: null }
            : { label: "המשימות שלי", value: myOpenTasks.length, pct: pct(myOpenTasks.length, openTasks.length), cls: "ok", hint: "משימות פתוחות באחריותך", filter: null }
    ];

    //Upcoming: open tasks due in the next 14 days + planned end dates
    const todayIso = new Date().toISOString().slice(0, 10);
    const in14 = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
    const upcoming = [
        ...openTasks.filter(t => t.dueDate && t.dueDate >= todayIso && t.dueDate <= in14 && t.idProject && inTab.some(p => p.idProject === t.idProject))
            .map(t => ({ key: `t${t.idTask}`, date: t.dueDate!, title: `${t.clientName || ""}${t.projectName ? " · " + t.projectName : ""}`, sub: t.taskText, idProject: t.idProject! })),
        ...inTab.filter(p => p.endDate && p.endDate >= todayIso && p.endDate <= in14)
            .map(p => ({ key: `p${p.idProject}`, date: p.endDate!, title: `${p.clientName || ""}${p.projectName ? " · " + p.projectName : ""}`, sub: "תאריך סיום מתוכנן", idProject: p.idProject }))
    ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

    //Team load (job usage %)
    const load = useMemo(() => {
        if (!heat) return [];
        const map = assignments(projects);
        return users.filter(u => u.isActive && map.has(u.idUser))
            .map(u => ({ user: u, usage: jobUsage(map.get(u.idUser)!, u, heat) }))
            .sort((a, b) => b.usage - a.usage)
            .slice(0, 6);
    }, [heat, projects, users]);

    const loadClass = (usage: number) => usage > 100 ? "over" : usage >= 80 ? "full" : "ok";


    function setClient(value: string) {
        setSearchParams(params => {
            if (value) params.set("client", value);
            else params.delete("client");
            return params;
        });
    }

    const clients = [...new Map(inTab.filter(p => p.idClient).map(p => [p.idClient!, p.clientName || ""])).entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "he"));


    // =========================
    // Row parts
    // =========================

    const stageBar = (p: ProjectModel) => (
        <div className="pl-stage">
            {p.stagesTotal ? (
                <>
                    <div className="pl-segs">
                        {Array.from({ length: p.stagesTotal }, (_, i) => (
                            <span key={i} className={i < p.stagesDone ? "on" : i === p.stagesDone ? "now" : ""} />
                        ))}
                    </div>
                    <span className="pl-stage-text">{p.stagesDone}/{p.stagesTotal} · {p.currentStage || "הכל הושלם"}</span>
                </>
            ) : <span className="pl-stage-text muted">לא הוגדרו שלבים</span>}
        </div>
    );

    const team = (p: ProjectModel) => (
        <div className="pl-team">
            {p.members.slice(0, 4).map(m => (
                <Tooltip key={m.idUser} title={`${m.firstName} · ${m.memberRole === MemberRole.Manager ? "אחראי/ת" : m.memberRole === MemberRole.Executor ? "מבצע/ת" : "צוות"}`}>
                    <span className="pl-avatar" style={{ background: personColor(m.idUser) }}>{m.firstName.slice(0, 1)}</span>
                </Tooltip>
            ))}
            {p.members.length > 4 && <span className="pl-avatar more">+{p.members.length - 4}</span>}
            {!p.members.length && <span className="muted pl-small">—</span>}
        </div>
    );

    const next = (p: ProjectModel) => {
        const task = nextTask(p.idProject);
        if (!task) return <span className="muted pl-small">אין משימה פתוחה</span>;
        const chip = dueChip(task.dueDate);
        return (
            <div className="pl-next">
                <span className="pl-next-text" title={task.taskText}>{task.taskText}</span>
                <div className="pl-next-meta">
                    <span className={`pl-due ${chip.cls}`}>{chip.text}</span>
                    {(task.withClient || task.withName) && <span className="muted">מול: {task.withClient ? "לקוח" : task.withName}</span>}
                </div>
            </div>
        );
    };

    const clientBadge = (p: ProjectModel, size = "") => (
        <span className={`pl-client-badge ${size}`} style={{ background: `hsl(${hueOf(p.idClient)} 70% 94%)`, color: `hsl(${hueOf(p.idClient)} 60% 28%)` }}>
            {(p.clientName || "?").slice(0, 1)}
        </span>
    );

    const updatedText = (p: ProjectModel) => p.lastUpdateDate ? `עודכן ${relDays(daysSince(p.lastUpdateDate))}` : "עדיין אין תיעוד";


    // =========================
    // JSX
    // =========================

    return (
        <section className="page pl-page">

            {/* Greeting / title */}
            <header className="pl-head">
                {tab === "active" ? (
                    <div>
                        <span className="pl-date">{new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}</span>
                        <h1>{greeting()} {me?.firstName}</h1>
                        <p>{inTab.length} פרויקטים פעילים{attention.length ? ` · ${attention.length} דורשים את תשומת ליבך` : " · הכל במסלול"}</p>
                    </div>
                ) : (
                    <div>
                        <h1>{titles[tab][0]}</h1>
                        <p>{titles[tab][1]}</p>
                    </div>
                )}

                <label className="pl-search">
                    <SearchIcon fontSize="small" />
                    <input type="search" placeholder="חיפוש פרויקט, לקוח, אדם או מילה מתוך התיעוד" value={search} onChange={e => setSearch(e.target.value)} />
                </label>
            </header>

            {/* KPIs */}
            {tab === "active" && (
                <div className="pl-kpis">
                    {kpis.map(k => (
                        <button key={k.label} type="button" className={`pl-kpi ${k.cls}${k.filter && statusFilter === k.filter ? " on" : ""}`}
                            disabled={!k.filter} onClick={() => k.filter && setStatusFilter(statusFilter === k.filter ? null : k.filter)}>
                            <span className="pl-kpi-label">{k.label}<i /></span>
                            <b>{k.value}</b>
                            <span className="pl-kpi-bar"><em style={{ width: k.pct }} /></span>
                            <span className="pl-kpi-hint">{k.hint}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Toolbar */}
            <div className="pl-toolbar">
                <div className="pl-seg" role="group" aria-label="תצוגה">
                    <button type="button" aria-pressed={view === "list"} onClick={() => changeView("list")}>רשימה</button>
                    <button type="button" aria-pressed={view === "cards"} onClick={() => changeView("cards")}>כרטיסים</button>
                </div>

                <div className="pl-pills">
                    <button type="button" className="pl-pill all" aria-pressed={!statusFilter} onClick={() => setStatusFilter(null)}>הכל <b>{inTab.length}</b></button>
                    {statuses.map(status => {
                        const count = inTab.filter(p => p.status === status).length;
                        if (!count && statusFilter !== status) return null;
                        return (
                            <button key={status} type="button" className={`pl-pill s-${statusStyle[status]}`} aria-pressed={statusFilter === status}
                                onClick={() => setStatusFilter(statusFilter === status ? null : status)}>
                                <span className="dot" />{statusLabel[status]} <b>{count}</b>
                            </button>
                        );
                    })}
                    {tab !== "done" && !!staleCount && (
                        <button type="button" className="pl-pill warn" aria-pressed={statusFilter === "__stale"} onClick={() => setStatusFilter(statusFilter === "__stale" ? null : "__stale")}>
                            לא עודכנו {appConfig.staleDays}+ ימים <b>{staleCount}</b>
                        </button>
                    )}
                </div>

                <div className="pl-selects">
                    <TextField select size="small" label="לקוח" value={clientFilter} onChange={e => setClient(e.target.value)}>
                        <MenuItem value="">כל הלקוחות</MenuItem>
                        {clients.map(([id, name]) => <MenuItem key={id} value={String(id)}>{name}</MenuItem>)}
                    </TextField>
                    <TextField select size="small" label="איש צוות" value={person} onChange={e => setPerson(e.target.value)}>
                        <MenuItem value="">כל הצוות</MenuItem>
                        {persons.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                    </TextField>
                    <TextField select size="small" label="מיון" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
                        <MenuItem value="attention">דורש טיפול קודם</MenuItem>
                        <MenuItem value="last">עודכן לאחרונה</MenuItem>
                        <MenuItem value="stale">הכי מזמן לא עודכן</MenuItem>
                        <MenuItem value="client">לפי לקוח</MenuItem>
                        <MenuItem value="status">לפי סטטוס</MenuItem>
                        <MenuItem value="urgency">לפי דחיפות</MenuItem>
                    </TextField>
                </div>
            </div>

            {/* Content */}
            <div className="pl-content">

                <div className="pl-main">

                    {!loaded && <div className="list"><div className="empty"><strong>טוען את הפרויקטים…</strong></div></div>}

                    {loaded && !shown.length && (
                        <div className="list"><div className="empty">
                            <strong>{inTab.length ? "אין פרויקטים שמתאימים לסינון" : "אין כאן פרויקטים"}</strong>
                            {inTab.length ? "נסו לנקות את החיפוש או את הסינון." : "פרויקט שתשויכו אליו יופיע כאן."}
                        </div></div>
                    )}

                    {/* List view */}
                    {loaded && !!shown.length && view === "list" && (
                        <section className="pl-table" aria-label="רשימת פרויקטים">
                            <div className="pl-row pl-th">
                                <span /><span>פרויקט</span><span>שלב בעבודה</span><span>צוות</span><span>הצעד הבא</span><span>סטטוס</span>
                            </div>
                            {shown.map(p => {
                                const health = healthOf.get(p.idProject)!;
                                return (
                                    <button key={p.idProject} type="button" className="pl-row" onClick={() => openProject(p.idProject)}>
                                        <Tooltip title={`${healthLabel[health.level]} · ${health.reason}`}>
                                            <span className={`pl-health h-${health.level}`} />
                                        </Tooltip>

                                        <div className="pl-project">
                                            {clientBadge(p)}
                                            <div className="pl-project-text">
                                                <span className="pl-client">{p.clientName || "ללא לקוח"}</span>
                                                <span className="pl-name">{p.projectName || "פרויקט כללי"}</span>
                                                <span className={`pl-updated${isStale(p) ? " stale" : ""}`}>{updatedText(p)}</span>
                                            </div>
                                        </div>

                                        {stageBar(p)}
                                        {team(p)}
                                        {next(p)}
                                        <span className="pl-status"><StatusPill status={p.status} /></span>
                                    </button>
                                );
                            })}
                            <div className="pl-table-foot">מוצגים {shown.length} מתוך {inTab.length}</div>
                        </section>
                    )}

                    {/* Cards view */}
                    {loaded && !!shown.length && view === "cards" && (
                        <div className="pl-cards">
                            {shown.map(p => {
                                const health = healthOf.get(p.idProject)!;
                                const done = p.stagesTotal ? Math.round(p.stagesDone / p.stagesTotal * 100) : null;
                                return (
                                    <button key={p.idProject} type="button" className={`pl-card h-${health.level}`} onClick={() => openProject(p.idProject)}>
                                        <div className="pl-card-head">
                                            {clientBadge(p, "sm")}
                                            <span className="pl-client">{p.clientName || "ללא לקוח"}</span>
                                            <span className="grow" />
                                            <StatusPill status={p.status} />
                                        </div>
                                        <span className="pl-card-name">{p.projectName || "פרויקט כללי"}</span>
                                        {stageBar(p)}
                                        <div className="pl-card-next">{next(p)}</div>
                                        <div className="pl-card-foot">
                                            {team(p)}
                                            <span className={`pl-updated${isStale(p) ? " stale" : ""}`}>{done != null ? `${done}% · ` : ""}{updatedText(p)}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Insights rail */}
                {tab === "active" && (
                    <aside className="pl-rail" aria-label="תובנות">

                        <section className="pl-box">
                            <h2>דורש תשומת לב</h2>
                            {attention.slice(0, 5).map(p => {
                                const health = healthOf.get(p.idProject)!;
                                return (
                                    <button key={p.idProject} type="button" className={`pl-attn h-${health.level}`} onClick={() => openProject(p.idProject)}>
                                        <i />
                                        <span>
                                            <b>{p.clientName}{p.projectName ? ` · ${p.projectName}` : ""}</b>
                                            <small>{health.reason}</small>
                                        </span>
                                    </button>
                                );
                            })}
                            {!attention.length && <span className="muted pl-small">אין כרגע פרויקטים בסיכון</span>}
                            {attention.length > 5 && (
                                <button type="button" className="link pl-more" onClick={() => setStatusFilter("__attention")}>עוד {attention.length - 5} ←</button>
                            )}
                        </section>

                        <section className="pl-box">
                            <h2>דדליינים קרובים</h2>
                            {upcoming.map(u => (
                                <button key={u.key} type="button" className="pl-deadline" onClick={() => openProject(u.idProject)}>
                                    <span className="pl-cal"><b>{+u.date.slice(8, 10)}</b><small>{monthNames[+u.date.slice(5, 7) - 1]}</small></span>
                                    <span className="pl-deadline-text"><b>{u.title}</b><small>{u.sub}</small></span>
                                </button>
                            ))}
                            {!upcoming.length && <span className="muted pl-small">אין דדליינים בשבועיים הקרובים</span>}
                        </section>

                        {privileged && load.length > 0 && (
                            <section className="pl-box dark">
                                <h2>עומס הצוות</h2>
                                {load.map(({ user, usage }) => (
                                    <div key={user.idUser} className="pl-load">
                                        <div><span>{fullName(user)}</span><b className={loadClass(usage)}>{usage}%</b></div>
                                        <span className="pl-load-bar"><em className={loadClass(usage)} style={{ width: `${Math.min(usage, 100)}%` }} /></span>
                                    </div>
                                ))}
                            </section>
                        )}

                    </aside>
                )}
            </div>

        </section>
    );
}
