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
import { SiteCredit } from "../../shared-area/site-credit/site-credit";
import { projectService } from "../../service/projectService";
import { userService } from "../../service/userService";
import { authService } from "../../service/authService";
import { notificationService } from "../../service/notificationService";
import { liveService } from "../../service/liveService";


export function Layout() {

    const session = useSelector((state: RootState) => state.auth.expiresAt);
    const { pathname } = useLocation();

    //Opening screen and login - full screen without menu
    const showMenu = !!session && pathname !== "/" && pathname !== "/login";
    //Home has the line inside its own footer. Everywhere else it sits under the page.
    const showCredit = pathname !== "/";


    //Load shared data after login + live updates from the server (changes of other users appear at once)
    useEffect(() => {
        if (!session) {
            liveService.stop();
            return;
        }

        authService.refreshMe()
            .then(() => Promise.all([projectService.refresh(), userService.getAllUsers()]))
            .catch(err => notificationService.error(err));

        liveService.start();
        return () => liveService.stop();

    }, [session]);


    return (
        <div className={`layout${showMenu ? "" : " no-menu"}${showCredit ? " has-credit" : ""}`}>

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

            {showCredit && (
                <footer className="app-foot">
                    <SiteCredit />
                </footer>
            )}

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
