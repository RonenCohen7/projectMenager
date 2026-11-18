import "./tags.css";
import { priorityLabel, statusLabel, statusStyle, urgencyLabel, Urgency, Priority } from "../../models/enum";
import type { ProjectModel } from "../../models/project-model";
import { hueOf } from "../../utils/utils";


//Status of project / lead
export function StatusPill({ status }: { status: string }) {
    return <span className={`pill s-${statusStyle[status] || "new"}`}>{statusLabel[status] || "ללא סטטוס"}</span>;
}


//Client name in its own color
export function ClientChip({ idClient, clientName }: { idClient: number | null, clientName: string | null }) {
    return <span className="cchip" style={{ ["--hue" as string]: hueOf(idClient) }}>{clientName || "ללא לקוח"}</span>;
}


//Urgency toward the client (normal is hidden unless always)
export function UrgencyTag({ urgency, always }: { urgency: Urgency, always?: boolean }) {
    if (urgency === Urgency.Normal && !always) return null;
    return <span className={`tag tag-${urgency}`}>דחיפות: {urgencyLabel[urgency]}</span>;
}


export function PriorityTag({ priority }: { priority: Priority }) {
    return <span className={`tag tag-${priority}`}>{priorityLabel[priority]}</span>;
}


//Stages progress bar
export function StageProgress({ project }: { project: ProjectModel }) {
    if (!project.stagesTotal) return null;
    const pct = Math.round(project.stagesDone / project.stagesTotal * 100);
    return (
        <div className="sprog" title={`${project.stagesDone} מתוך ${project.stagesTotal} שלבים הושלמו`}>
            <span className="spbar"><i style={{ width: `${pct}%` }} /></span>
            <span>{project.stagesDone}/{project.stagesTotal} שלבים{project.currentStage ? ` · עכשיו: ${project.currentStage}` : " · הכל הושלם"}</span>
        </div>
    );
}
