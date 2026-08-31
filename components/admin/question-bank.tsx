"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Ref = { id: string; name: string; subject_id?: string };
type Question = { id: string; question_text: string; is_active: boolean; difficulty: string | null; question_type: string | null; subjects?: { name: string } | null; classes?: { name: string } | null; terms?: { name: string } | null; topics?: { name: string } | null };

export function QuestionBank() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [refs, setRefs] = useState<{ subjects: Ref[]; classes: Ref[]; terms: Ref[]; topics: Ref[] }>({ subjects: [], classes: [], terms: [], topics: [] });
    const [filters, setFilters] = useState({ search: "", subject: "", class: "", term: "", topic: "", difficulty: "", type: "", status: "active" });
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [counts, setCounts] = useState({ active: 0, archived: 0 });
    const [error, setError] = useState("");
    const pageSize = 25;
    useEffect(() => { fetch("/api/admin/reference").then(response => response.json()).then(setRefs); fetch("/api/admin/questions?stats=1").then(response => response.json()).then(setCounts); }, []);
    async function load(targetPage = page) {
        const params = new URLSearchParams({ page: String(targetPage), pageSize: String(pageSize), status: filters.status });
        for (const key of ["search", "subject", "class", "term", "topic", "difficulty", "type"]) if (filters[key as keyof typeof filters]) params.set(key === "type" ? "question_type" : key, filters[key as keyof typeof filters]);
        const response = await fetch(`/api/admin/questions?${params}`, { cache: "no-store" });
        const payload = await response.json() as { questions?: Question[]; total?: number; error?: string };
        if (!response.ok) { setError(payload.error ?? "Unable to load questions."); return; }
        setQuestions(payload.questions ?? []); setTotal(payload.total ?? 0); setPage(targetPage);
    }
    useEffect(() => {
        const params = new URLSearchParams({ page: "1", pageSize: String(pageSize), status: filters.status });
        fetch(`/api/admin/questions?${params}`, { cache: "no-store" }).then(response => response.json() as Promise<{ questions?: Question[]; total?: number; error?: string }>).then(payload => { if (payload.error) setError(payload.error); else { setQuestions(payload.questions ?? []); setTotal(payload.total ?? 0); setPage(1); } });
    }, [filters.status]);
    async function setActive(id: string, active: boolean) { await fetch(`/api/admin/questions/${id}`, { method: active ? "PUT" : "DELETE" }); await load(); }
    const update = (key: keyof typeof filters, value: string) => setFilters(current => ({ ...current, [key]: value }));
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return <section className="admin-page"><div className="admin-page-heading"><div><p className="eyebrow">Admin</p><h1>Question bank</h1><p className="muted">Active: {counts.active} · Archived: {counts.archived}</p></div><div><Link className="btn btn-primary" href="/admin/questions/new">Add question</Link> <Link className="button button-secondary" href="/admin/import">Bulk import</Link></div></div><div className="admin-filters"><input aria-label="Search questions" placeholder="Search question text" value={filters.search} onChange={event => update("search", event.target.value)} /><select aria-label="Subject" value={filters.subject} onChange={event => update("subject", event.target.value)}><option value="">All subjects</option>{refs.subjects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select aria-label="Class" value={filters.class} onChange={event => update("class", event.target.value)}><option value="">All classes</option>{refs.classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select aria-label="Term" value={filters.term} onChange={event => update("term", event.target.value)}><option value="">All terms</option>{refs.terms.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select aria-label="Topic" value={filters.topic} onChange={event => update("topic", event.target.value)}><option value="">All topics</option>{refs.topics.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select aria-label="Difficulty" value={filters.difficulty} onChange={event => update("difficulty", event.target.value)}><option value="">All difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select><select aria-label="Question type" value={filters.type} onChange={event => update("type", event.target.value)}><option value="">All types</option><option value="multiple_choice">Multiple choice</option><option value="true_false">True/false</option><option value="short_answer">Short answer</option></select><select aria-label="Question status" value={filters.status} onChange={event => update("status", event.target.value)}><option value="active">Active</option><option value="archived">Archived</option></select><button className="btn btn-secondary" onClick={() => void load(1)}>Search</button></div>{error ? <p className="form-error">{error}</p> : null}<div className="admin-question-list">{questions.map(question => <article className="card" key={question.id}><p className="eyebrow">{question.subjects?.name ?? "Unassigned"} · {question.difficulty ?? "No difficulty"} · {question.question_type ?? "No type"}</p><h2>{question.question_text}</h2><p className="muted">{question.classes?.name ?? "All classes"} · {question.terms?.name ?? "All terms"} · {question.topics?.name ?? "No topic"}</p><Link className="button button-secondary" href={`/admin/questions/${question.id}`}>Edit</Link> <button className="btn btn-secondary" onClick={() => void setActive(question.id, !question.is_active)}>{question.is_active ? "Archive" : "Restore"}</button></article>)}</div><div className="admin-pagination"><button className="btn btn-secondary" disabled={page <= 1} onClick={() => void load(page - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => void load(page + 1)}>Next</button></div></section>;
}
