import "./agenda.css";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Button, MenuItem, TextField } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import type { RootState } from "../../redux/store";
import type { TaskModel } from "../../models/task-model";
import { Priority, priorityLabel, priorityRank, UserRole } from "../../models/enum";
import { useTitle } from "../../utils/UseTitle";
import { fmtDate, todayISO } from "../../utils/utils";
import { notificationService } from "../../service/notificationService";
import { TaskRow } from "../task-row/task-row";
import { TaskAdd } from "../task-add/task-add";


//Topics for a meeting with one person ("מול קרן" in the old system) - every task marked "with" that person
export function Agenda() {

    useTitle("נושאים לפגישה");

    const users = useSelector((state: RootState) => state.data.users);
    const tasks = useSelector((state: RootState) => state.data.tasks);

    const people = users.filter(u => u.isActive);
    //Default: the person with the most open topics
    const openWith = (idUser: number) => tasks.filter(t => !t.isDone && t.idWithUser === idUser).length;
    const busiest = [...people].sort((a, b) => openWith(b.idUser) - openWith(a.idUser) || Number(b.role === UserRole.Manager) - Number(a.role === UserRole.Manager))[0];

    const [idUser, setIdUser] = useState<number | null>(() => Number(localStorage.getItem("agendaUser")) || null);
    const selected = people.find(u => u.idUser === idUser) ?? busiest;


    function choose(value: string) {
        setIdUser(Number(value));
        localStorage.setItem("agendaUser", value);
    }


    const mine = selected ? tasks.filter(t => t.idWithUser === selected.idUser) : [];
    const open = mine.filter(t => !t.isDone).sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
    const general = open.filter(t => !t.idProject);
    const recentDone = mine.filter(t => t.isDone);

    const byProject = new Map<string, TaskModel[]>();
    for (const task of open.filter(t => t.idProject)) {
        const key = `${task.clientName || ""}${task.projectName ? " – " + task.projectName : ""}`;
        if (!byProject.has(key)) byProject.set(key, []);
        byProject.get(key)!.push(task);
    }


    //Agenda as text (to paste in a mail / Teams)
    async function copyAgenda() {
        const prio = (t: TaskModel) => t.priority !== Priority.Normal ? `[${priorityLabel[t.priority]}] ` : "";
        const lines = [`נושאים לפגישה עם ${selected?.firstName} – ${fmtDate(todayISO())}`, ""];
        if (general.length) {
            lines.push("נושאים כלליים:", ...general.map(t => `• ${prio(t)}${t.taskText}`), "");
        }
        for (const [key, list] of byProject) {
            lines.push(`${key}:`, ...list.map(t => `• ${prio(t)}${t.taskText}`), "");
        }
        try {
            await navigator.clipboard.writeText(lines.join("\n"));
            notificationService.success("סדר היום הועתק");
        } catch {
            notificationService.error("ההעתקה נכשלה");
        }
    }


    return (
        <section className="page">

            <header className="page-head">
                <div>
                    <h1>נושאים לפגישה {selected ? `מול ${selected.firstName}` : ""}</h1>
                    <p>כל המשימות שסומנו "מול" אותו אדם, מקובצות לפי פרויקט, ונושאים כלליים שלא קשורים לפרויקט</p>
                </div>
                <div className="toolbar">
                    <TextField select label="מול מי" value={selected ? String(selected.idUser) : ""} onChange={e => choose(e.target.value)} >
                        {people.map(u => <MenuItem key={u.idUser} value={String(u.idUser)}>{u.firstName} {u.lastName}</MenuItem>)}
                    </TextField>
                    <Button variant="outlined" className="agenda-copy" startIcon={<ContentCopyIcon />} disabled={!open.length} onClick={copyAgenda}>העתקת סדר היום</Button>
                </div>
            </header>

            {selected && <TaskAdd idWithUser={selected.idUser} placeholder={`נושא חדש מול ${selected.firstName}`} />}

            {general.length > 0 && (
                <section>
                    <h2 className="section-title">נושאים כלליים<small>{general.length}</small></h2>
                    <div className="list">{general.map(task => <TaskRow key={task.idTask} task={task} />)}</div>
                </section>
            )}

            {[...byProject.entries()].map(([key, list]) => (
                <section key={key}>
                    <h2 className="section-title">{key}<small>{list.length}</small></h2>
                    <div className="list">{list.map(task => <TaskRow key={task.idTask} task={task} hideProject />)}</div>
                </section>
            ))}

            {!open.length && (
                <div className="list"><div className="empty"><strong>אין נושאים פתוחים</strong>בתיעוד פגישה בוחרים "מול מי" כדי שהצעד הבא יופיע כאן.</div></div>
            )}

            {recentDone.length > 0 && (
                <section>
                    <h2 className="section-title agenda-done">נסגרו לאחרונה<small>{recentDone.length}</small></h2>
                    <div className="list">{recentDone.map(task => <TaskRow key={task.idTask} task={task} />)}</div>
                </section>
            )}

        </section>
    );
}
