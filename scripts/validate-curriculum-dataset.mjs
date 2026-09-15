import fs from "node:fs";

const filePath = new URL("../data/curriculum/jss1-3.json", import.meta.url);
const dataset = JSON.parse(fs.readFileSync(filePath, "utf8"));
const failures = [];
const expectedClasses = ["JSS1", "JSS2", "JSS3"];
const expectedTerms = ["First Term", "Second Term", "Third Term"];
const extractionStatuses = new Set([
  "verified",
  "partially_extracted",
  "manual_review_required",
]);
const verificationStatuses = new Set(["verified", "review_required"]);
const objectiveStatuses = new Set(["verified", "review_required"]);
const termAllocationTypes = new Set([
  "source",
  "implementation",
  "review_required",
  "unassigned",
]);
const idPattern = /^(class|subject|theme|subtheme|topic|objectives)_[a-f0-9]{16}$/;
const hierarchyIds = new Set();
const hierarchyRecords = new Set();
const registerId = (id, label) => {
  if (hierarchyIds.has(id)) failures.push(`Duplicate hierarchy ID: ${label}`);
  hierarchyIds.add(id);
};

if (JSON.stringify(dataset.classes) !== JSON.stringify(expectedClasses))
  failures.push("Classes must be JSS1, JSS2 and JSS3 in order.");
if (JSON.stringify(dataset.terms) !== JSON.stringify(expectedTerms))
  failures.push("Terms must contain First, Second and Third Term in order.");
if (!Array.isArray(dataset.subjects) || dataset.subjects.length === 0)
  failures.push("At least one curriculum subject is required.");
if (
  !Array.isArray(dataset.documentExtraction) ||
  dataset.documentExtraction.length === 0
)
  failures.push("Document extraction provenance is required.");
for (const document of dataset.documentExtraction ?? []) {
  if (!document.document || !extractionStatuses.has(document.status))
    failures.push(
      `Invalid extraction status for ${document.document ?? "unnamed document"}.`,
    );
  if (
    !Array.isArray(document.affectedHierarchy) ||
    document.affectedHierarchy.length === 0
  )
    failures.push(
      `Missing affected hierarchy for ${document.document ?? "unnamed document"}.`,
    );
}

const subjectNames = new Set();
for (const subject of dataset.subjects ?? []) {
  if (!subject.name?.trim()) failures.push("Subject names cannot be empty.");
  if (!/^https:\/\//.test(subject.sourceDocument ?? ""))
    failures.push(
      `Missing source document URL: ${subject.name ?? "unnamed subject"}`,
    );
  const normalizedSubject = subject.name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  if (subjectNames.has(normalizedSubject))
    failures.push(`Duplicate subject: ${subject.name}`);
  subjectNames.add(normalizedSubject);

  for (const className of expectedClasses) {
    const classData = subject.classes?.[className];
    if (!classData) continue;
    for (const term of expectedTerms) {
      for (const topic of classData[term]?.topics ?? []) {
        if (!topic.name?.trim())
          failures.push(`${subject.name}/${className}/${term}: empty topic.`);
        if (!topic.sourceReference)
          failures.push(
            `${subject.name}/${className}/${term}/${topic.name}: missing source reference.`,
          );
        if (
          !["source", "implementation", "review_required"].includes(
            topic.termAllocationType,
          )
        )
          failures.push(
            `${subject.name}/${className}/${term}/${topic.name}: invalid term allocation type.`,
          );
      }
    }
  }
}

const hierarchyClasses = new Set();
for (const classEntry of dataset.verifiedHierarchy ?? []) {
  if (!idPattern.test(classEntry.id ?? ""))
    failures.push(`Invalid class ID: ${classEntry.classCode}`);
  else registerId(classEntry.id, classEntry.classCode);
  if (!expectedClasses.includes(classEntry.classCode))
    failures.push(`Invalid hierarchy class: ${classEntry.classCode}`);
  if (hierarchyClasses.has(classEntry.classCode))
    failures.push(`Duplicate hierarchy class: ${classEntry.classCode}`);
  hierarchyClasses.add(classEntry.classCode);
  const subjectNamesInClass = new Set();
  for (const subject of classEntry.subjects ?? []) {
    if (!idPattern.test(subject.id ?? ""))
      failures.push(`Invalid subject ID: ${classEntry.classCode}/${subject.subjectName}`);
    else registerId(subject.id, subject.subjectName);
    if (!subject.subjectName?.trim())
      failures.push("Hierarchy subject name cannot be empty.");
    const subjectKey = subject.subjectName.trim().toLowerCase();
    if (subjectNamesInClass.has(subjectKey))
      failures.push(
        `Duplicate hierarchy subject: ${classEntry.classCode}/${subject.subjectName}`,
      );
    subjectNamesInClass.add(subjectKey);
    for (const theme of subject.themes ?? []) {
      if (!idPattern.test(theme.id ?? ""))
        failures.push(`Invalid theme ID: ${theme.name}`);
      else registerId(theme.id, theme.name);
      if (!theme.name?.trim() || !theme.sourceStatus)
        failures.push(
          `Malformed theme: ${classEntry.classCode}/${subject.subjectName}`,
        );
      const themeTopics = new Set();
      for (const subTheme of theme.subThemes ?? []) {
        if (!idPattern.test(subTheme.id ?? ""))
          failures.push(`Invalid sub-theme ID: ${subTheme.name}`);
        else registerId(subTheme.id, subTheme.name);
        if (!subTheme.name?.trim() || !subTheme.sourceStatus)
          failures.push(`Malformed sub-theme: ${theme.name}`);
        for (const topic of subTheme.topics ?? []) {
          if (!idPattern.test(topic.id ?? ""))
            failures.push(`Invalid topic ID: ${topic.name}`);
          else registerId(topic.id, topic.name);
          if (!idPattern.test(topic.objectiveSetId ?? ""))
            failures.push(`Invalid objective-set ID: ${topic.name}`);
          else registerId(topic.objectiveSetId, `${topic.name} objectives`);
          if (!topic.name?.trim())
            failures.push(`Empty topic under ${theme.name}/${subTheme.name}`);
          if (!verificationStatuses.has(topic.sourceStatus))
            failures.push(`Invalid topic verification status: ${topic.name}`);
          if (
            topic.sourceStatus === "verified" &&
            (!topic.sourceDocument ||
              !topic.sourceUrl ||
              !topic.sourcePages?.length)
          )
            failures.push(`Verified topic lacks provenance: ${topic.name}`);
          if (!objectiveStatuses.has(topic.objectivesStatus))
            failures.push(`Invalid objective status: ${topic.name}`);
          if (!Array.isArray(topic.objectives))
            failures.push(`Objectives must be an array: ${topic.name}`);
          if (
            topic.objectivesStatus === "verified" &&
            topic.objectives.length === 0
          )
            failures.push(`Verified objectives cannot be empty: ${topic.name}`);
          const allocation = topic.termAllocation;
          if (!allocation || !termAllocationTypes.has(allocation.type))
            failures.push(`Invalid term allocation: ${topic.name}`);
          if (allocation?.type === "source" && !allocation.term)
            failures.push(`Source allocation has no term: ${topic.name}`);
          if (allocation?.type === "unassigned" && allocation.term !== null)
            failures.push(
              `Unassigned topic must not have a term: ${topic.name}`,
            );
          if (
            ["source", "implementation"].includes(allocation?.type) &&
            !expectedTerms.includes(allocation.term)
          )
            failures.push(`Assigned topic has an invalid term: ${topic.name}`);
          const topicKey = topic.name.trim().replace(/\s+/g, " ").toLowerCase();
          if (themeTopics.has(topicKey))
            failures.push(`Duplicate topic in hierarchy: ${topic.name}`);
          themeTopics.add(topicKey);
          const hierarchyKey = [
            classEntry.classCode,
            subject.subjectCode,
            theme.name,
            subTheme.name,
            topic.name,
          ].map((value) => value.trim().replace(/\s+/g, " ").toLowerCase()).join("\u001f");
          if (hierarchyRecords.has(hierarchyKey))
            failures.push(`Duplicate curriculum record: ${topic.name}`);
          hierarchyRecords.add(hierarchyKey);
        }
      }
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify({
      classes: dataset.classes.length,
      terms: dataset.terms.length,
      subjects: dataset.subjects.length,
      status: dataset.status,
      readyForImport: dataset.qualityGate?.readyForImport ?? false,
    }),
  );
}
