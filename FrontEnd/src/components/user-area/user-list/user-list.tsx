import "./user-list.css";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Button, Chip, IconButton, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { RootState } from "../../redux/store";
import type { UserModel } from "../../models/user-model";
import { roleLabel } from "../../models/enum";
import { useTitle } from "../../utils/UseTitle";
import { fullName } from "../../utils/utils";
import { userService } from "../../service/userService";
import { notificationService } from "../../service/notificationService";
import { UserDialog } from "../user-dialog/user-dialog";


//Admin: users, roles (admin / manager / employee) and job percent
export function UserList() {

    useTitle("משתמשים והרשאות");

    const users = useSelector((state: RootState) => state.data.users);
    const projects = useSelector((state: RootState) => state.data.projects);
    const me = useSelector((state: RootState) => state.auth.user);

    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState<UserModel | "new" | null>(null);


    const projectsCount = (idUser: number) => projects.filter(p => p.members.some(m => m.idUser === idUser)).length;

    const shown = users.filter(user => [fullName(user), user.email].join(" ").toLowerCase().includes(search.toLowerCase()));


    async function remove(user: UserModel) {
        if (!window.confirm(`למחוק את ${fullName(user)}? השיוכים לפרויקטים יימחקו. אפשר במקום זה לסמן כלא פעיל.`)) return;
        try {
            await userService.deleteUser(user.idUser);
            notificationService.success("המשתמש נמחק");
        } catch (err) {
            notificationService.error(err);
        }
    }


    return (
        <section className="page">

            <header className="page-head">
                <div>
                    <h1>משתמשים והרשאות</h1>
                    <p>אדמין מנהל משתמשים. מנהל/ת ואדמין פותחים פרויקטים ומשייכים עובדים. עובד/ת רואה רק פרויקטים שהוא/היא משויך/ת אליהם.</p>
                </div>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing("new")}>משתמש חדש</Button>
            </header>

            <div className="toolbar">
                <TextField type="search" placeholder="חיפוש לפי שם או מייל" value={search} onChange={e => setSearch(e.target.value)} className="grow" />
            </div>

            <div className="list">
                <Table size="small" className="users-table">
                    <TableHead>
                        <TableRow>
                            <TableCell>שם</TableCell>
                            <TableCell>מייל</TableCell>
                            <TableCell>הרשאה</TableCell>
                            <TableCell>היקף משרה</TableCell>
                            <TableCell>פרויקטים</TableCell>
                            <TableCell>מצב</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {shown.map(user => (
                            <TableRow key={user.idUser} hover className={user.isActive ? "" : "inactive"}>
                                <TableCell className="user-name">{fullName(user)}</TableCell>
                                <TableCell dir="ltr" className="user-email">{user.email}</TableCell>
                                <TableCell><Chip size="small" label={roleLabel[user.role]} className={`role-chip role-${user.role}`} /></TableCell>
                                <TableCell>{user.jobPercent}%</TableCell>
                                <TableCell>{projectsCount(user.idUser)}</TableCell>
                                <TableCell>{user.isActive ? "פעיל/ה" : "לא פעיל/ה"}</TableCell>
                                <TableCell align="left" className="user-actions">
                                    <Tooltip title="עריכה"><IconButton size="small" onClick={() => setEditing(user)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                                    {user.idUser !== me?.idUser && (
                                        <Tooltip title="מחיקה"><IconButton size="small" onClick={() => remove(user)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {!shown.length && <div className="empty"><strong>לא נמצאו משתמשים</strong></div>}
            </div>

            {editing && <UserDialog user={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}

        </section>
    );
}
