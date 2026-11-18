import "./status-meeting.css";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import type { RootState } from "../../redux/store";
import type { ProjectModel } from "../../models/project-model";
import { InvoiceStatus, LeadStatus, ProjectKind, ProjectStatus, Urgency, urgencyRank, MemberRole } from "../../models/enum";
import { useTitle } from "../../utils/UseTitle";
import { useProjectDrawer } from "../../utils/UseProjectDrawer";
import { daysSince, dueBucket, fmtDate, isInactive, isPrivileged, isStale, memberNames, relDays, todayISO } from "../../utils/utils";
import { ClientChip, StageProgress, StatusPill, UrgencyTag } from "../../shared-area/tags/tags";


const statusOrder = [ProjectStatus.InProgress, ProjectStatus.Fixes, ProjectStatus.WaitingClient, ProjectStatus.Delivered, ProjectStatus.NotStarted, ProjectStatus.Frozen] as string[];


//Weekly status meeting: summary tiles, what needs attention, and a presentation mode project by project
export function StatusMeeting() {

    useTitle("ישיבת סטטוס");

    const me = useSelector((state: RootState) => state.auth.user);
    const projects = useSelector((state: RootState) => state.data.projects);
    const tasks = useSelector((state: RootState) => state.data.tasks);

    const navigate = useNavigate();
    const { openProject } = useProjectDrawer();

    const [slide, setSlide] = useState<number | null>(null);

    const active = projects.filter(p => p.kind === ProjectKind.Project && p.status !== ProjectStatus.Completed);
    const live = active.filter(p => !isInactive(p.status));
    const count = (status: string) => live.filter(p => p.status === status).length;

    const urgent = live.filter(p => p.urgency === Urgency.Urgent || p.urgency === Urgency.High);
    const stale = live.filter(isStale);
    const lateTasks = tasks.filter(t => !t.isDone && dueBucket(t.dueDate) === "באיחור");
    const readyToBill = projects.filter(p => p.invoiceStatus === InvoiceStatus.Ready);
    const openLeads = projects.filter(p => p.kind === ProjectKind.Lead && p.status !== LeadStatus.Dropped);

    //Order for the presentation: by status, then urgency
    const list = [...active].sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status) || urgencyRank[a.urgency] - urgencyRank[b.urgency] || (a.clientName || "").localeCompare(b.clientName || "", "he"));

    const attention: { project: ProjectModel, why: string }[] = [
        ...urgent.map(project => ({ project, why: `דחיפות ${project.urgency === Urgency.Urgent ? "דחוף" : "גבוה"}` })),
        ...stale.filter(p => !urgent.includes(p)).map(project => ({ project, why: `לא עודכן ${project.lastUpdateDate ? relDays(daysSince(project.lastUpdateDate)) : "מעולם"}` }))
    ];


    // =========================
    // Keyboard in presentation mode
    // =========================

    useEffect(() => {
        if (slide === null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") setSlide(s => Math.min((s ?? 0) + 1, list.length - 1));
            if (e.key === "ArrowRight") setSlide(s => Math.max((s ?? 0) - 1, 0));
            if (e.key === "Escape") setSlide(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [slide, list.length]);


    const card = (p: ProjectModel, big?: boolean) => {
        const open = tasks.filter(t => t.idProject === p.idProject && !t.isDone);
        return (
            <article key={p.idProject} className={big ? "mcard big" : "mcard"}>
                <div className="mcard-head">
                    <ClientChip idClient={p.idClient} clientName={p.clientName} />
                    <button type="button" className="link mcard-title" onClick={() => openProject(p.idProject)}>{p.projectName || "פרויקט כללי"}</button>
                    <StatusPill status={p.status} />
                    <UrgencyTag urgency={p.urgency} />
                </div>
                <div className="mcard-meta">
                    {memberNames(p, MemberRole.Manager).length > 0 && <span>אחראי/ת: {memberNames(p, MemberRole.Manager).join(", ")}</span>}
                    {p.deadline && <span>דדליין: {/^\d{4}-/.test(p.deadline) ? fmtDate(p.deadline) : p.deadline}</span>}
                    <span className={isStale(p) ? "stale" : ""}>{p.lastUpdateDate ? `עדכון אחרון ${relDays(daysSince(p.lastUpdateDate))}` : "אין תיעוד"}</span>
                </div>
                <StageProgress project={p} />
                {p.lastSummary && <p className="mcard-summary">{p.lastSummary}</p>}
                {open.length > 0 && (
                    <ul className="mcard-tasks">
                        {open.slice(0, big ? 10 : 3).map(t => <li key={t.idTask}>{t.taskText}{t.withClient ? " (לקוח)" : t.withName ? ` (מול ${t.withName})` : ""}{t.dueDate ? ` · עד ${fmtDate(t.dueDate)}` : ""}</li>)}
                    </ul>
                )}
            </article>
        );
    };


    // =========================
    // Presentation mode
    // =========================

    if (slide !== null) {
        const index = Math.max(0, Math.min(slide, list.length - 1));
        return (
            <section className="page mslide">
                <div className="mslide-nav">
                    <Button variant="outlined" disabled={index === 0} onClick={() => setSlide(index - 1)}>→ הקודם</Button>
                    <span className="note">פרויקט {index + 1} מתוך {list.length} · חצים במקלדת להעברה</span>
                    <Button variant="outlined" disabled={index >= list.length - 1} onClick={() => setSlide(index + 1)}>הבא ←</Button>
                    <span className="grow" />
                    <Button onClick={() => setSlide(null)}>יציאה ממצב מצגת ✕</Button>
                </div>
                {list[index] && card(list[index], true)}
            </section>
        );
    }


    const tile = (n: number, label: string, cls = "", onClick?: () => void) => (
        <button type="button" className={`mtile ${cls}`} onClick={onClick} disabled={!onClick}><b>{n}</b><span>{label}</span></button>
    );


    return (
        <section className="page">

            <header className="page-head">
                <div>
                    <h1>ישיבת סטטוס · {fmtDate(todayISO())}</h1>
                    <p>תמונת מצב של כל הפרויקטים הפעילים. אפשר לעבור פרויקט-פרויקט במצב מצגת.</p>
                </div>
                <Button variant="contained" startIcon={<PlayArrowIcon />} disabled={!list.length} onClick={() => setSlide(0)}>מצב מצגת</Button>
            </header>

            <div className="mtiles">
                {tile(live.length, "פרויקטים פעילים")}
                {tile(count(ProjectStatus.InProgress), "בעבודה")}
                {tile(count(ProjectStatus.Fixes), "בתיקונים")}
                {tile(count(ProjectStatus.WaitingClient), "ממתין ללקוח", "warn")}
                {tile(count(ProjectStatus.Delivered), "נמסרו")}
                {tile(urgent.length, "דחוף / גבוה", urgent.length ? "bad" : "")}
                {tile(stale.length, "לא עודכנו 14+ ימים", stale.length ? "bad" : "")}
                {tile(lateTasks.length, "משימות באיחור", lateTasks.length ? "bad" : "", () => navigate("/tasks"))}
                {isPrivileged(me?.role) && tile(readyToBill.length, "מוכנים לחיוב", "good", () => navigate("/invoices"))}
                {tile(openLeads.length, "לידים פתוחים", "", () => navigate("/leads"))}
            </div>

            {attention.length > 0 && (
                <section>
                    <h2 className="section-title">דורש תשומת לב<small>{attention.length}</small></h2>
                    <div className="list">
                        {attention.map(({ project, why }) => (
                            <button key={project.idProject} type="button" className="mattn" onClick={() => openProject(project.idProject)}>
                                <ClientChip idClient={project.idClient} clientName={project.clientName} />
                                <span className="mattn-name">{project.projectName || "פרויקט כללי"}</span>
                                <span className="tag tag-stale">{why}</span>
                                <StatusPill status={project.status} />
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {statusOrder.map(status => {
                const group = list.filter(p => p.status === status);
                if (!group.length) return null;
                return (
                    <section key={status}>
                        <h2 className="section-title"><StatusPill status={status} /><small>{group.length}</small></h2>
                        <div className="mgrid">{group.map(p => card(p))}</div>
                    </section>
                );
            })}

        </section>
    );
}
