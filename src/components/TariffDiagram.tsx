'use client';

import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSharedState } from '@/context/AppContext';

const BASE_PRICE = 100;
const INITIAL_PRICE_DISPLAY = `$${BASE_PRICE} 📦 (Click a final tariff result node to see the estimated price)`;

// Updated helper function for price calculation
const calculatePriceDisplay = (basePrice: number, label: string): string => {
  if (!label) return INITIAL_PRICE_DISPLAY;

  const noTariffsMatch = label.toLowerCase().includes('no tariffs');
  const percentageMatch = label.match(/(\d+)%\sTariff(?:\s|$)/i); // Includes cases like "X% Tariff" or "X% Fentanyl Tariff"
  const fentanylTariffMatch = label.match(/(\d+)%\sFentanyl\sTariff/i);
  const fullValueMatch = label.match(/(\d+)%\sTariff\son\sFull\sCustoms\sValue/i);
  const usContentFreeMatch = label.match(/US\sContent\sIs\sTariff\sFree;\sNon-US\sContent\sTariffed\sat\s(\d+)%/i);

  let rate = 0;
  let finalPrice = basePrice;
  let calculationNote = "";

  if (noTariffsMatch) {
    return `$${basePrice.toFixed(2)} 📦 (No Tariffs)`;
  } else if (usContentFreeMatch) {
    rate = parseFloat(usContentFreeMatch[1]) / 100;
    finalPrice = basePrice * (1 + rate); // Assuming 100% non-US content for this example
    calculationNote = ` (Non-US content tariffed at ${usContentFreeMatch[1]}%; US content tariff-free. Example assumes 100% non-US content.)`;
    return `$${basePrice.toFixed(2)} 📦 → $${finalPrice.toFixed(2)}${calculationNote}`;
  } else if (fentanylTariffMatch) {
    rate = parseFloat(fentanylTariffMatch[1]) / 100;
    finalPrice = basePrice * (1 + rate);
    return `$${basePrice.toFixed(2)} 📦 + ${fentanylTariffMatch[1]}% Fentanyl Tariff = $${finalPrice.toFixed(2)}`;
  } else if (fullValueMatch) {
    rate = parseFloat(fullValueMatch[1]) / 100;
    finalPrice = basePrice * (1 + rate);
    calculationNote = " (on full customs value)";
    return `$${basePrice.toFixed(2)} 📦 + ${fullValueMatch[1]}% Tariff = $${finalPrice.toFixed(2)}${calculationNote}`;
  } else if (percentageMatch) {
    rate = parseFloat(percentageMatch[1]) / 100;
    finalPrice = basePrice * (1 + rate);
    return `$${basePrice.toFixed(2)} 📦 + ${percentageMatch[1]}% Tariff = $${finalPrice.toFixed(2)}`;
  }

  return `$${basePrice.toFixed(2)} 📦 (Tariff info: "${label}")`; // Fallback
};

// 초기 노드 정의
const initialNodes: Node[] = [
  // Main Title (not a real node, but can be represented or handled by overall page title)
  { id: 'title', type: 'input', data: { label: 'Hardware Products Imported To The United States From' }, position: { x: 400, y: 0 }, selectable: false, draggable: false, style: { fontWeight: 'bold', fontSize: '1.2em', width: 400, textAlign: 'center', background: '#5D70B4', color: 'white', border: 'none' } },

  // Sources
  { id: 'china', data: { label: 'China' }, position: { x: 100, y: 100 }, style: { border: '1px solid #ccc', padding: 10, width: 150, textAlign: 'center' } },
  { id: 'can-mex', data: { label: 'Canada/Mexico' }, position: { x: 450, y: 100 }, style: { border: '1px solid #ccc', padding: 10, width: 150, textAlign: 'center' } },
  { id: 'other-regions', data: { label: 'All Other Regions' }, position: { x: 800, y: 100 }, style: { border: '1px solid #ccc', padding: 10, width: 150, textAlign: 'center' } },

  // China Path
  { id: 'china-q1', type: 'default', data: { label: 'April 11th Exemption?' }, position: { x: 100, y: 200 }, style: { width: 150, textAlign: 'center' } },
  { id: 'china-a1-no', type: 'output', data: { label: '145% Tariff', keyword: 'China 145% Tariff' }, position: { x: 0, y: 300 }, style: { background: '#5D70B4', color: 'white', width: 150, textAlign: 'center' } },
  { id: 'china-a1-yes', type: 'output', data: { label: '20% Fentanyl Tariff', keyword: 'China Fentanyl Tariff' }, position: { x: 200, y: 300 }, style: { background: '#82D0D4', color: 'black', width: 150, textAlign: 'center' } },
  { id: 'china-q2', type: 'default', data: { label: '>20% of Content from US?' }, position: { x: -50, y: 400 }, style: { width: 200, textAlign: 'center' } }, // Positioned relative to 145% Tariff path
  { id: 'china-a2-no', type: 'output', data: { label: '145% Tariff on Full Customs Value', keyword: 'China 145% Full Value' }, position: { x: -150, y: 500 }, style: { background: '#82D0D4', color: 'black', width: 200, textAlign: 'center' } },
  { id: 'china-a2-yes', type: 'output', data: { label: 'US Content Is Tariff Free; Non-US Content Tariffed at 145%', keyword: 'China 145% US Content Free' }, position: { x: 50, y: 500 }, style: { background: '#82D0D4', color: 'black', width: 200, textAlign: 'center' } },

  // Canada/Mexico Path
  { id: 'canmex-q1', type: 'default', data: { label: 'USMCA Compliant?' }, position: { x: 450, y: 200 }, style: { width: 150, textAlign: 'center' } },
  { id: 'canmex-a1-no', type: 'output', data: { label: '25% Tariff', keyword: 'Canada/Mexico Non-USMCA 25% Tariff' }, position: { x: 350, y: 300 }, style: { background: '#5D70B4', color: 'white', width: 150, textAlign: 'center' } },
  { id: 'canmex-a1-yes', type: 'output', data: { label: 'No Tariffs', keyword: 'Canada/Mexico USMCA No Tariffs' }, position: { x: 550, y: 300 }, style: { background: '#82D0D4', color: 'black', width: 150, textAlign: 'center' } },
  { id: 'canmex-q2', type: 'default', data: { label: 'April 11th Exemption?' }, position: { x: 350, y: 400 } , style: { width: 150, textAlign: 'center' } }, // Below 25% Tariff
  { id: 'canmex-a2-no', type: 'output', data: { label: '25% Tariff', keyword: 'Canada/Mexico Non-USMCA 25% No Exemption' }, position: { x: 250, y: 500 }, style: { background: '#5D70B4', color: 'white', width: 150, textAlign: 'center' } },
  { id: 'canmex-a2-yes', type: 'output', data: { label: 'No Tariffs', keyword: 'Canada/Mexico Non-USMCA No Tariffs Exemption' }, position: { x: 450, y: 500 }, style: { background: '#82D0D4', color: 'black', width: 150, textAlign: 'center' } },
  { id: 'canmex-q3', type: 'default', data: { label: '>20% of Content from US?' }, position: { x: 200, y: 600 }, style: { width: 200, textAlign: 'center' } }, // Below the second 25% tariff
  { id: 'canmex-a3-no', type: 'output', data: { label: '25% Tariff on Full Customs Value', keyword: 'Canada/Mexico 25% Full Value' }, position: { x: 100, y: 700 }, style: { background: '#82D0D4', color: 'black', width: 200, textAlign: 'center' } },
  { id: 'canmex-a3-yes', type: 'output', data: { label: 'US Content Is Tariff Free; Non-US Content Tariffed at 25%', keyword: 'Canada/Mexico 25% US Content Free' }, position: { x: 300, y: 700 }, style: { background: '#82D0D4', color: 'black', width: 200, textAlign: 'center' } },

  // Other Regions Path
  { id: 'other-q1', type: 'default', data: { label: 'April 11th Exemption?' }, position: { x: 800, y: 200 }, style: { width: 150, textAlign: 'center' } },
  { id: 'other-a1-no', type: 'output', data: { label: '10% Tariff', keyword: 'Other Regions 10% Tariff' }, position: { x: 700, y: 300 }, style: { background: '#5D70B4', color: 'white', width: 150, textAlign: 'center' } },
  { id: 'other-a1-yes', type: 'output', data: { label: 'No Tariffs', keyword: 'Other Regions No Tariffs Exemption' }, position: { x: 900, y: 300 }, style: { background: '#82D0D4', color: 'black', width: 150, textAlign: 'center' } },
  { id: 'other-q2', type: 'default', data: { label: '>20% of Content from US?' }, position: { x: 650, y: 400 }, style: { width: 200, textAlign: 'center' } }, // Below 10% Tariff
  { id: 'other-a2-no', type: 'output', data: { label: '10% Tariff on Full Customs Value', keyword: 'Other Regions 10% Full Value' }, position: { x: 550, y: 500 }, style: { background: '#82D0D4', color: 'black', width: 200, textAlign: 'center' } },
  { id: 'other-a2-yes', type: 'output', data: { label: 'US Content Is Tariff Free; Non-US Content Tariffed at 10%', keyword: 'Other Regions 10% US Content Free' }, position: { x: 750, y: 500 }, style: { background: '#82D0D4', color: 'black', width: 200, textAlign: 'center' } },
];

// 초기 엣지 정의
const initialEdges: Edge[] = [
  // Title to sources
  { id: 'e-title-china', source: 'title', target: 'china', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-title-canmex', source: 'title', target: 'can-mex', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-title-other', source: 'title', target: 'other-regions', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },

  // China path
  { id: 'e-china-q1', source: 'china', target: 'china-q1', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-china-q1-a1no', source: 'china-q1', target: 'china-a1-no', label: 'NO', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-china-q1-a1yes', source: 'china-q1', target: 'china-a1-yes', label: 'YES', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-china-a1no-q2', source: 'china-a1-no', target: 'china-q2', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-china-q2-a2no', source: 'china-q2', target: 'china-a2-no', label: 'NO', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-china-q2-a2yes', source: 'china-q2', target: 'china-a2-yes', label: 'YES', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },

  // Canada/Mexico path
  { id: 'e-canmex-q1', source: 'can-mex', target: 'canmex-q1', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-canmex-q1-a1no', source: 'canmex-q1', target: 'canmex-a1-no', label: 'NO', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-canmex-q1-a1yes', source: 'canmex-q1', target: 'canmex-a1-yes', label: 'YES', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-canmex-a1no-q2', source: 'canmex-a1-no', target: 'canmex-q2', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-canmex-q2-a2no', source: 'canmex-q2', target: 'canmex-a2-no', label: 'NO', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-canmex-q2-a2yes', source: 'canmex-q2', target: 'canmex-a2-yes', label: 'YES', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-canmex-a2no-q3', source: 'canmex-a2-no', target: 'canmex-q3', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, // Connecting from the 25% (NO exemption) to its Q3
  { id: 'e-canmex-q3-a3no', source: 'canmex-q3', target: 'canmex-a3-no', label: 'NO', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-canmex-q3-a3yes', source: 'canmex-q3', target: 'canmex-a3-yes', label: 'YES', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },

  // Other Regions path
  { id: 'e-other-q1', source: 'other-regions', target: 'other-q1', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-other-q1-a1no', source: 'other-q1', target: 'other-a1-no', label: 'NO', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-other-q1-a1yes', source: 'other-q1', target: 'other-a1-yes', label: 'YES', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-other-a1no-q2', source: 'other-a1-no', target: 'other-q2', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-other-q2-a2no', source: 'other-q2', target: 'other-a2-no', label: 'NO', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-other-q2-a2yes', source: 'other-q2', target: 'other-a2-yes', label: 'YES', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
];

const nodeColor = (node: Node) => {
  switch (node.type) {
    case 'input':
      return '#0041d0';
    case 'output': // 청록색 노드
      return node.data.label.includes('Tariff') && (node.data.label.includes('%') || node.data.label.includes('Fentanyl')) && !node.data.label.includes('No Tariffs') ? '#5D70B4' : '#82D0D4';
    default:
      return '#E2E2E2'; // Default node color (e.g., for questions)
  }
};

const HIGHLIGHT_COLOR = '#ff0072'; // Color for highlighted elements

export default function TariffDiagram() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { setSelectedTariffKeyword } = useSharedState();

  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [highlightedEdgeIds, setHighlightedEdgeIds] = useState<string[]>([]);
  const [priceDisplay, setPriceDisplay] = useState<string>(INITIAL_PRICE_DISPLAY);

  const resetHighlights = useCallback(() => {
    setHighlightedNodeIds([]);
    setHighlightedEdgeIds([]);
    setSelectedTariffKeyword(null);
    setPriceDisplay(INITIAL_PRICE_DISPLAY);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: initialNodes.find(inN => inN.id === n.id)?.style || n.style,
      }))
    );
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: initialEdges.find(inE => inE.id === e.id)?.style || e.style,
        animated: false,
      }))
    );
  }, [setNodes, setEdges, setSelectedTariffKeyword]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      resetHighlights();

      if (node.type === 'output') {
        const keyword = node.data.keyword || node.data.label;
        setSelectedTariffKeyword(keyword);
        setPriceDisplay(calculatePriceDisplay(BASE_PRICE, node.data.label || ''));

        const newHighlightedNodeIds = [node.id];
        const newHighlightedEdgeIds: string[] = [];

        const incomingEdges = initialEdges.filter(edge => edge.target === node.id);
        incomingEdges.forEach(edge => {
          newHighlightedEdgeIds.push(edge.id);
          if (edge.source) {
            newHighlightedNodeIds.push(edge.source);
          }
        });
        
        setHighlightedNodeIds(newHighlightedNodeIds);
        setHighlightedEdgeIds(newHighlightedEdgeIds);
      }
    },
    [setSelectedTariffKeyword, resetHighlights, setNodes, setEdges],
  );

  const onPaneClick = useCallback(() => {
    resetHighlights();
  }, [resetHighlights]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        const isHighlighted = highlightedNodeIds.includes(n.id);
        const originalNode = initialNodes.find(inN => inN.id === n.id);
        return {
          ...n,
          style: {
            ...(originalNode?.style || {}),
            ...(isHighlighted && n.type !== 'input' ? {
                 ...(n.type === 'output' ? { background: HIGHLIGHT_COLOR, color: 'white' } : {}),
                 border: `2px solid ${HIGHLIGHT_COLOR}`, 
                 boxShadow: `0 0 10px ${HIGHLIGHT_COLOR}` 
                } : {}),
            ...(n.id === 'title' && isHighlighted ? { border: `2px solid ${HIGHLIGHT_COLOR}` } : {}),
          },
        };
      })
    );

    setEdges((eds) =>
      eds.map((e) => {
        const isHighlighted = highlightedEdgeIds.includes(e.id);
        return {
          ...e,
          style: {
            ...(initialEdges.find(inE => inE.id === e.id)?.style || {}),
            stroke: isHighlighted ? HIGHLIGHT_COLOR : (initialEdges.find(inE => inE.id === e.id)?.style?.stroke || '#b1b1b7'),
            strokeWidth: isHighlighted ? 2.5 : 1.5,
          },
          animated: isHighlighted,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isHighlighted ? HIGHLIGHT_COLOR : '#b1b1b7',
          },
        };
      })
    );
  }, [highlightedNodeIds, highlightedEdgeIds, setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-gray-100 relative">
      <div 
        className="absolute top-5 left-1/2 transform -translate-x-1/2 z-10 bg-white bg-opacity-90 p-2.5 px-4 rounded-lg border border-gray-300 shadow-lg text-sm font-bold text-center min-w-[320px] text-gray-800"
      >
        {priceDisplay}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        attributionPosition="bottom-left"
        className="tariff-flow"
        minZoom={0.2}
        maxZoom={4}
      >
        <MiniMap nodeColor={nodeColor} nodeStrokeWidth={3} zoomable pannable />
        <Controls />
        <Background color="#ccc" gap={20} />
      </ReactFlow>
    </div>
  );
} 