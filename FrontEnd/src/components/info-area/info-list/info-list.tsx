import "./info-list.css";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Switch, TextField, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import type { RootState } from "../../redux/store";
import type { InfoDto, InfoModel } from "../../models/info-model";
import { InfoCategory, infoCategoryLabel } from "../../models/enum";
import { useTitle } from "../../utils/UseTitle";
import { fmtDate, isPrivileged } from "../../utils/utils";
import { infoService } from "../../service/infoService";
import { notificationService } from "../../service/notificationService";


//Text with clickable links (no HTML is rendered)
function LinkedText({ text }: { text: string }) {
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    return <>{parts.map((part, i) => /^https?:\/\//.test(part) ? <a key={i} href={part} target="_blank" rel="noreferrer">{part}</a> : part)}</>;
}


//Important info cards: pricing, procedures, contacts, templates...
export function InfoList() {

    useTitle("מידע חשוב");

    const me = useSelector((state: RootState) => state.auth.user);
    const canEdit = isPrivileged(me?.role);

    const [items, setItems] = useState<InfoModel[]>([]);
    const [category, setCategory] = useState<InfoCategory | "">("");
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState<InfoModel | "new" | null>(null);


    async function load() {
        try {
            setItems(await infoService.getAll());
        } catch (err) {
            notificationService.error(err);
        }
    }

    useEffect(() => { load(); }, []);


    const shown = items.filter(x => (!category || x.category === category) && (!search || [x.title, x.body].join(" ").includes(search)));


    async function togglePin(item: InfoModel) {
        try {
            await infoService.update(item.idInfo, { ...item, body: item.body ?? "", isPinned: !item.isPinned });
            await load();
        } catch (err) {
            notificationService.error(err);
        }
    }

    async function remove(item: InfoModel) {
        if (!window.confirm(`למחוק את "${item.title}"?`)) return;
        try {
            await infoService.delete(item.idInfo);
            await load();
        } catch (err) {
            notificationService.error(err);
        }
    }


    return (
        <section className="page">

            <header className="page-head">
                <div>
                    <h1>מידע חשוב</h1>
                    <p>מחירונים, נהלי עבודה, אנשי קשר ותבניות – במקום אחד לכל הצוות</p>
                </div>
                {canEdit && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing("new")}>מידע חדש</Button>}
            </header>

            <div className="toolbar">
                <TextField type="search" placeholder="חיפוש במידע" value={search} onChange={e => setSearch(e.target.value)} className="grow" />
                <div className="info-cats">
                    <button type="button" aria-pressed={!category} onClick={() => setCategory("")}>הכל <b>{items.length}</b></button>
                    {Object.values(InfoCategory).map(c => {
                        const n = items.filter(x => x.category === c).length;
                        return n ? <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}>{infoCategoryLabel[c]} <b>{n}</b></button> : null;
                    })}
                </div>
            </div>

            <div className="info-grid">
                {shown.map(item => (
                    <article key={item.idInfo} className={`card info-card${item.isPinned ? " pinned" : ""}`}>
                        <div className="info-head">
                            <span className="info-cat">{infoCategoryLabel[item.category]}</span>
                            <span className="grow" />
                            {canEdit && (
                                <>
                                    <Tooltip title={item.isPinned ? "ביטול הצמדה" : "הצמדה למעלה"}>
                                        <IconButton size="small" onClick={() => togglePin(item)}>{item.isPinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}</IconButton>
                                    </Tooltip>
                                    <Tooltip title="עריכה"><IconButton size="small" onClick={() => setEditing(item)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                                    <Tooltip title="מחיקה"><IconButton size="small" onClick={() => remove(item)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                                </>
                            )}
                        </div>
                        <h3>{item.title}</h3>
                        {item.body && <p className="info-body"><LinkedText text={item.body} /></p>}
                        <div className="info-meta">עודכן {fmtDate(item.updatedAt)}{item.authorName ? ` · ${item.authorName}` : ""}</div>
                    </article>
                ))}
            </div>

            {!shown.length && (
                <div className="list"><div className="empty">
                    <strong>{items.length ? "אין מידע שמתאים לחיפוש" : "עדיין אין כאן מידע"}</strong>
                    {items.length ? "נסו לנקות את החיפוש או לבחור \"הכל\"." : canEdit ? "לוחצים \"מידע חדש\" ומוסיפים למשל מחירון לומדות, נהלי עבודה או אנשי קשר." : ""}
                </div></div>
            )}

            {editing && <InfoDialog item={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}

        </section>
    );
}


// =========================
// Add / edit dialog
// =========================

function InfoDialog({ item, onClose, onSaved }: { item: InfoModel | null, onClose: () => void, onSaved: () => void }) {

    const [form, setForm] = useState<InfoDto>({
        title: item?.title ?? "",
        category: item?.category ?? InfoCategory.General,
        body: item?.body ?? "",
        isPinned: item?.isPinned ?? false
    });


    async function save() {
        try {
            if (item) await infoService.update(item.idInfo, form);
            else await infoService.add(form);
            notificationService.success("נשמר");
            onSaved();
        } catch (err) {
            notificationService.error(err);
        }
    }


    return (
        <Dialog open onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{item ? "עריכת מידע" : "מידע חדש"}</DialogTitle>
            <DialogContent className="info-dialog">
                <TextField label="כותרת" required autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                <TextField select label="קטגוריה" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as InfoCategory })}>
                    {Object.values(InfoCategory).map(c => <MenuItem key={c} value={c}>{infoCategoryLabel[c]}</MenuItem>)}
                </TextField>
                <TextField label="תוכן" multiline minRows={10} className="full" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
                <FormControlLabel className="full" label="הצמדה למעלה"
                    control={<Switch checked={!!form.isPinned} onChange={e => setForm({ ...form, isPinned: e.target.checked })} />} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>ביטול</Button>
                <Button variant="contained" onClick={save}>שמירה</Button>
            </DialogActions>
        </Dialog>
    );
}
