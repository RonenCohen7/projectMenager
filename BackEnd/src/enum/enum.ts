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


export enum StatusCode {
    OK = 200,
    Created = 201,
    NoContent = 204,
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    Conflict = 409,
    TooManyRequests = 429,
    InternalServerError = 500
}
