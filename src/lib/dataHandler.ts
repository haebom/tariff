import Papa from 'papaparse';

// Define types for our data for better type safety
export interface HSSection {
  section: string; // e.g., "I" or "01"
  name: string;    // e.g., "Animal Products"
  chapters?: string; // e.g., "01-05" or "15"
}

export interface HSData {
  section: string;    // Should match HSSection.section
  hscode: string;     // e.g., "0101", "0101210000"
  description: string;
  parent: string;
  level: string;      // Consider if this can be number type from CSV
}

export async function getHSSections(): Promise<HSSection[]> {
  // 1. Fetch main sections
  const mainSections = await fetchAndParseCSV<Omit<HSSection, 'chapters'>>('/Harmonized System Sections.csv');
  
  // 2. Fetch all HS data to determine chapter ranges
  const hsDataList = await getHSData();

  // 3. Calculate and add chapter ranges to each section
  const sectionsWithChapters: HSSection[] = mainSections.map(sectionItem => {
    const relevantHsCodes = hsDataList.filter(hs => hs.section === sectionItem.section);
    
    const chapterNumbers: number[] = [];
    relevantHsCodes.forEach(hs => {
      if (hs.hscode && hs.hscode.length >= 2) {
        const chapterStr = hs.hscode.substring(0, 2);
        const chapterNum = parseInt(chapterStr, 10);
        if (!isNaN(chapterNum)) {
          chapterNumbers.push(chapterNum);
        }
      }
    });

    if (chapterNumbers.length > 0) {
      const minChapter = Math.min(...chapterNumbers);
      const maxChapter = Math.max(...chapterNumbers);
      const chaptersRange = minChapter === maxChapter 
        ? `${String(minChapter).padStart(2, '0')}` 
        : `${String(minChapter).padStart(2, '0')}-${String(maxChapter).padStart(2, '0')}`;
      return { ...sectionItem, chapters: chaptersRange };
    }
    return { ...sectionItem, chapters: 'N/A' }; // Or undefined, or empty string
  });

  return sectionsWithChapters;
}

export async function getHSData(): Promise<HSData[]> {
  return fetchAndParseCSV<HSData>('/Harmonized System Data.csv');
}

async function fetchAndParseCSV<T>(filePath: string): Promise<T[]> {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText} (${response.status})`);
    }
    const text = await response.text();
    return new Promise<T[]>((resolve, reject) => {
      Papa.parse<T>(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length) {
            console.error("CSV parsing errors:", results.errors);
            const errorMessages = results.errors.map(err => `${err.message || 'Unknown parse error'} (Row: ${err.row})`).join('; ');
            reject(new Error(`Error parsing CSV: ${errorMessages}.`));
          } else {
            resolve(results.data);
          }
        },
        error: (error: Error) => {
          console.error("PapaParse stream error:", error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`Error in fetchAndParseCSV for ${filePath}:`, error);
    throw error;
  }
} 