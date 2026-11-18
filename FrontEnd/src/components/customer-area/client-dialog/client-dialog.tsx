import "./client-dialog.css";
import { useForm } from "react-hook-form";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import type { ClientDto, ClientModel } from "../../models/client-model";
import { clientService } from "../../service/clientService";
import { notificationService } from "../../service/notificationService";


interface ClientDialogProps {
    client: ClientModel | null;
    onClose: () => void;
    onSaved: () => void;
}

export function ClientDialog({ client, onClose, onSaved }: ClientDialogProps) {

    const { register, handleSubmit } = useForm<ClientDto>({
        defaultValues: {
            clientName: client?.clientName ?? "",
            contactName: client?.contactName ?? "",
            contactEmail: client?.contactEmail ?? "",
            contactPhone: client?.contactPhone ?? "",
            notes: client?.notes ?? ""
        }
    });


    async function send(form: ClientDto) {
        try {
            if (client) await clientService.updateClient(client.idClient, form);
            else await clientService.addClient(form);
            notificationService.success("נשמר");
            onSaved();
        } catch (err) {
            notificationService.error(err);
        }
    }


    return (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit(send)}>
                <DialogTitle>{client ? "עריכת לקוח" : "לקוח חדש"}</DialogTitle>

                <DialogContent className="client-dialog">
                    <TextField label="שם הלקוח" required autoFocus className="full" {...register("clientName", { required: true })} />
                    <TextField label="איש קשר" {...register("contactName")} />
                    <TextField label="טלפון" slotProps={{ htmlInput: { dir: "ltr" } }} {...register("contactPhone")} />
                    <TextField label="מייל" type="email" className="full" slotProps={{ htmlInput: { dir: "ltr" } }} {...register("contactEmail")} />
                    <TextField label="הערות" multiline minRows={3} className="full" {...register("notes")} />
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose}>ביטול</Button>
                    <Button type="submit" variant="contained">שמירה</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
