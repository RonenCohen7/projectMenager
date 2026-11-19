import { appConfig } from "../utils/app-config";
import { store } from "../redux/store";
import { isPrivileged } from "../utils/utils";
import { authService } from "./authService";
import { projectService } from "./projectService";
import { taskService } from "./taskService";
import { userService } from "./userService";
import { clientService } from "./clientService";
import { planService } from "./planService";
import { infoService } from "./infoService";
import { hiringService } from "./hiringService";
import { settingsService } from "./settingsService";


//Id of this browser tab - sent with every request, so the tab ignores the echo of its own changes
export const clientId = Math.random().toString(36).slice(2) + Date.now().toString(36); //randomUUID needs https

type Resource = "projects" | "tasks" | "users" | "clients" | "plan" | "info" | "hiring" | "settings";


//Live updates: listens to the server (Server-Sent Events) and reloads into the store
//whatever another user / tab changed - every screen updates without refreshing the browser.
class LiveService {

    private controller: AbortController | null = null;
    private pending = new Set<Resource>();
    private timer: ReturnType<typeof setTimeout> | null = null;
    private retryMs = 1000;


    //Start after login (called again - restarts with the current token)
    public start(): void {
        this.stop();
        const controller = new AbortController();
        this.controller = controller;
        this.connect(controller, false);
    }

    //Stop on logout
    public stop(): void {
        this.controller?.abort();
        this.controller = null;
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        this.pending.clear();
    }


    //fetch + stream (and not EventSource) - so the token goes in a header and not in the url
    private async connect(controller: AbortController, isRetry: boolean): Promise<void> {

        const token = store.getState().auth.token;
        if (!token || controller.signal.aborted) return;

        try {
            const response = await fetch(appConfig.baseUrl + "live", {
                headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
                credentials: "include",
                signal: controller.signal
            });

            if (response.status === 401) return; //token expired - axios sends to login on the next request
            if (!response.ok || !response.body) throw new Error("live " + response.status);

            this.retryMs = 1000;

            //Changes may have been missed while disconnected
            if (isRetry) this.reloadAll();

            const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += value;
                const blocks = buffer.split("\n\n");
                buffer = blocks.pop() ?? "";

                for (const block of blocks) this.handle(block);
            }
        }
        catch {
            if (controller.signal.aborted) return;
        }

        //Reconnect (up to 30 seconds between tries)
        if (controller.signal.aborted) return;
        setTimeout(() => this.connect(controller, true), this.retryMs);
        this.retryMs = Math.min(this.retryMs * 2, 30000);
    }


    private handle(block: string): void {
        const data = block.split("\n").filter(line => line.startsWith("data:")).map(line => line.slice(5).trim()).join("");
        if (!data) return;

        try {
            const event = JSON.parse(data) as { resource: Resource, origin: string | null };
            if (event.origin === clientId) return; //own change - already reloaded by the service
            this.queue(event.resource);
        } catch {
            //not a change event
        }
    }


    //Several changes together -> one reload
    private queue(resource: Resource): void {
        this.pending.add(resource);
        if (this.timer) return;
        this.timer = setTimeout(() => {
            this.timer = null;
            const resources = [...this.pending];
            this.pending.clear();
            this.reload(resources);
        }, 300);
    }


    private reloadAll(): void {
        this.reload(["projects", "tasks", "users", "clients", "plan", "info", "hiring", "settings"]);
    }


    //Reload only what changed. Lists of screens not opened yet (null) are loaded when the screen opens.
    private reload(resources: Resource[]): void {

        const data = store.getState().data;
        const privileged = isPrivileged(store.getState().auth.user?.role);
        const has = (r: Resource) => resources.includes(r);
        const jobs: Promise<unknown>[] = [];

        if (has("projects") || has("users") || has("clients")) {
            jobs.push(projectService.getAllProjects());
        }
        if (has("projects") || has("tasks") || has("users")) {
            jobs.push(taskService.getTasks());
        }
        if (has("users")) {
            jobs.push(userService.getAllUsers(), authService.refreshMe()); //my role / projects may have changed
        }
        if ((has("clients") || has("projects")) && data.clients !== null && privileged) {
            jobs.push(clientService.getAllClients());
        }
        if (has("plan") && data.plan !== null) jobs.push(planService.getAll());
        if (has("info") && data.info !== null) jobs.push(infoService.getAll());
        if (has("hiring") && data.hiring !== null && privileged) jobs.push(hiringService.getAll());
        if (has("settings") && data.heat !== null && privileged) jobs.push(settingsService.getHeat());

        Promise.allSettled(jobs);
    }

}

export const liveService = new LiveService();
