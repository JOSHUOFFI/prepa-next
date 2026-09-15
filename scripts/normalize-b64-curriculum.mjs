import crypto from "node:crypto";
import fs from "node:fs";

const filePath = new URL("../data/curriculum/jss1-3.json", import.meta.url);
const dataset = JSON.parse(fs.readFileSync(filePath, "utf8"));

const normalized = (value) => value.trim().replace(/\s+/g, " ");
const stableId = (prefix, parts) => {
  const value = parts.map(normalized).join("\u001f");
  return `${prefix}_${crypto.createHash("sha256").update(value).digest("hex").slice(0, 16)}`;
};

for (const classEntry of dataset.verifiedHierarchy) {
  classEntry.classCode = normalized(classEntry.classCode);
  classEntry.id = stableId("class", [classEntry.classCode]);

  for (const subject of classEntry.subjects) {
    subject.subjectCode = normalized(subject.subjectCode).toUpperCase();
    subject.subjectName = normalized(subject.subjectName);
    subject.id = stableId("subject", [classEntry.classCode, subject.subjectCode]);

    for (const theme of subject.themes) {
      theme.name = normalized(theme.name);
      theme.id = stableId("theme", [classEntry.classCode, subject.subjectCode, theme.name]);

      for (const subTheme of theme.subThemes) {
        subTheme.name = normalized(subTheme.name);
        subTheme.id = stableId("subtheme", [theme.id, subTheme.name]);

        for (const topic of subTheme.topics) {
          topic.name = normalized(topic.name);
          topic.id = stableId("topic", [subTheme.id, topic.name]);
          topic.objectiveSetId = stableId("objectives", [topic.id]);
        }
      }
    }
  }
}

dataset.schemaVersion = 2;
dataset.normalization = {
  stage: "B6.4",
  hierarchy: "subject > class > theme > sub-theme > topic > objective set",
  idStrategy: "stable SHA-256-derived IDs from canonical hierarchy identifiers and source text",
  objectiveStatuses: ["verified", "review_required"],
  termState: "unassigned",
};

fs.writeFileSync(filePath, `${JSON.stringify(dataset, null, 2)}\n`);
