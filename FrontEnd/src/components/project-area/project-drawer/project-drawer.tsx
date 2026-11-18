import "./project-drawer.css";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Drawer, IconButton, Tab, Tabs } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { RootState } from "../../redux/store";
import type { ProjectDetailsModel } from "../../models/project-model";
import { ProjectKind } from "../../models/enum";
import { useProjectDrawer } from "../../utils/UseProjectDrawer";
import { hueOf } from "../../utils/utils";
import { projectService } from "../../service/projectService";
import { notificationService } from "../../service/notificationService";
import { StatusPill, UrgencyTag } from "../../shared-area/tags/tags";
import { ProjectForm } from "../project-form/project-form";
import { ProjectStages } from "../project-stages/project-stages";
import { ProjectLog } from "../project-log/project-log";
import { ProjectOutlook } from "../project-outlook/project-outlook";
import { TaskRow } from "../../task-area/task-row/task-row";
import { TaskAdd } from "../../task-area/task-add/task-add";


type DrawerTab = "log" | "details" | "stages" | "tasks" | "outlook";


//Side panel of one project: details, work stages, meeting log, tasks, Outlook
export function ProjectDrawer() {

    const { idProject, newKind, closeProject, openProject } = useProjectDrawer();

    const projects = useSelector((state: RootState) => state.data.projects);
    const tasks = useSelector((state: RootState) => state.data.tasks);

    const [project, setProject] = useState<ProjectDetailsModel | null>(null);
    const [tab, setTab] = useState<DrawerTab>("log");

    const isOpen = !!idProject || !!newKind;


    // =========================
    // Load details (again when the lists change after a save)
    // =========================

    const reload = useCallback(async () => {
        if (!idProject) return;
        try {
            setProject(await projectService.getOneProject(idProject));
        } catch (err) {
            notificationService.error(err);
            closeProject();
        }
    }, [idProject]);

    useEffect(() => {
        setProject(null);
        setTab(newKind ? "details" : "log");
    }, [idProject, newKind]);

    useEffect(() => {
        reload();
    }, [reload, projects, tasks]);


    const isLead = newKind ? newKind === "lead" : project?.kind === ProjectKind.Lead;
    const openTasks = project ? tasks.filter(t => t.idProject === project.idProject) : [];


    return (
        <Drawer anchor="right" open={isOpen} onClose={closeProject} slotProps={{ paper: { className: "pdrawer" } }}>

            <div className="pdrawer-head" style={{ ["--dcol" as string]: project ? `hsl(${hueOf(project.idClient)} 62% 34%)` : "var(--accent)" }}>
                <div className="pdrawer-title">
                    <span className="pdrawer-kind">{newKind ? (newKind === "lead" ? "ליד חדש" : "פרויקט חדש") : isLead ? "ליד" : "פרויקט"}</span>
                    <h2>{newKind ? "פרטים ראשונים" : project ? `${project.clientName || ""}${project.projectName ? " · " + project.projectName : ""}` : "טוען…"}</h2>
                    {project && (
                        <div className="pdrawer-tags">
                            <StatusPill status={project.status} />
                            <UrgencyTag urgency={project.urgency} always />
                        </div>
                    )}
                </div>
                <IconButton onClick={closeProject} aria-label="סגירה"><CloseIcon /></IconButton>
            </div>

            {project && (
                <Tabs value={tab} onChange={(_, value) => setTab(value)} className="pdrawer-tabs" variant="scrollable">
                    <Tab value="log" label={`תיעוד פגישות · ${project.updates.length}`} />
                    <Tab value="tasks" label={`משימות · ${openTasks.filter(t => !t.isDone).length}`} />
                    {!isLead && <Tab value="stages" label={`שלבי עבודה${project.stages.length ? ` · ${project.stages.filter(s => s.status === "done").length}/${project.stages.length}` : ""}`} />}
                    <Tab value="details" label={`פרטי ה${isLead ? "ליד" : "פרויקט"}`} />
                    <Tab value="outlook" label="שליחה ב-Outlook" />
                </Tabs>
            )}

            <div className="pdrawer-body">

                {newKind && (
                    <ProjectForm project={null} kind={newKind === "lead" ? ProjectKind.Lead : ProjectKind.Project}
                        onSaved={saved => openProject(saved.idProject)} />
                )}

                {project && tab === "details" && <ProjectForm project={project} kind={project.kind} onSaved={reload} />}

                {project && tab === "stages" && <ProjectStages project={project} />}

                {project && tab === "log" && <ProjectLog project={project} />}

                {project && tab === "tasks" && (
                    <div className="pdrawer-tasks">
                        <TaskAdd idProject={project.idProject} />
                        <div className="list">
                            {openTasks.map(task => <TaskRow key={task.idTask} task={task} hideProject />)}
                            {!openTasks.length && <div className="empty"><strong>אין משימות פתוחות</strong>משימה נוצרת גם מ"הצעד הבא" בתיעוד פגישה.</div>}
                        </div>
                    </div>
                )}

                {project && tab === "outlook" && <ProjectOutlook project={project} />}

            </div>
        </Drawer>
    );
}
