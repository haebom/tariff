import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Define types for our data for better type safety
export interface HSCodeDataRow {
  originalRow: string[];
  searchableText: string;
  hsCode: string;
  // Add other specific fields if you know their types and names
  // e.g., hscode_6digit_name?: string;
  // e.g., description_product_specific?: string;
}

// Using a type alias for HSSectionRow as it's essentially an array of strings.
export type HSSectionRow = string[];

export interface HSSection {
  section: string;
  name: string;
}

export interface HSData {
  section: string;
  hscode: string;
  description: string;
  parent: string;
  level: string; // 또는 number, 실제 데이터 타입에 맞춰주세요
}

let processedHsData: HSCodeDataRow[] = [];
let hsDataHeaders: string[] = [];
let hsSectionsData: HSSectionRow[] = [];
let dataInitialized = false;

// Function to read and parse CSV from the public folder
async function loadCSV(fileName: string): Promise<string[][]> {
  try {
    // In Next.js, `process.cwd()` gives the root of the project
    // CSV files are in the `public` directory
    const filePath = path.join(process.cwd(), 'public', fileName);
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    
    return fileContent
      .trim()
      .split('\n')
      .map(row => 
        row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
      );
  } catch (error) {
    console.error(`Error loading or parsing CSV ${fileName}:`, error);
    return []; // Return empty array on error
  }
}

// This function will be called, likely from a server component or getStaticProps/getServerSideProps context
// For App Router, we can often do this directly in server components.
export async function getProcessedHSData(): Promise<{
  data: HSCodeDataRow[];
  headers: string[];
  sections: HSSectionRow[];
}> {
  if (dataInitialized) {
    return { data: processedHsData, headers: hsDataHeaders, sections: hsSectionsData };
  }

  const [sectionsRaw, dataRaw] = await Promise.all([
    loadCSV('Harmonized System Sections.csv'),
    loadCSV('Harmonized System Data.csv')
  ]);

  hsSectionsData = sectionsRaw as HSSectionRow[];

  if (dataRaw.length > 1) {
    hsDataHeaders = dataRaw[0];
    const idCol = hsDataHeaders.findIndex(h => h.toLowerCase().includes('hscode_6digit_id'));
    const nameCol = hsDataHeaders.findIndex(h => h.toLowerCase().includes('hscode_6digit_name'));
    const descCol = hsDataHeaders.findIndex(h => h.toLowerCase().includes('description_product_specific'));

    // Ensure column indices are valid
    if (idCol === -1 || nameCol === -1 || descCol === -1) {
        console.error("One or more critical columns (hscode_6digit_id, hscode_6digit_name, description_product_specific) not found in headers:", hsDataHeaders);
        // Fallback or throw error
        processedHsData = [];
    } else {
        processedHsData = dataRaw.slice(1).map(row => {
            const id = row[idCol] || '';
            const name = row[nameCol] || '';
            const desc = row[descCol] || '';
            const searchableText = `${id} ${name} ${desc}`.toLowerCase();
            return {
                originalRow: row,
                searchableText: searchableText,
                hsCode: id,
            };
        });
    }
    console.log('HS Data processed:', processedHsData.length, 'rows');
  } else {
    console.error('Harmonized System Data.csv could not be loaded or is empty.');
    processedHsData = [];
    hsDataHeaders = [];
  }
  dataInitialized = true;
  return { data: processedHsData, headers: hsDataHeaders, sections: hsSectionsData };
}

// Example of a function to get only section data if needed separately
export async function getHSSections(): Promise<HSSection[]> {
  // public 폴더의 파일은 빌드 시점에 접근 가능하며, 클라이언트에서는 fetch를 통해 접근합니다.
  // Next.js에서는 public 디렉토리의 파일은 앱의 루트에서 제공됩니다.
  return fetchAndParseCSV<HSSection>('/Harmonized System Sections.csv');
}

export async function getHSData(): Promise<HSData[]> {
  return fetchAndParseCSV<HSData>('/Harmonized System Data.csv');
}

async function fetchAndParseCSV<T>(filePath: string): Promise<T[]> {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText} (${response.status})`)
    }
    const text = await response.text();
    return new Promise<T[]>((resolve, reject) => {
      Papa.parse<T>(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length) {
            // results.errors 안에는 Papa.ParseError[] 타입의 상세 오류 정보가 들어 있습니다.
            console.error("CSV parsing errors:", results.errors);
            reject(new Error('Error parsing CSV. Check console for details.'));
          } else {
            resolve(results.data);
          }
        },
        error: (error: Error, file?: Papa.LocalFile | string) => { // file 매개변수는 선택적으로 처리
          console.error("PapaParse stream error:", error, "File:", file);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`Error in fetchAndParseCSV for ${filePath}:`, error);
    throw error; // 오류를 다시 던져서 호출 측에서 처리할 수 있도록 함
  }
} 