import "./login.css";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { Button, TextField } from "@mui/material";
import type { RootState } from "../../redux/store";
import { useTitle } from "../../utils/UseTitle";
import { authService } from "../../service/authService";
import { notificationService } from "../../service/notificationService";
import logo from "../../../assets/logo.svg";


type LoginForm = { email: string, code: string };


//Login by email - no password. A random code is sent to the email.
export function Login() {

    useTitle("כניסה");

    const token = useSelector((state: RootState) => state.auth.token);
    const navigate = useNavigate();

    const { register, handleSubmit, getValues, setValue } = useForm<LoginForm>();

    const [step, setStep] = useState<"email" | "code">("email");
    const [busy, setBusy] = useState(false);


    if (token) {
        return <Navigate to="/projects" replace />;
    }


    //Step 1
    async function sendCode(form: LoginForm) {
        setBusy(true);
        try {
            await authService.requestCode(form.email);
            notificationService.success("שלחנו קוד כניסה למייל");
            setValue("code", "");
            setStep("code");
        } catch (err) {
            notificationService.error(err);
        } finally {
            setBusy(false);
        }
    }


    //Step 2
    async function verify(form: LoginForm) {
        setBusy(true);
        try {
            const auth = await authService.verifyCode(form.email, form.code);
            notificationService.success(`שלום ${auth.user.firstName}`);
            navigate("/projects");
        } catch (err) {
            notificationService.error(err);
        } finally {
            setBusy(false);
        }
    }


    return (
        <section className="login-page">
            <div className="login-card">

                <div className="login-header">
                    <img src={logo} alt="" />
                    <h1>מעקב פרויקטים</h1>
                    <p>
                        {step === "email"
                            ? "מזינים את כתובת המייל ונשלח אליה קוד כניסה חד-פעמי"
                            : `שלחנו קוד בן 6 ספרות אל ${getValues("email")}`}
                    </p>
                </div>

                {step === "email" && (
                    <form className="login-form" onSubmit={handleSubmit(sendCode)}>
                        <TextField
                            label="כתובת מייל"
                            type="email"
                            autoFocus
                            autoComplete="email"
                            slotProps={{ htmlInput: { dir: "ltr" } }}
                            {...register("email", { required: true })}
                        />
                        <Button type="submit" variant="contained" size="large" disabled={busy}>
                            שליחת קוד כניסה
                        </Button>
                    </form>
                )}

                {step === "code" && (
                    <form className="login-form" onSubmit={handleSubmit(verify)}>
                        <TextField
                            label="קוד כניסה"
                            autoFocus
                            autoComplete="one-time-code"
                            className="login-code"
                            slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6, dir: "ltr" } }}
                            {...register("code", { required: true, pattern: /^\d{6}$/ })}
                        />
                        <Button type="submit" variant="contained" size="large" disabled={busy}>
                            כניסה
                        </Button>

                        <div className="login-links">
                            <button type="button" onClick={() => setStep("email")}>החלפת מייל</button>
                            <button type="button" disabled={busy} onClick={() => sendCode(getValues())}>שליחת קוד חדש</button>
                        </div>
                    </form>
                )}

                <p className="login-note">החיבור תקף ל-12 שעות. אחר כך יתבקש קוד חדש.</p>
            </div>
        </section>
    );
}
