import Papa from 'papaparse';

// Define types for our data for better type safety
export interface HSSection {
  section: string;
  name: string;
}

export interface HSData {
  section: string;
  hscode: string;
  description: string;
  parent: string;
  level: string;
}

export async function getHSSections(): Promise<HSSection[]> {
  return fetchAndParseCSV<HSSection>('/Harmonized System Sections.csv');
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