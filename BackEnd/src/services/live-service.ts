import { NextFunction, Request, Response } from "express";


//Change event sent to every open browser - only the resource name (no data).
//Each browser fetches the fresh data itself, so permissions are kept (employee sees only his projects).
export interface LiveEvent {
    resource: string;
    origin: string | null;
}

interface LiveClient {
    idUser: number;
    response: Response;
}


//Resource of a change by the url: /api/<resource>/...
const resourceOfPath: Record<string, string> = {
    projects: "projects",
    stages: "projects",
    updates: "projects",
    tasks: "tasks",
    users: "users",
    clients: "clients",
    plan: "plan",
    info: "info",
    hiring: "hiring",
    settings: "settings"
};


class LiveService {

    private clients = new Set<LiveClient>();


    //GET /api/live - Server-Sent Events stream (kept open)
    public subscribe(request: Request, response: Response): void {

        response.status(200).set({
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        });
        response.flushHeaders();
        response.write("retry: 3000\n\n");

        const client: LiveClient = { idUser: request.user!.idUser, response };
        this.clients.add(client);

        //Keeps proxies (nginx / vite) from closing an idle connection
        const ping = setInterval(() => response.write(": ping\n\n"), 25000);

        request.on("close", () => {
            clearInterval(ping);
            this.clients.delete(client);
        });
    }


    //Send a change to every open browser
    public broadcast(event: LiveEvent): void {
        const message = `event: change\ndata: ${JSON.stringify(event)}\n\n`;
        for (const client of this.clients) {
            client.response.write(message);
        }
    }


    //Middleware - after every successful change (POST/PUT/PATCH/DELETE) notify all browsers
    public notifyOnChange = (request: Request, response: Response, next: NextFunction): void => {

        if (request.method === "GET" || request.method === "OPTIONS" || request.method === "HEAD") {
            next();
            return;
        }

        const segment = request.path.split("/")[2] ?? "";
        const resource = resourceOfPath[segment];

        if (resource) {
            response.on("finish", () => {
                if (response.statusCode < 400) {
                    const origin = request.header("x-client-id");
                    this.broadcast({ resource, origin: origin ? origin.slice(0, 64) : null });
                }
            });
        }

        next();
    };

}

export const liveService = new LiveService();
