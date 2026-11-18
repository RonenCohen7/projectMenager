import "./client-list.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button, IconButton, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { RootState } from "../../redux/store";
import type { ClientModel } from "../../models/client-model";
import { UserRole } from "../../models/enum";
import { useTitle } from "../../utils/UseTitle";
import { clientService } from "../../service/clientService";
import { notificationService } from "../../service/notificationService";
import { ClientChip } from "../../shared-area/tags/tags";
import { ClientDialog } from "../client-dialog/client-dialog";


export function ClientList() {

    useTitle("לקוחות");

    const navigate = useNavigate();
    const user = useSelector((state: RootState) => state.auth.user);
    const projects = useSelector((state: RootState) => state.data.projects);

    const [clients, setClients] = useState<ClientModel[]>([]);
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState<ClientModel | "new" | null>(null);


    // =========================
    // Load clients (again when projects change - counts)
    // =========================

    useEffect(() => {
        clientService.getAllClients()
            .then(setClients)
            .catch(err => notificationService.error(err));
    }, [projects]);


    const shown = clients.filter(client =>
        [client.clientName, client.contactName, client.contactEmail].join(" ").toLowerCase().includes(search.toLowerCase())
    );


    async function saved() {
        setEditing(null);
        setClients(await clientService.getAllClients());
    }


    async function remove(client: ClientModel) {
        if (!window.confirm(`למחוק את הלקוח ${client.clientName}? הפרויקטים שלו יישארו ללא לקוח.`)) return;
        try {
            await clientService.deleteClient(client.idClient);
            setClients(await clientService.getAllClients());
            notificationService.success("הלקוח נמחק");
        } catch (err) {
            notificationService.error(err);
        }
    }


    return (
        <section className="page">

            <header className="page-head">
                <div>
                    <h1>לקוחות</h1>
                    <p>{clients.length} לקוחות · לקוח חדש נוצר גם אוטומטית כשפותחים פרויקט עם שם לקוח חדש</p>
                </div>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing("new")}>לקוח חדש</Button>
            </header>

            <div className="toolbar">
                <TextField type="search" placeholder="חיפוש לקוח או איש קשר" value={search} onChange={e => setSearch(e.target.value)} className="grow" />
            </div>

            <div className="list">
                <Table size="small" className="clients-table">
                    <TableHead>
                        <TableRow>
                            <TableCell>לקוח</TableCell>
                            <TableCell>איש קשר</TableCell>
                            <TableCell>מייל</TableCell>
                            <TableCell>טלפון</TableCell>
                            <TableCell>פרויקטים פעילים</TableCell>
                            <TableCell>סה״כ</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {shown.map(client => (
                            <TableRow key={client.idClient} hover>
                                <TableCell>
                                    <button type="button" className="link" onClick={() => navigate(`/projects?client=${client.idClient}`)}>
                                        <ClientChip idClient={client.idClient} clientName={client.clientName} />
                                    </button>
                                </TableCell>
                                <TableCell>{client.contactName}</TableCell>
                                <TableCell dir="ltr" className="client-ltr">{client.contactEmail}</TableCell>
                                <TableCell dir="ltr" className="client-ltr">{client.contactPhone}</TableCell>
                                <TableCell>{client.activeProjectsCount}</TableCell>
                                <TableCell>{client.projectsCount}</TableCell>
                                <TableCell align="left" className="client-actions">
                                    <Tooltip title="עריכה"><IconButton size="small" onClick={() => setEditing(client)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                                    {user?.role === UserRole.Admin && (
                                        <Tooltip title="מחיקה"><IconButton size="small" onClick={() => remove(client)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {!shown.length && <div className="empty"><strong>אין לקוחות להצגה</strong></div>}
            </div>

            {editing && <ClientDialog client={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={saved} />}

        </section>
    );
}
