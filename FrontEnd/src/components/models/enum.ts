export enum UserRole {
    Admin = "admin",
    Manager = "manager",
    Employee = "employee"
}

export enum ProjectKind {
    Project = "project",
    Lead = "lead"
}

export enum ProjectStatus {
    NotStarted = "not_started",
    InProgress = "in_progress",
    Fixes = "fixes",
    WaitingClient = "waiting_client",
    Frozen = "frozen",
    Delivered = "delivered",
    Completed = "completed"
}

export enum LeadStatus {
    New = "new",
    Scoping = "scoping",
    QuoteSent = "quote_sent",
    WaitingDecision = "waiting_decision",
    Dropped = "dropped"
}

export enum ProjectPhase {
    Development = "development",
    Production = "production",
    Fixes = "fixes",
    Delivered = "delivered"
}

export enum Urgency {
    Normal = "normal",
    Low = "low",
    High = "high",
    Urgent = "urgent",
    Frozen = "frozen"
}

export enum Priority {
    Urgent = "urgent",
    High = "high",
    Normal = "normal",
    Low = "low"
}

export enum InvoiceStatus {
    None = "none",
    Ready = "ready",
    Sent = "sent",
    Paid = "paid",
    NotBillable = "not_billable"
}

export enum MemberRole {
    Manager = "manager",
    Executor = "executor",
    Team = "team"
}

export enum LoadLevel {
    None = "none",
    Low = "low",
    Medium = "medium",
    High = "high"
}

export enum StageStatus {
    Todo = "todo",
    Doing = "doing",
    Review = "review",
    Done = "done"
}

export enum UpdateType {
    ClientMeeting = "client_meeting",
    InternalMeeting = "internal_meeting",
    PhoneCall = "phone_call",
    Email = "email",
    StatusUpdate = "status_update",
    TaskCompleted = "task_completed",
    Invoice = "invoice"
}

export enum PlanStatus {
    NotStarted = "not_started",
    InProgress = "in_progress",
    Completed = "completed",
    Postponed = "postponed"
}

export enum InfoCategory {
    Pricing = "pricing",
    Procedures = "procedures",
    Contacts = "contacts",
    Templates = "templates",
    Suppliers = "suppliers",
    General = "general"
}

export enum HiringStatus {
    NotStarted = "not_started",
    Searching = "searching",
    Interviewing = "interviewing",
    OfferSent = "offer_sent",
    Hired = "hired",
    Closed = "closed"
}


// =========================
// Hebrew labels
// =========================

export const roleLabel: Record<UserRole, string> = {
    admin: "אדמין",
    manager: "מנהל/ת",
    employee: "עובד/ת"
};

export const statusLabel: Record<string, string> = {
    not_started: "טרם התחיל",
    in_progress: "בעבודה",
    fixes: "בתיקונים",
    waiting_client: "ממתין ללקוח",
    frozen: "מוקפא",
    delivered: "נמסר",
    completed: "הסתיים",
    new: "חדש",
    scoping: "באפיון",
    quote_sent: "הצעת מחיר נשלחה",
    waiting_decision: "ממתין להחלטה",
    dropped: "ירד"
};

//Color key of each status (css: .pill.s-<key>)
export const statusStyle: Record<string, string> = {
    not_started: "new", in_progress: "work", fixes: "fix", waiting_client: "wait", frozen: "frozen",
    delivered: "done", completed: "done", new: "new", scoping: "work", quote_sent: "fix",
    waiting_decision: "wait", dropped: "drop"
};

export const projectStatuses = Object.values(ProjectStatus) as string[];
export const leadStatuses = Object.values(LeadStatus) as string[];

export const phaseLabel: Record<ProjectPhase, string> = {
    development: "פיתוח",
    production: "הפקה",
    fixes: "תיקונים",
    delivered: "נמסר"
};

export const urgencyLabel: Record<Urgency, string> = {
    normal: "רגיל",
    low: "נמוך",
    high: "גבוה",
    urgent: "דחוף",
    frozen: "מוקפא"
};

export const urgencyRank: Record<Urgency, number> = { urgent: 0, high: 1, normal: 2, low: 3, frozen: 4 };

export const priorityLabel: Record<Priority, string> = {
    urgent: "דחוף",
    high: "גבוה",
    normal: "רגיל",
    low: "נמוך"
};

export const priorityRank: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

export const invoiceLabel: Record<InvoiceStatus, string> = {
    none: "לא הוגדר",
    ready: "ניתן לשלוח חשבונית",
    sent: "חשבונית נשלחה – ממתין לתשלום",
    paid: "שולם",
    not_billable: "לא רלוונטי לחיוב"
};

export const memberRoleLabel: Record<MemberRole, string> = {
    manager: "אחראי/ת",
    executor: "מבצע/ת",
    team: "צוות"
};

export const loadLabel: Record<LoadLevel, string> = {
    none: "ללא",
    low: "מעט",
    medium: "בינוני",
    high: "עמוס"
};

export const stageStatusLabel: Record<StageStatus, string> = {
    todo: "לביצוע",
    doing: "בעבודה",
    review: "בבדיקה",
    done: "הושלם"
};

export const updateTypeLabel: Record<UpdateType, string> = {
    client_meeting: "פגישת לקוח",
    internal_meeting: "פגישה פנימית",
    phone_call: "שיחת טלפון",
    email: "מייל",
    status_update: "עדכון סטטוס",
    task_completed: "משימה הושלמה",
    invoice: "חשבונית"
};

export const planStatusLabel: Record<PlanStatus, string> = {
    not_started: "טרם התחיל",
    in_progress: "בתהליך",
    completed: "הושלם",
    postponed: "נדחה"
};

export const infoCategoryLabel: Record<InfoCategory, string> = {
    pricing: "תמחור",
    procedures: "נהלים",
    contacts: "אנשי קשר",
    templates: "תבניות ומסמכים",
    suppliers: "ספקים",
    general: "כללי"
};

export const hiringStatusLabel: Record<HiringStatus, string> = {
    not_started: "טרם התחיל חיפוש",
    searching: "בחיפוש – פורסם",
    interviewing: "בראיונות",
    offer_sent: "הצעה נשלחה",
    hired: "גויס/ה",
    closed: "נסגר / בוטל"
};

//Stages templates (like the old system)
export const stageTemplates: Record<string, string[]> = {
    "לומדה": ["אפיון וקבלת חומרים", "פיצוח ותסריט", "סטוריבורד", "אישור לקוח לסטוריבורד", "הפקה ופיתוח", "סבב תיקונים", "מסירה והטמעה"],
    "סרטון": ["אפיון", "תסריט", "סטוריבורד / קונספט", "צילום / אנימציה", "עריכה", "סבב תיקונים", "מסירה"],
    "מערכי שיעור": ["אפיון ותחקור", "כתיבת מערכים", "מצגות וחומרי עזר", "סבב תיקונים", "מסירה"]
};

export const planAreas = ["AI ויעול העבודה", "פיתוח עסקי ומכרזים", "לקוחות ופרויקטים", "צוות וגיוס", "פיתוח מקצועי ומתודולוגיה", "מוצר ו-More", "תהליכים פנימיים"];
