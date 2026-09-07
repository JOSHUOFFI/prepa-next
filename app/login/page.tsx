import { LoginForm } from "@/components/auth/login-form";
import { ButtonLink } from "@/components/button-link";
export const metadata={title:"Log in"};
export default function LoginPage(){return <main className="auth-page"><section className="auth-page__brand"><p className="eyebrow">PrePa CBT Portal</p><h1>Prepare smarter.<br />Perform better.</h1><p>Choose subjects, take timed CBT exams, and understand each result in one focused learning space.</p></section><section className="auth-page__form"><div><p className="eyebrow">Welcome back</p><h1>Sign in to PrePa</h1><LoginForm/><p className="auth-page__switch">New to PrePa? <ButtonLink href="/register" variant="secondary">Create an account</ButtonLink></p></div></section></main>;}
