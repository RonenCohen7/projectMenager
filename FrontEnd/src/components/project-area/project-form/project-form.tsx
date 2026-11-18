import "./project-form.css";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Autocomplete, Button, MenuItem, TextField } from "@mui/material";
import type { RootState } from "../../redux/store";
import type { ProjectDetailsModel, ProjectDto, ProjectMemberDto } from "../../models/project-model";
import type { ClientModel } from "../../models/client-model";
import type { UserModel } from "../../models/user-model";
import {
    InvoiceStatus, invoiceLabel, leadStatuses, MemberRole, memberRoleLabel, ProjectKind, ProjectPhase, phaseLabel,
    projectStatuses, statusLabel, Urgency, urgencyLabel, UserRole
} from "../../models/enum";
import { fullName, hoursLeftText, isPrivileged } from "../../utils/utils";
import { projectService } from "../../service/projectService";
import { clientService } from "../../service/clientService";
import { notificationService } from "../../service/notificationService";
import { useProjectDrawer } from "../../utils/UseProjectDrawer";
import { DateField } from "../../shared-area/date-field/date-field";


interface ProjectFormProps {
    project: ProjectDetailsModel | null;      //null = new
    kind: ProjectKind;
    onSaved: (saved: ProjectDetailsModel) => void;
}


//Project details + assigned employees. Only admin / manager can edit.
export function ProjectForm({ project, kind, onSaved }: ProjectFormProps) {

    const me = useSelector((state: RootState) => state.auth.user);
    const users = useSelector((state: RootState) => state.data.users);

    const { closeProject } = useProjectDrawer();

    const canEdit = isPrivileged(me?.role);
    const statuses = kind === ProjectKind.Lead ? leadStatuses : projectStatuses;

    const [clients, setClients] = useState<ClientModel[]>([]);
    const [clientName, setClientName] = useState(project?.clientName ?? "");
    const [members, setMembers] = useState<Record<MemberRole, number[]>>({
        manager: project?.members.filter(m => m.memberRole === MemberRole.Manager).map(m => m.idUser) ?? (me && canEdit && !project ? [me.idUser] : []),
        executor: project?.members.filter(m => m.memberRole === MemberRole.Executor).map(m => m.idUser) ?? [],
        team: project?.members.filter(m => m.memberRole === MemberRole.Team).map(m => m.idUser) ?? []
    });
    const [busy, setBusy] = useState(false);

    const { register, handleSubmit, watch, setValue } = useForm<ProjectDto>({
        defaultValues: {
            projectName: project?.projectName ?? "",
            status: project?.status ?? statuses[0],
            phase: project?.phase ?? "",
            urgency: project?.urgency ?? Urgency.Normal,
            deadline: project?.deadline ?? "",
            endDate: project?.endDate ?? "",
            hoursBillable: project?.hoursBillable ?? "",
            hoursAllocated: project?.hoursAllocated ?? "",
            hoursDone: project?.hoursDone ?? "",
            contactName: project?.contactName ?? "",
            quote: project?.quote ?? "",
            invoiceStatus: project?.invoiceStatus ?? InvoiceStatus.None,
            invoiceWhat: project?.invoiceWhat ?? "",
            billingNotes: project?.billingNotes ?? "",
            notes: project?.notes ?? ""
        }
    });


    // =========================
    // Clients for the autocomplete (admin / manager)
    // =========================

    useEffect(() => {
        if (!canEdit) return;
        clientService.getAllClients().then(setClients).catch(() => undefined);
    }, [canEdit]);


    const activeUsers = users.filter(u => u.isActive || Object.values(members).flat().includes(u.idUser));
    const usedElsewhere = (role: MemberRole) => Object.entries(members).filter(([r]) => r !== role).flatMap(([, ids]) => ids);


    async function send(form: ProjectDto) {
        if (!clientName.trim()) {
            notificationService.error("צריך למלא שם לקוח");
            return;
        }

        const memberList: ProjectMemberDto[] = (Object.keys(members) as MemberRole[])
            .flatMap(role => members[role].map(idUser => ({ idUser, memberRole: role })));

        const dto: ProjectDto = { ...form, kind, clientName: clientName.trim(), phase: form.phase || null, members: memberList };

        setBusy(true);
        try {
            const saved = project
                ? await projectService.updateProject(project.idProject, dto)
                : await projectService.addProject(dto);
            notificationService.success(project ? "נשמר" : kind === ProjectKind.Lead ? "הליד נוצר" : "הפרויקט נוצר");
            onSaved(saved);
        } catch (err) {
            notificationService.error(err);
        } finally {
            setBusy(false);
        }
    }


    async function convert() {
        if (!project) return;
        try {
            await projectService.convertLead(project.idProject);
            notificationService.success("הליד הומר לפרויקט פעיל");
        } catch (err) {
            notificationService.error(err);
        }
    }


    async function remove() {
        if (!project || !window.confirm("למחוק את הפרויקט עם כל התיעוד והמשימות שלו? אי אפשר לבטל.")) return;
        try {
            await projectService.deleteProject(project.idProject);
            notificationService.success("הפרויקט נמחק");
            closeProject();
        } catch (err) {
            notificationService.error(err);
        }
    }


    const select = (name: keyof ProjectDto, label: string, options: [string, string][], className?: string) => (
        <TextField select label={label} className={className} disabled={!canEdit}
            value={watch(name) ?? ""} onChange={e => setValue(name, e.target.value as never)}>
            {options.map(([value, text]) => <MenuItem key={value} value={value}>{text}</MenuItem>)}
        </TextField>
    );

    const memberSelect = (role: MemberRole) => (
        <Autocomplete
            multiple
            disabled={!canEdit}
            options={activeUsers.filter(u => !usedElsewhere(role).includes(u.idUser))}
            getOptionLabel={(u: UserModel) => fullName(u) + (u.role === UserRole.Employee ? "" : ` (${u.role === UserRole.Admin ? "אדמין" : "מנהל/ת"})`)}
            value={activeUsers.filter(u => members[role].includes(u.idUser))}
            onChange={(_, value) => setMembers({ ...members, [role]: value.map(u => u.idUser) })}
            isOptionEqualToValue={(a, b) => a.idUser === b.idUser}
            renderInput={params => <TextField {...params} label={memberRoleLabel[role]} size="small" />}
        />
    );


    return (
        <form className="pform" onSubmit={handleSubmit(send)} autoComplete="off">

            {!canEdit && <div className="pform-note">יש לך הרשאת צפייה בפרטי הפרויקט. אפשר לתעד פגישות, לעדכן שלבים ולבצע משימות.</div>}

            <section className="pform-section">
                <h3>שיוך עובדים לפרויקט</h3>
                <p className="note">רק עובדים ששויכו לפרויקט יראו אותו ויוכלו לתעד ולבצע בו משימות.</p>
                <div className="pform-members">
                    {memberSelect(MemberRole.Manager)}
                    {memberSelect(MemberRole.Executor)}
                    {memberSelect(MemberRole.Team)}
                </div>
            </section>

            <section className="pform-section pform-grid">
                <Autocomplete
                    freeSolo
                    disabled={!canEdit}
                    options={clients.map(c => c.clientName)}
                    inputValue={clientName}
                    onInputChange={(_, value) => setClientName(value)}
                    renderInput={params => <TextField {...params} label="לקוח" required size="small" />}
                />
                <TextField label={kind === ProjectKind.Lead ? "נושא הפנייה" : "שם הפרויקט"} disabled={!canEdit} {...register("projectName")} />

                {select("status", "סטטוס", statuses.map(s => [s, statusLabel[s]]))}
                {kind === ProjectKind.Project
                    ? select("phase", "פיתוח / הפקה", [["", "לא נבחר"], ...Object.values(ProjectPhase).map(p => [p, phaseLabel[p]] as [string, string])])
                    : <span />}
                {select("urgency", "דחיפות מול הלקוח", Object.values(Urgency).map(u => [u, urgencyLabel[u]]))}

                <TextField label="דדליין" placeholder="למשל 31.12 או דצמבר" disabled={!canEdit} {...register("deadline")} />
                <DateField label="תאריך סיום מתוכנן" disabled={!canEdit} value={watch("endDate")} onChange={v => setValue("endDate", v ?? "")} />
                <TextField label="איש קשר אצל הלקוח" disabled={!canEdit} {...register("contactName")} />
            </section>

            {kind === ProjectKind.Project && (
                <section className="pform-section">
                    <h3>שעות</h3>
                    <div className="pform-hours">
                        <TextField label="שעות לחיוב" type="number" disabled={!canEdit} slotProps={{ htmlInput: { min: 0, step: 1 } }} {...register("hoursBillable")} />
                        <TextField label="שעות שהוקצו" type="number" disabled={!canEdit} slotProps={{ htmlInput: { min: 0, step: 1 } }} {...register("hoursAllocated")} />
                        <TextField label="שעות שבוצעו" type="number" disabled={!canEdit} slotProps={{ htmlInput: { min: 0, step: 1 } }} {...register("hoursDone")} />
                        <div className="pform-calc">
                            <span>שעות שנותרו</span>
                            <b>{hoursLeftText(watch("hoursAllocated"), watch("hoursBillable"), watch("hoursDone"))}</b>
                        </div>
                    </div>
                </section>
            )}

            {canEdit && (
                <section className="pform-section pform-grid">
                    <h3 className="full">חיוב</h3>
                    <TextField label="הצעת מחיר" {...register("quote")} />
                    {select("invoiceStatus", "סטטוס חשבונית", Object.values(InvoiceStatus).map(s => [s, invoiceLabel[s]]))}
                    <TextField label="מה לחייב (למשל 30% מקדמה / סיום)" className="full" {...register("invoiceWhat")} />
                    <TextField label="הערות חיוב" className="full" {...register("billingNotes")} />
                </section>
            )}

            <section className="pform-section">
                <TextField label="הערות כלליות" multiline minRows={3} disabled={!canEdit} {...register("notes")} />
            </section>

            {canEdit && (
                <div className="pform-actions">
                    {project && me?.role === UserRole.Admin && <Button color="error" onClick={remove}>מחיקת הפרויקט</Button>}
                    {project && kind === ProjectKind.Lead && <Button variant="outlined" onClick={convert}>המרה לפרויקט פעיל</Button>}
                    <span className="grow" />
                    <Button type="submit" variant="contained" disabled={busy}>{project ? "שמירת השינויים" : "יצירה"}</Button>
                </div>
            )}

        </form>
    );
}
