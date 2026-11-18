import "./project-stages.css";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Button, IconButton, MenuItem, TextField, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import type { RootState } from "../../redux/store";
import type { ProjectDetailsModel, StageDto, StageModel } from "../../models/project-model";
import { stageStatusLabel, StageStatus, stageTemplates, MemberRole } from "../../models/enum";
import { projectService } from "../../service/projectService";
import { notificationService } from "../../service/notificationService";


//Work stages inside a project (sub tasks) - every member can update
export function ProjectStages({ project }: { project: ProjectDetailsModel }) {

    const users = useSelector((state: RootState) => state.data.users);

    const [newName, setNewName] = useState("");
    const [newGroup, setNewGroup] = useState("");

    const stages = project.stages;
    const done = stages.filter(s => s.status === StageStatus.Done).length;
    const pct = stages.length ? Math.round(done / stages.length * 100) : 0;

    //Owner list: project members first
    const memberIds = project.members.map(m => m.idUser);
    const owners = [...users.filter(u => memberIds.includes(u.idUser)), ...users.filter(u => u.isActive && !memberIds.includes(u.idUser))];

    const defaultOwner = project.members.find(m => m.memberRole === MemberRole.Executor)?.idUser
        ?? project.members.find(m => m.memberRole === MemberRole.Manager)?.idUser ?? null;

    const groups = [...new Set(stages.map(s => s.stageGroup || ""))];


    async function add(list: StageDto[], message: string) {
        try {
            await projectService.addStages(project.idProject, list);
            notificationService.success(message);
            setNewName("");
        } catch (err) {
            notificationService.error(err);
        }
    }

    async function update(stage: StageModel, change: Partial<StageDto>) {
        try {
            await projectService.updateStage(stage.idStage, { ...stage, ...change });
        } catch (err) {
            notificationService.error(err);
        }
    }

    async function remove(stage: StageModel) {
        if (!window.confirm(`למחוק את השלב "${stage.stageName}"?`)) return;
        try {
            await projectService.deleteStage(stage.idStage);
        } catch (err) {
            notificationService.error(err);
        }
    }

    const addTemplate = (name: string) => add(
        stageTemplates[name].map(stageName => ({ stageName, stageGroup: name, idOwner: defaultOwner })),
        `נוספו שלבי ${name}`
    );


    return (
        <div className="pstages">

            {stages.length > 0 && (
                <div className="pstages-progress">
                    <span className="spbar big"><i style={{ width: `${pct}%` }} /></span>
                    <b>{pct}%</b>
                    <span className="note">{done} מתוך {stages.length} שלבים הושלמו</span>
                </div>
            )}

            {groups.map(group => (
                <div key={group} className="list pstages-group">
                    {group && <div className="pstages-group-title">{group}</div>}

                    {stages.filter(s => (s.stageGroup || "") === group).map(stage => (
                        <div key={stage.idStage} className={`pstage st-${stage.status}`}>
                            <TextField select value={stage.status} onChange={e => update(stage, { status: e.target.value as StageStatus })} className="pstage-status">
                                {Object.values(StageStatus).map(s => <MenuItem key={s} value={s}>{stageStatusLabel[s]}</MenuItem>)}
                            </TextField>

                            <span className="pstage-name">{stage.stageName}</span>

                            <TextField select label="אחראי/ת" value={stage.idOwner ?? ""} onChange={e => update(stage, { idOwner: e.target.value === "" ? null : Number(e.target.value) })} className="pstage-owner">
                                <MenuItem value="">—</MenuItem>
                                {owners.map(u => <MenuItem key={u.idUser} value={u.idUser}>{u.firstName}</MenuItem>)}
                            </TextField>

                            <TextField label="תאריך יעד" type="date" value={stage.dueDate ?? ""} slotProps={{ inputLabel: { shrink: true } }}
                                onChange={e => update(stage, { dueDate: e.target.value || null })} className="pstage-due" />

                            <Tooltip title="מחיקת שלב">
                                <IconButton size="small" onClick={() => remove(stage)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                            </Tooltip>
                        </div>
                    ))}
                </div>
            ))}

            {!stages.length && (
                <div className="list"><div className="empty"><strong>עדיין אין שלבי עבודה</strong>מוסיפים שלב בודד, או תבנית מוכנה של לומדה / סרטון / מערכי שיעור.</div></div>
            )}

            <div className="card pstages-add">
                <TextField label="שלב חדש" value={newName} onChange={e => setNewName(e.target.value)} className="grow" />
                <TextField label="קבוצה (לא חובה)" value={newGroup} onChange={e => setNewGroup(e.target.value)} className="pstages-groupin" />
                <Button variant="contained" startIcon={<AddIcon />} disabled={!newName.trim()}
                    onClick={() => add([{ stageName: newName, stageGroup: newGroup || null, idOwner: defaultOwner }], "השלב נוסף")}>
                    הוספה
                </Button>
            </div>

            <div className="pstages-templates">
                <span className="note">הוספת תבנית:</span>
                {Object.keys(stageTemplates).map(name => (
                    <Button key={name} size="small" variant="outlined" onClick={() => addTemplate(name)}>{name}</Button>
                ))}
            </div>

        </div>
    );
}
