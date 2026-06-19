/**
 * Mappings for facility names to short hospital codes
 */
export const FACILITY_CODES = {
  "University Teaching Hospital": "UTH",
  "Lusaka General Hospital": "LGH",
  "Kabwe General Hospital": "KGH",
  "Ndola Teaching Hospital": "NTH",
  "Kitwe Central Hospital": "KCH",
  "Choma District Hospital": "CDH",
  "Chipata General Hospital": "CGH",
  "Livingstone Central Hospital": "LCH",
  "Default Facility": "FAC"
};

/**
 * Gets a 3-letter code for any facility name
 */
export function getFacilityCode(facilityName) {
  if (!facilityName) return "GEN";
  
  // Search direct mapping
  for (const [key, value] of Object.entries(FACILITY_CODES)) {
    if (facilityName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(facilityName.toLowerCase())) {
      return value;
    }
  }
  
  // Dynamic generation from initials or uppercase letters
  const clean = facilityName.replace(/[^a-zA-Z ]/g, "").trim();
  const words = clean.split(/\s+/);
  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  } else if (words.length === 2) {
    return (words[0][0] + words[1][0] + words[1][1]).toUpperCase();
  } else if (clean.length >= 3) {
    return clean.substring(0, 3).toUpperCase();
  }
  return "GEN";
}

/**
 * Generates a unique sample ID based on facility code, current date, and a sequential number.
 * Format: PCR-[FAC]-[YYMMDD]-[SEQ]
 * Example: PCR-UTH-260618-004
 */
export function generateSampleId(facilityName, sequenceNumber = 1) {
  const code = getFacilityCode(facilityName);
  
  const now = new Date();
  const yy = String(now.getFullYear()).substring(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  
  const dateStr = `${yy}${mm}${dd}`;
  const seqStr = String(sequenceNumber).padStart(4, '0'); // 4-digit sequence: 0001
  
  return `PCR-${code}-${dateStr}-${seqStr}`;
}
