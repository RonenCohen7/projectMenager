import "./load-map.css";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Button, Dialog, DialogContent, DialogTitle, MenuItem, Select, TextField } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import type { RootState } from "../../redux/store";
import type { HeatSettingsModel } from "../../models/settings-model";
import type { UserModel } from "../../models/user-model";
import { LoadLevel, loadLabel, memberRoleLabel } from "../../models/enum";
import { useTitle } from "../../utils/UseTitle";
import { assignments, autoLevelName, cellBand, fullName, isInactive, jobUsage, percentOf, sumLoad, totalBand, totalBands } from "../../utils/utils";
import { projectService } from "../../service/projectService";
import { settingsService } from "../../service/settingsService";
import { notificationService } from "../../service/notificationService";
import { ClientChip, StatusPill } from "../../shared-area/tags/tags";


//Heat map: row = employee, column = client. Color = load on that client.
export function LoadMap() {

    useTitle("מפת עומסים");

    const users = useSelector((state: RootState) => state.data.users);
    const projects = useSelector((state: RootState) => state.data.projects);

    const [heat, setHeat] = useState<HeatSettingsModel>({ weekHours: 42, levels: { low: 10, medium: 25, high: 40 } });
    const [showSettings, setShowSettings] = useState(false);
    const [openUser, setOpenUser] = useState<UserModel | null>(null);

    useEffect(() => {
        settingsService.getHeat().then(setHeat).catch(err => notificationService.error(err));
    }, []);


    const map = assignments(projects);
    const rows = users.filter(u => map.has(u.idUser)).sort((a, b) => sumLoad(map.get(b.idUser)!) - sumLoad(map.get(a.idUser)!));

    //Clients ordered by total load
    const clientLoad = new Map<string, { idClient: number | null, name: string, total: number }>();
    for (const items of map.values()) {
        for (const a of items) {
            const key = String(a.project.idClient ?? "none");
            const current = clientLoad.get(key) ?? { idClient: a.project.idClient, name: a.project.clientName || "ללא לקוח", total: 0 };
            current.total += a.value;
            clientLoad.set(key, current);
        }
    }
    const clients = [...clientLoad.entries()].sort((a, b) => b[1].total - a[1].total || a[1].name.localeCompare(b[1].name, "he"));


    async function saveSettings() {
        try {
            setHeat(await settingsService.updateHeat(heat));
            setShowSettings(false);
            notificationService.success("ההגדרות נשמרו");
        } catch (err) {
            notificationService.error(err);
        }
    }


    async function setLoad(idProject: number, idUser: number, level: string) {
        try {
            await projectService.updateMemberLoad(idProject, idUser, level === "auto" ? null : level as LoadLevel);
        } catch (err) {
            notificationService.error(err);
        }
    }


    return (
        <section className="page">

            <header className="page-head">
                <div>
                    <h1>מפת עומסים</h1>
                    <p>כל שורה היא איש צוות וכל עמודה היא לקוח. לחיצה על שם פותחת את הפרויקטים שלו, ושם קובעים את רמת העומס בכל פרויקט.</p>
                </div>
                <Button variant="outlined" startIcon={<TuneIcon />} onClick={() => setShowSettings(!showSettings)}>הגדרות חישוב</Button>
            </header>

            {showSettings && (
                <div className="card heat-settings">
                    <TextField label="שעות במשרה מלאה (שבוע)" type="number" value={heat.weekHours} onChange={e => setHeat({ ...heat, weekHours: Number(e.target.value) })} />
                    {(["low", "medium", "high"] as const).map(level => (
                        <TextField key={level} label={`${loadLabel[level]} – % משרה`} type="number" value={heat.levels[level]}
                            onChange={e => setHeat({ ...heat, levels: { ...heat.levels, [level]: Number(e.target.value) } })} />
                    ))}
                    <Button variant="contained" onClick={saveSettings}>שמירה</Button>
                    <p className="note full">פרויקט עם שעות ותאריך סיום מחושב לפי השעות שנותרו חלקי השבועות עד הסיום. פרויקט בלי שעות מחושב לפי רמת העומס.</p>
                </div>
            )}

            <div className="legend">
                {[1, 2, 3, 4].map(b => <span key={b}><i className={`h${b}`} />{totalBands[b - 1][1]}</span>)}
                <span><i className="h0 est" />הערכה אוטומטית (לא נקבעה רמת עומס)</span>
            </div>

            <div className="list heat-wrap">
                <table className="heat">
                    <thead>
                        <tr>
                            <th className="sticky">איש צוות</th>
                            <th>פרויקטים</th>
                            <th>ניצול משרה</th>
                            <th>עומס כולל</th>
                            {clients.map(([key, c]) => <th key={key} className="client-col"><ClientChip idClient={c.idClient} clientName={c.name} /></th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(user => {
                            const items = map.get(user.idUser)!;
                            const total = sumLoad(items);
                            const band = totalBand(total);
                            const usage = jobUsage(items, user, heat);
                            const activeCount = new Set(items.filter(a => !isInactive(a.project.status)).map(a => a.project.idProject)).size;

                            return (
                                <tr key={user.idUser}>
                                    <th className="sticky"><button type="button" className="link" onClick={() => setOpenUser(user)}>{fullName(user)}</button></th>
                                    <td className="num">{activeCount}</td>
                                    <td>
                                        <div className={`jp jp-${usage > 100 ? "over" : usage >= 80 ? "full" : "ok"}`}>
                                            <b>{Math.min(usage, 100)}%</b><span className="jpbar"><i style={{ width: `${Math.min(usage, 100)}%` }} /></span>
                                            {usage > 100 && <small>עומס יתר</small>}
                                        </div>
                                    </td>
                                    <td><button type="button" className={`total h${band[2]}`} onClick={() => setOpenUser(user)}>{band[1]}</button></td>
                                    {clients.map(([key]) => {
                                        const its = items.filter(a => String(a.project.idClient ?? "none") === key);
                                        if (!its.length) return <td key={key}><span className="cell h0" /></td>;
                                        const active = its.filter(a => !isInactive(a.project.status));
                                        const estimated = active.some(a => !a.explicit);
                                        const tip = its.map(a => `${a.project.projectName || "פרויקט כללי"} – ${isInactive(a.project.status) ? "לא פעיל" : a.explicit ? loadLabel[a.level!] : "הערכה: " + loadLabel[autoLevelName(a.value)]}`).join("\n");
                                        return (
                                            <td key={key}>
                                                <button type="button" title={tip} className={`cell h${cellBand(sumLoad(active))}${estimated ? " est" : ""}`} onClick={() => setOpenUser(user)}>
                                                    {active.length > 1 ? active.length : ""}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {!rows.length && <div className="empty"><strong>אין עדיין שיבוצים</strong>משייכים עובדים לפרויקטים, והעומס יופיע כאן.</div>}
            </div>

            {openUser && map.has(openUser.idUser) && (
                <Dialog open onClose={() => setOpenUser(null)} maxWidth="md" fullWidth>
                    <DialogTitle>העומס של {fullName(openUser)} · משרה {openUser.jobPercent}%</DialogTitle>
                    <DialogContent>
                        <table className="load-table">
                            <thead>
                                <tr><th>לקוח</th><th>פרויקט</th><th>תפקיד</th><th>סטטוס</th><th>רמת עומס</th><th>% משרה</th></tr>
                            </thead>
                            <tbody>
                                {map.get(openUser.idUser)!.map(a => (
                                    <tr key={a.project.idProject}>
                                        <td><ClientChip idClient={a.project.idClient} clientName={a.project.clientName} /></td>
                                        <td>{a.project.projectName || "פרויקט כללי"}</td>
                                        <td>{memberRoleLabel[a.role]}</td>
                                        <td><StatusPill status={a.project.status} /></td>
                                        <td>
                                            <Select size="small" value={a.explicit ? a.level! : "auto"} onChange={e => setLoad(a.project.idProject, openUser.idUser, e.target.value)}>
                                                <MenuItem value="auto">אוטומטי ({loadLabel[autoLevelName(a.explicit ? 0 : a.value)]})</MenuItem>
                                                {Object.values(LoadLevel).map(l => <MenuItem key={l} value={l}>{loadLabel[l]}</MenuItem>)}
                                            </Select>
                                        </td>
                                        <td className="num">{Math.round(percentOf(a, openUser.idUser, heat))}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </DialogContent>
                </Dialog>
            )}

        </section>
    );
}
