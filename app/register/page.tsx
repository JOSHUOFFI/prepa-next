import { RegisterForm } from "@/components/auth/register-form";
import { ButtonLink } from "@/components/button-link";
import { PageShell } from "@/components/page-shell";
export const metadata={title:"Create account"};
export default function RegisterPage(){return <PageShell title="Join PrePa CBT"><RegisterForm/><ButtonLink href="/login" variant="secondary">Already have an account? Log in</ButtonLink></PageShell>;}
