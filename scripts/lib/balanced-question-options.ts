type OptionSource = {
  id: string;
  options: readonly string[];
  answer: string;
};

function stableHash(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeOption(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

export function balanceCorrectOptionPositions(
  records: readonly OptionSource[],
): Map<string, string[]> {
  const orderedRecords = [...records].sort((left, right) => {
    const hashDifference = stableHash(left.id) - stableHash(right.id);
    return hashDifference || left.id.localeCompare(right.id);
  });
  const targetPositions = new Map(
    orderedRecords.map((record, index) => [record.id, index % 4]),
  );
  const orderedOptions = new Map<string, string[]>();

  for (const record of records) {
    const answer = normalizeOption(record.answer);
    const correctOptions = record.options.filter(
      (option) => normalizeOption(option) === answer,
    );
    if (
      record.options.length !== 4 ||
      new Set(record.options.map(normalizeOption)).size !== 4 ||
      correctOptions.length !== 1
    ) {
      throw new Error(`Invalid four-option record ${record.id}.`);
    }

    const distractors = record.options.filter(
      (option) => normalizeOption(option) !== answer,
    );
    const position = targetPositions.get(record.id)!;
    distractors.splice(position, 0, correctOptions[0]);
    orderedOptions.set(record.id, distractors);
  }

  return orderedOptions;
}
