import type { ProjectModel } from "../models/project-model";
import { invoiceLabel, InvoiceStatus, ProjectKind, statusLabel, updateTypeLabel, phaseLabel } from "../models/enum";
import { fmtDate, memberNames, tabOf, todayISO } from "../utils/utils";
import { MemberRole } from "../models/enum";
import { projectService } from "./projectService";



//Excel friendly CSV (BOM for Hebrew)
class ExportService {

    private toCsv(rows: unknown[][]): string {
        return "﻿" + rows.map(row => row.map(cell => {
            const text = String(cell ?? "");
            return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        }).join(",")).join("\r\n");
    }

    private download(filename: string, rows: unknown[][]): void {
        const blob = new Blob([this.toCsv(rows)], { type: "text/csv;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    }

    //Projects table
    public exportProjects(projects: ProjectModel[]): void {
        const rows: unknown[][] = [["סוג", "לקוח", "פרויקט", "סטטוס", "שלב", "אחראי/ת", "מבצע/ת", "צוות", "דדליין", "שעות לחיוב", "שעות שהוקצו", "שעות שבוצעו", "תאריך סיום", "איש קשר", "הצעת מחיר", "סטטוס חשבונית", "מה לחייב", "הערות חיוב", "הערות", "תיעוד אחרון", "תוכן התיעוד האחרון"]];

        for (const p of [...projects].sort((a, b) => (a.clientName || "").localeCompare(b.clientName || "", "he"))) {
            rows.push([
                p.kind === ProjectKind.Lead ? "ליד" : tabOf(p) === "done" ? "הסתיים" : "פעיל",
                p.clientName, p.projectName, statusLabel[p.status], p.phase ? phaseLabel[p.phase] : "",
                memberNames(p, MemberRole.Manager).join(", "), memberNames(p, MemberRole.Executor).join(", "), memberNames(p, MemberRole.Team).join(", "),
                p.deadline, p.hoursBillable, p.hoursAllocated, p.hoursDone, fmtDate(p.endDate), p.contactName, p.quote,
                invoiceLabel[p.invoiceStatus], p.invoiceWhat, p.billingNotes, p.notes, fmtDate(p.lastUpdateDate), p.lastSummary
            ]);
        }

        this.download(`פרויקטים-${todayISO()}.csv`, rows);
    }

    //Projects to bill
    public exportInvoices(projects: ProjectModel[]): boolean {
        const list = projects.filter(p => p.invoiceStatus === InvoiceStatus.Ready || p.invoiceStatus === InvoiceStatus.Sent);
        if (!list.length) return false;

        const rows: unknown[][] = [["סטטוס", "לקוח", "פרויקט", "מה לחייב", "הערות חיוב", "הצעת מחיר", "איש קשר", "אחראי/ת", "סטטוס פרויקט", "תאריך שליחת חשבונית"]];
        for (const p of list) {
            rows.push([
                p.invoiceStatus === InvoiceStatus.Ready ? "להפקה" : "נשלחה – ממתין לתשלום",
                p.clientName, p.projectName, p.invoiceWhat, p.billingNotes, p.quote, p.contactName,
                memberNames(p, MemberRole.Manager).join(", "), statusLabel[p.status], fmtDate(p.invoiceSentDate)
            ]);
        }

        this.download(`חשבוניות-להפקה-${todayISO()}.csv`, rows);
        return true;
    }

    //Meetings log
    public async exportLog(projects: ProjectModel[]): Promise<void> {
        const updates = await projectService.getAllUpdates();
        const byId = new Map(projects.map(p => [p.idProject, p]));

        const rows: unknown[][] = [["תאריך", "לקוח", "פרויקט", "סוג", "משתתפים", "מה עלה / מה סוכם", "משימות ואחריות", "סטטוס אחרי", "תועד ע״י"]];
        for (const u of updates) {
            const p = byId.get(u.idProject);
            rows.push([fmtDate(u.updateDate), p?.clientName, p?.projectName, updateTypeLabel[u.updateType], u.participants, u.summary, u.tasksText, u.statusAfter ? statusLabel[u.statusAfter] : "", u.authorName]);
        }

        this.download(`יומן-פגישות-${todayISO()}.csv`, rows);
    }

}

export const exportService = new ExportService();
