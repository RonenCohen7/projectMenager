import "./header.css";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Avatar, Button, Chip, Divider, ListItemIcon, Menu as MuiMenu, MenuItem } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import type { RootState } from "../../redux/store";
import { roleLabel } from "../../models/enum";
import { fullName, isPrivileged } from "../../utils/utils";
import { authService } from "../../service/authService";
import { exportService } from "../../service/exportService";
import { notificationService } from "../../service/notificationService";


export function Header() {

    const user = useSelector((state: RootState) => state.auth.user);
    const projects = useSelector((state: RootState) => state.data.projects);

    const navigate = useNavigate();
    const [, setSearchParams] = useSearchParams();

    const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
    const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null);

    const canEdit = isPrivileged(user?.role);


    //Open the drawer on a new project / lead
    function openNew(kind: "project" | "lead") {
        setSearchParams(params => {
            params.delete("project");
            params.set("new", kind);
            return params;
        });
    }


    async function doExport(kind: "projects" | "log" | "invoices") {
        setExportAnchor(null);
        try {
            if (kind === "projects") exportService.exportProjects(projects);
            if (kind === "log") await exportService.exportLog(projects);
            if (kind === "invoices" && !exportService.exportInvoices(projects)) {
                notificationService.info("אין כרגע פרויקטים לחיוב");
            }
        } catch (err) {
            notificationService.error(err);
        }
    }


    async function logout() {
        setUserAnchor(null);
        await authService.logout();
        navigate("/login");
    }


    return (
        <div className="header">

            <div className="header-actions">
                {canEdit && (
                    <>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openNew("project")}>
                            פרויקט חדש
                        </Button>
                        <Button variant="outlined" onClick={() => openNew("lead")}>
                            ליד חדש
                        </Button>
                    </>
                )}

                <Button variant="text" color="inherit" startIcon={<FileDownloadOutlinedIcon />} onClick={e => setExportAnchor(e.currentTarget)}>
                    ייצוא לאקסל
                </Button>

                <MuiMenu anchorEl={exportAnchor} open={!!exportAnchor} onClose={() => setExportAnchor(null)}>
                    <MenuItem onClick={() => doExport("projects")}>טבלת פרויקטים (CSV)</MenuItem>
                    <MenuItem onClick={() => doExport("log")}>יומן פגישות ועדכונים (CSV)</MenuItem>
                    {canEdit && <MenuItem onClick={() => doExport("invoices")}>פרויקטים לחיוב (CSV)</MenuItem>}
                </MuiMenu>
            </div>

            <button type="button" className="header-user" onClick={e => setUserAnchor(e.currentTarget)}>
                <Avatar className="header-avatar">{user?.firstName?.[0]}</Avatar>
                <span className="header-name">{fullName(user)}</span>
                {user && <Chip size="small" label={roleLabel[user.role]} className={`role-chip role-${user.role}`} />}
            </button>

            <MuiMenu anchorEl={userAnchor} open={!!userAnchor} onClose={() => setUserAnchor(null)}>
                <MenuItem disabled>{user?.email}</MenuItem>
                <Divider />
                <MenuItem onClick={logout}>
                    <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                    יציאה
                </MenuItem>
            </MuiMenu>

        </div>
    );
}
