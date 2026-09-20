"use client";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
export function SiteFooter() {
    const pathname = usePathname();

    if (["/dashboard", "/exam", "/results", "/classroom"].some(route => pathname === route || pathname.startsWith(`${route}/`))) {
        return null;
    }

    return (
        <footer className="landing-footer">
            <div>
                <Link className="landing-footer__brand" href="/">
                    <Image src="/images/logo.png" alt="PrePa" width={44} height={44} />
                    <span>
                        PrePa
                        <small>by JoLight Academy</small>
                    </span>
                </Link>
                <p>Structured CBT practice, clear results, and a focused path to better preparation.</p>
            </div>
            <nav aria-label="Footer navigation">
                <Link href="/login">Sign in</Link>
                <Link href="/register">Create an account</Link>
            </nav>
            <small>© {new Date().getFullYear()} PrePa · JoLight Academy.</small>
        </footer>
    );
}
