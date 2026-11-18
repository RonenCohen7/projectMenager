import { useSearchParams } from "react-router-dom";

// Custom React Hook: open / close the project drawer from any screen (?project=ID / ?new=project|lead)
export function useProjectDrawer() {

    const [searchParams, setSearchParams] = useSearchParams();

    const openProject = (idProject: number) => setSearchParams(params => {
        params.delete("new");
        params.set("project", String(idProject));
        return params;
    });

    const closeProject = () => setSearchParams(params => {
        params.delete("new");
        params.delete("project");
        return params;
    });

    const idProject = Number(searchParams.get("project")) || null;
    const newKind = searchParams.get("new") as "project" | "lead" | null;

    return { idProject, newKind, openProject, closeProject };
}
