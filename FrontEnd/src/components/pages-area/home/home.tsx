import "./home.css";
import { useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { RootState } from "../../redux/store";
import { useTitle } from "../../utils/UseTitle";
import { BrandLogo } from "../../shared-area/brand/brand";
import { SiteCredit } from "../../shared-area/site-credit/site-credit";
import hero from "../../../assets/home-hero.webp";


const features = ["פרויקטים ולקוחות", "תיעוד פגישות", "משימות וקנבן", "שלבי פיתוח לומדה", "חשבוניות", "מפת עומסים"];


//Opening screen - system name, T.MORE logo, 3D learning scene and the way in
export function Home() {

    useTitle("ברוכים הבאים");

    const session = useSelector((state: RootState) => state.auth.expiresAt);
    const navigate = useNavigate();

    const stage = useRef<HTMLDivElement>(null);


    //3D tilt that follows the mouse
    function onMove(e: React.MouseEvent) {
        const box = stage.current?.getBoundingClientRect();
        if (!box) return;
        const x = (e.clientX - box.left) / box.width - .5;
        const y = (e.clientY - box.top) / box.height - .5;
        stage.current!.style.setProperty("--ry", `${x * 14}deg`);
        stage.current!.style.setProperty("--rx", `${-y * 10}deg`);
    }

    function onLeave() {
        stage.current?.style.setProperty("--ry", "0deg");
        stage.current?.style.setProperty("--rx", "0deg");
    }


    return (
        <section className="home" onMouseMove={onMove} onMouseLeave={onLeave}>

            <header className="home-top">
                <BrandLogo tone="dark" />
                <Button variant="outlined" className="home-top-btn" onClick={() => navigate(session ? "/projects" : "/login")}>
                    {session ? "למסך הראשי" : "כניסה"}
                </Button>
            </header>

            <div className="home-main">

                {/* Text */}
                <div className="home-text">
                    <span className="home-eyebrow">T.MORE · MGROUP · פתרונות למידה דיגיטליים</span>
                    <h1 dir="ltr">MT-Project</h1>
                    <p className="home-sub">מערכת ניהול הפרויקטים של מחלקת הלמידה – מהליד הראשון ועד מסירת הלומדה, הכל במקום אחד.</p>

                    <ul className="home-features">
                        {features.map(f => <li key={f}>{f}</li>)}
                    </ul>

                    <Button variant="contained" size="large" className="home-cta" endIcon={<ArrowBackIcon />}
                        onClick={() => navigate(session ? "/projects" : "/login")}>
                        {session ? "כניסה למסך הראשי" : "כניסה עם מייל"}
                    </Button>
                    <span className="home-note">ללא סיסמה – קוד חד-פעמי נשלח למייל שלך</span>
                </div>

                {/* 3D scene: the image tilts with the mouse and floats, with light and motion layers on top */}
                <div className="home-stage" ref={stage}>
                    <div className="home-scene">
                        <div className="home-photo">
                            {/* Image + motion layers move together (zoom, mouse depth) */}
                            <div className="home-layer">
                            <img src={hero} alt="מחשב נייד עם לומדה אינטראקטיבית ונתוני פרויקטים" className="home-hero" />

                            {/* Motion layers (same 1024x576 frame as the image) */}
                            <svg className="home-fx" viewBox="0 0 1024 576" aria-hidden="true">
                                <defs>
                                    <radialGradient id="fxDot">
                                        <stop offset="0" stopColor="#FFFFFF" />
                                        <stop offset=".35" stopColor="#C4B5FD" />
                                        <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
                                    </radialGradient>
                                    <radialGradient id="fxNode">
                                        <stop offset="0" stopColor="#FFFFFF" />
                                        <stop offset=".4" stopColor="#5EEAD4" />
                                        <stop offset="1" stopColor="#5EEAD4" stopOpacity="0" />
                                    </radialGradient>
                                </defs>

                                {/* Light running around the orbit ring */}
                                <path id="fxOrbit" d="M 196 418 a 316 92 0 1 0 632 0 a 316 92 0 1 0 -632 0" fill="none" />
                                <circle r="14" fill="url(#fxDot)">
                                    <animateMotion dur="9s" repeatCount="indefinite"><mpath href="#fxOrbit" /></animateMotion>
                                </circle>
                                <circle r="9" fill="url(#fxDot)" opacity=".7">
                                    <animateMotion dur="9s" begin="-4.5s" repeatCount="indefinite"><mpath href="#fxOrbit" /></animateMotion>
                                </circle>

                                {/* Network points pulse */}
                                <g className="fx-nodes">
                                    <circle cx="257" cy="186" r="10" fill="url(#fxNode)" />
                                    <circle cx="330" cy="148" r="10" fill="url(#fxNode)" style={{ animationDelay: "-1s" }} />
                                    <circle cx="690" cy="204" r="16" fill="url(#fxNode)" style={{ animationDelay: "-2s" }} />
                                    <circle cx="770" cy="203" r="10" fill="url(#fxNode)" style={{ animationDelay: "-.5s" }} />
                                    <circle cx="690" cy="252" r="8" fill="url(#fxNode)" style={{ animationDelay: "-1.5s" }} />
                                </g>

                                {/* Rising sparkles */}
                                <g className="fx-sparks" fill="#FFFFFF">
                                    <circle cx="420" cy="330" r="2" />
                                    <circle cx="610" cy="300" r="1.6" style={{ animationDelay: "-2s" }} />
                                    <circle cx="500" cy="360" r="1.8" style={{ animationDelay: "-4s" }} />
                                    <circle cx="560" cy="250" r="1.4" style={{ animationDelay: "-1s" }} />
                                    <circle cx="380" cy="270" r="1.5" style={{ animationDelay: "-3s" }} />
                                </g>
                            </svg>
                            </div>

                            {/* Light sweep */}
                            <span className="home-glare" aria-hidden="true" />
                        </div>
                    </div>
                </div>

            </div>

            <footer className="home-foot">
                <div>Training and more · ייעוץ ופיתוח פתרונות למידה מתקדמים לארגונים ולמערכות חינוך</div>
                <SiteCredit />
            </footer>

        </section>
    );
}
