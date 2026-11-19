import sanitizeHtml from "sanitize-html";

export function sanitizeText(value: unknown): string {
    if (typeof value !== "string") return "";

    return sanitizeHtml(value.trim(), {
        allowedTags: [],
        allowedAttributes: {},
        textFilter: text => text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"")
    });
}


//Email format (simple and strict enough: name@domain.tld, no spaces)
export function isEmail(value: string): boolean {
    return value.length <= 200 && /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[^\s@<>()",;]{2,}$/.test(value);
}


//Empty string -> null (for optional columns)
export function cleanOrNull(value: unknown): string | null {
    const text = sanitizeText(value);
    return text === "" ? null : text;
}


//Number or null
export function numberOrNull(value: unknown): number | null {
    if (value === undefined || value === null || value === "") return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}


//YYYY-MM-DD or null
export function dateOrNull(value: unknown): string | null {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}


//Value must be one of the enum values
export function enumOrDefault<T extends string>(value: unknown, values: T[], fallback: T): T {
    return values.includes(value as T) ? value as T : fallback;
}
