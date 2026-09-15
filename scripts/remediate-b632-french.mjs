import fs from "node:fs";

const file = new URL("../data/curriculum/jss1-3.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const document = "jss1-3_french.pdf";
const sourceUrl = "https://www.nerdc.gov.ng/content_manager/jss/jss1-3_french.pdf";
const reason = "The NERDC document does not specify a universal school-term allocation.";

const rows = [
  ["JSS1", "Identité/Identification", "Traits physiques", "Parler des caractéristiques personnelles", 1],
  ["JSS1", "Environnement immédiat", "Le temps et la vie rurale", "Décrire la vie rurale", 2],
  ["JSS1", "Activités humaines", "Récréation", "Parler de ce que l’on fait pour se distraire", 3],
  ["JSS1", "Activités humaines", "Récréation", "Parler des voyages", 3],
  ["JSS1", "Activités humaines", "Les achats", "Acheter et vendre", 4],
  ["JSS2", "Identité/Identification", "Traits moraux", "Parler du caractère des gens", 5],
  ["JSS2", "Identité/Identification", "Traits moraux", "Exprimer les attitudes (jugements/appréciations)", 5],
  ["JSS2", "Environnement immédiat", "La ville et le village", "Dégager les caractéristiques de la vie rurale", 6],
  ["JSS2", "Environnement immédiat", "La ville et le village", "Dégager les caractéristiques de la vie urbaine", 6],
  ["JSS2", "Environnement immédiat", "La ville et le village", "Parler des ressemblances et différences", 6],
  ["JSS2", "Environnement immédiat", "Les fêtes dans la communauté", "Décrire les fêtes de la communauté", 7],
  ["JSS2", "Environnement immédiat", "Le bien-être dans la communauté", "Identifier les choses dans la communauté", 8],
  ["JSS2", "Environnement immédiat", "Le bien-être dans la communauté", "Identifier les étrangers", 8],
  ["JSS2", "Activités humaines", "Sports", "Expliquer l’importance du sport", 9],
  ["JSS2", "Activités humaines", "Sports", "Nommer les sports principaux", 9],
  ["JSS2", "Activités humaines", "Demander poliment", "Demander poliment", 10],
  ["JSS2", "Activités humaines", "Exprimer les sentiments", "Employer les expressions: j’ai honte de…", 11],
  ["JSS3", "Identité/Identification", "Les professions et les qualités des gens", "Parler des professions variées", 12],
  ["JSS3", "Identité/Identification", "Les professions et les qualités des gens", "Décrire les qualités admirables", 12],
  ["JSS3", "Identité/Identification", "Les professions et les qualités des gens", "Parler des gens qu’on admire beaucoup", 12],
  ["JSS3", "Environnement immédiat", "La santé", "Nommer les maladies", 13],
  ["JSS3", "Environnement immédiat", "La santé", "Discuter les causes de certaines maladies", 13],
  ["JSS3", "Environnement immédiat", "La santé", "Parler des populations affectées", 13],
  ["JSS3", "Environnement immédiat", "La santé", "Dire l’importance de l’hygiène", 13],
  ["JSS3", "Environnement immédiat", "Corps médical", "Parler des professionnels de la santé", 14],
  ["JSS3", "Environnement immédiat", "Où aller ?", "Parler de la pharmacie, l’hôpital, chez le dentiste", 15],
  ["JSS3", "Activités humaines", "Activités quotidiennes", "Décrire ce qu’on fait tous les jours", 16],
  ["JSS3", "Activités humaines", "Narration", "Raconter ce qui s’est passé", 17],
  ["JSS3", "Activités humaines", "Correspondance", "Écrire une lettre d’amitié", 18],
  ["JSS3", "Activités humaines", "Correspondance", "Téléphoner", 18],
];

function normalize(value) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

for (const [classCode, themeName, subThemeName, topicName, sourcePage] of rows) {
  const classEntry = data.verifiedHierarchy.find((entry) => entry.classCode === classCode);
  let subject = classEntry.subjects.find((entry) => entry.subjectName === "French");
  if (!subject) {
    subject = { subjectCode: "FRENCH", subjectName: "French", sourceStatus: "verified", sourceDocument: document, sourceUrl, themes: [] };
    classEntry.subjects.push(subject);
  }
  let theme = subject.themes.find((entry) => normalize(entry.name) === normalize(themeName));
  if (!theme) {
    theme = { name: themeName, sourceStatus: "verified", sourcePages: [sourcePage], subThemes: [] };
    subject.themes.push(theme);
  } else if (!theme.sourcePages.includes(sourcePage)) theme.sourcePages.push(sourcePage);
  let subTheme = theme.subThemes.find((entry) => normalize(entry.name) === normalize(subThemeName));
  if (!subTheme) {
    subTheme = { name: subThemeName, sourceStatus: "verified", sourcePages: [sourcePage], topics: [] };
    theme.subThemes.push(subTheme);
  } else if (!subTheme.sourcePages.includes(sourcePage)) subTheme.sourcePages.push(sourcePage);
  if (subTheme.topics.some((entry) => normalize(entry.name) === normalize(topicName))) continue;
  subTheme.topics.push({
    name: topicName,
    sourceStatus: "verified",
    sourceDocument: document,
    sourceUrl,
    sourcePages: [sourcePage],
    objectives: [],
    objectivesStatus: "review_required",
    termAllocation: { term: null, type: "unassigned", reason },
  });
}

for (const classEntry of data.verifiedHierarchy) {
  for (const subject of classEntry.subjects) {
    for (const theme of subject.themes) {
      theme.sourcePages.sort((a, b) => a - b);
      for (const subTheme of theme.subThemes) subTheme.sourcePages.sort((a, b) => a - b);
    }
  }
}

const extraction = data.documentExtraction.find((entry) => entry.document === document);
extraction.verifiedPages = Array.from({ length: 18 }, (_, index) => index + 1);
extraction.verifiedHierarchy = ["class", "theme", "sub-theme", "topic"];
extraction.affectedHierarchy = ["objectives", "pages 19-20"]; 
extraction.reason = "Rendered PDF review verified class, theme, sub-theme and topic cells on pages 1-18. Objective transcription and the remaining pages require separate review.";

fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
