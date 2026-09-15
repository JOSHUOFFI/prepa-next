import fs from "node:fs";

const file = new URL("../data/curriculum/jss1-3.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const reason = "The NERDC document does not specify a universal school-term allocation.";
const rows = [
  ["National Values Curriculum", "JSS1", "Civic Education", "Our Values", "National Values", 2, "jss1-3_nvc.pdf"],
  ["National Values Curriculum", "JSS1", "Civic Education", "Our Values", "National Values: Honesty", 3, "jss1-3_nvc.pdf"],
  ["National Values Curriculum", "JSS1", "Civic Education", "Our Values", "National Values: Self Reliance", 4, "jss1-3_nvc.pdf"],
  ["Pre-Vocational Studies", "JSS1", "Agriculture", "Concept and Medium of Agricultural Production", "Classes and Uses of Crops", 2, "jss1-3_prevoc.pdf"],
  ["Pre-Vocational Studies", "JSS1", "Agriculture", "Concept and Medium of Agricultural Production", "Classes and Uses of Farm Animals", 3, "jss1-3_prevoc.pdf"],
  ["Pre-Vocational Studies", "JSS1", "Agriculture", "Concept and Medium of Agricultural Production", "Methods of Weed and Pests Control", 4, "jss1-3_prevoc.pdf"],
  ["Pre-Vocational Studies", "JSS1", "Agriculture", "Concept and Medium of Agricultural Production", "Factors of Agricultural Production", 5, "jss1-3_prevoc.pdf"],
  ["Pre-Vocational Studies", "JSS1", "Home Economics", "Family Living and Resource Management", "Puberty, Adolescence, Sexually Transmitted Infections (STIs), HIV/AIDS and Human Rights", 6, "jss1-3_prevoc.pdf"],
  ["Pre-Vocational Studies", "JSS1", "Home Economics", "Family Living and Resource Management", "Family Needs, Goals and Standards", 7, "jss1-3_prevoc.pdf"],
];
const urls = {
  "jss1-3_nvc.pdf": "https://www.nerdc.gov.ng/content_manager/jss/jss1-3_nvc.pdf",
  "jss1-3_prevoc.pdf": "https://www.nerdc.gov.ng/content_manager/jss/jss1-3_prevoc.pdf",
};
const key = (value) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

for (const [subjectName, classCode, themeName, subThemeName, topicName, sourcePage, document] of rows) {
  const classEntry = data.verifiedHierarchy.find((entry) => entry.classCode === classCode);
  let subject = classEntry.subjects.find((entry) => entry.subjectName === subjectName);
  if (!subject) {
    subject = { subjectCode: subjectName === "National Values Curriculum" ? "NVC" : "PREVOC", subjectName, sourceStatus: "verified", sourceDocument: document, sourceUrl: urls[document], themes: [] };
    classEntry.subjects.push(subject);
  }
  let theme = subject.themes.find((entry) => key(entry.name) === key(themeName));
  if (!theme) { theme = { name: themeName, sourceStatus: "verified", sourcePages: [sourcePage], subThemes: [] }; subject.themes.push(theme); }
  else if (!theme.sourcePages.includes(sourcePage)) theme.sourcePages.push(sourcePage);
  let subTheme = theme.subThemes.find((entry) => key(entry.name) === key(subThemeName));
  if (!subTheme) { subTheme = { name: subThemeName, sourceStatus: "verified", sourcePages: [sourcePage], topics: [] }; theme.subThemes.push(subTheme); }
  else if (!subTheme.sourcePages.includes(sourcePage)) subTheme.sourcePages.push(sourcePage);
  if (!subTheme.topics.some((entry) => key(entry.name) === key(topicName))) subTheme.topics.push({ name: topicName, sourceStatus: "verified", sourceDocument: document, sourceUrl: urls[document], sourcePages: [sourcePage], objectives: [], objectivesStatus: "review_required", termAllocation: { term: null, type: "unassigned", reason } });
}

for (const document of Object.keys(urls)) {
  const extraction = data.documentExtraction.find((entry) => entry.document === document);
  const pages = rows.filter((row) => row[6] === document).map((row) => row[5]);
  extraction.status = "partially_extracted";
  extraction.verifiedPages = [...new Set(pages)].sort((a, b) => a - b);
  extraction.verifiedHierarchy = ["class", "theme", "sub-theme", "topic"];
  extraction.affectedHierarchy = ["objectives", "remaining pages"];
  extraction.reason = "Rendered PDF and layout review verified only the listed JSS1 hierarchy rows; objective cells and remaining pages remain unresolved.";
}
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
