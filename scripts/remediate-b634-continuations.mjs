import fs from "node:fs";
const file = new URL("../data/curriculum/jss1-3.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const reason = "The NERDC document does not specify a universal school-term allocation.";
const configs = {
  "National Values Curriculum": { code: "NVC", document: "jss1-3_nvc.pdf", url: "https://www.nerdc.gov.ng/content_manager/jss/jss1-3_nvc.pdf" },
  "Pre-Vocational Studies": { code: "PREVOC", document: "jss1-3_prevoc.pdf", url: "https://www.nerdc.gov.ng/content_manager/jss/jss1-3_prevoc.pdf" },
};
const rows = [
  ["National Values Curriculum", "JSS1", "Social Studies Education", "Fundamentals of Social Studies Education", "History of Nigerian Social Studies Education", 8, ["Explain the development of Social Studies Education in Nigeria."]],
  ["National Values Curriculum", "JSS1", "Social Studies Education", "Family as the Basic Unit of Society", "Family as a Primary Social Group", 9, ["Give a simple definition of a primary social group."]],
  ["National Values Curriculum", "JSS1", "Social Studies Education", "Family as the Basic Unit of Society", "The Consequences of Large/Small Family Size", 10, ["Describe the characteristics of large and small family sizes."]],
  ["National Values Curriculum", "JSS1", "Social Studies Education", "Culture and Social Values", "Meaning and Characteristics of Culture", 11, ["Define culture."]],
  ["National Values Curriculum", "JSS1", "Social Studies Education", "Culture and Social Values", "Similarities and Differences among Cultures", 12, ["Identify cultural similarities in Nigeria."]],
  ["National Values Curriculum", "JSS1", "Social Studies Education", "Culture and Social Values", "Agents and Processes of Socialization", 13, ["Define socialization."]],
  ["National Values Curriculum", "JSS1", "Social Studies Education", "Culture and Social Values", "Road Safety Club as an Agent of Socialization", 14, ["Describe the structure and process of forming Road Safety Club in schools."]],
  ["National Values Curriculum", "JSS1", "Social Studies", "Social and Health Issues", "Common Social Problems in Nigeria", 15, ["Identify social problems in Nigeria."]],
  ["National Values Curriculum", "JSS1", "Social Studies", "Social and Health Issues", "Ways of Solving Common Social Problems in Nigeria", 16, ["Explain the effects of social issues and problems in Nigeria."]],
  ["National Values Curriculum", "JSS1", "Social Studies", "Social and Health Issues", "Our Roles in Promoting Safety in Our Community", 17, ["Explain the need for safety."]],
  ["National Values Curriculum", "JSS1", "Security Education", "Common Crimes and Security Management 1", "Common Crimes, Causes and Effects", 18, ["Identify common crimes."]],
  ["Pre-Vocational Studies", "JSS2", "Agriculture", "Processes of Agricultural Production", "Farm Structures and Buildings", 11, ["Describe and identify various farm structures and buildings."]],
  ["Pre-Vocational Studies", "JSS2", "Agriculture", "Processes of Agricultural Production", "Crop Propagation and Cultural Practices", 12, ["Define crop propagation.", "State methods of crop propagation."]],
  ["Pre-Vocational Studies", "JSS2", "Agriculture", "Processes of Agricultural Production", "Agricultural Practices", 13, ["Describe pre-planting, planting, post-planting, harvesting and post-harvesting operations."]],
  ["Pre-Vocational Studies", "JSS2", "Agriculture", "Processes of Agricultural Production", "Animal Feeds and Feeding", 14, ["State the meaning of feeding.", "List types of feedstuffs.", "Mention feeding tools."]],
  ["Pre-Vocational Studies", "JSS2", "Agriculture", "Processes of Agricultural Production", "Animal Pests and Diseases", 14, ["List four farm animal diseases.", "State methods of transmission of farm animal diseases."]],
  ["Pre-Vocational Studies", "JSS2", "Agriculture", "Processes of Agricultural Production", "Fishery", 16, ["Define fishery.", "Classify fishes."]],
  ["Pre-Vocational Studies", "JSS2", "Agriculture", "Processes of Agricultural Production", "Forests and Forest Uses", 17, ["Describe forests."]],
];
const key = (value) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
for (const [subjectName, classCode, themeName, subThemeName, topicName, sourcePage, objectives] of rows) {
  const cfg = configs[subjectName]; const classEntry = data.verifiedHierarchy.find((entry) => entry.classCode === classCode);
  let subject = classEntry.subjects.find((entry) => entry.subjectName === subjectName);
  if (!subject) { subject = { subjectCode: cfg.code, subjectName, sourceStatus: "verified", sourceDocument: cfg.document, sourceUrl: cfg.url, themes: [] }; classEntry.subjects.push(subject); }
  let theme = subject.themes.find((entry) => key(entry.name) === key(themeName));
  if (!theme) { theme = { name: themeName, sourceStatus: "verified", sourcePages: [sourcePage], subThemes: [] }; subject.themes.push(theme); } else if (!theme.sourcePages.includes(sourcePage)) theme.sourcePages.push(sourcePage);
  let sub = theme.subThemes.find((entry) => key(entry.name) === key(subThemeName));
  if (!sub) { sub = { name: subThemeName, sourceStatus: "verified", sourcePages: [sourcePage], topics: [] }; theme.subThemes.push(sub); } else if (!sub.sourcePages.includes(sourcePage)) sub.sourcePages.push(sourcePage);
  if (!sub.topics.some((entry) => key(entry.name) === key(topicName))) sub.topics.push({ name: topicName, sourceStatus: "verified", sourceDocument: cfg.document, sourceUrl: cfg.url, sourcePages: [sourcePage], objectives, objectivesStatus: "verified", termAllocation: { term: null, type: "unassigned", reason } });
}
for (const [subjectName, cfg] of Object.entries(configs)) {
  const pages = rows.filter((row) => row[0] === subjectName).map((row) => row[5]);
  const extraction = data.documentExtraction.find((entry) => entry.document === cfg.document);
  extraction.status = "partially_extracted";
  extraction.verifiedPages = [...new Set([...(extraction.verifiedPages || []), ...pages])].sort((a,b)=>a-b);
  extraction.verifiedHierarchy = ["class", "theme", "sub-theme", "topic", "objectives"];
  extraction.affectedHierarchy = ["remaining pages"];
  extraction.reason = "Rendered continuation-page review verified the listed topic and performance-objective rows; remaining pages still require source-by-source review.";
}
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
