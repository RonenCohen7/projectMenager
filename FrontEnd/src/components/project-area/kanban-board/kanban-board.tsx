import "./kanban-board.css";
import { useState } from "react";
import { useSelector } from "react-redux";
import { MenuItem, Select, TextField } from "@mui/material";
import type { RootState } from "../../redux/store";
import type { ProjectModel } from "../../models/project-model";
import { MemberRole, phaseLabel, ProjectKind, ProjectPhase, ProjectStatus, statusLabel, statusStyle } from "../../models/enum";
import { useTitle } from "../../utils/UseTitle";
import { useProjectDrawer } from "../../utils/UseProjectDrawer";
import { fmtDate, memberNames } from "../../utils/utils";
import { projectService } from "../../service/projectService";
import { notificationService } from "../../service/notificationService";
import { ClientChip, StageProgress, UrgencyTag } from "../../shared-area/tags/tags";


const columns = [ProjectStatus.NotStarted, ProjectStatus.InProgress, ProjectStatus.Fixes, ProjectStatus.WaitingClient, ProjectStatus.Delivered, ProjectStatus.Frozen] as string[];


//Kanban of active projects - drag a card to change its status
export function KanbanBoard() {

    useTitle("לוח קנבן");

    const projects = useSelector((state: RootState) => state.data.projects);
    const tasks = useSelector((state: RootState) => state.data.tasks);

    const { openProject } = useProjectDrawer();

    const [search, setSearch] = useState("");
    const [person, setPerson] = useState("");
    const [phase, setPhase] = useState("");
    const [dragOver, setDragOver] = useState<string | null>(null);

    const active = projects.filter(p => p.kind === ProjectKind.Project && p.status !== ProjectStatus.Completed);
    const persons = [...new Set(active.flatMap(p => memberNames(p)))].sort((a, b) => a.localeCompare(b, "he"));

    const shown = active.filter(p =>
        (!person || memberNames(p).includes(person)) &&
        (!phase || (phase === "none" ? !p.phase : p.phase === phase)) &&
        (!search || [p.clientName, p.projectName, ...memberNames(p)].join(" ").includes(search))
    );


    async function move(idProject: number, change: { status?: string, phase?: string | null }) {
        try {
            await projectService.updateStatus(idProject, change);
        } catch (err) {
            notificationService.error(err);
        }
    }


    function onDrop(e: React.DragEvent, status: string) {
        e.preventDefault();
        setDragOver(null);
        const idProject = Number(e.dataTransfer.getData("text/plain"));
        const project = active.find(p => p.idProject === idProject);
        if (project && project.status !== status) move(idProject, { status });
    }


    const nextTask = (p: ProjectModel) => tasks.find(t => t.idProject === p.idProject && !t.isDone);


    return (
        <section className="page board-page">

            <header className="page-head">
                <div>
                    <h1>לוח קנבן</h1>
                    <p>גוררים כרטיס לעמודה אחרת כדי לשנות סטטוס. לחיצה על שם הפרויקט פותחת את הפרטים.</p>
                </div>
            </header>

            <div className="toolbar">
                <TextField type="search" placeholder="חיפוש" value={search} onChange={e => setSearch(e.target.value)} className="grow" />
                <TextField select label="איש צוות" value={person} onChange={e => setPerson(e.target.value)}>
                    <MenuItem value="">כל הצוות</MenuItem>
                    {persons.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                </TextField>
                <TextField select label="שלב" value={phase} onChange={e => setPhase(e.target.value)}>
                    <MenuItem value="">כל השלבים</MenuItem>
                    {Object.values(ProjectPhase).map(p => <MenuItem key={p} value={p}>{phaseLabel[p]}</MenuItem>)}
                    <MenuItem value="none">ללא שלב</MenuItem>
                </TextField>
            </div>

            <div className="board">
                {columns.map(status => {
                    const cards = shown.filter(p => p.status === status);
                    return (
                        <div key={status} className={`bcol s-${statusStyle[status]}${dragOver === status ? " over" : ""}`}
                            onDragOver={e => { e.preventDefault(); setDragOver(status); }}
                            onDragLeave={() => setDragOver(null)}
                            onDrop={e => onDrop(e, status)}>

                            <div className="bcol-head"><span className="dot" />{statusLabel[status]}<b>{cards.length}</b></div>

                            <div className="bcol-cards">
                                {cards.map(p => {
                                    const task = nextTask(p);
                                    return (
                                        <article key={p.idProject} className="kcard" draggable
                                            onDragStart={e => e.dataTransfer.setData("text/plain", String(p.idProject))}>

                                            <div className="kcard-chips">
                                                <ClientChip idClient={p.idClient} clientName={p.clientName} />
                                                <UrgencyTag urgency={p.urgency} />
                                            </div>

                                            <button type="button" className="link kcard-title" onClick={() => openProject(p.idProject)}>
                                                {p.projectName || "פרויקט כללי"}
                                            </button>

                                            {p.deadline && <div className="kcard-meta">דדליין: {/^\d{4}-/.test(p.deadline) ? fmtDate(p.deadline) : p.deadline}</div>}
                                            {p.members.length > 0 && <div className="kcard-meta">{memberNames(p, MemberRole.Manager).join(", ")}{p.members.some(m => m.memberRole !== MemberRole.Manager) ? " · " + p.members.filter(m => m.memberRole !== MemberRole.Manager).map(m => m.firstName).join(", ") : ""}</div>}

                                            <StageProgress project={p} />

                                            {task && <div className="kcard-next">← {task.taskText}</div>}

                                            <Select size="small" displayEmpty value={p.phase ?? ""} className="kcard-phase"
                                                onChange={e => move(p.idProject, { phase: e.target.value || null })}>
                                                <MenuItem value="">שלב: —</MenuItem>
                                                {Object.values(ProjectPhase).map(x => <MenuItem key={x} value={x}>{phaseLabel[x]}</MenuItem>)}
                                            </Select>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

        </section>
    );
}
