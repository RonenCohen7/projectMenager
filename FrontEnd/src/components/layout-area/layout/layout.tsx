import "./layout.css";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import type { RootState } from "../../redux/store";
import { Header } from "../header/header";
import { Menu } from "../menu/menu";
import { Routing } from "../routing/routing";
import { ProjectDrawer } from "../../project-area/project-drawer/project-drawer";
import { projectService } from "../../service/projectService";
import { userService } from "../../service/userService";
import { authService } from "../../service/authService";
import { notificationService } from "../../service/notificationService";


export function Layout() {

    const token = useSelector((state: RootState) => state.auth.token);


    //Load shared data after login
    useEffect(() => {
        if (!token) return;

        authService.refreshMe()
            .then(() => Promise.all([projectService.refresh(), userService.getAllUsers()]))
            .catch(err => notificationService.error(err));

    }, [token]);


    return (
        <div className={token ? "layout" : "layout no-menu"}>

            {token && (
                <>
                    <nav>
                        <Menu />
                    </nav>

                    <header>
                        <Header />
                    </header>
                </>
            )}

            <main>
                <Routing />
            </main>

            {token && <ProjectDrawer />}

            <ToastContainer
                position="bottom-left"
                autoClose={3000}
                newestOnTop
                closeOnClick
                pauseOnHover
                rtl
                theme="colored"
            />
        </div>
    );
}
