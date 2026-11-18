import "./brand.css";
import { useState } from "react";


//T.MORE | MGROUP logo (public/tmor-logo.png). Falls back to a text logo when the file is missing.
export function BrandLogo({ tone = "dark", className = "" }: { tone?: "dark" | "light", className?: string }) {

    const [failed, setFailed] = useState(false);

    if (failed) {
        return (
            <span className={`brand-word brand-${tone} ${className}`}>
                <b>T.MORE</b><i>|</i><span>MGROUP</span>
            </span>
        );
    }

    return <img src="/tmor-logo.png" alt="T.MORE MGROUP" className={`brand-img brand-${tone} ${className}`} onError={() => setFailed(true)} />;
}
