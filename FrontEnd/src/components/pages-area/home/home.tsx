import "./home.css";
import { useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { RootState } from "../../redux/store";
import { useTitle } from "../../utils/UseTitle";
import { BrandLogo } from "../../shared-area/brand/brand";
import hero from "../../../assets/learning-hero.svg";


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

            <div className="home-bg" aria-hidden="true">
                <span className="home-blob b1" /><span className="home-blob b2" /><span className="home-blob b3" />
                <span className="home-grid" />
            </div>

            <header className="home-top">
                <BrandLogo tone="light" />
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

                {/* 3D scene */}
                <div className="home-stage" ref={stage}>
                    <div className="home-scene">
                        <img src={hero} alt="" className="home-hero" />

                        <div className="glass g1"><b>לומדה אינטראקטיבית</b><span>7 שלבים · 82% הושלם</span><i className="gbar"><em /></i></div>
                        <div className="glass g2"><b>AI</b><span>תסריט · תרגום · עיצוב</span></div>
                        <div className="glass g3"><b>סרטון הדרכה</b><span>בהפקה</span></div>
                        <div className="glass g4"><b>מפת עומסים</b><span>מי פנוי לפרויקט הבא</span></div>
                    </div>
                </div>

            </div>

            <footer className="home-foot">Training and more · ייעוץ ופיתוח פתרונות למידה מתקדמים לארגונים ולמערכות חינוך</footer>

        </section>
    );
}
