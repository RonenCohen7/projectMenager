import { Navigate, Route, Routes } from "react-router-dom";
import { UserRole } from "../../models/enum";
import { AuthGuard } from "../../user-area/auth-guard/auth-guard";
import { Login } from "../../user-area/login/login";
import { UserList } from "../../user-area/user-list/user-list";
import { ClientList } from "../../customer-area/client-list/client-list";
import { ProjectList } from "../../project-area/project-list/project-list";
import { KanbanBoard } from "../../project-area/kanban-board/kanban-board";
import { StatusMeeting } from "../../project-area/status-meeting/status-meeting";
import { TaskList } from "../../task-area/task-list/task-list";
import { Agenda } from "../../task-area/agenda/agenda";
import { InvoiceList } from "../../invoice-area/invoice-list/invoice-list";
import { WorkPlan } from "../../plan-area/work-plan/work-plan";
import { InfoList } from "../../info-area/info-list/info-list";
import { StaffList } from "../../staff-area/staff-list/staff-list";
import { LoadMap } from "../../staff-area/load-map/load-map";
import { Home } from "../../pages-area/home/home";


const privileged = [UserRole.Admin, UserRole.Manager];


export function Routing() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            <Route path="/projects" element={<AuthGuard><ProjectList tab="active" /></AuthGuard>} />
            <Route path="/leads" element={<AuthGuard><ProjectList tab="lead" /></AuthGuard>} />
            <Route path="/done" element={<AuthGuard><ProjectList tab="done" /></AuthGuard>} />
            <Route path="/meeting" element={<AuthGuard><StatusMeeting /></AuthGuard>} />
            <Route path="/board" element={<AuthGuard><KanbanBoard /></AuthGuard>} />
            <Route path="/tasks" element={<AuthGuard><TaskList /></AuthGuard>} />
            <Route path="/agenda" element={<AuthGuard><Agenda /></AuthGuard>} />
            <Route path="/plan" element={<AuthGuard><WorkPlan /></AuthGuard>} />
            <Route path="/info" element={<AuthGuard><InfoList /></AuthGuard>} />

            <Route path="/invoices" element={<AuthGuard roles={privileged}><InvoiceList /></AuthGuard>} />
            <Route path="/clients" element={<AuthGuard roles={privileged}><ClientList /></AuthGuard>} />
            <Route path="/staff" element={<AuthGuard roles={privileged}><StaffList /></AuthGuard>} />
            <Route path="/load-map" element={<AuthGuard roles={privileged}><LoadMap /></AuthGuard>} />

            <Route path="/users" element={<AuthGuard roles={[UserRole.Admin]}><UserList /></AuthGuard>} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
