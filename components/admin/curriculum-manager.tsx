"use client";

import { useState, useEffect, useCallback } from "react";

type Topic = {
    id: string;
    name: string;
    subject_id: string;
    class_id: string | null;
    term_id: string | null;
    is_active: boolean;
    subjectName: string;
    className: string | null;
    termName: string | null;
};

type Reference = { id: string; name: string };

type References = {
    subjects: Reference[];
    classes: Reference[];
    terms: Reference[];
};

type Coverage = {
    classId: string;
    className: string;
    termId: string;
    termName: string;
    subjectId: string;
    subjectName: string;
    topics: number;
    questions: number;
    validQuestions: number;
    examReady: boolean;
};

type FormState = {
    name: string;
    subjectId: string;
    classId: string;
    termId: string;
};

export function CurriculumManager() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [references, setReferences] = useState<References>({ subjects: [], classes: [], terms: [] });
    const [coverage, setCoverage] = useState<Coverage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>({ name: "", subjectId: "", classId: "", termId: "" });
    const [filters, setFilters] = useState({
        subjectId: "",
        classId: "",
        termId: "",
        isActive: "true",
    });

    const loadTopics = useCallback(async () => {
        setLoading(true);
        setError("");
        const params = new URLSearchParams();
        if (filters.subjectId) params.set("subjectId", filters.subjectId);
        if (filters.classId) params.set("classId", filters.classId);
        if (filters.termId) params.set("termId", filters.termId);
        if (filters.isActive) params.set("isActive", filters.isActive);

        const response = await fetch(`/api/admin/curriculum?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) {
            setError(data.error || "Failed to load topics.");
        } else {
            setTopics(data.topics);
            setReferences(data.references);
            setCoverage(data.coverage ?? []);
        }
        setLoading(false);
    }, [filters]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadTopics();
    }, [loadTopics]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!form.name.trim()) {
            setError("Topic name is required.");
            return;
        }

        if (!form.subjectId) {
            setError("Subject is required.");
            return;
        }
        if (!form.classId || !form.termId) {
            setError("Class and term are required.");
            return;
        }

        try {
            const url = editingId ? "/api/admin/curriculum" : "/api/admin/curriculum";
            const method = editingId ? "PUT" : "POST";
            const body = {
                ...(editingId && { id: editingId }),
                name: form.name,
                subjectId: form.subjectId,
                classId: form.classId || null,
                termId: form.termId || null,
            };

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || `Failed to ${editingId ? "update" : "create"} topic.`);
                return;
            }

            setMessage(`Topic ${editingId ? "updated" : "created"} successfully.`);
            setForm({ name: "", subjectId: "", classId: "", termId: "" });
            setEditingId(null);
            setShowForm(false);
            void loadTopics();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred.");
        }
    }

    async function handleArchive(id: string) {
        if (!confirm("Archive this topic?")) return;
        setError("");
        setMessage("");

        try {
            const response = await fetch("/api/admin/curriculum", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isActive: false }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || "Failed to archive topic.");
                return;
            }

            setMessage("Topic archived.");
            void loadTopics();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred.");
        }
    }

    async function handleRestore(id: string) {
        setError("");
        setMessage("");

        try {
            const response = await fetch("/api/admin/curriculum", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isActive: true }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || "Failed to restore topic.");
                return;
            }

            setMessage("Topic restored.");
            void loadTopics();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred.");
        }
    }

    function handleEdit(topic: Topic) {
        setEditingId(topic.id);
        setForm({
            name: topic.name,
            subjectId: topic.subject_id,
            classId: topic.class_id || "",
            termId: topic.term_id || "",
        });
        setShowForm(true);
    }

    function handleCancel() {
        setEditingId(null);
        setForm({ name: "", subjectId: "", classId: "", termId: "" });
        setShowForm(false);
    }

    const visibleCoverage = coverage.filter((item) =>
        (!filters.subjectId || item.subjectId === filters.subjectId) &&
        (!filters.classId || item.classId === filters.classId) &&
        (!filters.termId || item.termId === filters.termId)
    );

    return (
        <section className="admin-curriculum">
            <div className="admin-page-heading">
                <div>
                    <p className="eyebrow">Administration</p>
                    <h1>Curriculum Manager</h1>
                </div>
                <button className="button button-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Cancel" : "+ Add Topic"}
                </button>
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}
            {message && <p className="form-success" role="status">{message}</p>}

            {showForm && (
                <form onSubmit={handleSubmit} className="admin-form">
                    <h2>{editingId ? "Edit Topic" : "Create Topic"}</h2>
                    <div className="form-group">
                        <label htmlFor="subject">Subject *</label>
                        <select
                            id="subject"
                            value={form.subjectId}
                            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                            required
                        >
                            <option value="">Select subject</option>
                            {references.subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="class">Class</label>
                        <select
                            id="class"
                            value={form.classId}
                            onChange={(e) => setForm({ ...form, classId: e.target.value })}
                        >
                            <option value="">Select class</option>
                            {references.classes.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="term">Term</label>
                        <select
                            id="term"
                            value={form.termId}
                            onChange={(e) => setForm({ ...form, termId: e.target.value })}
                        >
                            <option value="">Select term</option>
                            {references.terms.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="name">Topic Name *</label>
                        <input
                            id="name"
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g., The Creation, Algebra Basics"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary">
                        {editingId ? "Update Topic" : "Create Topic"}
                    </button>
                    {editingId && (
                        <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                            Cancel
                        </button>
                    )}
                </form>
            )}

            <div className="filters">
                <label>
                    Filter by Subject:
                    <select
                        value={filters.subjectId}
                        onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}
                    >
                        <option value="">All subjects</option>
                        {references.subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Filter by Class:
                    <select
                        value={filters.classId}
                        onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
                    >
                        <option value="">All classes</option>
                        {references.classes.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Filter by Term:
                    <select
                        value={filters.termId}
                        onChange={(e) => setFilters({ ...filters, termId: e.target.value })}
                    >
                        <option value="">All terms</option>
                        {references.terms.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    <input
                        type="checkbox"
                        checked={filters.isActive === "true"}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                isActive: e.target.checked ? "true" : "",
                            })
                        }
                    />
                    Active only
                </label>
            </div>

            <div className="curriculum-coverage">
                <h2>Academic coverage</h2>
                {visibleCoverage.length === 0 ? <p>No curriculum scope found.</p> : (
                    <table className="topics-table">
                        <thead><tr><th>Class</th><th>Term</th><th>Subject</th><th>Topics</th><th>Valid questions</th><th>Status</th></tr></thead>
                        <tbody>{visibleCoverage.map((item) => (
                            <tr key={`${item.classId}-${item.termId}-${item.subjectId}`}>
                                <td>{item.className}</td>
                                <td>{item.termName}</td>
                                <td>{item.subjectName}</td>
                                <td>{item.topics}</td>
                                <td>{item.validQuestions}</td>
                                <td>{item.examReady ? "Exam-ready" : item.validQuestions ? "Insufficient" : "Not populated"}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                )}
            </div>

            {loading ? (
                <p>Loading topics...</p>
            ) : topics.length === 0 ? (
                <p>No topics found.</p>
            ) : (
                <table className="topics-table">
                    <thead>
                        <tr>
                            <th>Topic</th>
                            <th>Subject</th>
                            <th>Class</th>
                            <th>Term</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topics.map((topic) => (
                            <tr key={topic.id}>
                                <td>{topic.name}</td>
                                <td>{topic.subjectName}</td>
                                <td>{topic.className || "—"}</td>
                                <td>{topic.termName || "—"}</td>
                                <td>{topic.is_active ? "Active" : "Archived"}</td>
                                <td>
                                    <button className="action-btn" onClick={() => handleEdit(topic)}>
                                        Edit
                                    </button>
                                    {topic.is_active ? (
                                        <button className="action-btn" onClick={() => void handleArchive(topic.id)}>
                                            Archive
                                        </button>
                                    ) : (
                                        <button className="action-btn" onClick={() => void handleRestore(topic.id)}>
                                            Restore
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}
