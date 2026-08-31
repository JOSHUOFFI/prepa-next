import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdminApi } from "@/lib/supabase/admin-auth";

export async function GET() {
  const access = await requireAdminApi();
  if (!access)
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  const rows = [
    [
      "question",
      "option_a",
      "option_b",
      "option_c",
      "option_d",
      "option_e",
      "option_f",
      "correct_option",
      "subject",
      "class",
      "term",
      "topic",
      "difficulty",
      "question_type",
      "points",
      "explanation",
    ],
    [
      "What is 2 + 2?",
      "3",
      "4",
      "5",
      "6",
      "",
      "",
      "B",
      "Mathematics",
      "JSS1",
      "First Term",
      "Number System",
      "easy",
      "multiple_choice",
      1,
      "The sum of two and two is four.",
    ],
    [
      "The Earth is round.",
      "True",
      "False",
      "",
      "",
      "",
      "",
      "True",
      "Basic Science",
      "JSS1",
      "First Term",
      "Our World",
      "easy",
      "true_false",
      1,
      "",
    ],
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(rows),
    "Questions",
  );
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        "attachment; filename=prepa-question-template.xlsx",
    },
  });
}
