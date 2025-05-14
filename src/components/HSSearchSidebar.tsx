'use client'; // This component will have client-side interactions (state, event handlers)

import React, { useState, useEffect, useCallback } from 'react';
import { getHSSections, getHSData, HSSection, HSData } from '../lib/dataHandler'; // Modified import
import { useSharedState } from '@/context/AppContext'; // Import shared context

// HSSearchSidebarProps may no longer be needed

const MAX_TABLE_ROWS = 50;

export default function HSSearchSidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [hsData, setHsData] = useState<HSData[]>([]);
  const [sections, setSections] = useState<HSSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayData, setDisplayData] = useState<HSData[]>([]);
  const { selectedTariffKeyword } = useSharedState();

  // Use sections variable (temporary - will be actually used in UI later)
  // useEffect(() => {
  //   if (sections.length > 0) {
  //     console.log("HS Sections loaded:", sections.length);
  //   }
  // }, [sections]); // This part is commented out as it will naturally be resolved when Sections UI is used

  // Update searchTerm when the selected keyword changes in the diagram
  useEffect(() => {
    if (selectedTariffKeyword) {
      // Here we simply change the searchTerm, but more complex filtering logic could be applied.
      // For example, analyzing the keyword to search for specific HS code patterns or description content.
      setSearchTerm(selectedTariffKeyword); 
    }
    // When the selected keyword becomes null (e.g., clicking outside the diagram or reset), we could reset the search term.
    // else {
    //   setSearchTerm(''); 
    // }
  }, [selectedTariffKeyword]);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [sectionsData, hsData] = await Promise.all([
          getHSSections(),
          getHSData()
        ]);
        setSections(sectionsData);
        setHsData(hsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const filterData = useCallback(() => {
    if (!searchTerm.trim()) {
      return selectedSection 
        ? hsData.filter(item => item.section === selectedSection)
        : hsData;
    }

    // Split search terms by spaces and filter out empty strings
    const searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    
    return hsData.filter(item => {
      // If section is selected, first filter by section
      if (selectedSection && item.section !== selectedSection) {
        return false;
      }

      // Check if any of the search terms match (OR operation)
      return searchTerms.some(term => {
        // Split the term into individual keywords if it contains OR
        const keywords = term.split(/\s*or\s*/i);
        
        // Check if any of the keywords match (OR operation)
        return keywords.some(keyword => {
          const hscodeMatch = item.hscode.toLowerCase().includes(keyword);
          const descriptionMatch = item.description.toLowerCase().includes(keyword);
          const sectionMatch = item.section.toLowerCase().includes(keyword);
          const levelMatch = item.level.toLowerCase().includes(keyword);
          
          return hscodeMatch || descriptionMatch || sectionMatch || levelMatch;
        });
      });
    });
  }, [searchTerm, selectedSection, hsData]);

  // Update filtered data when search term or section changes
  useEffect(() => {
    const filteredData = filterData();
    setDisplayData(filteredData.slice(0, MAX_TABLE_ROWS));
  }, [filterData, hsData, selectedSection]);

  const tableHeaders = ['HS Code', 'Description', 'Section', 'Level'];

  // Added styling using Tailwind CSS
  const asideClasses = "sidebar p-4 border-gray-300 dark:border-gray-700 flex flex-col h-full"; 
  const inputClasses = "w-full p-2 mb-4 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400";
  const tableContainerClasses = "hs-table-container overflow-auto flex-grow"; 
  const tableClasses = "hs-table w-full text-sm text-left text-gray-500 dark:text-gray-400";
  const thClasses = "px-4 py-2 text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400";
  const tdClasses = "px-4 py-2 border-b border-gray-200 dark:border-gray-700";
  const messageClasses = "text-center p-4 text-gray-500 dark:text-gray-400";

  if (isLoading) {
    return <aside className={`${asideClasses} md:border-r items-center justify-center`} id="sidebar-left"><p className={messageClasses}>Loading data...</p></aside>;
  }

  if (error) {
    return <aside className={`${asideClasses} md:border-r items-center justify-center`} id="sidebar-left"><p className={messageClasses}>Error loading data: {error}</p></aside>;
  }

  return (
    <aside className={`${asideClasses} md:border-r`} id="sidebar-left">
      <h2 className="text-xl font-semibold mb-4 flex-shrink-0">HS Sections + Search</h2>
      
      {/* "All Sections" Button */}
      <div className="mb-2 flex-shrink-0">
        <button 
          onClick={() => { setSelectedSection(''); setSearchTerm(''); }}
          className={`w-full p-2 text-left rounded-md border dark:border-gray-600 transition-colors ${!selectedSection && !searchTerm ? 'bg-blue-600 text-white dark:bg-blue-700' : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
        >
          All Sections / Clear Search
        </button>
      </div>

      {/* HS Section Table List */}
      {sections.length > 0 && (
        <div className="mb-4 flex-shrink-0 border rounded-md dark:border-gray-600 overflow-hidden">
          <div className="max-h-60 overflow-y-auto"> {/* Limit height and allow scroll for section list if too long */}
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="p-2 font-medium text-gray-600 dark:text-gray-300">Section</th>
                  <th className="p-2 font-medium text-gray-600 dark:text-gray-300">Name</th>
                  <th className="p-2 font-medium text-gray-600 dark:text-gray-300">HS Chapters</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sections.map(sec => (
                  <tr 
                    key={sec.section} 
                    onClick={() => { setSelectedSection(sec.section); setSearchTerm(''); }} 
                    className={`cursor-pointer transition-colors ${selectedSection === sec.section ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    title={`Filter by Section: ${sec.section} - ${sec.name}`}
                  >
                    <td className="p-2 whitespace-nowrap w-1/6 text-center font-medium text-gray-700 dark:text-gray-300">{sec.section}</td>
                    <td className="p-2 w-4/6 text-gray-700 dark:text-gray-300">{sec.name}</td>
                    <td className="p-2 whitespace-nowrap w-1/6 text-center text-gray-500 dark:text-gray-400">
                      {sec.chapters || 'N/A'} {/* Display chapters range, fallback to N/A */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Search Input - Remains below the section list */}
      <div className="mb-4 flex-shrink-0">
        <input 
          type="text" 
          placeholder={`Search HS Code or Description ${selectedSection ? 'within Section ' + selectedSection : 'across all sections'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={inputClasses} 
        />
      </div>
      
      <div className={tableContainerClasses}>
        <table className={tableClasses}>
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-10"> {/* Fixed table header */} 
            <tr>
              {tableHeaders.map((header, index) => (
                <th key={index} className={thClasses}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!searchTerm && !selectedSection && hsData.length > 0) && (
              <tr>
                <td colSpan={tableHeaders.length} className={messageClasses}>
                  Please enter a search term or select a section to see HS codes.
                </td>
              </tr>
            )}
            {(searchTerm || selectedSection) && displayData.length === 0 && !isLoading && (
              <tr>
                <td colSpan={tableHeaders.length} className={messageClasses}>
                  {`No results found for "${searchTerm}" ${selectedSection ? `in section ${selectedSection}` : ''}.`}
                </td>
              </tr>
            )}
            {filterData().slice(0, MAX_TABLE_ROWS).map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className={tdClasses}>{item.hscode}</td>
                <td className={tdClasses} dangerouslySetInnerHTML={{
                  __html: searchTerm ? 
                  item.description.replace(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark class="bg-yellow-200 dark:bg-yellow-600 rounded">$1</mark>') :
                  item.description
                }}></td>
                <td className={tdClasses}>{item.section}</td>
                <td className={tdClasses}>{item.level}</td>
              </tr>
            ))}
            {filterData().length > MAX_TABLE_ROWS && (
              <tr>
                <td colSpan={tableHeaders.length} className={`${messageClasses} italic`}>
                  {`Showing ${MAX_TABLE_ROWS} of ${filterData().length} results. Refine your search.`}
                </td>
              </tr>
            )}
            {hsData.length === 0 && !isLoading && (
                 <tr>
                    <td colSpan={tableHeaders.length} className={messageClasses}>
                        HS Code data is not available.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </aside>
  );
} 