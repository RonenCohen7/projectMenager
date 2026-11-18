import "./user-dialog.css";
import { useForm } from "react-hook-form";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, MenuItem, Switch, TextField } from "@mui/material";
import type { UserDto, UserModel } from "../../models/user-model";
import { roleLabel, UserRole } from "../../models/enum";
import { userService } from "../../service/userService";
import { notificationService } from "../../service/notificationService";


interface UserDialogProps {
    user: UserModel | null;      //null = new user
    onClose: () => void;
}

export function UserDialog({ user, onClose }: UserDialogProps) {

    const { register, handleSubmit, watch, setValue } = useForm<UserDto>({
        defaultValues: user
            ? { firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, jobPercent: user.jobPercent, isActive: user.isActive }
            : { firstName: "", lastName: "", email: "", role: UserRole.Employee, jobPercent: 100, isActive: true }
    });


    async function send(form: UserDto) {
        try {
            const dto = { ...form, jobPercent: Number(form.jobPercent) };
            if (user) await userService.updateUser(user.idUser, dto);
            else await userService.addUser(dto);
            notificationService.success(user ? "המשתמש עודכן" : "המשתמש נוסף. הכניסה היא בקוד שנשלח למייל שלו.");
            onClose();
        } catch (err) {
            notificationService.error(err);
        }
    }


    return (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit(send)}>
                <DialogTitle>{user ? "עריכת משתמש" : "משתמש חדש"}</DialogTitle>

                <DialogContent className="user-dialog">
                    <TextField label="שם פרטי" required autoFocus {...register("firstName", { required: true })} />
                    <TextField label="שם משפחה" {...register("lastName")} />
                    <TextField label="מייל (לכניסה למערכת)" type="email" required className="full" slotProps={{ htmlInput: { dir: "ltr" } }} {...register("email", { required: true })} />

                    <TextField select label="הרשאה" value={watch("role")} onChange={e => setValue("role", e.target.value as UserRole)}>
                        {Object.values(UserRole).map(role => <MenuItem key={role} value={role}>{roleLabel[role]}</MenuItem>)}
                    </TextField>

                    <TextField label="היקף משרה (%)" type="number" slotProps={{ htmlInput: { min: 0, max: 100 } }} {...register("jobPercent")} />

                    <FormControlLabel
                        className="full"
                        control={<Switch checked={watch("isActive")} onChange={e => setValue("isActive", e.target.checked)} />}
                        label="משתמש פעיל (יכול להתחבר)"
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose}>ביטול</Button>
                    <Button type="submit" variant="contained">שמירה</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
