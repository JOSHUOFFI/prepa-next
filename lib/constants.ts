import type { Class, Subject, Term } from "@/types";

export const classes: Class[] = [
  { value: "JSS1", label: "JSS 1" },
  { value: "JSS2", label: "JSS 2" },
  { value: "JSS3", label: "JSS 3" },
  { value: "SS1", label: "SS 1" },
  { value: "SS2", label: "SS 2" },
];

export const terms: Term[] = ["First Term", "Second Term", "Third Term"];

export const subjectGroups = [
  {
    name: "Junior Secondary • Core / General",
    subjects: [
      "Mathematics",
      "English",
      "English Studies",
      "Intermediate Science",
      "Physical & Health Education",
      "Nigerian History",
      "Social & Citizenship Studies",
      "Cultural & Creative Arts",
      "Business Studies",
    ],
  },
  {
    name: "Junior Secondary • Religion",
    subjects: ["Christian Religious Studies", "CRS", "Islamic Studies"],
  },
  {
    name: "Junior Secondary • Languages",
    subjects: ["Hausa", "Igbo", "Yoruba", "French", "Arabic Language"],
  },
  {
    name: "Junior Secondary • Trade / Vocational",
    subjects: [
      "Solar Photovoltaic Installation & Maintenance",
      "Fashion Design & Garment Making",
      "Livestock Farming",
      "Beauty & Cosmetology",
      "Computer Hardware & GSM Repairs",
      "Horticulture & Crop Production",
    ],
  },
  {
    name: "Senior Secondary • Core & Compulsory",
    subjects: [
      "English Language",
      "General Mathematics",
      "Citizenship & Heritage Studies",
      "Digital Technologies",
      "Trade Subject",
      "English",
      "Mathematics",
    ],
  },
  {
    name: "Senior Secondary • Science",
    subjects: [
      "Biology",
      "Chemistry",
      "Physics",
      "Agricultural Science",
      "Further Mathematics",
      "Geography",
      "Technical Drawing",
      "Physical Education",
      "Health Education",
      "Foods & Nutrition",
    ],
  },
  {
    name: "Senior Secondary • Arts",
    subjects: [
      "Government",
      "Nigerian History",
      "Literature in English",
      "Christian Religious Studies",
      "CRS",
      "Islamic Studies",
      "Hausa",
      "Igbo",
      "Yoruba",
      "French",
      "Arabic",
      "Visual Arts",
      "Music",
      "Home Management",
      "Catering Craft",
    ],
  },
  {
    name: "Senior Secondary • Commercial",
    subjects: ["Accounting", "Commerce", "Economics", "Marketing"],
  },
  {
    name: "Senior Secondary • Trade / Vocational",
    subjects: [
      "Solar Photovoltaic Installation & Maintenance",
      "Fashion Design & Garment Making",
      "Livestock Farming",
      "Beauty & Cosmetology",
      "Computer Hardware & GSM Repairs",
      "Horticulture & Crop Production",
    ],
  },
];

export const subjects: Subject[] = subjectGroups.flatMap((group) =>
  group.subjects.map((name) => ({
    name,
    group: group.name,
    hasQuestions: false,
    questionCount: 0,
  })),
);
