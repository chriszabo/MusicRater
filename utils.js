function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    // Create two arrays for previous and current rows
    let prevRow = Array.from({ length: b.length + 1 }, (_, i) => i);
    let currRow = new Array(b.length + 1);

    for (let i = 1; i <= a.length; i++) {
        currRow[0] = i;  // First element is the cost of deleting current character from a

        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            currRow[j] = Math.min(
                prevRow[j] + 1,          // Deletion
                currRow[j - 1] + 1,      // Insertion
                prevRow[j - 1] + cost    // Substitution
            );
        }

        // Swap rows for next iteration
        [prevRow, currRow] = [currRow, prevRow];
    }

    return prevRow[b.length];
}

export function levenshteinSimilarity(a, b) {
    const distance = levenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
}