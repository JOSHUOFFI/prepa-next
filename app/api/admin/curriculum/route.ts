import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdminApi } from "@/lib/supabase/admin-auth";
import { normalizeTopic } from "@/services/topic-management";

type TopicRow = {
  id: string;
  name: string;
  subject_id: string;
  class_id: string | null;
  term_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  question_count?: number;
};

type Reference = { id: string; name: string };

async function getReferences(admin: SupabaseClient) {
  const [{ data: subjects }, { data: classes }, { data: terms }] =
    await Promise.all([
      admin.from("subjects").select("id, name").eq("is_active", true),
      admin.from("classes").select("id, name"),
      admin.from("terms").select("id, name"),
    ]);
  return {
    subjects: (subjects ?? []) as Reference[],
    classes: (classes ?? []) as Reference[],
    terms: (terms ?? []) as Reference[],
  };
}

export async function GET(request: Request) {
  const access = await requireAdminApi();
  if (!access)
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );

  try {
    const url = new URL(request.url);
    const subjectId = url.searchParams.get("subjectId");
    const classId = url.searchParams.get("classId");
    const termId = url.searchParams.get("termId");
    const isActive = url.searchParams.get("isActive");

    let query = access.admin
      .from("topics")
      .select(
        "id, name, subject_id, class_id, term_id, is_active, created_at, updated_at",
      );

    if (subjectId) query = query.eq("subject_id", subjectId);
    if (classId) query = query.eq("class_id", classId);
    if (termId) query = query.eq("term_id", termId);
    if (isActive !== null) query = query.eq("is_active", isActive === "true");

    const { data: topics, error } = await query;

    if (error) throw error;

    const references = await getReferences(access.admin);

    type TopicData = TopicRow & {
      class_id?: string | null;
      term_id?: string | null;
    };

    const enriched = (topics ?? []).map((topic: TopicData) => ({
      ...topic,
      subjectName:
        references.subjects.find((s) => s.id === topic.subject_id)?.name ??
        "Unknown",
      className: topic.class_id
        ? (references.classes.find((c) => c.id === topic.class_id)?.name ??
          null)
        : null,
      termName: topic.term_id
        ? (references.terms.find((t) => t.id === topic.term_id)?.name ?? null)
        : null,
    }));

    return NextResponse.json({
      topics: enriched,
      references,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to fetch topics.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const access = await requireAdminApi();
  if (!access)
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );

  try {
    const body = await request.json();
    const { name, subjectId, classId, termId } = body;

    if (!name || !name.trim())
      return NextResponse.json(
        { error: "Topic name is required." },
        { status: 400 },
      );

    if (!subjectId)
      return NextResponse.json(
        { error: "Subject is required." },
        { status: 400 },
      );

    const normalizedName = normalizeTopic(name);

    // Get subject name for error context
    const { data: subject } = await access.admin
      .from("subjects")
      .select("name")
      .eq("id", subjectId)
      .single();

    // Safely check for duplicates using the normalized index
    const { data: existing } = await access.admin
      .from("topics")
      .select("id, name, class_id, term_id")
      .eq("subject_id", subjectId)
      .maybeSingle();

    if (
      existing &&
      normalizeTopic(existing.name) === normalizedName &&
      (existing.class_id ?? null) === (classId || null) &&
      (existing.term_id ?? null) === (termId || null)
    ) {
      const classRef =
        classId || termId
          ? ` → ${classId ? classId : ""}${classId && termId ? " → " : ""}${termId || ""}`
          : "";
      return NextResponse.json(
        {
          error: `Topic "${name}" already exists for ${subject?.name}${classRef}.`,
        },
        { status: 409 },
      );
    }

    const { data: topic, error } = await access.admin
      .from("topics")
      .insert({
        name: name.trim(),
        subject_id: subjectId,
        class_id: classId || null,
        term_id: termId || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: `Topic "${name}" already exists for this subject.` },
          { status: 409 },
        );
      }
      throw error;
    }

    return NextResponse.json({ topic }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create topic.",
      },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const access = await requireAdminApi();
  if (!access)
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );

  try {
    const body = await request.json();
    const { id, name, isActive } = body;

    if (!id)
      return NextResponse.json(
        { error: "Topic ID is required." },
        { status: 400 },
      );

    if (name && !name.trim())
      return NextResponse.json(
        { error: "Topic name cannot be empty." },
        { status: 400 },
      );

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (isActive !== undefined) updates.is_active = isActive;
    updates.updated_at = new Date().toISOString();

    const { data: topic, error } = await access.admin
      .from("topics")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A topic with this name already exists for this subject." },
          { status: 409 },
        );
      }
      throw error;
    }

    if (!topic)
      return NextResponse.json({ error: "Topic not found." }, { status: 404 });

    return NextResponse.json({ topic });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update topic.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const access = await requireAdminApi();
  if (!access)
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id)
      return NextResponse.json(
        { error: "Topic ID is required." },
        { status: 400 },
      );

    // Check if topic is in use
    const { count: questionCount } = await access.admin
      .from("questions")
      .select("id", { count: "exact" })
      .eq("topic_id", id);

    if ((questionCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete topic that is in use. Archive it instead or delete associated questions first.",
        },
        { status: 409 },
      );
    }

    const { error } = await access.admin.from("topics").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to delete topic.",
      },
      { status: 400 },
    );
  }
}
