import "./menu.css";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import type { ReactNode } from "react";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import CoPresentOutlinedIcon from "@mui/icons-material/CoPresentOutlined";
import ViewKanbanOutlinedIcon from "@mui/icons-material/ViewKanbanOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import GridOnOutlinedIcon from "@mui/icons-material/GridOnOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import type { RootState } from "../../redux/store";
import { InvoiceStatus, UserRole } from "../../models/enum";
import { isPrivileged, tabOf } from "../../utils/utils";
import { BrandLogo } from "../../shared-area/brand/brand";


type MenuLink = { to: string, label: string, icon: ReactNode, count?: number, roles?: UserRole[] };

const privileged = [UserRole.Admin, UserRole.Manager];


export function Menu() {

    const user = useSelector((state: RootState) => state.auth.user);
    const projects = useSelector((state: RootState) => state.data.projects);
    const tasks = useSelector((state: RootState) => state.data.tasks);

    const count = (tab: string) => projects.filter(p => tabOf(p) === tab).length;
    const openTasks = tasks.filter(t => !t.isDone).length;

    const groups: { title: string, links: MenuLink[] }[] = [
        {
            title: "פרויקטים",
            links: [
                { to: "/projects", label: "פרויקטים פעילים", icon: <DashboardOutlinedIcon />, count: count("active") },
                { to: "/meeting", label: "ישיבת סטטוס", icon: <CoPresentOutlinedIcon /> },
                { to: "/board", label: "לוח קנבן", icon: <ViewKanbanOutlinedIcon /> },
                { to: "/tasks", label: "משימות", icon: <ChecklistOutlinedIcon />, count: openTasks },
                { to: "/agenda", label: "נושאים לפגישה", icon: <ForumOutlinedIcon /> },
                { to: "/leads", label: "לידים", icon: <LightbulbOutlinedIcon />, count: count("lead") },
                { to: "/done", label: "הסתיימו", icon: <TaskAltOutlinedIcon />, count: count("done") }
            ]
        },
        {
            title: "ניהול",
            links: [
                { to: "/hours", label: "ניהול זמנים", icon: <AccessTimeOutlinedIcon /> },
                { to: "/invoices", label: "חשבוניות", icon: <ReceiptLongOutlinedIcon />, roles: privileged, count: projects.filter(p => p.invoiceStatus === InvoiceStatus.Ready).length },
                { to: "/clients", label: "לקוחות", icon: <BusinessOutlinedIcon />, roles: privileged },
                { to: "/plan", label: "תוכנית עבודה", icon: <EventNoteOutlinedIcon /> },
                { to: "/info", label: "מידע חשוב", icon: <InfoOutlinedIcon /> }
            ]
        },
        {
            title: "צוות",
            links: [
                { to: "/staff", label: "כח אדם", icon: <GroupsOutlinedIcon />, roles: privileged },
                { to: "/load-map", label: "מפת עומסים", icon: <GridOnOutlinedIcon />, roles: privileged },
                { to: "/users", label: "משתמשים והרשאות", icon: <ManageAccountsOutlinedIcon />, roles: [UserRole.Admin] }
            ]
        }
    ];


    return (
        <div className="menu">

            <NavLink to="/" end className="menu-brand">
                <strong dir="ltr">MT-Project</strong>
                <span>{isPrivileged(user?.role) ? "כל הפרויקטים" : "הפרויקטים שלי"}</span>
                <BrandLogo tone="light" className="menu-logo" />
            </NavLink>

            {groups.map(group => {
                const links = group.links.filter(link => !link.roles || (user && link.roles.includes(user.role)));
                if (!links.length) return null;

                return (
                    <div className="menu-group" key={group.title}>
                        <div className="menu-title">{group.title}</div>
                        {links.map(link => (
                            <NavLink key={link.to} to={link.to}>
                                {link.icon}
                                <span>{link.label}</span>
                                {!!link.count && <b>{link.count}</b>}
                            </NavLink>
                        ))}
                    </div>
                );
            })}

        </div>
    );
}
