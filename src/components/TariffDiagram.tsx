'use client';

import React, { useState, useEffect } from 'react';
import {
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSharedState } from '@/context/AppContext';
import dagre from 'dagre';
import tariffPolicyDataJson from '@/data/tariffPolicyEn.json';
const tariffPolicyData: TariffPolicy = tariffPolicyDataJson;

// View types for filtering
type ViewType = 'policy' | 'country' | 'item';

// --- START TypeScript Interface Definitions ---

interface TariffPolicy {
  policy_name: string;
  effective_date: string;
  basic_tariff_structure: BasicTariffStructure;
  april_11th_exemption: April11thExemption;
  regional_tariffs: RegionalTariffs;
  us_content_tariff_application: UsContentTariffApplication;
  fentanyl_tariff: FentanylTariff;
  item_specific_tariffs: ItemSpecificTariffs;
  industry_impacts: IndustryImpacts;
}

interface BasicTariffStructure {
  global_base_tariff: GlobalBaseTariff;
  country_specific_reciprocal_tariff: CountrySpecificReciprocalTariff;
  china_special_tariff: ChinaSpecialTariff;
  usmca_special_rules: UsmcaSpecialRules;
}

interface GlobalBaseTariff {
  rate: string;
  effective_date: string;
  description: string;
}

interface CountrySpecificReciprocalTariff {
  rate: string;
  effective_date: string;
  suspension: Suspension;
  description: string;
}

interface Suspension {
  is_suspended: boolean;
  suspension_period: string;
  suspension_end_date: string;
  description: string;
}

interface ChinaSpecialTariff {
  rate: string;
  components: {
    fentanyl_tariff: string;
    reciprocal_tariff: string;
  };
  description: string;
}

interface UsmcaSpecialRules {
  usmca_compliant_products: string;
  usmca_noncompliant_products: string;
  description: string;
}

interface April11thExemptionProduct {
  item: string;
  HTSUS: string | null;
}

interface April11thExemption {
  definition: string;
  applicable_products: April11thExemptionProduct[];
  benefits: string[];
  main_beneficiary_countries: string[];
  nature: string;
  future_plan: string;
}

interface ChinaSpecialProvision {
  category: string;
  applicable_items?: string[];
  tariff_rate?: string; // Changed to optional
  description?: string;
  target_countries?: string[];
  effective_date?: string;
}

interface ChinaRegionalTariff {
  base_tariff_rate: string;
  composition: {
    reciprocal_tariff: string;
    fentanyl_tariff: string;
  };
  special_provisions: ChinaSpecialProvision[];
}

interface CanadaMexicoRegionalTariff {
  usmca_compliant_products: string;
  usmca_noncompliant_products: string;
  canadian_usmca_noncompliant_energy_potassium: string;
  usmca_rules_of_origin: {
    automotive_industry: {
      north_american_content: string;
      additional_labor_value_requirement: string;
    };
    raw_materials: string;
  };
}

interface EURegionalTariff {
  base_tariff_rate: string;
  current_application: string;
  suspension_end_date: string;
  uk_special_agreement: {
    base_tariff: string;
    steel_aluminum: string;
  };
  retaliation_measures: {
    scale: string;
    target: string;
    status: string;
  };
}

interface OtherMajorTradePartnerDetail {
  reciprocal_tariff: string;
  current_application: string;
  major_impact_sectors?: string; // Japan
  additional_info?: string; // Korea
  excluded_items?: string; // Taiwan
}

interface OtherMajorTradePartners {
  japan: OtherMajorTradePartnerDetail;
  korea: OtherMajorTradePartnerDetail;
  taiwan: OtherMajorTradePartnerDetail;
  vietnam: OtherMajorTradePartnerDetail;
  india: OtherMajorTradePartnerDetail;
  brazil: OtherMajorTradePartnerDetail;
}

interface RegionalTariffs {
  china: ChinaRegionalTariff;
  canada_mexico: CanadaMexicoRegionalTariff;
  european_union: EURegionalTariff;
  other_major_trade_partners: OtherMajorTradePartners;
}

interface UsContentTariffApplication {
  requirement: string;
  benefit: string;
  calculation_method: {
    basis: string;
    example: {
      product_price: string;
      us_content: string;
      tariff_applicable_portion: string;
      japan_import: {
        tariff_rate: string;
        tariff_amount: string;
        effective_tariff_rate: string;
      };
    };
  };
  application_method: {
    claim_code: string;
    required_documentation: string;
  };
}

interface FentanylTariffCountryRate {
  initial?: string; // China
  current?: string; // China
  additional?: string; // China
  usmca_noncompliant_products?: string; // Canada, Mexico
  usmca_noncompliant_energy_potassium?: string; // Canada
}

interface FentanylTariff {
  definition: string;
  legal_basis: string;
  implementation_timeline: {
    declaration_date: string;
    china_initial_tariff_date: string;
    canada_mexico_tariff_date: string;
    china_tariff_increase_date: string;
    reciprocal_tariff_integration_date: string;
  };
  countries_and_rates: {
    china: FentanylTariffCountryRate;
    canada: FentanylTariffCountryRate;
    mexico: FentanylTariffCountryRate;
  };
  exemptions: string[];
}

interface AutomotiveTariffDetail {
  tariff_rate: string;
  effective_date: string;
}

interface AutomotiveTariff {
  completed_vehicles_import: AutomotiveTariffDetail;
  auto_parts: AutomotiveTariffDetail;
  special_provisions: string[];
}

interface SteelAluminumTariffDetail {
  tariff_rate: string;
  effective_date: string;
  previous_rate?: string; // Aluminum
}

interface SteelAluminumTariff {
  steel_imports: SteelAluminumTariffDetail;
  aluminum_imports: SteelAluminumTariffDetail;
  empty_aluminum_cans_canned_beer: SteelAluminumTariffDetail;
  requirements: {
    steel: string;
    aluminum: string;
  };
}

interface ElectronicsTechnologyTariff {
  smartphones_computers_other_electronics: {
    tariff: string;
    announcement_date: string;
  };
  applicable_htsus_categories: string[];
  chinese_products: string;
  semiconductors: string;
}

interface ApparelTextilesTariff {
  tariff_rate: string;
  price_impact: {
    clothing: string;
    footwear: string;
  };
  retail_industry_outlook: string;
}

interface AgriculturalProductsTariff {
  tariff_rate: string;
  price_impact: {
    mexican_products: string;
    canadian_products: string;
    outlook: string;
  };
  export_impact: string;
}

interface OtherItemDetail {
  tariff?: string; // Changed to optional
  additional_investigation?: string;
  investigation_completion_date?: string;
  implementation?: string; // Film
  cambodia?: string; // Solar Panels
  chinese_factory_countries?: string; // Solar Panels
}

interface OtherItemsTariff {
  pharmaceuticals: OtherItemDetail;
  copper: OtherItemDetail;
  lumber: OtherItemDetail;
  critical_minerals_energy_products: string;
  precious_metals: string;
  film_entertainment: OtherItemDetail;
  solar_panels: OtherItemDetail;
}

interface ItemSpecificTariffs {
  automotive: AutomotiveTariff;
  steel_aluminum: SteelAluminumTariff;
  electronics_technology: ElectronicsTechnologyTariff;
  apparel_textiles: ApparelTextilesTariff;
  agricultural_products: AgriculturalProductsTariff;
  other_items: OtherItemsTariff;
}

interface IndustryImpactDetail {
  price_impact?: string | number | Record<string, unknown>; // Changed to optional
  supply_chain_changes?: string | number | Record<string, unknown>;
  future_outlook?: string | number | Record<string, unknown>;
  sales_outlook?: string | number | Record<string, unknown>;
  production_shifts?: string | number | Record<string, unknown>;
  consumer_behavior?: string | number | Record<string, unknown>;
  farm_input_costs?: string | number | Record<string, unknown>;
  export_impact?: string | number | Record<string, unknown>;
  food_prices?: string | number | Record<string, unknown>;
  sourcing_shifts?: string | number | Record<string, unknown>;
  retailer_strategies?: string | number | Record<string, unknown>;
  vulnerability?: string;
  major_supplier_tariffs?: string | number | Record<string, unknown>;
}

interface IndustryImpacts {
  electronics_industry: IndustryImpactDetail;
  automotive_industry: IndustryImpactDetail;
  appliance_industry: IndustryImpactDetail;
  apparel_textile_industry: IndustryImpactDetail;
  agricultural_industry: IndustryImpactDetail;
}

// const typedTariffPolicyData = tariffPolicyData as TariffPolicy;

// Updated helper function for price calculation
// const calculatePriceDisplay = (basePrice: number, label: string): string => {
//   if (!label) return INITIAL_PRICE_DISPLAY;

//   const noTariffsMatch = label.toLowerCase().includes('no tariffs');
//   const percentageMatch = label.match(/(\d+)%\sTariff(?:\s|$)/i); // Includes cases like "X% Tariff" or "X% Fentanyl Tariff"
//   const fentanylTariffMatch = label.match(/(\d+)%\sFentanyl\sTariff/i);
//   const fullValueMatch = label.match(/(\d+)%\sTariff\son\sFull\sCustoms\sValue/i);
//   const usContentFreeMatch = label.match(/US\sContent\sIs\sTariff\sFree;\sNon-US\sContent\sTariffed\sat\s(\d+)%/i);

//   let rate = 0;
//   let finalPrice = basePrice;
//   let calculationNote = "";

//   if (noTariffsMatch) {
//     return `$${basePrice.toFixed(2)} 📦 (No Tariffs)`;
//   } else if (usContentFreeMatch) {
//     rate = parseFloat(usContentFreeMatch[1]) / 100;
//     finalPrice = basePrice * (1 + rate); // Assuming 100% non-US content for this example
//     calculationNote = ` (Non-US content tariffed at ${usContentFreeMatch[1]}%; US content tariff-free. Example assumes 100% non-US content.)`;
//     return `$${basePrice.toFixed(2)} 📦 → $${finalPrice.toFixed(2)}${calculationNote}`;
//   } else if (fentanylTariffMatch) {
//     rate = parseFloat(fentanylTariffMatch[1]) / 100;
//     finalPrice = basePrice * (1 + rate);
//     return `$${basePrice.toFixed(2)} 📦 + ${fentanylTariffMatch[1]}% Fentanyl Tariff = $${finalPrice.toFixed(2)}`;
//   } else if (fullValueMatch) {
//     rate = parseFloat(fullValueMatch[1]) / 100;
//     finalPrice = basePrice * (1 + rate);
//     calculationNote = " (on full customs value)";
//     return `$${basePrice.toFixed(2)} 📦 + ${fullValueMatch[1]}% Tariff = $${finalPrice.toFixed(2)}${calculationNote}`;
//   } else if (percentageMatch) {
//     rate = parseFloat(percentageMatch[1]) / 100;
//     finalPrice = basePrice * (1 + rate);
//     return `$${basePrice.toFixed(2)} 📦 + ${percentageMatch[1]}% Tariff = $${finalPrice.toFixed(2)}`;
//   }

//   return `$${basePrice.toFixed(2)} 📦 (Tariff info: "${label}")`; // Fallback
// };

// 초기 노드 정의
const initialNodes: Node[] = [
  // Main Title (not a real node, but can be represented or handled by overall page title)
  { id: 'title', type: 'input', data: { label: 'Hardware Products Imported To The United States From' }, position: { x: 0, y: 0 }, selectable: false, draggable: false, style: { fontWeight: 'bold', fontSize: '1.2em', width: 350, textAlign: 'center', background: '#5D70B4', color: 'white', border: 'none' } },

  // Sources (Scaling factor: 0.7 approx)
  { id: 'china', data: { label: 'China' }, position: { x: 0, y: 0 }, style: { border: '1px solid #ccc', padding: 8, width: 120, textAlign: 'center' } },
  { id: 'can-mex', data: { label: 'Canada/Mexico' }, position: { x: 0, y: 0 }, style: { border: '1px solid #ccc', padding: 8, width: 120, textAlign: 'center' } },
  { id: 'other-regions', data: { label: 'All Other Regions' }, position: { x: 0, y: 0 }, style: { border: '1px solid #ccc', padding: 8, width: 120, textAlign: 'center' } },

  // China Path
  { id: 'china-q1', type: 'default', data: { label: 'April 11th Exemption?' }, position: { x: 0, y: 0 }, style: { width: 120, textAlign: 'center' } },
  { id: 'china-a1-no', type: 'output', data: { label: '145% Tariff', keyword: 'China 145% Tariff' }, position: { x: 0, y: 0 }, style: { background: '#5D70B4', color: 'white', width: 120, textAlign: 'center' } },
  // News update: 90-day temporary tariff reduction node added (US→China)
  { id: 'china-a1-temp-us', type: 'output', data: { label: '30% Tariff (90 days, US→China)', keyword: 'US to China 30% Tariff 90 days', details: { description: 'US and China agreed in June 2025 to significantly reduce tariffs for 90 days. The US reduced tariffs on Chinese imports from 145% to 30% for a 90-day period.' } }, position: { x: 0, y: 0 }, style: { background: '#FFD700', color: 'black', width: 180, textAlign: 'center', border: '2px dashed #5D70B4' } },
  { id: 'china-a1-yes', type: 'output', data: { label: '20% Fentanyl Tariff', keyword: 'China Fentanyl Tariff' }, position: { x: 0, y: 0 }, style: { background: '#82D0D4', color: 'black', width: 120, textAlign: 'center' } },
  // News update: 90-day temporary tariff reduction node added (China→US)
  { id: 'china-a1-temp-cn', type: 'output', data: { label: '10% Tariff (90 days, China→US)', keyword: 'China to US 10% Tariff 90 days', details: { description: 'China also reduced tariffs on US imports from 125% to 10% for a 90-day period.' } }, position: { x: 0, y: 0 }, style: { background: '#FFD700', color: 'black', width: 180, textAlign: 'center', border: '2px dashed #5D70B4' } },
  { id: 'china-q2', type: 'default', data: { label: '>20% of Content from US?' }, position: { x: 0, y: 0 }, style: { width: 150, textAlign: 'center' } },
  { id: 'china-a2-no', type: 'output', data: { label: '145% Tariff on Full Customs Value', keyword: 'China 145% Full Value' }, position: { x: 0, y: 0 }, style: { background: '#82D0D4', color: 'black', width: 160, textAlign: 'center' } },
  { id: 'china-a2-yes', type: 'output', data: { label: 'US Content Is Tariff Free; Non-US Content Tariffed at 145%', keyword: 'China 145% US Content Free' }, position: { x: 0, y: 0 }, style: { background: '#82D0D4', color: 'black', width: 160, textAlign: 'center' } },

  // Canada/Mexico Path
  { id: 'canmex-q1', type: 'default', data: { label: 'USMCA Compliant?' }, position: { x: 0, y: 0 }, style: { width: 120, textAlign: 'center' } },
  { id: 'canmex-a1-no', type: 'output', data: { label: '25% Tariff', keyword: 'Canada/Mexico Non-USMCA 25% Tariff' }, position: { x: 0, y: 0 }, style: { background: '#5D70B4', color: 'white', width: 120, textAlign: 'center' } },
  { id: 'canmex-a1-yes', type: 'output', data: { label: 'No Tariffs', keyword: 'Canada/Mexico USMCA No Tariffs' }, position: { x: 0, y: 0 }, style: { background: '#82D0D4', color: 'black', width: 120, textAlign: 'center' } },
  { id: 'canmex-q2', type: 'default', data: { label: 'April 11th Exemption?' } , position: { x: 0, y: 0 }, style: { width: 120, textAlign: 'center' } },
  { id: 'canmex-a2-no', type: 'output', data: { label: '25% Tariff', keyword: 'Canada/Mexico Non-USMCA 25% No Exemption' }, position: { x: 0, y: 0 }, style: { background: '#5D70B4', color: 'white', width: 120, textAlign: 'center' } },
  { id: 'canmex-a2-yes', type: 'output', data: { label: 'No Tariffs', keyword: 'Canada/Mexico Non-USMCA No Tariffs Exemption' }, position: { x: 0, y: 0 }, style: { background: '#82D0D4', color: 'black', width: 120, textAlign: 'center' } },
  { id: 'canmex-q3', type: 'default', data: { label: '>20% of Content from US?' }, position: { x: 0, y: 0 }, style: { width: 150, textAlign: 'center' } },
  { id: 'canmex-a3-no', type: 'output', data: { label: '25% Tariff on Full Customs Value', keyword: 'Canada/Mexico 25% Full Value' }, position: { x: 0, y: 0 }, style: { background: '#82D0D4', color: 'black', width: 160, textAlign: 'center' } },
  { id: 'canmex-a3-yes', type: 'output', data: { label: 'US Content Is Tariff Free; Non-US Content Tariffed at 25%', keyword: 'Canada/Mexico 25% US Content Free' }, position: { x: 0, y: 0 }, style: { background: '#82D0D4', color: 'black', width: 160, textAlign: 'center' } },

  // Other Regions Path
  { id: 'other-q1', type: 'default', data: { label: 'April 11th Exemption?' }, position: { x: 0, y: 0 }, style: { width: 120, textAlign: 'center' } },
  { id: 'other-a1-no', type: 'output', data: { label: '10% Tariff', keyword: 'Other Regions 10% Tariff' }, position: { x: 0, y: 0 }, style: { background: '#5D70B4', color: 'white', width: 120, textAlign: 'center' } },
  { id: 'other-a1-yes', type: 'output', data: { label: 'No Tariffs', keyword: 'Other Regions No Tariffs Exemption' }, position: { x: 0, y: 0 }, style: { background: '#82D0D4', color: 'black', width: 120, textAlign: 'center' } },
  { id: 'other-q2', type: 'default', data: { label: '>20% of Content from US?' }, position: { x: 0, y: 0 }, style: { width: 150, textAlign: 'center' } },
  { id: 'other-a2-no', type: 'output', data: { label: '10% Tariff on Full Customs Value', keyword: 'Other Regions 10% Full Value' }, position: { x: 0, y: 0 }, style: { background: '#82D0D4', color: 'black', width: 160, textAlign: 'center' } },
  { id: 'other-a2-yes', type: 'output', data: { label: 'US Content Is Tariff Free; Non-US Content Tariffed at 10%', keyword: 'Other Regions 10% US Content Free' }, position: { x: 0, y: 0 }, style: { background: '#82D0D4', color: 'black', width: 160, textAlign: 'center' } },
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
  // 뉴스 반영: 145% → 30% 임시 관세 노드 연결
  { id: 'e-china-a1no-tempus', source: 'china-a1-no', target: 'china-a1-temp-us', label: 'NEWS', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#FFD700', strokeDasharray: '4 2' } },
  // 뉴스 반영: 125% → 10% 임시 관세 노드 연결 (중국→미국)
  { id: 'e-china-a1no-tempcn', source: 'china-a1-no', target: 'china-a1-temp-cn', label: 'NEWS', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#FFD700', strokeDasharray: '4 2' } },
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

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodesToLayout: Node[], edgesToLayout: Edge[], direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 70 }); // Added nodesep and ranksep for spacing

  nodesToLayout.forEach((node) => {
    const nodeWidth = (node.style?.width && typeof node.style.width === 'number') ? node.style.width : ((typeof node.style?.width === 'string') ? parseInt(node.style.width) : 150);
    const nodeHeight = (node.style?.height && typeof node.style.height === 'number') ? node.style.height : ((typeof node.style?.height === 'string') ? parseInt(node.style.height) : 50);
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edgesToLayout.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodesToLayout.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const nodeWidth = (node.style?.width && typeof node.style.width === 'number') ? node.style.width : ((typeof node.style?.width === 'string') ? parseInt(node.style.width) : 150);
    
    return {
      ...node,
      position: { x: nodeWithPosition.x - nodeWidth / 2, y: nodeWithPosition.y },
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
    };
  });

  return { nodes: layoutedNodes, edges: edgesToLayout };
};

// Generate nodes and edges for country-based view
const generateCountryViewDiagram = () => {
  // Check if we have the regional_tariffs data
  if (!tariffPolicyData.regional_tariffs) {
    console.error('No regional tariffs data found');
    return { nodes: [], edges: [] };
  }
  
  const countryNodes: Node[] = [];
  const countryEdges: Edge[] = [];
  
  // Create root node
  countryNodes.push({
    id: 'country-root',
    type: 'input',
    data: { label: 'Tariffs by Country/Region' },
    position: { x: 0, y: 0 },
    style: { 
      fontWeight: 'bold', 
      fontSize: '1.2em', 
      width: 250, 
      textAlign: 'center', 
      background: '#5D70B4', 
      color: 'white', 
      border: 'none',
      borderRadius: '8px' 
    }
  });
  
  // Add main country/region nodes
  const countries = [
    { id: 'china', label: 'China', data: tariffPolicyData.regional_tariffs.china },
    { id: 'canada-mexico', label: 'Canada/Mexico', data: tariffPolicyData.regional_tariffs.canada_mexico },
    { id: 'eu', label: 'European Union', data: tariffPolicyData.regional_tariffs.european_union },
    { id: 'other-partners', label: 'Other Major Partners', data: tariffPolicyData.regional_tariffs.other_major_trade_partners }
  ];
  
  // Add country nodes
  countries.forEach((country) => {
    const countryId = `country-${country.id}`;
    
    // Create country node
    countryNodes.push({
      id: countryId,
      data: { 
        label: country.label, 
        countryData: country.data   // Store the country data for detail panel
      },
      position: { x: 0, y: 0 },
      style: { 
        border: '1px solid #ccc', 
        padding: 8, 
        width: 150, 
        textAlign: 'center',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    });
    
    // Connect root to country
    countryEdges.push({
      id: `e-root-${country.id}`,
      source: 'country-root',
      target: countryId,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed }
    });
    
    // Process China special case
    if (country.id === 'china') {
      const chinaData = country.data as ChinaRegionalTariff; // Type assertion
      if (chinaData.base_tariff_rate) {
        const baseTariffId = `${countryId}-base-tariff`;
        // China tariff rate node
        countryNodes.push({
          id: baseTariffId,
          type: 'output',
          data: { 
            label: `Base Tariff: ${chinaData.base_tariff_rate}`,
            keyword: 'China Base Tariff',
            details: chinaData
          },
          position: { x: 0, y: 0 },
          style: {
            background: '#5D70B4',
            color: 'white',
            width: 160,
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect country to tariff rate
        countryEdges.push({
          id: `e-${country.id}-base`,
          source: countryId,
          target: baseTariffId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
      }
      
      // Add special provisions
      if (chinaData.special_provisions && Array.isArray(chinaData.special_provisions)) {
        chinaData.special_provisions.forEach((provision: ChinaSpecialProvision, idx: number) => {
          const provisionId = `${countryId}-provision-${idx}`;
          // Provision node
          countryNodes.push({
            id: provisionId,
            type: 'default',
            data: { 
              label: provision.category,
              details: provision
            },
            position: { x: 0, y: 0 },
            style: {
              width: 160,
              textAlign: 'center',
              borderRadius: '4px'
            }
          });
          
          // Connect country to provision
          countryEdges.push({
            id: `e-${country.id}-prov-${idx}`,
            source: countryId,
            target: provisionId,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed }
          });
          
          // Add tariff rate for this provision if available
          if (provision.tariff_rate) {
            const rateId = `${provisionId}-rate`;
            countryNodes.push({
              id: rateId,
              type: 'output',
              data: { 
                label: `Tariff: ${provision.tariff_rate}`,
                keyword: `China ${provision.category} Tariff`,
                details: provision
              },
              position: { x: 0, y: 0 },
              style: {
                background: '#82D0D4',
                color: 'black',
                width: 160,
                textAlign: 'center',
                borderRadius: '4px'
              }
            });
            
            // Connect provision to rate
            countryEdges.push({
              id: `e-prov-${idx}-rate`,
              source: provisionId,
              target: rateId,
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed }
            });
          }
        });
      }
    }
    
    // Process Canada/Mexico
    else if (country.id === 'canada-mexico') {
      const canMexData = country.data as CanadaMexicoRegionalTariff; // Type assertion
      // USMCA complaint products node
      if (canMexData.usmca_compliant_products) {
        const compliantId = `${countryId}-compliant`;
        countryNodes.push({
          id: compliantId,
          type: 'default',
          data: { 
            label: 'USMCA Compliant?',
            details: country.data
          },
          position: { x: 0, y: 0 },
          style: {
            width: 160,
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect country to USMCA decision
        countryEdges.push({
          id: `e-${country.id}-compliant`,
          source: countryId,
          target: compliantId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
        
        // Yes branch - USMCA compliant
        const yesId = `${compliantId}-yes`;
        countryNodes.push({
          id: yesId,
          type: 'output',
          data: { 
            label: `Tariff: ${canMexData.usmca_compliant_products}`,
            keyword: 'USMCA Compliant Tariff',
            details: { rate: canMexData.usmca_compliant_products, condition: 'USMCA Compliant' }
          },
          position: { x: 0, y: 0 },
          style: {
            background: '#82D0D4',
            color: 'black',
            width: 160,
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect decision to Yes
        countryEdges.push({
          id: `e-compliant-yes`,
          source: compliantId,
          target: yesId,
          label: 'YES',
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
        
        // No branch - USMCA non-compliant
        const noId = `${compliantId}-no`;
        countryNodes.push({
          id: noId,
          type: 'output',
          data: { 
            label: `Tariff: ${canMexData.usmca_noncompliant_products}`,
            keyword: 'USMCA Non-Compliant Tariff',
            details: { rate: canMexData.usmca_noncompliant_products, condition: 'USMCA Non-Compliant' }
          },
          position: { x: 0, y: 0 },
          style: {
            background: '#5D70B4',
            color: 'white',
            width: 160,
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect decision to No
        countryEdges.push({
          id: `e-compliant-no`,
          source: compliantId,
          target: noId,
          label: 'NO',
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
        
        // Add special case for Canadian energy/potassium
        if (canMexData.canadian_usmca_noncompliant_energy_potassium) {
          const specialId = `${noId}-special`;
          countryNodes.push({
            id: specialId,
            type: 'output',
            data: { 
              label: `Canadian Energy/Potassium: ${canMexData.canadian_usmca_noncompliant_energy_potassium}`,
              keyword: 'Canadian Energy Tariff',
              details: { 
                rate: canMexData.canadian_usmca_noncompliant_energy_potassium, 
                condition: 'USMCA Non-Compliant Canadian Energy/Potassium' 
              }
            },
            position: { x: 0, y: 0 },
            style: {
              background: '#82D0D4',
              color: 'black',
              width: 180,
              textAlign: 'center',
              borderRadius: '4px'
            }
          });
          
          // Connect from non-compliant to special case
          countryEdges.push({
            id: `e-no-special`,
            source: noId,
            target: specialId,
            label: 'if Canadian',
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed }
          });
        }
      }
    }
    
    // Process EU
    else if (country.id === 'eu') {
      const euData = country.data as EURegionalTariff; // Type assertion
      if (euData.base_tariff_rate) {
        const euBaseId = `${countryId}-base`;
        countryNodes.push({
          id: euBaseId,
          type: 'output',
          data: { 
            label: `Base Rate: ${euData.base_tariff_rate}`,
            keyword: 'EU Base Tariff',
            details: euData
          },
          position: { x: 0, y: 0 },
          style: {
            background: '#5D70B4',
            color: 'white',
            width: 160,
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect country to base rate
        countryEdges.push({
          id: `e-${country.id}-base`,
          source: countryId,
          target: euBaseId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
        
        // Add current application (if suspended)
        if (euData.current_application) {
          const currentId = `${countryId}-current`;
          countryNodes.push({
            id: currentId,
            type: 'output',
            data: { 
              label: `Current: ${euData.current_application}`,
              keyword: 'EU Current Tariff',
              details: { 
                current: euData.current_application,
                suspension_end: euData.suspension_end_date
              }
            },
            position: { x: 0, y: 0 },
            style: {
              background: '#82D0D4',
              color: 'black',
              width: 160,
              textAlign: 'center',
              borderRadius: '4px'
            }
          });
          
          // Connect country to current rate
          countryEdges.push({
            id: `e-${country.id}-current`,
            source: countryId,
            target: currentId,
            label: 'Suspended',
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed }
          });
        }
      }
    }
    
    // Process Other major trade partners
    else if (country.id === 'other-partners') {
      const partnersData = country.data as OtherMajorTradePartners; // Type assertion
      
      if (partnersData) {
        (Object.keys(partnersData) as (keyof OtherMajorTradePartners)[]).forEach((partnerKey) => {
          const partner = partnersData[partnerKey] as OtherMajorTradePartnerDetail;
          const partnerId = `${countryId}-${partnerKey}`;
          
          // Create partner node
          countryNodes.push({
            id: partnerId,
            data: { 
              label: partnerKey.charAt(0).toUpperCase() + partnerKey.slice(1), 
              details: partner
            },
            position: { x: 0, y: 0 },
            style: { 
              border: '1px solid #ccc', 
              padding: 8, 
              width: 120, 
              textAlign: 'center',
              borderRadius: '4px'
            }
          });
          
          // Connect country to partner
          countryEdges.push({
            id: `e-${country.id}-${partnerKey}`,
            source: countryId,
            target: partnerId,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed }
          });
          
          // Add reciprocal tariff if available
          if (partner.reciprocal_tariff) {
            const tariffId = `${partnerId}-tariff`;
            countryNodes.push({
              id: tariffId,
              type: 'output',
              data: { 
                label: `Tariff: ${partner.reciprocal_tariff}`,
                keyword: `${partnerKey} Reciprocal Tariff`,
                details: partner
              },
              position: { x: 0, y: 0 },
              style: {
                background: '#5D70B4',
                color: 'white',
                width: 160,
                textAlign: 'center',
                borderRadius: '4px'
              }
            });
            
            // Connect partner to tariff
            countryEdges.push({
              id: `e-${partnerKey}-tariff`,
              source: partnerId,
              target: tariffId,
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed }
            });
          }
          
          // Add current application if available
          if (partner.current_application) {
            const currentId = `${partnerId}-current`;
            countryNodes.push({
              id: currentId,
              type: 'output',
              data: { 
                label: `Current: ${partner.current_application}`,
                keyword: `${partnerKey} Current Tariff`,
                details: partner
              },
              position: { x: 0, y: 0 },
              style: {
                background: '#82D0D4',
                color: 'black',
                width: 160,
                textAlign: 'center',
                borderRadius: '4px'
              }
            });
            
            // Connect partner to current application
            countryEdges.push({
              id: `e-${partnerKey}-current`,
              source: partnerId,
              target: currentId,
              label: 'Suspended',
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed }
            });
          }
        });
      }
    }
  });
  
  return { nodes: countryNodes, edges: countryEdges };
};

// Generate nodes and edges for item-based view
const generateItemViewDiagram = () => {
  // Check if we have the item_specific_tariffs data
  if (!tariffPolicyData.item_specific_tariffs) {
    console.error('No item specific tariffs data found');
    return { nodes: [], edges: [] };
  }
  
  const itemNodes: Node[] = [];
  const itemEdges: Edge[] = [];
  
  // Create root node
  itemNodes.push({
    id: 'item-root',
    type: 'input',
    data: { label: 'Tariffs by Product Category' },
    position: { x: 0, y: 0 },
    style: { 
      fontWeight: 'bold', 
      fontSize: '1.2em', 
      width: 250, 
      textAlign: 'center', 
      background: '#5D70B4', 
      color: 'white', 
      border: 'none',
      borderRadius: '8px' 
    }
  });
  
  // Define product categories
  const productCategories = [
    { id: 'automotive', label: 'Automotive', data: tariffPolicyData.item_specific_tariffs.automotive },
    { id: 'steel-aluminum', label: 'Steel & Aluminum', data: tariffPolicyData.item_specific_tariffs.steel_aluminum },
    { id: 'electronics', label: 'Electronics & Technology', data: tariffPolicyData.item_specific_tariffs.electronics_technology },
    { id: 'apparel', label: 'Apparel & Textiles', data: tariffPolicyData.item_specific_tariffs.apparel_textiles },
    { id: 'agricultural', label: 'Agricultural Products', data: tariffPolicyData.item_specific_tariffs.agricultural_products },
    { id: 'other-items', label: 'Other Items', data: tariffPolicyData.item_specific_tariffs.other_items }
  ];
  
  // Create nodes and edges for each product category
  productCategories.forEach((category) => {
    const categoryId = `item-${category.id}`;
    
    // Create category node
    itemNodes.push({
      id: categoryId,
      data: { 
        label: category.label, 
        itemData: category.data 
      },
      position: { x: 0, y: 0 },
      style: { 
        border: '1px solid #ccc', 
        padding: 8, 
        width: 160, 
        textAlign: 'center',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    });
    
    // Connect root to category
    itemEdges.push({
      id: `e-root-${category.id}`,
      source: 'item-root',
      target: categoryId,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed }
    });
    
    // Process Automotive category
    if (category.id === 'automotive') {
      const automotiveData = category.data as AutomotiveTariff; // Type assertion
      // Add completed vehicles node
      if (automotiveData.completed_vehicles_import) {
        const vehiclesId = `${categoryId}-vehicles`;
        itemNodes.push({
          id: vehiclesId,
          data: { 
            label: 'Completed Vehicles',
            details: automotiveData.completed_vehicles_import
          },
          position: { x: 0, y: 0 },
          style: { 
            width: 160, 
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect category to vehicles
        itemEdges.push({
          id: `e-${category.id}-vehicles`,
          source: categoryId,
          target: vehiclesId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
        
        // Add tariff rate node
        const vehicleTariffId = `${vehiclesId}-tariff`;
        itemNodes.push({
          id: vehicleTariffId,
          type: 'output',
          data: { 
            label: `Tariff: ${automotiveData.completed_vehicles_import.tariff_rate}`,
            keyword: 'Vehicles Tariff',
            details: automotiveData.completed_vehicles_import
          },
          position: { x: 0, y: 0 },
          style: {
            background: '#5D70B4',
            color: 'white',
            width: 160,
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect vehicles to tariff
        itemEdges.push({
          id: `e-vehicles-tariff`,
          source: vehiclesId,
          target: vehicleTariffId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
      }
      
      // Add auto parts node
      if (automotiveData.auto_parts) {
        const partsId = `${categoryId}-parts`;
        itemNodes.push({
          id: partsId,
          data: { 
            label: 'Auto Parts',
            details: automotiveData.auto_parts
          },
          position: { x: 0, y: 0 },
          style: { 
            width: 160, 
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect category to parts
        itemEdges.push({
          id: `e-${category.id}-parts`,
          source: categoryId,
          target: partsId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
        
        // Add tariff rate node
        const partsTariffId = `${partsId}-tariff`;
        itemNodes.push({
          id: partsTariffId,
          type: 'output',
          data: { 
            label: `Tariff: ${automotiveData.auto_parts.tariff_rate}`,
            keyword: 'Auto Parts Tariff',
            details: automotiveData.auto_parts
          },
          position: { x: 0, y: 0 },
          style: {
            background: '#5D70B4',
            color: 'white',
            width: 160,
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect parts to tariff
        itemEdges.push({
          id: `e-parts-tariff`,
          source: partsId,
          target: partsTariffId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
      }
      
      // Add special provisions if available
      if (automotiveData.special_provisions && Array.isArray(automotiveData.special_provisions)) {
        const provisionsId = `${categoryId}-provisions`;
        itemNodes.push({
          id: provisionsId,
          data: { 
            label: 'Special Provisions',
            details: automotiveData.special_provisions
          },
          position: { x: 0, y: 0 },
          style: { 
            width: 160, 
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect category to provisions
        itemEdges.push({
          id: `e-${category.id}-provisions`,
          source: categoryId,
          target: provisionsId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
        
        // Add each provision as a node
        automotiveData.special_provisions.forEach((provision: string, provIdx: number) => {
          const provisionId = `${provisionsId}-${provIdx}`;
          itemNodes.push({
            id: provisionId,
            type: 'output',
            data: { 
              label: provision,
              keyword: `Auto Provision ${provIdx+1}`,
              details: { provision }
            },
            position: { x: 0, y: 0 },
            style: {
              background: '#82D0D4',
              color: 'black',
              width: 200,
              textAlign: 'center',
              borderRadius: '4px'
            }
          });
          
          // Connect provisions to specific provision
          itemEdges.push({
            id: `e-provisions-${provIdx}`,
            source: provisionsId,
            target: provisionId,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed }
          });
        });
      }
    }
    
    // Process Steel & Aluminum category
    else if (category.id === 'steel-aluminum') {
      const steelAluminumData = category.data as SteelAluminumTariff; // Type assertion
      // Add steel imports node
      if (steelAluminumData.steel_imports) {
        const steelId = `${categoryId}-steel`;
        itemNodes.push({
          id: steelId,
          data: { 
            label: 'Steel Imports',
            details: steelAluminumData.steel_imports
          },
          position: { x: 0, y: 0 },
          style: { 
            width: 160, 
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect category to steel
        itemEdges.push({
          id: `e-${category.id}-steel`,
          source: categoryId,
          target: steelId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
        
        // Add tariff rate node
        const steelTariffId = `${steelId}-tariff`;
        itemNodes.push({
          id: steelTariffId,
          type: 'output',
          data: { 
            label: `Tariff: ${steelAluminumData.steel_imports.tariff_rate}`,
            keyword: 'Steel Tariff',
            details: steelAluminumData.steel_imports
          },
          position: { x: 0, y: 0 },
          style: {
            background: '#5D70B4',
            color: 'white',
            width: 160,
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect steel to tariff
        itemEdges.push({
          id: `e-steel-tariff`,
          source: steelId,
          target: steelTariffId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
      }
      
      // Add aluminum imports node
      if (steelAluminumData.aluminum_imports) {
        const aluminumId = `${categoryId}-aluminum`;
        itemNodes.push({
          id: aluminumId,
          data: { 
            label: 'Aluminum Imports',
            details: steelAluminumData.aluminum_imports
          },
          position: { x: 0, y: 0 },
          style: { 
            width: 160, 
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect category to aluminum
        itemEdges.push({
          id: `e-${category.id}-aluminum`,
          source: categoryId,
          target: aluminumId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
        
        // Add tariff rate node
        const aluminumTariffId = `${aluminumId}-tariff`;
        itemNodes.push({
          id: aluminumTariffId,
          type: 'output',
          data: { 
            label: `Tariff: ${steelAluminumData.aluminum_imports.tariff_rate}`,
            keyword: 'Aluminum Tariff',
            details: steelAluminumData.aluminum_imports
          },
          position: { x: 0, y: 0 },
          style: {
            background: '#5D70B4',
            color: 'white',
            width: 160,
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect aluminum to tariff
        itemEdges.push({
          id: `e-aluminum-tariff`,
          source: aluminumId,
          target: aluminumTariffId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
      }
    }
    
    // Process Electronics & Technology category
    else if (category.id === 'electronics') {
      const electronicsData = category.data as ElectronicsTechnologyTariff; // Type assertion
      // Add smartphones & electronics node
      if (electronicsData.smartphones_computers_other_electronics) {
        const electronicsId = `${categoryId}-electronics`;
        itemNodes.push({
          id: electronicsId,
          data: { 
            label: 'Smartphones & Electronics',
            details: electronicsData.smartphones_computers_other_electronics
          },
          position: { x: 0, y: 0 },
          style: { 
            width: 180, 
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect category to electronics
        itemEdges.push({
          id: `e-${category.id}-electronics`,
          source: categoryId,
          target: electronicsId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
        
        // Add exemption node
        const exemptionId = `${electronicsId}-exemption`;
        itemNodes.push({
          id: exemptionId,
          type: 'output',
          data: { 
            label: electronicsData.smartphones_computers_other_electronics.tariff,
            keyword: 'Electronics Exemption',
            details: electronicsData.smartphones_computers_other_electronics
          },
          position: { x: 0, y: 0 },
          style: {
            background: '#82D0D4',
            color: 'black',
            width: 220,
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect electronics to exemption
        itemEdges.push({
          id: `e-electronics-exemption`,
          source: electronicsId,
          target: exemptionId,
          label: 'April 11th',
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
      }
      
      // Add Chinese products special case
      if (electronicsData.chinese_products) {
        const chineseId = `${categoryId}-chinese`;
        itemNodes.push({
          id: chineseId,
          data: { 
            label: 'Chinese Products',
            details: { note: electronicsData.chinese_products }
          },
          position: { x: 0, y: 0 },
          style: { 
            width: 160, 
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect category to Chinese products
        itemEdges.push({
          id: `e-${category.id}-chinese`,
          source: categoryId,
          target: chineseId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
        
        // Add fentanyl tariff node
        const fentanylId = `${chineseId}-fentanyl`;
        itemNodes.push({
          id: fentanylId,
          type: 'output',
          data: { 
            label: '20% Fentanyl Tariff Remains',
            keyword: 'Chinese Electronics Fentanyl Tariff',
            details: { note: electronicsData.chinese_products }
          },
          position: { x: 0, y: 0 },
          style: {
            background: '#5D70B4',
            color: 'white',
            width: 180,
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect Chinese to fentanyl tariff
        itemEdges.push({
          id: `e-chinese-fentanyl`,
          source: chineseId,
          target: fentanylId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
      }
    }
    
    // Process other categories with simpler structures
    else {
      // Get the main tariff rate if available
      if ('tariff_rate' in category.data && typeof (category.data as ApparelTextilesTariff | AgriculturalProductsTariff).tariff_rate === 'string') {
        const tariffId = `${categoryId}-tariff`;
        itemNodes.push({
          id: tariffId,
          type: 'output',
          data: { 
            label: `Tariff: ${(category.data as ApparelTextilesTariff | AgriculturalProductsTariff).tariff_rate}`,
            keyword: `${category.label} Tariff`,
            details: category.data
          },
          position: { x: 0, y: 0 },
          style: {
            background: '#5D70B4',
            color: 'white',
            width: 180,
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect category to tariff
        itemEdges.push({
          id: `e-${category.id}-tariff`,
          source: categoryId,
          target: tariffId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
      }
      
      // Handle price impacts if available
      if ('price_impact' in category.data) {
        const priceImpactData = (category.data as ApparelTextilesTariff | AgriculturalProductsTariff).price_impact;
        const impactId = `${categoryId}-impact`;
        const impactLabel = typeof priceImpactData === 'string' 
          ? priceImpactData 
          : 'Price Impacts';
        
        itemNodes.push({
          id: impactId,
          data: { 
            label: impactLabel,
            details: priceImpactData
          },
          position: { x: 0, y: 0 },
          style: { 
            width: 160, 
            textAlign: 'center',
            borderRadius: '4px'
          }
        });
        
        // Connect category to impact
        itemEdges.push({
          id: `e-${category.id}-impact`,
          source: categoryId,
          target: impactId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed }
        });
        
        // If price_impact is an object with nested properties
        if (typeof priceImpactData === 'object' && priceImpactData !== null) {
          // Add detailed impact nodes for key aspects
          Object.keys(priceImpactData).forEach((impactKey /*, impIdx removed */) => {
            if (impactKey !== 'outlook') { // Skip outlook for now
              const detailId = `${impactId}-${impactKey}`;
              const detailValue = (priceImpactData as Record<string, string>)[impactKey];
              
              itemNodes.push({
                id: detailId,
                type: 'output',
                data: { 
                  label: `${impactKey}: ${detailValue}`,
                  keyword: `${category.label} ${impactKey} Impact`,
                  details: { [impactKey]: detailValue }
                },
                position: { x: 0, y: 0 },
                style: {
                  background: '#82D0D4',
                  color: 'black',
                  width: 180,
                  textAlign: 'center',
                  borderRadius: '4px'
                }
              });
              
              // Connect impact to detail
              itemEdges.push({
                id: `e-impact-${impactKey}`,
                source: impactId,
                target: detailId,
                type: 'smoothstep',
                markerEnd: { type: MarkerType.ArrowClosed }
              });
            }
          });
          
          // Add outlook node if available
          if (typeof priceImpactData === 'object' && priceImpactData !== null && 'outlook' in priceImpactData && typeof (priceImpactData as { outlook?: string }).outlook === 'string') {
            const outlookId = `${impactId}-outlook`;
            itemNodes.push({
              id: outlookId,
              type: 'output',
              data: { 
                label: `Outlook: ${(priceImpactData as { outlook?: string }).outlook}`,
                keyword: `${category.label} Outlook`,
                details: { outlook: (priceImpactData as { outlook?: string }).outlook }
              },
              position: { x: 0, y: 0 },
              style: {
                background: '#82D0D4',
                color: 'black',
                width: 200,
                textAlign: 'center',
                borderRadius: '4px'
              }
            });
            
            // Connect impact to outlook
            itemEdges.push({
              id: `e-impact-outlook`,
              source: impactId,
              target: outlookId,
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed }
            });
          }
        }
      }
    }
  });
  
  return { nodes: itemNodes, edges: itemEdges };
};

// Component to select view type (policy, country, item)
const ViewTypeSelector = ({ viewType, setViewType }: { viewType: ViewType, setViewType: (type: ViewType) => void }) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      marginBottom: '20px',
      gap: '10px'
    }}>
      <button 
        onClick={() => setViewType('policy')}
        style={{ 
          padding: '8px 16px',
          backgroundColor: viewType === 'policy' ? 'var(--accent-color)' : 'var(--sidebar-bg)',
          color: viewType === 'policy' ? 'white' : 'var(--foreground)',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: viewType === 'policy' ? 'bold' : 'normal'
        }}
      >
        Policy View
      </button>
      <button 
        onClick={() => setViewType('country')}
        style={{ 
          padding: '8px 16px',
          backgroundColor: viewType === 'country' ? 'var(--accent-color)' : 'var(--sidebar-bg)',
          color: viewType === 'country' ? 'white' : 'var(--foreground)',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: viewType === 'country' ? 'bold' : 'normal'
        }}
      >
        By Country
      </button>
      <button 
        onClick={() => setViewType('item')}
        style={{ 
          padding: '8px 16px',
          backgroundColor: viewType === 'item' ? 'var(--accent-color)' : 'var(--sidebar-bg)',
          color: viewType === 'item' ? 'white' : 'var(--foreground)',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: viewType === 'item' ? 'bold' : 'normal'
        }}
      >
        By Product
      </button>
    </div>
  );
};

// Interface for detailed node data to be shown in info panel
interface DetailedNodeInfo {
  title: string;
  description?: string;
  details?: {
    label: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
  }[];
  relatedLinks?: {
    label: string;
    id: string;
  }[];
}

export default function TariffDiagram() {
  const [viewType, setViewType] = useState<ViewType>('policy');
  const [, setNodes] = useNodesState([]);
  const [, setEdges] = useEdgesState([]);
  const { setSelectedTariffKeyword } = useSharedState();

  // Remove unused state variables
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<DetailedNodeInfo | null>(null);

  // Load tariff policy data
  useEffect(() => {
    console.log('Loaded tariff policy data:', tariffPolicyData);
  }, []);

  // Initialize diagram based on current view type
  useEffect(() => {
    let nodesCopy;
    let edgesCopy;
    let layoutedElements;

    if (viewType === 'policy') {
      nodesCopy = initialNodes.map(n => ({ ...n, data: { ...n.data }, style: { ...n.style } }));
      edgesCopy = initialEdges.map(e => ({ ...e, style: { ...e.style } }));
      layoutedElements = getLayoutedElements(nodesCopy, edgesCopy);
    } 
    else if (viewType === 'country') {
      const countryDiagram = generateCountryViewDiagram();
      layoutedElements = getLayoutedElements(countryDiagram.nodes, countryDiagram.edges);
    }
    else if (viewType === 'item') {
      const itemDiagram = generateItemViewDiagram();
      layoutedElements = getLayoutedElements(itemDiagram.nodes, itemDiagram.edges);
    }

    if (layoutedElements) {
      setNodes(layoutedElements.nodes);
      setEdges(layoutedElements.edges);
    }
    
    setSelectedTariffKeyword(null);
    setSelectedNodeInfo(null);
    
  }, [viewType, setNodes, setEdges, setSelectedTariffKeyword]);

  // Detail panel component
  const DetailPanel = () => {
    if (!selectedNodeInfo) return null;
    
    return (
      <div style={{
        position: 'absolute',
        right: '20px',
        top: '100px',
        width: '300px',
        padding: '15px',
        backgroundColor: 'var(--main-content-bg)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: '8px',
        zIndex: 10,
        border: '1px solid var(--border-color)',
        maxHeight: '600px',
        overflowY: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '15px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '10px' 
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '16px',
            color: 'var(--foreground)',
            fontWeight: 'bold'
          }}>{selectedNodeInfo.title}</h3>
          <button 
            onClick={() => setSelectedNodeInfo(null)}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '16px',
              color: 'var(--foreground)',
              padding: '4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg-color)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>
        
        {selectedNodeInfo.description && (
          <p style={{ 
            margin: '10px 0', 
            fontSize: '14px',
            color: 'var(--foreground)',
          }}>{selectedNodeInfo.description}</p>
        )}
        
        {selectedNodeInfo.details && selectedNodeInfo.details.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            {selectedNodeInfo.details.map((detail, idx) => (
              <div key={idx} style={{ 
                marginBottom: '10px',
                padding: '8px',
                backgroundColor: idx % 2 === 0 ? 'var(--sidebar-bg)' : 'transparent',
                borderRadius: '4px'
              }}>
                <strong style={{ 
                  fontSize: '13px',
                  color: 'var(--accent-color)',
                  display: 'block',
                  marginBottom: '3px'
                }}>{detail.label}:</strong> 
                <span style={{ 
                  fontSize: '14px', 
                  color: 'var(--foreground)',
                  wordBreak: 'break-word',
                  whiteSpace: typeof detail.value === 'object' && detail.value !== null ? 'pre-wrap' : 'normal',
                  fontFamily: typeof detail.value === 'object' && detail.value !== null ? 'monospace' : 'inherit'
                }}>
                  {typeof detail.value === 'object' && detail.value !== null
                    ? JSON.stringify(detail.value, null, 2)
                    : detail.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Replace React Flow with static SVG
  const StaticDiagram = ({ viewType }: { viewType: ViewType }) => {
    const [selectedNodeInfo] = useState<DetailedNodeInfo | null>(null);

    const renderPolicyView = () => (
      <svg width="100%" height="600" viewBox="0 0 800 600">
        {/* Root node */}
        <g transform="translate(400,50)">
          <rect x="-100" y="-30" width="200" height="60" rx="10" fill="#5D70B4" />
          <text x="0" y="5" textAnchor="middle" fill="white" fontSize="16">Trump 2025 Tariff Policy</text>
        </g>

        {/* Main branches */}
        <g transform="translate(400,150)">
          <line x1="0" y1="0" x2="-200" y2="100" stroke="var(--foreground)" strokeWidth="2" />
          <line x1="0" y1="0" x2="0" y2="100" stroke="var(--foreground)" strokeWidth="2" />
          <line x1="0" y1="0" x2="200" y2="100" stroke="var(--foreground)" strokeWidth="2" />
          
          {/* Branch labels */}
          <text x="-200" y="120" textAnchor="middle" fill="var(--foreground)">China</text>
          <text x="0" y="120" textAnchor="middle" fill="var(--foreground)">Canada/Mexico</text>
          <text x="200" y="120" textAnchor="middle" fill="var(--foreground)">Other Regions</text>
        </g>

        {/* Add more static elements as needed */}
      </svg>
    );

    const renderCountryView = () => (
      <svg width="100%" height="600" viewBox="0 0 800 600">
        {/* Similar structure for country view */}
      </svg>
    );

    const renderItemView = () => (
      <svg width="100%" height="600" viewBox="0 0 800 600">
        {/* Similar structure for item view */}
      </svg>
    );

    return (
      <div style={{ width: '100%', height: '800px', position: 'relative', padding: '15px' }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 15px 0', color: 'var(--foreground)' }}>
          Trump 2025 Tariff Policy Visualization
        </h2>
        
        <ViewTypeSelector viewType={viewType} setViewType={setViewType} />
        
        <div style={{ 
          height: '600px', 
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          {viewType === 'policy' && renderPolicyView()}
          {viewType === 'country' && renderCountryView()}
          {viewType === 'item' && renderItemView()}
        </div>

        {selectedNodeInfo && (
          <DetailPanel />
        )}
      </div>
    );
  };

  return <StaticDiagram viewType={viewType} />;
} 