import "./client-list.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button, IconButton, TextField, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import type { RootState } from "../../redux/store";
import type { ClientModel } from "../../models/client-model";
import { UserRole } from "../../models/enum";
import { useTitle } from "../../utils/UseTitle";
import { useProjectDrawer } from "../../utils/UseProjectDrawer";
import { hueOf, tabOf } from "../../utils/utils";
import { clientService } from "../../service/clientService";
import { notificationService } from "../../service/notificationService";
import { StatusPill } from "../../shared-area/tags/tags";
import { ClientDialog } from "../client-dialog/client-dialog";


type Tier = "gold" | "silver" | "bronze" | "none";

const tierLabel: Record<Tier, string> = { gold: "זהב", silver: "כסף", bronze: "ברונזה", none: "ללא פרויקטים" };

//Client rank by number of projects: 3+ gold, 2 silver, 1 bronze
function tierOf(count: number): Tier {
    return count >= 3 ? "gold" : count === 2 ? "silver" : count === 1 ? "bronze" : "none";
}


//Clients as cards - contact details, projects and rank
export function ClientList() {

    useTitle("לקוחות");

    const navigate = useNavigate();
    const { openProject } = useProjectDrawer();

    const user = useSelector((state: RootState) => state.auth.user);
    const projects = useSelector((state: RootState) => state.data.projects);

    const clients = useSelector((state: RootState) => state.data.clients) ?? [];
    const [search, setSearch] = useState("");
    const [tierFilter, setTierFilter] = useState<Tier | "">("");
    const [editing, setEditing] = useState<ClientModel | "new" | null>(null);


    // =========================
    // Load clients into the store (changes arrive live)
    // =========================

    useEffect(() => {
        clientService.getAllClients().catch(err => notificationService.error(err));
    }, []);


    const withTier = clients
        .map(client => ({ client, tier: tierOf(client.projectsCount) }))
        .sort((a, b) => b.client.projectsCount - a.client.projectsCount || a.client.clientName.localeCompare(b.client.clientName, "he"));

    const shown = withTier.filter(({ client, tier }) =>
        (!tierFilter || tier === tierFilter) &&
        (!search || [client.clientName, client.contactName, client.contactEmail].join(" ").toLowerCase().includes(search.toLowerCase()))
    );

    const count = (tier: Tier) => withTier.filter(x => x.tier === tier).length;

    //Open projects of the client (from the projects list)
    const clientProjects = (idClient: number) => projects.filter(p => p.idClient === idClient && tabOf(p) !== "done");


    function saved() {
        setEditing(null);
    }


    async function remove(client: ClientModel) {
        if (!window.confirm(`למחוק את הלקוח ${client.clientName}? הפרויקטים שלו יישארו ללא לקוח.`)) return;
        try {
            await clientService.deleteClient(client.idClient);
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
                    <p>{clients.length} לקוחות · דירוג לפי כמות פרויקטים: 3 ומעלה זהב, 2 כסף, 1 ברונזה</p>
                </div>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing("new")}>לקוח חדש</Button>
            </header>

            <div className="toolbar">
                <TextField type="search" placeholder="חיפוש לקוח או איש קשר" value={search} onChange={e => setSearch(e.target.value)} className="grow" />
                <div className="cl-tiers">
                    <button type="button" aria-pressed={!tierFilter} onClick={() => setTierFilter("")}>הכל <b>{clients.length}</b></button>
                    {(["gold", "silver", "bronze"] as Tier[]).map(tier => (
                        <button key={tier} type="button" className={`t-${tier}`} aria-pressed={tierFilter === tier} onClick={() => setTierFilter(tierFilter === tier ? "" : tier)}>
                            <i />{tierLabel[tier]} <b>{count(tier)}</b>
                        </button>
                    ))}
                </div>
            </div>

            <div className="cl-grid">
                {shown.map(({ client, tier }) => {
                    const open = clientProjects(client.idClient);
                    return (
                        <article key={client.idClient} className={`cl-card t-${tier}`}>

                            <div className="cl-head">
                                <span className="cl-badge" style={{ background: `hsl(${hueOf(client.idClient)} 70% 94%)`, color: `hsl(${hueOf(client.idClient)} 60% 28%)` }}>
                                    {client.clientName.slice(0, 1)}
                                </span>
                                <div className="cl-title">
                                    <h2>{client.clientName}</h2>
                                    <span className="cl-tier"><WorkspacePremiumIcon fontSize="inherit" />{tierLabel[tier]}</span>
                                </div>
                                <div className="cl-actions">
                                    <Tooltip title="עריכה"><IconButton size="small" onClick={() => setEditing(client)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                                    {user?.role === UserRole.Admin && (
                                        <Tooltip title="מחיקה"><IconButton size="small" onClick={() => remove(client)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                                    )}
                                </div>
                            </div>

                            <div className="cl-stats">
                                <div><b>{client.projectsCount}</b><span>פרויקטים</span></div>
                                <div><b>{client.activeProjectsCount}</b><span>פעילים</span></div>
                                <div><b>{client.projectsCount - client.activeProjectsCount}</b><span>הסתיימו / לידים</span></div>
                            </div>

                            <ul className="cl-contact">
                                <li><PersonOutlineIcon fontSize="small" />{client.contactName || <span className="muted">לא הוגדר איש קשר</span>}</li>
                                {client.contactEmail && <li><MailOutlineIcon fontSize="small" /><a href={`mailto:${client.contactEmail}`} dir="ltr">{client.contactEmail}</a></li>}
                                {client.contactPhone && <li><PhoneOutlinedIcon fontSize="small" /><a href={`tel:${client.contactPhone}`} dir="ltr">{client.contactPhone}</a></li>}
                            </ul>

                            {open.length > 0 && (
                                <div className="cl-projects">
                                    {open.slice(0, 4).map(p => (
                                        <button key={p.idProject} type="button" onClick={() => openProject(p.idProject)}>
                                            <span>{p.projectName || "פרויקט כללי"}</span>
                                            <StatusPill status={p.status} />
                                        </button>
                                    ))}
                                    {open.length > 4 && <span className="muted cl-more">ועוד {open.length - 4}</span>}
                                </div>
                            )}

                            {client.notes && <p className="cl-notes">{client.notes}</p>}

                            <Button variant="outlined" size="small" className="cl-open" onClick={() => navigate(`/projects?client=${client.idClient}`)}>
                                כל הפרויקטים של הלקוח
                            </Button>
                        </article>
                    );
                })}
            </div>

            {!shown.length && <div className="list"><div className="empty"><strong>אין לקוחות להצגה</strong></div></div>}

            {editing && <ClientDialog client={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={saved} />}

        </section>
    );
}
