import "./user-dialog.css";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Select, Switch, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { RootState } from "../../redux/store";
import type { UserDto, UserModel } from "../../models/user-model";
import type { ProjectModel } from "../../models/project-model";
import { MemberRole, memberRoleLabel, roleLabel, UserRole } from "../../models/enum";
import { tabOf } from "../../utils/utils";
import { userService } from "../../service/userService";
import { notificationService } from "../../service/notificationService";
import { ClientChip, StatusPill } from "../../shared-area/tags/tags";


interface UserDialogProps {
    user: UserModel | null;      //null = new user
    onClose: () => void;
}

const projectLabel = (p: ProjectModel) => `${p.clientName || ""}${p.projectName ? " · " + p.projectName : ""}`;


//User details + the projects he may enter and work in
export function UserDialog({ user, onClose }: UserDialogProps) {

    const projects = useSelector((state: RootState) => state.data.projects);

    const { register, handleSubmit, watch, setValue, formState } = useForm<UserDto>({
        defaultValues: user
            ? { firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, jobPercent: user.jobPercent, isActive: user.isActive }
            : { firstName: "", lastName: "", email: "", role: UserRole.Employee, jobPercent: 100, isActive: true }
    });


    // =========================
    // Assigned projects: idProject -> role
    // =========================

    const initial = new Map<number, MemberRole>(
        user ? projects.flatMap(p => p.members.filter(m => m.idUser === user.idUser).map(m => [p.idProject, m.memberRole] as [number, MemberRole])) : []
    );

    const [assigned, setAssigned] = useState<Map<number, MemberRole>>(initial);

    const openProjects = projects.filter(p => tabOf(p) !== "done").sort((a, b) => projectLabel(a).localeCompare(projectLabel(b), "he"));
    const assignedProjects = projects.filter(p => assigned.has(p.idProject)).sort((a, b) => projectLabel(a).localeCompare(projectLabel(b), "he"));

    const changed = assigned.size !== initial.size || [...assigned].some(([id, role]) => initial.get(id) !== role);


    function addProjects(list: ProjectModel[]) {
        const next = new Map(assigned);
        for (const p of list) if (!next.has(p.idProject)) next.set(p.idProject, MemberRole.Team);
        setAssigned(next);
    }

    function setRole(idProject: number, role: MemberRole) {
        setAssigned(new Map(assigned).set(idProject, role));
    }

    function removeProject(idProject: number) {
        const next = new Map(assigned);
        next.delete(idProject);
        setAssigned(next);
    }


    async function send(form: UserDto) {
        try {
            const dto = { ...form, jobPercent: Number(form.jobPercent) };
            const saved = user ? await userService.updateUser(user.idUser, dto) : await userService.addUser(dto);

            if (changed) {
                await userService.updateUserProjects(saved.idUser, [...assigned].map(([idProject, memberRole]) => ({ idProject, memberRole })));
            }

            notificationService.success(user ? "המשתמש עודכן" : "המשתמש נוסף. הכניסה היא בקוד שנשלח למייל שלו.");
            onClose();
        } catch (err) {
            notificationService.error(err);
        }
    }


    const isEmployee = watch("role") === UserRole.Employee;


    return (
        <Dialog open onClose={onClose} maxWidth="md" fullWidth>
            <form onSubmit={handleSubmit(send)}>
                <DialogTitle>{user ? "עריכת משתמש" : "משתמש חדש"}</DialogTitle>

                <DialogContent className="user-dialog">
                    <TextField label="שם פרטי" required autoFocus {...register("firstName", { required: true })} />
                    <TextField label="שם משפחה" {...register("lastName")} />
                    <TextField label="מייל (לכניסה למערכת)" type="email" required className="full" slotProps={{ htmlInput: { dir: "ltr" } }} {...register("email", { required: true })} />

                    <TextField select label="הרשאה" value={watch("role")} onChange={e => setValue("role", e.target.value as UserRole)}>
                        {Object.values(UserRole).map(role => <MenuItem key={role} value={role}>{roleLabel[role]}</MenuItem>)}
                    </TextField>

                    <TextField label="היקף משרה (%)" type="number" slotProps={{ htmlInput: { min: 0, max: 100 } }} {...register("jobPercent")} />

                    <FormControlLabel
                        className="full"
                        control={<Switch checked={watch("isActive")} onChange={e => setValue("isActive", e.target.checked)} />}
                        label="משתמש פעיל (יכול להתחבר)"
                    />

                    {/* Projects */}
                    <section className="full udlg-projects">
                        <h3>פרויקטים מורשים <small>{assigned.size}</small></h3>
                        <p className="note">
                            {isEmployee
                                ? "העובד/ת יראה רק את הפרויקטים האלה, ויוכל/תוכל לתעד בהם פגישות, לעדכן שלבים ולבצע משימות."
                                : "מנהל ואדמין רואים את כל הפרויקטים. השיוך כאן קובע אחריות ומשפיע על מפת העומסים."}
                        </p>

                        <Autocomplete
                            multiple
                            value={[]}
                            options={openProjects.filter(p => !assigned.has(p.idProject))}
                            getOptionLabel={projectLabel}
                            onChange={(_, value) => addProjects(value)}
                            renderInput={params => <TextField {...params} label="הוספת פרויקט (חיפוש לקוח או פרויקט)" size="small" />}
                        />

                        <div className="udlg-list">
                            {assignedProjects.map(p => (
                                <div key={p.idProject} className="udlg-row">
                                    <ClientChip idClient={p.idClient} clientName={p.clientName} />
                                    <span className="udlg-name">{p.projectName || "פרויקט כללי"}</span>
                                    <StatusPill status={p.status} />
                                    <Select size="small" value={assigned.get(p.idProject)} onChange={e => setRole(p.idProject, e.target.value as MemberRole)} className="udlg-role">
                                        {Object.values(MemberRole).map(r => <MenuItem key={r} value={r}>{memberRoleLabel[r]}</MenuItem>)}
                                    </Select>
                                    <IconButton size="small" onClick={() => removeProject(p.idProject)} aria-label="הסרה"><CloseIcon fontSize="small" /></IconButton>
                                </div>
                            ))}
                            {!assignedProjects.length && <div className="note udlg-empty">לא שויך עדיין לאף פרויקט</div>}
                        </div>
                    </section>
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose}>ביטול</Button>
                    <Button type="submit" variant="contained" disabled={formState.isSubmitting}>שמירה</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
