import { RegisterForm } from "@/components/auth/register-form";
import { ButtonLink } from "@/components/button-link";
export const metadata={title:"Create account"};
export default function RegisterPage(){return <main className="auth-page"><section className="auth-page__brand"><p className="eyebrow">PrePa CBT Portal</p><h1>Start with a clearer way to prepare.</h1><p>Create your account to practise class and subject-based CBT exams and revisit every submitted result.</p></section><section className="auth-page__form"><div><p className="eyebrow">Create your account</p><h1>Join PrePa</h1><RegisterForm/><p className="auth-page__switch">Already have an account? <ButtonLink href="/login" variant="secondary">Sign in</ButtonLink></p></div></section></main>;}
