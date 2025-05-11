'use client'; // This component will have client-side interactions (state, event handlers)

import React, { useState, useEffect } from 'react';
import { getHSSections, getHSData, HSSection, HSData } from '../lib/dataHandler'; // 수정된 임포트
import { useSharedState } from '@/context/AppContext'; // 공유 컨텍스트 import

// HSSearchSidebarProps는 이제 필요 없을 수 있습니다.

const MAX_TABLE_ROWS = 50;

export default function HSSearchSidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sections, setSections] = useState<HSSection[]>([]);
  const [hsData, setHsData] = useState<HSData[]>([]); // 전체 원본 HS 데이터
  const [filteredHsData, setFilteredHsData] = useState<HSData[]>([]); // 필터링된 결과 (초기에는 비어있음)
  const [displayData, setDisplayData] = useState<HSData[]>([]); // 화면에 표시될 데이터 (MAX_TABLE_ROWS 제한)
  const [chartData, setChartData] = useState({ count: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true); // 데이터 로딩 상태
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');

  const { selectedTariffKeyword } = useSharedState(); // 공유 상태 가져오기

  // sections 변수 사용 (임시 - 추후 UI에 실제 사용)
  // useEffect(() => {
  //   if (sections.length > 0) {
  //     console.log("HS Sections loaded:", sections.length);
  //   }
  // }, [sections]); // 이 부분은 실제 Sections UI가 사용되면 자연스럽게 해결되므로 일단 주석 처리

  // 다이어그램에서 선택된 키워드가 변경되면 searchTerm 업데이트
  useEffect(() => {
    if (selectedTariffKeyword) {
      // 여기서는 간단히 searchTerm을 변경하지만, 더 복잡한 필터링 로직을 적용할 수도 있습니다.
      // 예를 들어, 키워드를 분석하여 특정 HS 코드 패턴이나 설명 내용을 검색하도록 할 수 있습니다.
      setSearchTerm(selectedTariffKeyword); 
    }
    // 선택된 키워드가 null이 되면 (예: 다이어그램 외부 클릭 또는 초기화 시) 검색어를 초기화할 수도 있습니다.
    // else {
    //   setSearchTerm(''); 
    // }
  }, [selectedTariffKeyword]);

  // 데이터 로딩
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      setFilteredHsData([]); // 데이터 로드 시작 시 필터링된 데이터 초기화
      setDisplayData([]);    // 화면 표시 데이터도 초기화
      try {
        // Promise.all을 사용하여 두 데이터를 병렬로 가져올 수 있습니다.
        const [sectionsData, allHsData] = await Promise.all([
          getHSSections(),
          getHSData()
        ]);
        setSections(sectionsData);
        setHsData(allHsData); // 원본 데이터 저장
        // 초기에는 filteredHsData를 설정하지 않음. 사용자가 검색하거나 섹션을 선택할 때 업데이트
      } catch (err) {
        console.error("Failed to load HS data:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  // selectedSection 또는 searchTerm이 변경될 때 필터링된 데이터 업데이트
  useEffect(() => {
    // 검색어나 선택된 섹션이 있을 때만 필터링 수행
    if (searchTerm || selectedSection) {
      let currentData = hsData;
      if (selectedSection && hsData.length > 0) {
        currentData = hsData.filter(item => item.section === selectedSection);
      }
      if (searchTerm) {
        const lowerCaseQuery = searchTerm.toLowerCase();
        currentData = currentData.filter(item => {
          const hsCodeMatches = item.hscode.replace(/\./g, '').startsWith(lowerCaseQuery.replace(/[\.\s]/g, ''));
          const descriptionMatches = item.description.toLowerCase().includes(lowerCaseQuery);
          // 만약 searchTerm이 숫자와 점으로만 이루어져 있다면 HS 코드 검색에 더 큰 비중을 둡니다.
          if (/^[\d\.]+$/.test(lowerCaseQuery)) {
            return hsCodeMatches || descriptionMatches; // HS코드 우선, 없으면 설명
          } else if (selectedTariffKeyword && searchTerm === selectedTariffKeyword) {
             // 다이어그램에서 온 키워드면 설명에서 더 넓게 검색 (또는 특별한 로직)
             return descriptionMatches || item.hscode.includes(lowerCaseQuery.split(' ')[0]); // 예: 키워드의 첫 단어가 코드에 포함되는지
          }
          return descriptionMatches || hsCodeMatches; // 설명 또는 코드 매치
        });
      }
      setFilteredHsData(currentData);
    } else {
      setFilteredHsData([]); // 검색어와 선택된 섹션이 모두 없으면 필터된 데이터 비움
    }
  }, [searchTerm, selectedSection, hsData, selectedTariffKeyword]);

  useEffect(() => {
    setDisplayData(filteredHsData.slice(0, MAX_TABLE_ROWS));
    // 차트 데이터는 필터된 결과 기준, 전체는 선택된 섹션 또는 전체 HS 데이터 기준
    const baseTotal = selectedSection ? hsData.filter(item => item.section === selectedSection).length : hsData.length;
    setChartData({ count: filteredHsData.length, total: baseTotal > 0 ? baseTotal : 1 }); // total이 0이 되는 것 방지
  }, [filteredHsData, selectedSection, hsData]);

  // Canvas 차트 (기존 로직을 최대한 활용하되, CSS 변수 접근 방식 개선)
  useEffect(() => {
    const canvas = document.getElementById('hs-chart-canvas') as HTMLCanvasElement;
    if (canvas && chartData.total > 0) { // chartData.total이 0보다 클 때만 실행
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        const barWidth = (chartData.count / chartData.total) * canvasWidth;
        
        // Tailwind CSS의 테마 색상을 사용하거나, CSS 변수를 안전하게 가져옵니다.
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--tw-color-blue-500') || '#3b82f6'; // Tailwind blue-500
        const fgColor = getComputedStyle(document.documentElement).getPropertyValue('--foreground') || '#e0e0e0';

        ctx.fillStyle = accentColor;
        ctx.fillRect(0, 0, barWidth, canvasHeight - 15); 
        
        ctx.fillStyle = fgColor;
        ctx.font = '12px Arial';
        ctx.fillText(`Results: ${chartData.count} / ${chartData.total}`, 5, canvasHeight - 5);
      }
    }
  }, [chartData]); 

  const tableHeaders = ['HS Code', 'Description', 'Section', 'Level'];

  // Tailwind CSS를 사용한 스타일링 추가
  const asideClasses = "sidebar p-4 border-gray-300 dark:border-gray-700"; // 기본 패딩 및 보더 색상 (globals.css와 연계)
  const inputClasses = "w-full p-2 mb-4 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400";
  const selectClasses = "w-full p-2 mb-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"; // select도 mb-4로 통일하거나 필요에 따라 조정
  const tableContainerClasses = "hs-table-container overflow-auto"; // globals.css의 max-height와 함께 사용
  const tableClasses = "hs-table w-full text-sm text-left text-gray-500 dark:text-gray-400";
  const thClasses = "px-4 py-2 text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400";
  const tdClasses = "px-4 py-2 border-b border-gray-200 dark:border-gray-700";
  const messageClasses = "text-center p-4 text-gray-500 dark:text-gray-400";

  if (isLoading) {
    return <aside className={`${asideClasses} md:border-r`} id="sidebar-left"><p className={messageClasses}>Loading data...</p></aside>;
  }

  if (error) {
    return <aside className={`${asideClasses} md:border-r`} id="sidebar-left"><p className={messageClasses}>Error loading data: {error}</p></aside>;
  }

  return (
    <aside className={`${asideClasses} md:border-r`} id="sidebar-left">
      <h2 className="text-xl font-semibold mb-4">HS Sections + Search</h2>
      <div className="filters-container mb-4">
        <select 
          value={selectedSection} 
          onChange={(e) => setSelectedSection(e.target.value)}
          className={selectClasses}
        >
          <option value="">All Sections</option>
          {sections.map(sec => (
            <option key={sec.section} value={sec.section}>
              {`${sec.section} - ${sec.name}`}
            </option>
          ))}
        </select>
        <input 
          type="text" 
          placeholder="Search HS Code or Description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={inputClasses}
        />
      </div>
      
      <div className={tableContainerClasses}>
        <table className={tableClasses}>
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-10"> {/* 테이블 헤더 고정 */} 
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
            {displayData.map((item, rowIndex) => (
              <tr key={`${item.hscode}-${item.section}-${rowIndex}`} className="hover:bg-gray-50 dark:hover:bg-gray-600">
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
            {filteredHsData.length > MAX_TABLE_ROWS && (
              <tr>
                <td colSpan={tableHeaders.length} className={`${messageClasses} italic`}>
                  {`Showing ${MAX_TABLE_ROWS} of ${filteredHsData.length} results. Refine your search.`}
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
      <canvas id="hs-chart-canvas" className="hs-chart w-full h-12 mt-4" width="200" height="50"></canvas> {/* Tailwind w-full, h-12 적용 */}
    </aside>
  );
} 