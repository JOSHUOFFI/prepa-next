import Image from "next/image";
import Link from "next/link";
export function SiteHeader() { return <header className="header"><Link className="brand" href="/"><Image src="/images/logo.png" alt="PrePa logo" width={42} height={42} priority /><span>PrePa <small>CBT Portal</small></span></Link><nav aria-label="Primary navigation"><Link href="/dashboard">Dashboard</Link><Link href="/exam">Exam</Link><Link href="/classroom">Classroom</Link><Link href="/login">Log in</Link></nav></header>; }
