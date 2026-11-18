class AppConfig {

    public readonly baseUrl = import.meta.env.VITE_API_URL || "/api/";

    public readonly authUrl = this.baseUrl + "auth/";

    public readonly usersUrl = this.baseUrl + "users/";

    public readonly clientsUrl = this.baseUrl + "clients/";

    public readonly projectsUrl = this.baseUrl + "projects/";

    public readonly stagesUrl = this.baseUrl + "stages/";

    public readonly updatesUrl = this.baseUrl + "updates/";

    public readonly tasksUrl = this.baseUrl + "tasks/";

    public readonly planUrl = this.baseUrl + "plan/";

    public readonly infoUrl = this.baseUrl + "info/";

    public readonly hiringUrl = this.baseUrl + "hiring/";

    public readonly heatUrl = this.baseUrl + "settings/heat";

    //Project not updated for more than this -> "stale"
    public readonly staleDays = 14;

}

export const appConfig = new AppConfig();
