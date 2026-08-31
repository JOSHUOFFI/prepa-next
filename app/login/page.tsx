import { LoginForm } from "@/components/auth/login-form";
import { ButtonLink } from "@/components/button-link";
import { PageShell } from "@/components/page-shell";
export const metadata={title:"Log in"};
export default function LoginPage(){return <PageShell title="Welcome back"><LoginForm/><ButtonLink href="/register">Create an account</ButtonLink></PageShell>;}
