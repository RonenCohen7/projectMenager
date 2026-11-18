import "./date-field.css";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";


interface DateFieldProps {
    label?: string;
    value: string | null | undefined;          //YYYY-MM-DD (as saved in the DB)
    onChange: (value: string | null) => void;
    disabled?: boolean;
    className?: string;
    compact?: boolean;                         //Small, borderless (task rows)
    late?: boolean;                            //Red - date passed
}


//Date picker in Hebrew, shown as DD/MM/YYYY
export function DateField({ label, value, onChange, disabled, className = "", compact, late }: DateFieldProps) {

    const parsed = value ? dayjs(value) : null;

    return (
        <DatePicker
            label={label}
            value={parsed && parsed.isValid() ? parsed : null}
            disabled={disabled}
            format="DD/MM/YYYY"
            onChange={date => {
                if (date === null) onChange(null);
                else if (date.isValid()) onChange(date.format("YYYY-MM-DD"));
            }}
            className={`date-field${compact ? " compact" : ""}${late ? " late" : ""} ${className}`}
            slotProps={{
                textField: { size: "small", fullWidth: true },
                field: { clearable: !compact && !disabled }
            }}
        />
    );
}
