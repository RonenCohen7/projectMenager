import "./task-add.css";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Button, MenuItem, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import type { RootState } from "../../redux/store";
import { Priority, priorityLabel } from "../../models/enum";
import { tabOf } from "../../utils/utils";
import { taskService } from "../../service/taskService";
import { notificationService } from "../../service/notificationService";
import { DateField } from "../../shared-area/date-field/date-field";


interface TaskAddProps {
    idProject?: number;        //Fixed project (inside the project drawer)
    idWithUser?: number;       //Fixed "with whom" (agenda)
    placeholder?: string;
}


//Add a task by hand - linked to a project or a general topic
export function TaskAdd({ idProject, idWithUser, placeholder }: TaskAddProps) {

    const me = useSelector((state: RootState) => state.auth.user);
    const users = useSelector((state: RootState) => state.data.users);
    const projects = useSelector((state: RootState) => state.data.projects);

    const empty = { taskText: "", idProject: "", idOwner: me ? String(me.idUser) : "", withWhom: idWithUser ? String(idWithUser) : "", priority: Priority.Normal, dueDate: "" };
    const [form, setForm] = useState(empty);
    const [busy, setBusy] = useState(false);

    const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

    const openProjects = projects.filter(p => tabOf(p) !== "done").sort((a, b) => (a.clientName || "").localeCompare(b.clientName || "", "he"));


    async function add() {
        if (!form.taskText.trim()) {
            notificationService.error("צריך לכתוב את המשימה");
            return;
        }
        setBusy(true);
        try {
            await taskService.addTask({
                taskText: form.taskText,
                idProject: idProject ?? (form.idProject ? Number(form.idProject) : null),
                idOwner: form.idOwner ? Number(form.idOwner) : null,
                withClient: form.withWhom === "client",
                idWithUser: form.withWhom && form.withWhom !== "client" ? Number(form.withWhom) : null,
                priority: form.priority,
                dueDate: form.dueDate || null
            });
            setForm({ ...empty, idProject: form.idProject });
            notificationService.success("המשימה נוספה");
        } catch (err) {
            notificationService.error(err);
        } finally {
            setBusy(false);
        }
    }


    return (
        <form className="card tadd" onSubmit={e => { e.preventDefault(); add(); }}>

            <TextField label={placeholder || "משימה חדשה"} value={form.taskText} onChange={set("taskText")} className="tadd-text" />

            {!idProject && (
                <TextField select label="פרויקט" value={form.idProject} onChange={set("idProject")} className="tadd-project">
                    <MenuItem value="">ללא פרויקט (נושא כללי)</MenuItem>
                    {openProjects.map(p => <MenuItem key={p.idProject} value={String(p.idProject)}>{p.clientName}{p.projectName ? ` · ${p.projectName}` : ""}</MenuItem>)}
                </TextField>
            )}

            <TextField select label="אחראי/ת" value={form.idOwner} onChange={set("idOwner")}>
                <MenuItem value="">—</MenuItem>
                {users.filter(u => u.isActive).map(u => <MenuItem key={u.idUser} value={String(u.idUser)}>{u.firstName}</MenuItem>)}
            </TextField>

            {!idWithUser && (
                <TextField select label="מול מי" value={form.withWhom} onChange={set("withWhom")}>
                    <MenuItem value="">—</MenuItem>
                    <MenuItem value="client">לקוח</MenuItem>
                    {users.filter(u => u.isActive).map(u => <MenuItem key={u.idUser} value={String(u.idUser)}>{u.firstName}</MenuItem>)}
                </TextField>
            )}

            <TextField select label="עדיפות" value={form.priority} onChange={set("priority")}>
                {Object.values(Priority).map(p => <MenuItem key={p} value={p}>{priorityLabel[p]}</MenuItem>)}
            </TextField>

            <DateField label="תאריך יעד" value={form.dueDate} onChange={v => setForm({ ...form, dueDate: v ?? "" })} />

            <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={busy}>הוספה</Button>

        </form>
    );
}
