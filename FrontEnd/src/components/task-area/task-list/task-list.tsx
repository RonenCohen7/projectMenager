import "./task-list.css";
import { useState } from "react";
import { useSelector } from "react-redux";
import { MenuItem, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { RootState } from "../../redux/store";
import type { TaskModel } from "../../models/task-model";
import { Priority, priorityLabel, priorityRank } from "../../models/enum";
import { useTitle } from "../../utils/UseTitle";
import { dueBucket, dueBuckets } from "../../utils/utils";
import { TaskRow } from "../task-row/task-row";
import { TaskAdd } from "../task-add/task-add";


type GroupMode = "project" | "client" | "owner" | "with" | "priority" | "date";

const groupLabels: Record<GroupMode, string> = {
    project: "פרויקט",
    client: "לקוח",
    owner: "אחראי/ת",
    with: "מול מי",
    priority: "עדיפות",
    date: "תאריך יעד"
};


//All open tasks ("next steps" from meetings + tasks added by hand)
export function TaskList() {

    useTitle("משימות");

    const me = useSelector((state: RootState) => state.auth.user);
    const tasks = useSelector((state: RootState) => state.data.tasks);

    const [mode, setMode] = useState<GroupMode>(() => (localStorage.getItem("taskGroup") as GroupMode) || "project");
    const [search, setSearch] = useState("");
    const [onlyMine, setOnlyMine] = useState(false);
    const [showDone, setShowDone] = useState(false);


    function changeMode(value: GroupMode | null) {
        if (!value) return;
        setMode(value);
        localStorage.setItem("taskGroup", value);
    }


    const matches = (t: TaskModel) =>
        (!onlyMine || [t.idOwner, t.idWithUser, t.idCreatedBy].includes(me?.idUser ?? -1)) &&
        (!search || [t.taskText, t.clientName, t.projectName, t.ownerName, t.withName].join(" ").includes(search));

    const open = tasks.filter(t => !t.isDone && matches(t));
    const done = tasks.filter(t => t.isDone && matches(t));


    // =========================
    // Groups
    // =========================

    const keyOf = (t: TaskModel): string => {
        switch (mode) {
            case "project": return t.idProject ? `${t.clientName || ""}${t.projectName ? " · " + t.projectName : ""}` : "נושאים כלליים";
            case "client": return t.clientName || "ללא לקוח";
            case "owner": return t.ownerName || "ללא אחראי/ת";
            case "with": return t.withClient ? "לקוח" : t.withName || "ללא שיוך \"מול מי\"";
            case "priority": return priorityLabel[t.priority];
            case "date": return dueBucket(t.dueDate);
        }
    };

    const groups = new Map<string, TaskModel[]>();
    for (const task of open) {
        const key = keyOf(task);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(task);
    }

    const order = [...groups.keys()].sort((a, b) => {
        if (mode === "date") return dueBuckets.indexOf(a) - dueBuckets.indexOf(b);
        if (mode === "priority") {
            const rank = (label: string) => priorityRank[(Object.keys(priorityLabel) as Priority[]).find(p => priorityLabel[p] === label)!];
            return rank(a) - rank(b);
        }
        if (mode === "owner" || mode === "with") return groups.get(b)!.length - groups.get(a)!.length || a.localeCompare(b, "he");
        return a.localeCompare(b, "he");
    });


    return (
        <section className="page">

            <header className="page-head">
                <div>
                    <h1>משימות</h1>
                    <p>{open.length} משימות פתוחות · כל "הצעד הבא" מתיעוד פגישה הוא משימה עד שמסמנים שבוצעה</p>
                </div>
            </header>

            <TaskAdd />

            <div className="toolbar">
                <TextField type="search" placeholder="חיפוש משימה, לקוח או אדם" value={search} onChange={e => setSearch(e.target.value)} className="grow" />

                <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, value) => changeMode(value)}>
                    {(Object.keys(groupLabels) as GroupMode[]).map(key => <ToggleButton key={key} value={key}>{groupLabels[key]}</ToggleButton>)}
                </ToggleButtonGroup>

                <TextField select value={onlyMine ? "mine" : "all"} onChange={e => setOnlyMine(e.target.value === "mine")}>
                    <MenuItem value="all">כל המשימות</MenuItem>
                    <MenuItem value="mine">רק שלי</MenuItem>
                </TextField>
            </div>

            {order.map(key => (
                <section key={key} className="tgroup">
                    <h2 className={`section-title ${mode === "date" && key === "באיחור" ? "late" : ""}`}>
                        {key}<small>{groups.get(key)!.length === 1 ? "משימה אחת" : `${groups.get(key)!.length} משימות`}</small>
                    </h2>
                    <div className="list">
                        {groups.get(key)!.map(task => <TaskRow key={task.idTask} task={task} hideProject={mode === "project"} />)}
                    </div>
                </section>
            ))}

            {!open.length && (
                <div className="list"><div className="empty"><strong>אין משימות פתוחות</strong>משימות נוספות כאן, או נוצרות מ"הצעד הבא" בתיעוד פגישה.</div></div>
            )}

            {done.length > 0 && (
                <section className="tgroup">
                    <button type="button" className="link tlist-done-toggle" onClick={() => setShowDone(!showDone)}>
                        {showDone ? "▾" : "◂"} בוצעו ב-14 הימים האחרונים ({done.length})
                    </button>
                    {showDone && <div className="list">{done.map(task => <TaskRow key={task.idTask} task={task} />)}</div>}
                </section>
            )}

        </section>
    );
}
