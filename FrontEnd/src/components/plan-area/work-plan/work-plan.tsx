import "./work-plan.css";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { RootState } from "../../redux/store";
import type { PlanDto, PlanModel } from "../../models/plan-model";
import { planAreas, PlanStatus, planStatusLabel } from "../../models/enum";
import { useTitle } from "../../utils/UseTitle";
import { currentQuarter, dueBucket, fmtDate, isPrivileged, planQuarters, quarterRank } from "../../utils/utils";
import { planService } from "../../service/planService";
import { notificationService } from "../../service/notificationService";


//Department work plan - goals by quarter / area
export function WorkPlan() {

    useTitle("תוכנית עבודה");

    const me = useSelector((state: RootState) => state.auth.user);
    const users = useSelector((state: RootState) => state.data.users);

    const canEdit = isPrivileged(me?.role);

    const [items, setItems] = useState<PlanModel[]>([]);
    const [mode, setMode] = useState<"quarter" | "area">("quarter");
    const [editing, setEditing] = useState<PlanModel | "new" | null>(null);


    async function load() {
        try {
            setItems(await planService.getAll());
        } catch (err) {
            notificationService.error(err);
        }
    }

    useEffect(() => { load(); }, []);


    const keyOf = (x: PlanModel) => mode === "area" ? (x.area || "ללא תחום") : (x.quarter || "שוטף / ללא רבעון");

    const groups = new Map<string, PlanModel[]>();
    for (const item of items) {
        const key = keyOf(item);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(item);
    }
    const order = [...groups.keys()].sort(mode === "area"
        ? (a, b) => ((planAreas.indexOf(a) + 1) || 99) - ((planAreas.indexOf(b) + 1) || 99)
        : (a, b) => quarterRank(a) - quarterRank(b));

    const total = items.filter(x => x.status !== PlanStatus.Postponed).length;
    const done = items.filter(x => x.status === PlanStatus.Completed).length;
    const quarter = currentQuarter();
    const inQuarter = items.filter(x => x.quarter === quarter && x.status !== PlanStatus.Postponed);
    const late = items.filter(x => x.dueDate && x.status !== PlanStatus.Completed && x.status !== PlanStatus.Postponed && dueBucket(x.dueDate) === "באיחור");


    async function setStatus(item: PlanModel, status: PlanStatus) {
        try {
            await planService.update(item.idPlan, { ...item, status } as PlanDto);
            await load();
        } catch (err) {
            notificationService.error(err);
        }
    }

    async function remove(item: PlanModel) {
        if (!window.confirm(`למחוק את "${item.title}"?`)) return;
        try {
            await planService.delete(item.idPlan);
            await load();
        } catch (err) {
            notificationService.error(err);
        }
    }


    return (
        <section className="page">

            <header className="page-head">
                <div>
                    <h1>תוכנית עבודה</h1>
                    <p>יעדי המחלקה לפי רבעונים ותחומים</p>
                </div>
                {canEdit && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing("new")}>פריט חדש</Button>}
            </header>

            <div className="plan-summary">
                <div className="card"><b>{done}/{total}</b><span>הושלמו בסה״כ</span></div>
                <div className="card"><b>{inQuarter.filter(x => x.status === PlanStatus.Completed).length}/{inQuarter.length}</b><span>ברבעון הנוכחי ({quarter})</span></div>
                <div className={`card ${late.length ? "bad" : ""}`}><b>{late.length}</b><span>באיחור</span></div>
                <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, value) => value && setMode(value)}>
                    <ToggleButton value="quarter">לפי רבעון</ToggleButton>
                    <ToggleButton value="area">לפי תחום</ToggleButton>
                </ToggleButtonGroup>
            </div>

            {order.map(key => (
                <section key={key}>
                    <h2 className={`section-title ${key === quarter ? "current" : ""}`}>{key}<small>{groups.get(key)!.length}</small></h2>
                    <div className="list">
                        {groups.get(key)!.map(item => (
                            <div key={item.idPlan} className={`plrow pl-${item.status}`}>
                                <TextField select value={item.status} disabled={!canEdit} onChange={e => setStatus(item, e.target.value as PlanStatus)} className="plrow-status">
                                    {Object.values(PlanStatus).map(s => <MenuItem key={s} value={s}>{planStatusLabel[s]}</MenuItem>)}
                                </TextField>
                                <div className="plrow-main">
                                    <span className="plrow-title">{item.title}</span>
                                    <div className="plrow-meta">
                                        {mode === "quarter" && item.area && <span>{item.area}</span>}
                                        {mode === "area" && item.quarter && <span>{item.quarter}</span>}
                                        {item.ownerName && <span>אחראי/ת: {item.ownerName}</span>}
                                        {item.dueDate && <span className={dueBucket(item.dueDate) === "באיחור" && item.status !== PlanStatus.Completed ? "late" : ""}>יעד: {fmtDate(item.dueDate)}</span>}
                                        {item.kpi && <span>מדד: {item.kpi}</span>}
                                    </div>
                                    {item.notes && <p className="plrow-notes">{item.notes}</p>}
                                </div>
                                {canEdit && (
                                    <div className="plrow-actions">
                                        <Tooltip title="עריכה"><IconButton size="small" onClick={() => setEditing(item)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                                        <Tooltip title="מחיקה"><IconButton size="small" onClick={() => remove(item)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            ))}

            {!items.length && <div className="list"><div className="empty"><strong>תוכנית העבודה ריקה</strong>{canEdit ? "לוחצים \"פריט חדש\" ומוסיפים יעד." : ""}</div></div>}

            {editing && (
                <PlanDialog item={editing === "new" ? null : editing} users={users.filter(u => u.isActive)}
                    onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
            )}

        </section>
    );
}


// =========================
// Add / edit dialog
// =========================

interface PlanDialogProps {
    item: PlanModel | null;
    users: { idUser: number, firstName: string }[];
    onClose: () => void;
    onSaved: () => void;
}

function PlanDialog({ item, users, onClose, onSaved }: PlanDialogProps) {

    const [form, setForm] = useState<PlanDto>({
        title: item?.title ?? "",
        area: item?.area ?? "",
        quarter: item?.quarter ?? currentQuarter(),
        idOwner: item?.idOwner ?? null,
        status: item?.status ?? PlanStatus.NotStarted,
        dueDate: item?.dueDate ?? "",
        kpi: item?.kpi ?? "",
        notes: item?.notes ?? ""
    });

    const set = (key: keyof PlanDto, value: unknown) => setForm({ ...form, [key]: value });


    async function save() {
        try {
            if (item) await planService.update(item.idPlan, form);
            else await planService.add(form);
            notificationService.success("נשמר");
            onSaved();
        } catch (err) {
            notificationService.error(err);
        }
    }


    return (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{item ? "עריכת פריט" : "פריט חדש בתוכנית העבודה"}</DialogTitle>
            <DialogContent className="plan-dialog">
                <TextField label="יעד / משימה" required autoFocus className="full" value={form.title} onChange={e => set("title", e.target.value)} />
                <Autocomplete freeSolo options={planAreas} inputValue={form.area ?? ""} onInputChange={(_, value) => set("area", value)}
                    renderInput={params => <TextField {...params} label="תחום" size="small" />} />
                <TextField select label="רבעון" value={form.quarter ?? ""} onChange={e => set("quarter", e.target.value)}>
                    <MenuItem value="">שוטף / ללא רבעון</MenuItem>
                    {[...new Set([...planQuarters(), ...(form.quarter ? [form.quarter] : [])])].map(q => <MenuItem key={q} value={q}>{q}</MenuItem>)}
                </TextField>
                <TextField select label="אחראי/ת" value={form.idOwner ?? ""} onChange={e => set("idOwner", e.target.value === "" ? null : Number(e.target.value))}>
                    <MenuItem value="">—</MenuItem>
                    {users.map(u => <MenuItem key={u.idUser} value={u.idUser}>{u.firstName}</MenuItem>)}
                </TextField>
                <TextField label="תאריך יעד" type="date" value={form.dueDate ?? ""} onChange={e => set("dueDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                <TextField label="מדד הצלחה" className="full" value={form.kpi} onChange={e => set("kpi", e.target.value)} />
                <TextField label="הערות" multiline minRows={3} className="full" value={form.notes} onChange={e => set("notes", e.target.value)} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>ביטול</Button>
                <Button variant="contained" onClick={save}>שמירה</Button>
            </DialogActions>
        </Dialog>
    );
}
