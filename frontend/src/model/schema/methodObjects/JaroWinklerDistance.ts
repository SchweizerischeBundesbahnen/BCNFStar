export default class JaroWinklerDistance {
  constructor(private columnName: string, private otherColumnName: string) {}

  public get(): number {
    return this.jaroWinklerDistance(this.columnName, this.otherColumnName);
  }
  // changed code from: https://www.geeksforgeeks.org/jaro-and-jaro-winkler-similarity
  // Function to calculate the
  // Jaro Similarity of two strings
  private jaroDistance(s1: string, s2: string) {
    // If the strings are equal
    if (s1 == s2) return 1.0;

    // Length of two strings
    var len1 = s1.length,
      len2 = s2.length;

    // Maximum distance upto which matching
    // is allowed
    var maxDistance = Math.floor(Math.max(len1, len2) / 2) - 1;

    // Count of matches
    var match = 0;

    // Hash for matches
    var hashS1 = Array(s1.length).fill(0);
    var hashS2 = Array(s1.length).fill(0);

    // Traverse through the first string
    for (var i = 0; i < len1; i++) {
      // Check if there is any matches
      for (
        var j = Math.max(0, i - maxDistance);
        j < Math.min(len2, i + maxDistance + 1);
        j++
      )
        // If there is a match
        if (s1[i] == s2[j] && hashS2[j] == 0) {
          hashS1[i] = 1;
          hashS2[j] = 1;
          match++;
          break;
        }
    }

    // If there is no match
    if (match == 0) return 0.0;

    // Number of transpositions
    var t = 0;

    var point = 0;

    // Count number of occurrences
    // where two characters match but
    // there is a third matched character
    // in between the indices
    for (let i = 0; i < len1; i++)
      if (hashS1[i]) {
        // Find the next matched character
        // in second string
        while (hashS2[point] == 0) point++;

        if (s1[i] != s2[point++]) t++;
      }

    t /= 2;

    // Return the Jaro Similarity
    return (match / len1 + match / len2 + (match - t) / match) / 3.0;
  }

  private jaroWinklerDistance(s1: string, s2: string) {
    let jaroDistance = this.jaroDistance(s1, s2);

    // If the jaro Similarity is above a threshold
    if (jaroDistance > 0.7) {
      // Find the length of common prefix
      let prefix = 0;

      for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
        // If the characters match
        if (s1[i] == s2[i]) prefix++;
        // Else break
        else break;
      }

      // Maximum of 4 characters are allowed in prefix
      prefix = Math.min(4, prefix);

      // Calculate jaro winkler Similarity
      jaroDistance += 0.1 * prefix * (1 - jaroDistance);
    }
    return jaroDistance;
  }
}
