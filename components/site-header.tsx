"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function SiteHeader() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const toggleMenu = () => setOpen(current => !current);
    const studentRoute = ["/dashboard", "/catalogue", "/exam", "/results", "/classroom"].some(
        route => pathname === route || pathname.startsWith(`${route}/`),
    );

    useEffect(() => {
        const close = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };

        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
    }, []);

    if (studentRoute) return null;

    return (
        <header className="landing-header">
            <Link className="landing-brand" href="/" onClick={() => setOpen(false)}>
                <Image src="/images/logo.png" alt="PrePa" width={48} height={48} priority />
                <span>
                    PrePa
                    <small>A JoLight Academy product</small>
                </span>
            </Link>

            <button
                className="landing-menu"
                type="button"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                onClick={toggleMenu}
            >
                <span />
                <span />
                <span />
            </button>

            {open ? (
                <button
                    className="landing-header__overlay"
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setOpen(false)}
                />
            ) : null}

            <nav className={open ? "is-open" : ""} aria-label="Public navigation">
                <Link href="/" onClick={() => setOpen(false)}>Home</Link>
                <Link href="#how-it-works" onClick={() => setOpen(false)}>How it works</Link>
                <Link href="#features" onClick={() => setOpen(false)}>Features</Link>
                <Link href="#about" onClick={() => setOpen(false)}>About</Link>
                <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
                <Link className="button button-primary" href="/register" onClick={() => setOpen(false)}>
                    Get started
                </Link>
            </nav>
        </header>
    );
}