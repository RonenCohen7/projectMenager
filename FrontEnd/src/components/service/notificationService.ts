import { toast, type ToastOptions } from "react-toastify";
import { errorMessage } from "../utils/utils";


class NotificationService {

    public success(message: string, options?: ToastOptions): void {
        toast.success(message, options);
    }

    //Accepts an error object (axios) or a message
    public error(err: unknown, options?: ToastOptions): void {
        toast.error(typeof err === "string" ? err : errorMessage(err), { autoClose: 6000, ...options });
    }

    public info(message: string, options?: ToastOptions): void {
        toast.info(message, options);
    }
}

export const notificationService = new NotificationService();
