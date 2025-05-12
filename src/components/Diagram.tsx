import React from 'react';
import ReactFlow, { Node, Edge, Background, Controls, NodeChange, EdgeChange } from 'reactflow';
import 'reactflow/dist/style.css';

interface NodeData {
  label: string;
  price?: number | string;
}

interface CustomNode extends Node {
  data: NodeData;
}

interface DiagramProps {
  nodes: CustomNode[];
  edges: Edge[];
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
}

const Diagram: React.FC<DiagramProps> = ({ nodes, edges, onNodesChange, onEdgesChange }) => {
  const calculatePrice = (node: CustomNode) => {
    if (!node.data?.price) return 0;
    
    // 가격 문자열에서 숫자만 추출
    const priceStr = node.data.price.toString().replace(/[^0-9.]/g, '');
    const price = parseFloat(priceStr);
    
    // 유효하지 않은 가격인 경우 0 반환
    if (isNaN(price)) return 0;
    
    // 가격이 0 이하인 경우 0 반환
    if (price <= 0) return 0;
    
    return price;
  };

  const calculateTotalPrice = (node: CustomNode) => {
    if (!node) return 0;
    
    let total = calculatePrice(node);
    
    // 자식 노드들의 가격 합산
    const childNodes = getChildNodes(node.id);
    childNodes.forEach(child => {
      total += calculateTotalPrice(child);
    });
    
    return total;
  };

  const getChildNodes = (parentId: string): CustomNode[] => {
    return nodes.filter(node => {
      const edge = edges.find(e => e.target === node.id && e.source === parentId);
      return edge !== undefined;
    });
  };

  const formatPrice = (price: number): string => {
    if (price === 0) return '0원';
    return price.toLocaleString('ko-KR') + '원';
  };

  const nodeTypes = {
    default: (nodeProps: { data: NodeData }) => {
      const node = nodeProps as unknown as CustomNode;
      const totalPrice = calculateTotalPrice(node);
      const nodePrice = calculatePrice(node);
      const hasChildren = getChildNodes(node.id).length > 0;
      
      return (
        <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
          <div className="font-semibold text-gray-800">{node.data.label}</div>
          {node.data.price && (
            <div className="mt-2 text-sm">
              <div className="text-gray-600">단가: {formatPrice(nodePrice)}</div>
              {hasChildren && (
                <div className="text-blue-600 font-medium">
                  총액: {formatPrice(totalPrice)}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default Diagram; 