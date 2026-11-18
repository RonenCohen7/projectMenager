import "./project-log.css";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Button, MenuItem, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import type { RootState } from "../../redux/store";
import type { ProjectDetailsModel } from "../../models/project-model";
import type { UpdateDto, UpdateModel } from "../../models/update-model";
import { leadStatuses, Priority, priorityLabel, ProjectKind, projectStatuses, statusLabel, UpdateType, updateTypeLabel } from "../../models/enum";
import { fmtDate, isPrivileged, todayISO } from "../../utils/utils";
import { projectService } from "../../service/projectService";
import { notificationService } from "../../service/notificationService";
import { StatusPill } from "../../shared-area/tags/tags";


//Meetings and updates log of a project (timeline). Every member can write.
export function ProjectLog({ project }: { project: ProjectDetailsModel }) {

    const me = useSelector((state: RootState) => state.auth.user);

    const [editing, setEditing] = useState<UpdateModel | "new" | null>(null);

    const canManage = isPrivileged(me?.role);


    async function remove(update: UpdateModel) {
        if (!window.confirm("למחוק את התיעוד?")) return;
        try {
            await projectService.deleteUpdate(update.idUpdate);
        } catch (err) {
            notificationService.error(err);
        }
    }


    return (
        <div className="plog">

            {editing === null && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing("new")} className="plog-new">
                    תיעוד פגישה / עדכון
                </Button>
            )}

            {editing === "new" && <EntryForm project={project} update={null} onDone={() => setEditing(null)} />}

            {project.updates.length ? (
                <ol className="timeline">
                    {project.updates.map(update => editing !== "new" && editing?.idUpdate === update.idUpdate ? (
                        <li key={update.idUpdate} className="entry"><EntryForm project={project} update={update} onDone={() => setEditing(null)} /></li>
                    ) : (
                        <li key={update.idUpdate} className={`entry type-${update.updateType}`}>
                            <div className="entry-head">
                                <b>{fmtDate(update.updateDate)}</b>
                                <span className="entry-type">{updateTypeLabel[update.updateType]}</span>
                                {update.statusAfter && <StatusPill status={update.statusAfter} />}
                                <span className="grow" />
                                {(canManage || update.idAuthor === me?.idUser) && <button type="button" className="link entry-act" onClick={() => setEditing(update)}>עריכה</button>}
                                {canManage && <button type="button" className="link entry-act" onClick={() => remove(update)}>מחיקה</button>}
                            </div>

                            {update.participants && <div className="entry-meta">משתתפים: {update.participants}</div>}
                            {update.summary && <p className="entry-text">{update.summary}</p>}
                            {update.tasksText && <p className="entry-text entry-tasks"><b>משימות ואחריות: </b>{update.tasksText}</p>}

                            <div className="entry-meta">
                                {[update.authorName ? `תועד ע״י ${update.authorName}` : "", update.editedAt ? `נערך ${fmtDate(update.editedAt)}` : ""].filter(Boolean).join(" · ")}
                            </div>
                        </li>
                    ))}
                </ol>
            ) : editing === null && (
                <div className="list"><div className="empty"><strong>עדיין אין תיעוד</strong>אחרי הפגישה הבאה לוחצים על "תיעוד פגישה / עדכון".</div></div>
            )}

        </div>
    );
}


// =========================
// Entry form (new / edit)
// =========================

interface EntryFormProps {
    project: ProjectDetailsModel;
    update: UpdateModel | null;
    onDone: () => void;
}

function EntryForm({ project, update, onDone }: EntryFormProps) {

    const users = useSelector((state: RootState) => state.data.users);

    const statuses = project.kind === ProjectKind.Lead ? leadStatuses : projectStatuses;

    const { register, handleSubmit, watch, setValue, formState } = useForm<UpdateDto>({
        defaultValues: {
            updateDate: update?.updateDate ?? todayISO(),
            updateType: update?.updateType ?? UpdateType.ClientMeeting,
            participants: update?.participants ?? "",
            summary: update?.summary ?? "",
            tasksText: update?.tasksText ?? "",
            statusAfter: update?.statusAfter ?? project.status,
            nextStep: "",
            withWhom: "client",
            taskPriority: Priority.Normal,
            taskDue: ""
        }
    });


    async function send(form: UpdateDto) {
        const dto: UpdateDto = {
            ...form,
            withClient: form.withWhom === "client",
            idWithUser: form.withWhom && form.withWhom !== "client" ? Number(form.withWhom) : null
        };

        try {
            if (update) await projectService.editUpdate(update.idUpdate, dto);
            else await projectService.addUpdate(project.idProject, dto);
            notificationService.success("התיעוד נשמר");
            onDone();
        } catch (err) {
            notificationService.error(err);
        }
    }


    return (
        <form className="card entry-form" onSubmit={handleSubmit(send)} autoComplete="off">

            <TextField label="תאריך" type="date" slotProps={{ inputLabel: { shrink: true } }} {...register("updateDate")} />

            <TextField select label="סוג" value={watch("updateType")} onChange={e => setValue("updateType", e.target.value as UpdateType)}>
                {Object.values(UpdateType).map(t => <MenuItem key={t} value={t}>{updateTypeLabel[t]}</MenuItem>)}
            </TextField>

            <TextField label="משתתפים" placeholder="מי השתתף בפגישה" className="full" {...register("participants")} />
            <TextField label="מה עלה / מה סוכם" multiline minRows={4} className="full" autoFocus {...register("summary")} />
            <TextField label="משימות ואחריות" placeholder="מי עושה מה ועד מתי" multiline minRows={2} className="full" {...register("tasksText")} />

            {!update && (
                <>
                    <TextField label="הצעד הבא (נוצרת משימה)" className="full" {...register("nextStep")} />

                    <TextField select label="מול מי" value={watch("withWhom")} onChange={e => setValue("withWhom", e.target.value)}>
                        <MenuItem value="">— לא נבחר —</MenuItem>
                        <MenuItem value="client">לקוח</MenuItem>
                        {users.filter(u => u.isActive).map(u => <MenuItem key={u.idUser} value={String(u.idUser)}>{u.firstName}</MenuItem>)}
                    </TextField>

                    <TextField label="תאריך יעד למשימה" type="date" slotProps={{ inputLabel: { shrink: true } }} {...register("taskDue")} />

                    <TextField select label="עדיפות המשימה" value={watch("taskPriority")} onChange={e => setValue("taskPriority", e.target.value as Priority)}>
                        {Object.values(Priority).map(p => <MenuItem key={p} value={p}>{priorityLabel[p]}</MenuItem>)}
                    </TextField>
                </>
            )}

            <TextField select label="סטטוס אחרי הפגישה" value={watch("statusAfter")} onChange={e => setValue("statusAfter", e.target.value)}>
                {statuses.map(s => <MenuItem key={s} value={s}>{statusLabel[s]}</MenuItem>)}
            </TextField>

            <div className="entry-form-bar full">
                <span className="note">{update ? "" : "שמירה תעדכן גם את סטטוס הפרויקט ותיצור משימה מהצעד הבא"}</span>
                <Button onClick={onDone}>ביטול</Button>
                <Button type="submit" variant="contained" disabled={formState.isSubmitting}>{update ? "שמירת התיעוד" : "הוספה לתיעוד"}</Button>
            </div>
        </form>
    );
}
