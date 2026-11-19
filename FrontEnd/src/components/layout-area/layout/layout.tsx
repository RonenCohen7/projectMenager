import "./layout.css";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
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
import { liveService } from "../../service/liveService";


export function Layout() {

    const token = useSelector((state: RootState) => state.auth.token);
    const { pathname } = useLocation();

    //Opening screen and login - full screen without menu
    const showMenu = !!token && pathname !== "/" && pathname !== "/login";


    //Load shared data after login + live updates from the server (changes of other users appear at once)
    useEffect(() => {
        if (!token) {
            liveService.stop();
            return;
        }

        authService.refreshMe()
            .then(() => Promise.all([projectService.refresh(), userService.getAllUsers()]))
            .catch(err => notificationService.error(err));

        liveService.start();
        return () => liveService.stop();

    }, [token]);


    return (
        <div className={showMenu ? "layout" : "layout no-menu"}>

            {showMenu && (
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

            {showMenu && <ProjectDrawer />}

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
