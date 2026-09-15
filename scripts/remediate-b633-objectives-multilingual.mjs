import fs from "node:fs";

const file = new URL("../data/curriculum/jss1-3.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const termReason = "The NERDC document does not specify a universal school-term allocation.";
const urls = {
  Hausa: "https://www.nerdc.gov.ng/content_manager/jss/jss1-3_hausa.pdf",
  Igbo: "https://www.nerdc.gov.ng/content_manager/jss/jss1-3_igbo.pdf",
};
const documents = { Hausa: "jss1-3_hausa.pdf", Igbo: "jss1-3_igbo.pdf" };
const key = (value) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

function findTopic(subjectName, classCode, topicName) {
  const classEntry = data.verifiedHierarchy.find((entry) => entry.classCode === classCode);
  for (const subject of classEntry.subjects) {
    if (subject.subjectName !== subjectName) continue;
    for (const theme of subject.themes) for (const subTheme of theme.subThemes) {
      const topic = subTheme.topics.find((entry) => key(entry.name) === key(topicName));
      if (topic) return topic;
    }
  }
  throw new Error(`Topic not found: ${classCode}/${subjectName}/${topicName}`);
}

function setObjectives(subjectName, classCode, topicName, objectives) {
  const topic = findTopic(subjectName, classCode, topicName);
  topic.objectives = objectives;
  topic.objectivesStatus = "verified";
}

function addTopic(subjectName, classCode, themeName, subThemeName, topicName, sourcePage, objectives) {
  const classEntry = data.verifiedHierarchy.find((entry) => entry.classCode === classCode);
  let subject = classEntry.subjects.find((entry) => entry.subjectName === subjectName);
  if (!subject) {
    subject = { subjectCode: subjectName.toUpperCase(), subjectName, sourceStatus: "verified", sourceDocument: documents[subjectName], sourceUrl: urls[subjectName], themes: [] };
    classEntry.subjects.push(subject);
  }
  let theme = subject.themes.find((entry) => key(entry.name) === key(themeName));
  if (!theme) { theme = { name: themeName, sourceStatus: "verified", sourcePages: [sourcePage], subThemes: [] }; subject.themes.push(theme); }
  else if (!theme.sourcePages.includes(sourcePage)) theme.sourcePages.push(sourcePage);
  let subTheme = theme.subThemes.find((entry) => key(entry.name) === key(subThemeName));
  if (!subTheme) { subTheme = { name: subThemeName, sourceStatus: "verified", sourcePages: [sourcePage], topics: [] }; theme.subThemes.push(subTheme); }
  else if (!subTheme.sourcePages.includes(sourcePage)) subTheme.sourcePages.push(sourcePage);
  if (subTheme.topics.some((entry) => key(entry.name) === key(topicName))) return;
  subTheme.topics.push({ name: topicName, sourceStatus: "verified", sourceDocument: documents[subjectName], sourceUrl: urls[subjectName], sourcePages: [sourcePage], objectives, objectivesStatus: "verified", termAllocation: { term: null, type: "unassigned", reason: termReason } });
}

setObjectives("French", "JSS1", "Parler de ce que l’on fait pour se distraire", ["L’apprenant devrait être capable d’employer des mots/expressions liés aux loisirs."]);
setObjectives("National Values Curriculum", "JSS1", "National Values", ["Explain what is meant by values.", "Mention some values in the society."]);
setObjectives("National Values Curriculum", "JSS1", "National Values: Honesty", ["Explain the meaning of honesty.", "State attributes of honesty.", "Explain the benefits of honesty.", "Discuss the consequences of dishonesty."]);
setObjectives("National Values Curriculum", "JSS1", "National Values: Self Reliance", ["Explain the meaning of self-reliance.", "Identify the importance of self-reliance.", "Identify processes of discovering talents and skills."]);
setObjectives("Pre-Vocational Studies", "JSS1", "Classes and Uses of Crops", ["Identify crop plant forms.", "Classify crops according to forms, life span, uses, and types.", "State the various uses of crops."]);
setObjectives("Pre-Vocational Studies", "JSS1", "Classes and Uses of Farm Animals", ["Describe different forms of farm animals.", "Identify the basic characteristics of different farm animals.", "List farm animals."]);
setObjectives("Pre-Vocational Studies", "JSS1", "Methods of Weed and Pests Control", ["List the characteristics of weeds.", "Indicate the uses of weeds.", "Briefly discuss methods of weed control.", "State the effects of weed control methods on vegetation and soil."]);
setObjectives("Pre-Vocational Studies", "JSS1", "Factors of Agricultural Production", ["List the basic factors of production.", "Describe the uses of each factor in agricultural production."]);
setObjectives("Pre-Vocational Studies", "JSS1", "Puberty, Adolescence, Sexually Transmitted Infections (STIs), HIV/AIDS and Human Rights", ["Explain the meaning of puberty and adolescence.", "Describe the signs of puberty in boys and girls.", "Discuss the needs and challenges of the adolescent."]);
setObjectives("Pre-Vocational Studies", "JSS1", "Family Needs, Goals and Standards", ["Explain the meaning of family needs.", "List family needs.", "Explain the meaning of family goals and standards."]);

addTopic("Hausa", "JSS1", "HARSHE", "SAURARO DA MAGANA", "Tsarin Sassauƙar Jimla", 3, ["Tantance sassan sassauƙar jimla.", "Fito da kalmomin da suke cikin sassan sassauƙar jimla."]);
addTopic("Hausa", "JSS1", "HARSHE", "SAURARO DA MAGANA", "Furuci", 4, ["Bayyana ma’anar furuci.", "Kawo gaɓoɓin furuci.", "Bayyana yadda ake samun furuci."]);
addTopic("Hausa", "JSS1", "HARSHE", "SAURARO DA MAGANA", "Auna Fahimta", 5, ["Tantance karanta labarin da kan su.", "Bayar da labari na kansu.", "Kawo labarin da suka karanta.", "Kawo ma’anar muhimman kalmomi cikin labarin."]);
addTopic("Igbo", "JSS1", "ASỤSỤ", "IGE NTỊ NA IKWU OKWU", "Ụdaasụsụ na Nsoroedide Igbo", 1, ["Ịkpọpụta ụdaume, mgbochiume na myiriụdaume.", "Ide mkpụrụedemede ọ bụla.", "Itinye akara edemede ọ bụla."]);
addTopic("Igbo", "JSS1", "OMENALA", "NSINIWU NA MBAMURU", "Ịkọwa ndị bụ ndị Igbo na asụsụ ha", 2, ["Izipụta ebe a na-asụ Igbo.", "Igosi ụzọ dị iche iche e ji ama ndị Igbo."]);
addTopic("Igbo", "JSS1", "ASỤSỤ", "IGE NTỊ NA IKWU OKWU", "Ahịrịmfe", 3, ["Ikwu ihe bụ ahịrịmfe.", "Imebe ahịrịmfe.", "Ide ahịrịmfe."]);
addTopic("Igbo", "JSS1", "OMENALA", "NSINIWU NA MBAMURU", "Nrụkọrịta ọrụ na uru ọ bara", 4, ["Ịkọwa ihe nrụkọrịta ọrụ bụ.", "Ịkọwa usoro na iwu nrụkọrịta ọrụ.", "Idepụta ọmụmaatụ ụzọ anọ e nwere ike isi rụkọrịta ọrụ n’ala Igbo."]);

for (const document of [documents.Hausa, documents.Igbo]) {
  const extraction = data.documentExtraction.find((entry) => entry.document === document);
  extraction.status = "partially_extracted";
  extraction.verifiedPages = document === documents.Hausa ? [2, 3, 4, 5] : [1, 2, 3, 4];
  extraction.verifiedHierarchy = ["class", "theme", "sub-theme", "topic", "objectives"];
  extraction.affectedHierarchy = ["remaining pages"];
  extraction.reason = "Rendered PDF review verified the listed JSS1 source-language rows and objective cells; remaining pages require language-aware continuation review.";
}

fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
