import "./invoice-list.css";
import type { ReactNode } from "react";
import { useSelector } from "react-redux";
import { Button } from "@mui/material";
import type { RootState } from "../../redux/store";
import type { ProjectModel } from "../../models/project-model";
import { InvoiceStatus, ProjectKind, ProjectStatus } from "../../models/enum";
import { useTitle } from "../../utils/UseTitle";
import { useProjectDrawer } from "../../utils/UseProjectDrawer";
import { daysSince, fmtDate, relDays } from "../../utils/utils";
import { projectService } from "../../service/projectService";
import { notificationService } from "../../service/notificationService";
import { ClientChip, StatusPill } from "../../shared-area/tags/tags";


const billingHint = /חשבונית|לחייב|חיוב|מקדמה|תשלום/;


//Invoices flow: ready to bill -> sent -> paid
export function InvoiceList() {

    useTitle("חשבוניות");

    const projects = useSelector((state: RootState) => state.data.projects);
    const { openProject } = useProjectDrawer();

    const byName = (a: ProjectModel, b: ProjectModel) => (a.clientName || "").localeCompare(b.clientName || "", "he") || (a.projectName || "").localeCompare(b.projectName || "", "he");

    const ready = projects.filter(p => p.invoiceStatus === InvoiceStatus.Ready).sort(byName);
    const sent = projects.filter(p => p.invoiceStatus === InvoiceStatus.Sent).sort((a, b) => (a.invoiceSentDate || "").localeCompare(b.invoiceSentDate || ""));
    const paid = projects.filter(p => p.invoiceStatus === InvoiceStatus.Paid && (daysSince(p.paidDate) ?? 999) <= 30);

    //Not set yet but looks billable
    const reasons = (p: ProjectModel) => [
        p.status === ProjectStatus.Delivered ? "הפרויקט נמסר" : "",
        p.status === ProjectStatus.Completed ? "הפרויקט הסתיים" : "",
        p.billingNotes && billingHint.test(p.billingNotes) ? `הערת חיוב: ${p.billingNotes}` : ""
    ].filter(Boolean);
    const check = projects.filter(p => p.kind === ProjectKind.Project && p.invoiceStatus === InvoiceStatus.None && reasons(p).length).sort(byName);


    async function setInvoice(p: ProjectModel, status: InvoiceStatus, message: string) {
        try {
            await projectService.updateInvoice(p.idProject, status);
            notificationService.success(message);
        } catch (err) {
            notificationService.error(err);
        }
    }


    const row = (p: ProjectModel, meta: ReactNode, buttons: ReactNode) => (
        <div key={p.idProject} className="invrow">
            <div className="invrow-main">
                <div className="invrow-head">
                    <ClientChip idClient={p.idClient} clientName={p.clientName} />
                    <button type="button" className="link invrow-name" onClick={() => openProject(p.idProject)}>{p.projectName || "פרויקט כללי"}</button>
                    <StatusPill status={p.status} />
                </div>
                <div className="invrow-meta">{meta}</div>
            </div>
            <div className="invrow-buttons">{buttons}</div>
        </div>
    );

    const section = (title: string, list: ProjectModel[], cls: string, render: (p: ProjectModel) => ReactNode, empty: string) => (
        <section className={`invsec ${cls}`}>
            <h2 className="section-title">{title}<small>{list.length ? `${list.length} פרויקטים` : ""}</small></h2>
            <div className="list">
                {list.length ? list.map(render) : <div className="empty">{empty}</div>}
            </div>
        </section>
    );


    return (
        <section className="page">

            <header className="page-head">
                <div>
                    <h1>חשבוניות</h1>
                    <p>מה מוכן לחיוב, מה נשלח ומחכה לתשלום, ומה כדאי לבדוק. כל שינוי נרשם בתיעוד של הפרויקט.</p>
                </div>
            </header>

            {section("ניתן לשלוח חשבונית", ready, "inv-ready", p => row(p,
                <>{p.invoiceWhat ? <span className="invwhat">לחייב: {p.invoiceWhat}</span> : <span>לא צוין מה לחייב – אפשר להוסיף בפרטי הפרויקט</span>}{p.billingNotes && <span>{p.billingNotes}</span>}{p.quote && <span>הצעת מחיר: {p.quote}</span>}</>,
                <>
                    <Button size="small" variant="contained" onClick={() => setInvoice(p, InvoiceStatus.Sent, "נרשם שהחשבונית נשלחה")}>החשבונית נשלחה</Button>
                    <Button size="small" onClick={() => setInvoice(p, InvoiceStatus.None, "בוטל")}>ביטול</Button>
                </>
            ), "אין כרגע פרויקטים שמסומנים כמוכנים לחיוב.")}

            {section("חשבונית נשלחה – ממתין לתשלום", sent, "inv-sent", p => row(p,
                <>{p.invoiceWhat && <span className="invwhat">{p.invoiceWhat}</span>}<span>נשלחה {fmtDate(p.invoiceSentDate)} · {relDays(daysSince(p.invoiceSentDate))}</span></>,
                <>
                    <Button size="small" variant="contained" color="success" onClick={() => setInvoice(p, InvoiceStatus.Paid, "התשלום נרשם")}>התקבל תשלום</Button>
                    <Button size="small" onClick={() => setInvoice(p, InvoiceStatus.Ready, "הוחזר ל'ניתן לחייב'")}>החזרה</Button>
                </>
            ), "אין חשבוניות שממתינות לתשלום.")}

            {check.length > 0 && section("כדאי לבדוק אם לחייב", check, "inv-check", p => row(p,
                <>{reasons(p).map(r => <span key={r}>{r}</span>)}</>,
                <>
                    <Button size="small" variant="outlined" onClick={() => setInvoice(p, InvoiceStatus.Ready, "סומן כמוכן לחיוב")}>מוכן לחיוב</Button>
                    <Button size="small" onClick={() => setInvoice(p, InvoiceStatus.NotBillable, "סומן כלא רלוונטי")}>לא לחיוב</Button>
                </>
            ), "")}

            {paid.length > 0 && section("שולמו ב-30 הימים האחרונים", paid, "inv-paid", p => row(p,
                <span>שולם {fmtDate(p.paidDate)}</span>, null
            ), "")}

        </section>
    );
}
