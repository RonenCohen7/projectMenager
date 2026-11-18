import "./project-outlook.css";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Button, TextField } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EventIcon from "@mui/icons-material/Event";
import type { RootState } from "../../redux/store";
import type { ProjectDetailsModel } from "../../models/project-model";
import { statusLabel, UpdateType } from "../../models/enum";
import { fmtDate, projectTitle, todayISO } from "../../utils/utils";
import { notificationService } from "../../service/notificationService";
import { DateField } from "../../shared-area/date-field/date-field";


//Update mail to copy into Outlook + meeting invite (.ics)
export function ProjectOutlook({ project }: { project: ProjectDetailsModel }) {

    const tasks = useSelector((state: RootState) => state.data.tasks);

    const title = projectTitle(project);
    const lastUpdate = project.updates.find(u => u.updateType !== UpdateType.TaskCompleted);
    const openTasks = tasks.filter(t => t.idProject === project.idProject && !t.isDone);


    // =========================
    // Mail draft
    // =========================

    const lines = ["שלום,", "", `להלן עדכון לגבי ${title}:`, "", `סטטוס: ${statusLabel[project.status]}`];
    if (project.deadline) lines.push(`יעד: ${/^\d{4}-/.test(project.deadline) ? fmtDate(project.deadline) : project.deadline}`);
    if (lastUpdate?.summary) lines.push("", `מה סוכם (${fmtDate(lastUpdate.updateDate)}):`, lastUpdate.summary);
    if (openTasks.length) {
        lines.push("", "הצעדים הבאים:");
        for (const task of openTasks) {
            lines.push(`• ${task.taskText}${task.withClient ? " (באחריות הלקוח)" : ""}${task.dueDate ? ` – עד ${fmtDate(task.dueDate)}` : ""}`);
        }
    }
    lines.push("", "בברכה,");

    const [mail, setMail] = useState(lines.join("\n"));
    const subject = `עדכון: ${title}`;


    async function copyMail() {
        try {
            await navigator.clipboard.writeText(mail);
            notificationService.success("המייל הועתק – מדביקים ב-Outlook");
        } catch {
            notificationService.error("ההעתקה נכשלה, אפשר לסמן ולהעתיק ידנית");
        }
    }


    // =========================
    // Meeting invite (.ics)
    // =========================

    const [invite, setInvite] = useState({ title: `פגישה: ${title}`, date: todayISO(), time: "10:00", minutes: 60, location: "Teams" });

    function downloadInvite() {
        const start = new Date(`${invite.date}T${invite.time}:00`);
        if (isNaN(start.getTime())) {
            notificationService.error("תאריך או שעה לא תקינים");
            return;
        }
        const end = new Date(start.getTime() + invite.minutes * 60000);
        const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
        const esc = (text: string) => text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

        const ics = [
            "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Project Manager//HE", "METHOD:REQUEST", "BEGIN:VEVENT",
            `UID:${Date.now()}-${project.idProject}@project-manager`,
            `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
            `SUMMARY:${esc(invite.title)}`, `LOCATION:${esc(invite.location)}`, `DESCRIPTION:${esc(mail)}`,
            "END:VEVENT", "END:VCALENDAR"
        ].join("\r\n");

        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
        link.download = "invite.ics";
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 2000);
        notificationService.success("הזימון ירד – פותחים אותו ב-Outlook ושולחים");
    }


    return (
        <div className="poutlook">

            <section className="card poutlook-card">
                <h3>מייל עדכון ללקוח</h3>
                <TextField label="נושא" value={subject} slotProps={{ input: { readOnly: true } }} />
                <TextField label="תוכן" multiline minRows={10} value={mail} onChange={e => setMail(e.target.value)} />
                <div className="poutlook-actions">
                    <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={copyMail}>העתקת המייל</Button>
                    <Button href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mail)}`}>פתיחה בתוכנת המייל</Button>
                </div>
            </section>

            <section className="card poutlook-card">
                <h3>זימון לפגישה</h3>
                <div className="poutlook-grid">
                    <TextField label="כותרת" className="full" value={invite.title} onChange={e => setInvite({ ...invite, title: e.target.value })} />
                    <DateField label="תאריך" value={invite.date} onChange={v => setInvite({ ...invite, date: v ?? "" })} />
                    <TextField label="שעה" type="time" value={invite.time} onChange={e => setInvite({ ...invite, time: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                    <TextField label="משך (דקות)" type="number" value={invite.minutes} onChange={e => setInvite({ ...invite, minutes: Number(e.target.value) || 60 })} />
                    <TextField label="מיקום" value={invite.location} onChange={e => setInvite({ ...invite, location: e.target.value })} />
                </div>
                <div className="poutlook-actions">
                    <Button variant="contained" startIcon={<EventIcon />} onClick={downloadInvite}>הורדת זימון (ics)</Button>
                </div>
            </section>

        </div>
    );
}
