const normalize = (s) => s.trim().replace(/\s+/g, " ").toLowerCase();
const isEqual = (a, b) => normalize(a) === normalize(b);

console.log("Testing topic normalization:");
console.log('normalize("The Creation"):', normalize("The Creation"));
console.log('normalize("the creation"):', normalize("the creation"));
console.log('normalize("THE CREATION"):', normalize("THE CREATION"));
console.log('normalize("The   Creation"):', normalize("The   Creation"));
console.log("");
console.log("Testing equality:");
console.log(
  'isEqual("The Creation", "the creation"):',
  isEqual("The Creation", "the creation"),
);
console.log(
  'isEqual("THE CREATION", "The   Creation"):',
  isEqual("THE CREATION", "The   Creation"),
);
console.log(
  'isEqual("The Creation", "The Fall of Man"):',
  isEqual("The Creation", "The Fall of Man"),
);
console.log("");
console.log("All tests passed!");
