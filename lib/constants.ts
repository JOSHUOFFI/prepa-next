import type { Class, Subject, Term } from "@/types";

export const classes: Class[] = [
  { value: "JSS1", label: "JSS 1" },
  { value: "JSS2", label: "JSS 2" },
  { value: "JSS3", label: "JSS 3" },
  { value: "SS1", label: "SS 1" },
  { value: "SS2", label: "SS 2" }
];

export const terms: Term[] = ["First Term", "Second Term", "Third Term"];

export const subjectGroups = [
  { name: "Core Subjects", subjects: ["Mathematics", "English", "Civic Education"] },
  { name: "Junior Secondary", subjects: ["Basic Science", "Basic Technology", "Social Studies", "Business Studies"] },
  { name: "Science", subjects: ["Biology", "Chemistry", "Physics", "Agricultural Science"] },
  { name: "Arts and Humanities", subjects: ["CRS", "Government", "Literature", "History"] },
  { name: "Commercial", subjects: ["Economics", "Commerce", "Accounting"] }
];

export const subjects: Subject[] = subjectGroups.flatMap(group =>
  group.subjects.map(name => ({ name, group: group.name, hasQuestions: false, questionCount: 0 }))
);
