"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/state";

export type CatalogueSubject = {
    catalogue_key: string;
    display_name: string;
    category: string;
    education_level?: "jss" | "sss" | null;
    subject_field?: string | null;
    production_subject_id: string | null;
    availability_status: string;
    selection_group: string | null;
    selection_rule: string;
    sort_order: number;
    is_active: boolean;
};

const categoryLabels: Record<string, string> = {
    core_academic: "Core academic",
    nigerian_language: "Nigerian languages",
    religion: "Religion",
    optional_language: "Optional languages",
    trade_vocational: "Trade & vocational",
};

const sectionLabels: Record<string, string> = {
    core_general: "Core / General",
    religion: "Religion",
    language: "Languages",
    trade_vocational: "Trade / Vocational",
    core_compulsory: "Core & Compulsory",
    science: "Science",
    arts_humanities: "Arts",
    commercial_business: "Commercial",
};

const sortSubjects = (subjects: CatalogueSubject[]) => [...subjects].sort((a, b) => a.display_name.localeCompare(b.display_name, undefined, { sensitivity: "base" }));

const groupSubjectsByField = (subjects: CatalogueSubject[], fieldOrder: string[]) =>
    fieldOrder
        .map(field => ({
            field,
            label: sectionLabels[field] ?? field,
            subjects: sortSubjects(subjects.filter(subject => subject.subject_field === field)),
        }))
        .filter(section => section.subjects.length > 0);

function SubjectCard({
    subject,
    selected,
    onSelect,
}: {
    subject: CatalogueSubject;
    selected: boolean;
    onSelect: (subjectId: string | null) => void;
}) {
    const available = Boolean(subject.production_subject_id);

    return (
        <button
            type="button"
            className={`catalogue-card${available ? " catalogue-card--available" : ""}${selected ? " catalogue-card--selected" : ""}`}
            disabled={!available}
            aria-pressed={selected}
            aria-label={available ? `${subject.display_name}${selected ? ", selected" : ""}` : `${subject.display_name}, coming soon`}
            onClick={() => available && onSelect(subject.production_subject_id)}
        >
            <div className="catalogue-card__topline">
                <span className={`catalogue-card__icon catalogue-card__icon--${subject.category}`} aria-hidden="true">
                    {subject.display_name.slice(0, 1)}
                </span>
                <Badge tone={available ? "success" : "neutral"}>{available ? "Available" : "Coming soon"}</Badge>
            </div>
            <div className="catalogue-card__body">
                <p className="catalogue-card__category">{categoryLabels[subject.category] ?? "Subject"}</p>
                <h3>{subject.display_name}</h3>
                <p>{available ? "Ready for a subject-only practice exam." : "This subject is being prepared for PrePa."}</p>
            </div>
            <span className={`catalogue-card__action${available ? "" : " catalogue-card__action--muted"}`}>
                {available ? "Select" : "Coming soon"}
                {available ? <span aria-hidden="true">-&gt;</span> : null}
            </span>
        </button>
    );
}

export function CataloguePicker({
    subjects,
    availableCount,
}: {
    subjects: CatalogueSubject[];
    availableCount: number;
}) {
    const router = useRouter();
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

    const juniorSections = useMemo(
        () => groupSubjectsByField(subjects.filter(subject => subject.education_level === "jss"), ["core_general", "religion", "language", "trade_vocational"]),
        [subjects],
    );
    const seniorSections = useMemo(
        () => groupSubjectsByField(subjects.filter(subject => subject.education_level === "sss"), ["core_compulsory", "science", "arts_humanities", "commercial_business", "trade_vocational"]),
        [subjects],
    );
    const languageRule = subjects.some(subject => subject.selection_group === "nigerian_language" && subject.selection_rule === "exactly_one");
    const religionRule = subjects.some(subject => subject.selection_group === "religion" && subject.selection_rule === "applicable_option");
    const selectedSubject = subjects.find(subject => subject.production_subject_id === selectedSubjectId) ?? null;

    return (
        <main className="catalogue-page">
            <header className="catalogue-hero">
                <div>
                    <p className="eyebrow">JSS 1–3 / SS 1–3</p>
                    <h1>Choose your subject</h1>
                    <p>Start with the level you are in, then choose the right subject field before continuing.</p>
                </div>
                <div className="catalogue-hero__summary" aria-label={`${availableCount} of ${subjects.length} subjects available`}>
                    <strong>{availableCount}<span>/{subjects.length}</span></strong>
                    <small>ready to practise</small>
                </div>
            </header>

            {languageRule || religionRule ? (
                <aside className="catalogue-rules" aria-label="Subject selection notes">
                    {languageRule ? <div><span className="catalogue-rules__mark" aria-hidden="true">1</span><p><strong>Nigerian languages</strong><span>Choose one language: Hausa, Igbo, or Yoruba.</span></p></div> : null}
                    {religionRule ? <div><span className="catalogue-rules__mark" aria-hidden="true">+</span><p><strong>Religion</strong><span>Choose the applicable religious option.</span></p></div> : null}
                </aside>
            ) : null}

            {subjects.length === 0 ? (
                <section className="catalogue-empty"><h2>No subjects available</h2><p>We are preparing the subject catalogue. Please check back soon.</p></section>
            ) : (
                <div className="catalogue-tiered-layout">
                    {juniorSections.length > 0 ? (
                        <section className="catalogue-tier" aria-labelledby="junior-heading">
                            <h2 id="junior-heading" className="catalogue-tier__heading catalogue-tier__heading--junior">Junior Secondary</h2>
                            <div className="catalogue-tier__senior-groups">
                                {juniorSections.map(section => (
                                    <div className="catalogue-tier__subsection" key={section.field}>
                                        <h3 className="catalogue-tier__subheading">{section.label}</h3>
                                        <div className="catalogue-grid">
                                            {section.subjects.map(subject => (
                                                <SubjectCard
                                                    key={subject.catalogue_key}
                                                    subject={subject}
                                                    selected={subject.production_subject_id === selectedSubjectId}
                                                    onSelect={setSelectedSubjectId}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {seniorSections.length > 0 ? (
                        <section className="catalogue-tier" aria-labelledby="senior-heading">
                            <h2 id="senior-heading" className="catalogue-tier__heading catalogue-tier__heading--senior">Senior Secondary</h2>
                            <div className="catalogue-tier__senior-groups">
                                {seniorSections.map(section => (
                                    <div className="catalogue-tier__subsection" key={section.field}>
                                        <h3 className="catalogue-tier__subheading">{section.label}</h3>
                                        <div className="catalogue-grid">
                                            {section.subjects.map(subject => (
                                                <SubjectCard
                                                    key={subject.catalogue_key}
                                                    subject={subject}
                                                    selected={subject.production_subject_id === selectedSubjectId}
                                                    onSelect={setSelectedSubjectId}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    <div className="catalogue-picker-toolbar">
                        <div className="catalogue-picker-summary">
                            <span className="catalogue-picker-summary__label">Selected</span>
                            <strong>{selectedSubject ? selectedSubject.display_name : "No subject selected"}</strong>
                        </div>
                        <button
                            type="button"
                            className="catalogue-picker__continue"
                            disabled={!selectedSubject}
                            onClick={() => selectedSubject && router.push(`/exam?subjectId=${encodeURIComponent(selectedSubject.production_subject_id!)}`)}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
