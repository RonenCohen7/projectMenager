import "./hours-list.css";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import type { ProjectModel } from "../../models/project-model";
import { useTitle } from "../../utils/UseTitle";
import { useProjectDrawer } from "../../utils/UseProjectDrawer";
import { hoursOverrun } from "../../utils/utils";
import { ClientChip, StatusPill } from "../../shared-area/tags/tags";


function hoursText(value: number | string | null | undefined): string {
    if (value == null || value === "") return "—";
    const n = Number(value);
    return Number.isFinite(n) ? String(n) : "—";
}


//Time: the hours already stored on each project the viewer may see
export function HoursList() {

    useTitle("ניהול זמנים");

    const projects = useSelector((state: RootState) => state.data.projects);
    const loaded = useSelector((state: RootState) => state.data.loaded);
    const { openProject } = useProjectDrawer();

    const [search, setSearch] = useState("");


    const rows = useMemo(() => {
        const q = search.trim();
        return projects
            .filter(p => !q || [p.clientName, p.projectName].join(" ").includes(q))
            .map(p => ({ project: p, overrun: hoursOverrun(p.hoursAllocated, p.hoursBillable, p.hoursDone) }))
            .sort((a, b) =>
                (b.overrun ?? -1) - (a.overrun ?? -1)
                || (a.project.clientName || "").localeCompare(b.project.clientName || "", "he")
                || (a.project.projectName || "").localeCompare(b.project.projectName || "", "he")
            );
    }, [projects, search]);

    const sum = (pick: (p: ProjectModel) => number | string | null) => rows.reduce((total, row) => total + (Number(pick(row.project)) || 0), 0);
    const overrunSum = rows.reduce((total, row) => total + (row.overrun || 0), 0);


    return (
        <section className="page">

            <header className="page-head">
                <div>
                    <h1>ניהול זמנים</h1>
                    <p>שעות לחיוב, שעות שהוקצו, שעות שבוצעו ושעות חריגה, מתוך מה ששמור בכל פרויקט</p>
                </div>
                <label className="hours-search">
                    <input type="search" placeholder="חיפוש לקוח או פרויקט" value={search} onChange={e => setSearch(e.target.value)} />
                </label>
            </header>

            {!loaded && <div className="list"><div className="empty"><strong>טוען את הפרויקטים…</strong></div></div>}

            {loaded && !rows.length && (
                <div className="list"><div className="empty">
                    <strong>{projects.length ? "אין פרויקטים שמתאימים לחיפוש" : "אין פרויקטים להצגה"}</strong>
                </div></div>
            )}

            {loaded && !!rows.length && (
                <div className="list hours-table">
                    <div className="hours-row hours-th">
                        <span>לקוח</span>
                        <span>פרויקט</span>
                        <span>סטטוס</span>
                        <span>שעות לחיוב</span>
                        <span>שעות שהוקצו</span>
                        <span>שעות שבוצעו</span>
                        <span>שעות חריגה</span>
                    </div>
                    {rows.map(({ project, overrun }) => (
                        <button key={project.idProject} type="button" className="hours-row" onClick={() => openProject(project.idProject)}>
                            <ClientChip idClient={project.idClient} clientName={project.clientName} />
                            <span className="hours-name">{project.projectName || "פרויקט כללי"}</span>
                            <StatusPill status={project.status} />
                            <span>{hoursText(project.hoursBillable)}</span>
                            <span>{hoursText(project.hoursAllocated)}</span>
                            <span>{hoursText(project.hoursDone)}</span>
                            <span className={overrun ? "hours-over" : ""}>{overrun == null ? "—" : String(overrun)}</span>
                        </button>
                    ))}
                    <div className="hours-row hours-foot">
                        <span>סה״כ {rows.length}</span>
                        <span />
                        <span />
                        <span>{sum(p => p.hoursBillable)}</span>
                        <span>{sum(p => p.hoursAllocated)}</span>
                        <span>{sum(p => p.hoursDone)}</span>
                        <span className={overrunSum ? "hours-over" : ""}>{overrunSum}</span>
                    </div>
                </div>
            )}

        </section>
    );
}
