'use client'; // This component will have client-side interactions (state, event handlers)

import React, { useState, useEffect } from 'react';
import { getHSSections, getHSData, HSSection, HSData } from '../lib/dataHandler'; // 수정된 임포트
import { useSharedState } from '@/context/AppContext'; // 공유 컨텍스트 import

// HSSearchSidebarProps는 이제 필요 없을 수 있습니다.

const MAX_TABLE_ROWS = 50;

export default function HSSearchSidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sections, setSections] = useState<HSSection[]>([]);
  const [hsData, setHsData] = useState<HSData[]>([]);
  const [filteredHsData, setFilteredHsData] = useState<HSData[]>([]);
  const [displayData, setDisplayData] = useState<HSData[]>([]);
  const [chartData, setChartData] = useState({ count: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>(''); // ''는 모든 섹션을 의미

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
      try {
        // Promise.all을 사용하여 두 데이터를 병렬로 가져올 수 있습니다.
        const [sectionsData, allHsData] = await Promise.all([
          getHSSections(),
          getHSData()
        ]);
        setSections(sectionsData);
        setHsData(allHsData);
        // 초기 필터링 데이터는 전체 HS 데이터로 설정
        // setFilteredHsData(allHsData); // 이 부분은 selectedSection과 searchTerm에 따라 아래 useEffect에서 처리
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
    let currentData = hsData;

    // 1. 섹션 필터링
    if (selectedSection && hsData.length > 0) {
      currentData = hsData.filter(item => item.section === selectedSection);
    }

    // 2. 검색어 필터링
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
        const accentColor = '#007acc'; // 기본값 또는 Tailwind 설정에서 가져오도록 수정 가능
        const fgColor = '#d4d4d4'; // 기본값 또는 Tailwind 설정에서 가져오도록 수정 가능

        ctx.fillStyle = accentColor;
        ctx.fillRect(0, 0, barWidth, canvasHeight - 15); 
        
        ctx.fillStyle = fgColor;
        ctx.font = '12px Arial';
        ctx.fillText(`Results: ${chartData.count} / ${chartData.total}`, 5, canvasHeight - 5);
      }
    }
  }, [chartData]); 

  const tableHeaders = ['HS Code', 'Description', 'Section', 'Level'];

  if (isLoading) {
    return <aside className="sidebar" id="sidebar-left"><p>Loading data...</p></aside>;
  }

  if (error) {
    return <aside className="sidebar" id="sidebar-left"><p>Error loading data: {error}</p></aside>;
  }

  return (
    <aside className="sidebar" id="sidebar-left">
      <h2>HS Sections + Search</h2>
      <div className="filters-container" style={{ marginBottom: '1rem' }}>
        <select 
          value={selectedSection} 
          onChange={(e) => {
            setSelectedSection(e.target.value);
            // 섹션 변경 시 검색어 초기화 또는 유지 정책 결정 가능
            // if (selectedTariffKeyword && e.target.value === '') setSearchTerm(''); // 예: 전체 섹션 시 검색어 초기화
          }}
          className="hs-section-select"
          style={{ marginRight: '0.5rem', padding: '0.5rem', borderRadius: '4px' }}
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
          placeholder="Search HS Code or Description..." // 플레이스홀더 업데이트
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="hs-search-input"
          style={{ padding: '0.5rem', borderRadius: '4px' }}
        />
      </div>
      
      <div className="hs-table-container">
        <table className="hs-table">
          <thead>
            <tr>
              {tableHeaders.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((item, rowIndex) => (
              <tr key={`${item.hscode}-${item.section}-${rowIndex}`}> 
                <td>{item.hscode}</td>
                <td dangerouslySetInnerHTML={{
                  __html: searchTerm ? 
                  item.description.replace(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>') : 
                  item.description
                }}></td>
                <td>{item.section}</td>
                <td>{item.level}</td>
              </tr>
            ))}
            {filteredHsData.length > MAX_TABLE_ROWS && (
              <tr>
                <td colSpan={tableHeaders.length} style={{ textAlign: 'center', fontStyle: 'italic' }}>
                  {`Showing ${MAX_TABLE_ROWS} of ${filteredHsData.length} results. Refine your search.`}
                </td>
              </tr>
            )}
            {displayData.length === 0 && (searchTerm || selectedSection) && (
                 <tr>
                    <td colSpan={tableHeaders.length} style={{ textAlign: 'center' }}>
                        {`No results found for "${searchTerm}" ${selectedSection ? `in section ${selectedSection}` : ''}.`}
                    </td>
                </tr>
            )}
             {displayData.length === 0 && !searchTerm && !selectedSection && hsData.length > 0 && (
                 <tr>
                    <td colSpan={tableHeaders.length} style={{ textAlign: 'center' }}>
                        No data to display. Try a search or select a section.
                    </td>
                </tr>
            )}
            {hsData.length === 0 && !isLoading && (
                 <tr>
                    <td colSpan={tableHeaders.length} style={{ textAlign: 'center' }}>
                        HS Code data is not available.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      <canvas id="hs-chart-canvas" className="hs-chart" width="200" height="50"></canvas>
    </aside>
  );
} 