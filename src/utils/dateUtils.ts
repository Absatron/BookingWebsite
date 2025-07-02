/**
 * Utility functions for date parsing and formatting
 */

/**
 * Helper function to safely parse createdAt timestamp
 * Handles malformed date strings, Unix timestamps, and ISO date strings
 * @param createdAt - The timestamp string to parse
 * @returns A Date object
 */
export const parseCreatedAtDate = (createdAt: string): Date => {
  // Regex for the malformed string like "Jun 25, 2025 PM1750879313 8:21 PM"
  const malformedDateRegex = /^([A-Za-z]{3})\s(\d{1,2}),\s(\d{4})\s(?:[AP]M\d+)\s(\d{1,2}:\d{2}\s[AP]M)$/;
  const malformedMatch = createdAt.match(malformedDateRegex);

  if (malformedMatch) {
    // Reconstruct a parsable date string: "Month Day, Year Time"
    // e.g., "Jun 25, 2025 8:21 PM"
    const parsableDateString = `${malformedMatch[1]} ${malformedMatch[2]}, ${malformedMatch[3]} ${malformedMatch[4]}`;
    return new Date(parsableDateString);
  }

  // Check if the string is a numeric Unix timestamp (only digits)
  const unixTimestampRegex = /^\d+$/;
  if (unixTimestampRegex.test(createdAt)) {
    // Parse as Unix timestamp (multiply by 1000 to convert to milliseconds)
    return new Date(parseInt(createdAt) * 1000);
  }

  // Treat as ISO string or other standard date format
  return new Date(createdAt);
};
