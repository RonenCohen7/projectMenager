import "./staff-list.css";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, TextField, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { RootState } from "../../redux/store";
import type { HiringDto, HiringModel } from "../../models/hiring-model";
import type { HeatSettingsModel } from "../../models/settings-model";
import { HiringStatus, hiringStatusLabel, memberRoleLabel } from "../../models/enum";
import { useTitle } from "../../utils/UseTitle";
import { useProjectDrawer } from "../../utils/UseProjectDrawer";
import { assignments, fmtDate, fullName, hoursInfo, jobUsage } from "../../utils/utils";
import { hiringService } from "../../service/hiringService";
import { settingsService } from "../../service/settingsService";
import { notificationService } from "../../service/notificationService";
import { ClientChip, StatusPill } from "../../shared-area/tags/tags";
import { DateField } from "../../shared-area/date-field/date-field";


//Team: hiring + what every employee works on and how full the job is
export function StaffList() {

    useTitle("כח אדם");

    const users = useSelector((state: RootState) => state.data.users);
    const projects = useSelector((state: RootState) => state.data.projects);
    const tasks = useSelector((state: RootState) => state.data.tasks);

    const { openProject } = useProjectDrawer();

    const [hiring, setHiring] = useState<HiringModel[]>([]);
    const [heat, setHeat] = useState<HeatSettingsModel>({ weekHours: 42, levels: { low: 10, medium: 25, high: 40 } });
    const [editing, setEditing] = useState<HiringModel | "new" | null>(null);


    async function loadHiring() {
        try {
            setHiring(await hiringService.getAll());
        } catch (err) {
            notificationService.error(err);
        }
    }

    useEffect(() => {
        loadHiring();
        settingsService.getHeat().then(setHeat).catch(() => undefined);
    }, []);


    async function remove(item: HiringModel) {
        if (!window.confirm(`למחוק את "${item.roleTitle}"?`)) return;
        try {
            await hiringService.delete(item.idHiring);
            await loadHiring();
        } catch (err) {
            notificationService.error(err);
        }
    }


    const map = assignments(projects);
    const team = users.filter(u => u.isActive && map.has(u.idUser));


    return (
        <section className="page">

            <header className="page-head">
                <div>
                    <h1>כח אדם</h1>
                    <p>גיוס וחיפוש עובדים, ומה כל אחד/ת מהצוות מחזיק/ה עכשיו</p>
                </div>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing("new")}>משרה / גיוס חדש</Button>
            </header>

            {/* Hiring */}
            <section>
                <h2 className="section-title">גיוס וחיפוש עובדים<small>{hiring.filter(h => h.status !== HiringStatus.Hired && h.status !== HiringStatus.Closed).length} פתוחים</small></h2>
                <div className="list">
                    <table className="sttable">
                        <thead>
                            <tr><th>תפקיד</th><th>סטטוס</th><th>מועמד/ת</th><th>היקף</th><th>תחילת עבודה</th><th>מקור</th><th>הערות</th><th /></tr>
                        </thead>
                        <tbody>
                            {hiring.map(h => (
                                <tr key={h.idHiring} className={h.status === HiringStatus.Closed ? "closed" : ""}>
                                    <td className="strong">{h.roleTitle}</td>
                                    <td><span className={`hst hst-${h.status}`}>{hiringStatusLabel[h.status]}</span></td>
                                    <td>{h.candidateName}</td>
                                    <td>{h.scopePercent != null ? `${h.scopePercent}%` : ""}</td>
                                    <td>{fmtDate(h.startDate)}</td>
                                    <td>{h.source}</td>
                                    <td className="notes">{h.notes}</td>
                                    <td className="acts">
                                        <Tooltip title="עריכה"><IconButton size="small" onClick={() => setEditing(h)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="מחיקה"><IconButton size="small" onClick={() => remove(h)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!hiring.length && <div className="empty">אין כרגע משרות פתוחות</div>}
                </div>
            </section>

            {/* Team cards */}
            <section>
                <h2 className="section-title">הצוות והפרויקטים<small>{team.length} אנשי צוות משויכים לפרויקטים פעילים</small></h2>
                <div className="staff-grid">
                    {team.map(user => {
                        const items = map.get(user.idUser)!;
                        const usage = jobUsage(items, user, heat);
                        const cls = usage > 100 ? "over" : usage >= 80 ? "full" : "ok";
                        return (
                            <article key={user.idUser} className={`card staff-card ${cls}`}>
                                <div className="staff-head">
                                    <div>
                                        <h3>{fullName(user)}</h3>
                                        <span className="note">משרה {user.jobPercent}% · {items.length} פרויקטים</span>
                                    </div>
                                    <div className="staff-usage">
                                        <b>{usage}%</b>
                                        <span className="jpbar"><i style={{ width: `${Math.min(usage, 100)}%` }} /></span>
                                        <small>{usage > 100 ? "אין מקום לעוד פרויקט" : usage >= 80 ? "כמעט מלא/ה" : "יש מקום לעוד פרויקט"}</small>
                                    </div>
                                </div>
                                <table className="sttable compact">
                                    <tbody>
                                        {items.map(a => {
                                            const hours = hoursInfo(a.project);
                                            const openTasks = tasks.filter(t => t.idProject === a.project.idProject && !t.isDone).length;
                                            return (
                                                <tr key={a.project.idProject}>
                                                    <td><ClientChip idClient={a.project.idClient} clientName={a.project.clientName} /></td>
                                                    <td><button type="button" className="link" onClick={() => openProject(a.project.idProject)}>{a.project.projectName || "פרויקט כללי"}</button></td>
                                                    <td className={a.role === "manager" ? "strong" : ""}>{memberRoleLabel[a.role]}</td>
                                                    <td><StatusPill status={a.project.status} /></td>
                                                    <td className="note">{hours?.perWeek != null ? `${Math.round(hours.perWeek / Math.max(1, hours.doers.length))} ש׳/שבוע` : ""}</td>
                                                    <td className="note">{openTasks ? `${openTasks} משימות` : ""}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </article>
                        );
                    })}
                </div>
            </section>

            {editing && <HiringDialog item={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); loadHiring(); }} />}

        </section>
    );
}


// =========================
// Hiring dialog
// =========================

function HiringDialog({ item, onClose, onSaved }: { item: HiringModel | null, onClose: () => void, onSaved: () => void }) {

    const [form, setForm] = useState<HiringDto>({
        roleTitle: item?.roleTitle ?? "",
        status: item?.status ?? HiringStatus.NotStarted,
        candidateName: item?.candidateName ?? "",
        scopePercent: item?.scopePercent ?? 100,
        startDate: item?.startDate ?? "",
        source: item?.source ?? "",
        notes: item?.notes ?? ""
    });

    const set = (key: keyof HiringDto, value: unknown) => setForm({ ...form, [key]: value });


    async function save() {
        try {
            if (item) await hiringService.update(item.idHiring, form);
            else await hiringService.add(form);
            notificationService.success("נשמר");
            onSaved();
        } catch (err) {
            notificationService.error(err);
        }
    }


    return (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{item ? "עריכת גיוס" : "גיוס חדש"}</DialogTitle>
            <DialogContent className="hire-dialog">
                <TextField label="תפקיד" required autoFocus value={form.roleTitle} onChange={e => set("roleTitle", e.target.value)} />
                <TextField select label="סטטוס" value={form.status} onChange={e => set("status", e.target.value)}>
                    {Object.values(HiringStatus).map(s => <MenuItem key={s} value={s}>{hiringStatusLabel[s]}</MenuItem>)}
                </TextField>
                <TextField label="מועמד/ת" value={form.candidateName} onChange={e => set("candidateName", e.target.value)} />
                <TextField label="היקף משרה (%)" type="number" value={form.scopePercent ?? ""} onChange={e => set("scopePercent", e.target.value)} />
                <DateField label="תחילת עבודה" value={form.startDate} onChange={v => set("startDate", v)} />
                <TextField label="מקור" value={form.source} onChange={e => set("source", e.target.value)} />
                <TextField label="הערות" multiline minRows={3} className="full" value={form.notes} onChange={e => set("notes", e.target.value)} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>ביטול</Button>
                <Button variant="contained" onClick={save}>שמירה</Button>
            </DialogActions>
        </Dialog>
    );
}
