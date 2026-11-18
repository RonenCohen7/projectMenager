import "./task-row.css";
import { useSelector } from "react-redux";
import { IconButton, MenuItem, Select, Tooltip } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import UndoIcon from "@mui/icons-material/Undo";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { RootState } from "../../redux/store";
import type { TaskDto, TaskModel } from "../../models/task-model";
import { Priority, priorityLabel } from "../../models/enum";
import { dueBucket, fmtDate, isPrivileged } from "../../utils/utils";
import { useProjectDrawer } from "../../utils/UseProjectDrawer";
import { taskService } from "../../service/taskService";
import { notificationService } from "../../service/notificationService";


interface TaskRowProps {
    task: TaskModel;
    hideProject?: boolean;
}


//One task: done tick, priority, text, owner / with whom, due date
export function TaskRow({ task, hideProject }: TaskRowProps) {

    const me = useSelector((state: RootState) => state.auth.user);
    const users = useSelector((state: RootState) => state.data.users);
    const projects = useSelector((state: RootState) => state.data.projects);

    const { openProject } = useProjectDrawer();

    const project = projects.find(p => p.idProject === task.idProject);
    const bucket = dueBucket(task.dueDate);
    const canDelete = isPrivileged(me?.role) || task.idCreatedBy === me?.idUser;


    async function update(change: Partial<TaskDto>) {
        try {
            await taskService.updateTask(task.idTask, change);
        } catch (err) {
            notificationService.error(err);
        }
    }

    async function toggleDone() {
        try {
            await taskService.setDone(task.idTask, !task.isDone);
            if (!task.isDone) notificationService.success("המשימה סומנה כבוצעה");
        } catch (err) {
            notificationService.error(err);
        }
    }

    async function remove() {
        if (!window.confirm("למחוק את המשימה?")) return;
        try {
            await taskService.deleteTask(task.idTask);
        } catch (err) {
            notificationService.error(err);
        }
    }


    return (
        <div className={`trow prio-${task.priority}${task.isDone ? " done" : ""}`}>

            <Tooltip title={task.isDone ? "החזרה לפתוחות" : "סימון כבוצע"}>
                <IconButton size="small" className="trow-tick" onClick={toggleDone}>
                    {task.isDone ? <UndoIcon fontSize="small" /> : <CheckIcon fontSize="small" />}
                </IconButton>
            </Tooltip>

            <Select size="small" value={task.priority} disabled={task.isDone} className={`trow-prio tag-${task.priority}`}
                onChange={e => update({ priority: e.target.value as Priority })}>
                {Object.values(Priority).map(p => <MenuItem key={p} value={p}>{priorityLabel[p]}</MenuItem>)}
            </Select>

            <div className="trow-main">
                <span className="trow-text">{task.taskText}</span>
                <div className="trow-meta">
                    {!hideProject && (task.idProject ? (
                        <button type="button" className="link" onClick={() => openProject(task.idProject!)}>
                            {task.clientName}{task.projectName ? ` · ${task.projectName}` : ""}
                        </button>
                    ) : <span className="trow-general">נושא כללי</span>)}
                    {task.withClient && <span>מול: לקוח</span>}
                    {task.withName && <span>מול: {task.withName}</span>}
                    {task.isDone && task.doneAt && <span>בוצע {fmtDate(task.doneAt)}</span>}
                </div>
            </div>

            <Select size="small" displayEmpty value={task.idOwner ?? ""} disabled={task.isDone} className="trow-owner"
                onChange={e => update({ idOwner: String(e.target.value) === "" ? null : Number(e.target.value) })}>
                <MenuItem value="">ללא אחראי/ת</MenuItem>
                {users.filter(u => u.isActive || u.idUser === task.idOwner)
                    .filter(u => !project || project.members.some(m => m.idUser === u.idUser) || u.idUser === task.idOwner || isPrivileged(u.role))
                    .map(u => <MenuItem key={u.idUser} value={u.idUser}>{u.firstName}</MenuItem>)}
            </Select>

            <input type="date" className={`trow-due due-${bucket === "באיחור" && !task.isDone ? "late" : "ok"}`} value={task.dueDate ?? ""} disabled={task.isDone}
                title={task.dueDate ? bucket : "תאריך יעד"} onChange={e => update({ dueDate: e.target.value || null })} />

            {canDelete ? (
                <Tooltip title="מחיקה"><IconButton size="small" onClick={remove}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
            ) : <span />}

        </div>
    );
}
