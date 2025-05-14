'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSharedState } from '@/context/AppContext';
import G6 from '@antv/g6';
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

// G6용 트리 데이터 인터페이스 정의
interface G6TreeNode {
  id: string;
  label: string;
  style?: Record<string, any>;
  children?: G6TreeNode[];
  type?: string;
  labelCfg?: {
    style?: Record<string, any>;
  };
  keyword?: string;
  details?: any;
}

// 초기 노드와 엣지 정의 부분은 유지 (데이터 변환에 사용할 수 있음)
// ... 기존 initialNodes 및 initialEdges 유지 ...

// G6 Tree 데이터 생성 함수 - Policy View
const generatePolicyViewData = (): G6TreeNode => {
  return {
    id: 'root',
    label: 'Trump 2025 Tariff Policy',
    style: {
      fill: '#5D70B4',
      stroke: '#5D70B4',
      radius: 4,
    },
    labelCfg: {
      style: {
        fill: 'white',
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    children: [
      {
        id: 'china',
        label: 'China',
        style: {
          fill: '#fff',
          stroke: '#ccc',
        },
        children: [
          {
            id: 'china-q1',
            label: 'April 11th Exemption?',
            style: {
              fill: '#f4f4f4',
              stroke: '#ddd',
            },
            children: [
              {
                id: 'china-a1-yes',
                label: '20% Fentanyl Tariff',
                keyword: 'China Fentanyl Tariff',
                style: {
                  fill: '#82D0D4',
                  stroke: '#82D0D4',
                },
                labelCfg: {
                  style: {
                    fill: 'black',
                  },
                },
              },
              {
                id: 'china-a1-no',
                label: '145% Tariff',
                keyword: 'China 145% Tariff',
                style: {
                  fill: '#5D70B4',
                  stroke: '#5D70B4',
                },
                labelCfg: {
                  style: {
                    fill: 'white',
                  },
                },
                children: [
                  {
                    id: 'china-a1-temp-us',
                    label: '30% Tariff (90 days, US→China)',
                    keyword: 'US to China 30% Tariff 90 days',
                    details: { 
                      description: 'US and China agreed in June 2025 to significantly reduce tariffs for 90 days. The US reduced tariffs on Chinese imports from 145% to 30% for a 90-day period.' 
                    },
                    style: {
                      fill: '#FFD700',
                      stroke: '#5D70B4',
                      lineDash: [4, 2],
                    },
                    labelCfg: {
                      style: {
                        fill: 'black',
                      },
                    },
                  },
                  {
                    id: 'china-a1-temp-cn',
                    label: '10% Tariff (90 days, China→US)',
                    keyword: 'China to US 10% Tariff 90 days',
                    details: { 
                      description: 'China also reduced tariffs on US imports from 125% to 10% for a 90-day period.'
                    },
                    style: {
                      fill: '#FFD700',
                      stroke: '#5D70B4',
                      lineDash: [4, 2],
                    },
                    labelCfg: {
                      style: {
                        fill: 'black',
                      },
                    },
                  },
                  {
                    id: 'china-q2',
                    label: '>20% of Content from US?',
                    style: {
                      fill: '#f4f4f4',
                      stroke: '#ddd',
                    },
                    children: [
                      {
                        id: 'china-a2-yes',
                        label: 'US Content Is Tariff Free; Non-US Content Tariffed at 145%',
                        keyword: 'China 145% US Content Free',
                        style: {
                          fill: '#82D0D4',
                          stroke: '#82D0D4',
                        },
                        labelCfg: {
                          style: {
                            fill: 'black',
                          },
                        },
                      },
                      {
                        id: 'china-a2-no',
                        label: '145% Tariff on Full Customs Value',
                        keyword: 'China 145% Full Value',
                        style: {
                          fill: '#82D0D4',
                          stroke: '#82D0D4',
                        },
                        labelCfg: {
                          style: {
                            fill: 'black',
                          },
                        },
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'can-mex',
        label: 'Canada/Mexico',
        style: {
          fill: '#fff',
          stroke: '#ccc',
        },
        children: [
          {
            id: 'canmex-q1',
            label: 'USMCA Compliant?',
            style: {
              fill: '#f4f4f4',
              stroke: '#ddd',
            },
            children: [
              {
                id: 'canmex-a1-yes',
                label: 'No Tariffs',
                keyword: 'Canada/Mexico USMCA No Tariffs',
                style: {
                  fill: '#82D0D4',
                  stroke: '#82D0D4',
                },
                labelCfg: {
                  style: {
                    fill: 'black',
                  },
                },
              },
              {
                id: 'canmex-a1-no',
                label: '25% Tariff',
                keyword: 'Canada/Mexico Non-USMCA 25% Tariff',
                style: {
                  fill: '#5D70B4',
                  stroke: '#5D70B4',
                },
                labelCfg: {
                  style: {
                    fill: 'white',
                  },
                },
                children: [
                  {
                    id: 'canmex-q2',
                    label: 'April 11th Exemption?',
                    style: {
                      fill: '#f4f4f4',
                      stroke: '#ddd',
                    },
                    children: [
                      {
                        id: 'canmex-a2-yes',
                        label: 'No Tariffs',
                        keyword: 'Canada/Mexico Non-USMCA No Tariffs Exemption',
                        style: {
                          fill: '#82D0D4',
                          stroke: '#82D0D4',
                        },
                        labelCfg: {
                          style: {
                            fill: 'black',
                          },
                        },
                      },
                      {
                        id: 'canmex-a2-no',
                        label: '25% Tariff',
                        keyword: 'Canada/Mexico Non-USMCA 25% No Exemption',
                        style: {
                          fill: '#5D70B4',
                          stroke: '#5D70B4',
                        },
                        labelCfg: {
                          style: {
                            fill: 'white',
                          },
                        },
                        children: [
                          {
                            id: 'canmex-q3',
                            label: '>20% of Content from US?',
                            style: {
                              fill: '#f4f4f4',
                              stroke: '#ddd',
                            },
                            children: [
                              {
                                id: 'canmex-a3-yes',
                                label: 'US Content Is Tariff Free; Non-US Content Tariffed at 25%',
                                keyword: 'Canada/Mexico 25% US Content Free',
                                style: {
                                  fill: '#82D0D4',
                                  stroke: '#82D0D4',
                                },
                                labelCfg: {
                                  style: {
                                    fill: 'black',
                                  },
                                },
                              },
                              {
                                id: 'canmex-a3-no',
                                label: '25% Tariff on Full Customs Value',
                                keyword: 'Canada/Mexico 25% Full Value',
                                style: {
                                  fill: '#82D0D4',
                                  stroke: '#82D0D4',
                                },
                                labelCfg: {
                                  style: {
                                    fill: 'black',
                                  },
                                },
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'other-regions',
        label: 'All Other Regions',
        style: {
          fill: '#fff',
          stroke: '#ccc',
        },
        children: [
          {
            id: 'other-q1',
            label: 'April 11th Exemption?',
            style: {
              fill: '#f4f4f4',
              stroke: '#ddd',
            },
            children: [
              {
                id: 'other-a1-yes',
                label: 'No Tariffs',
                keyword: 'Other Regions No Tariffs Exemption',
                style: {
                  fill: '#82D0D4',
                  stroke: '#82D0D4',
                },
                labelCfg: {
                  style: {
                    fill: 'black',
                  },
                },
              },
              {
                id: 'other-a1-no',
                label: '10% Tariff',
                keyword: 'Other Regions 10% Tariff',
                style: {
                  fill: '#5D70B4',
                  stroke: '#5D70B4',
                },
                labelCfg: {
                  style: {
                    fill: 'white',
                  },
                },
                children: [
                  {
                    id: 'other-q2',
                    label: '>20% of Content from US?',
                    style: {
                      fill: '#f4f4f4',
                      stroke: '#ddd',
                    },
                    children: [
                      {
                        id: 'other-a2-yes',
                        label: 'US Content Is Tariff Free; Non-US Content Tariffed at 10%',
                        keyword: 'Other Regions 10% US Content Free',
                        style: {
                          fill: '#82D0D4',
                          stroke: '#82D0D4',
                        },
                        labelCfg: {
                          style: {
                            fill: 'black',
                          },
                        },
                      },
                      {
                        id: 'other-a2-no',
                        label: '10% Tariff on Full Customs Value',
                        keyword: 'Other Regions 10% Full Value',
                        style: {
                          fill: '#82D0D4',
                          stroke: '#82D0D4',
                        },
                        labelCfg: {
                          style: {
                            fill: 'black',
                          },
                        },
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };
};

// G6 Tree 데이터 생성 함수 - Country View
const generateCountryViewData = (): G6TreeNode => {
  if (!tariffPolicyData.regional_tariffs) {
    console.error('No regional tariffs data found');
    return { id: 'empty', label: 'No data available' };
  }
  
  const rootNode: G6TreeNode = {
    id: 'country-root',
    label: 'Tariffs by Country/Region',
    style: {
      fill: '#5D70B4',
      stroke: '#5D70B4',
      radius: 4,
    },
    labelCfg: {
      style: {
        fill: 'white',
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    children: []
  };

  // 주요 국가/지역 노드 추가
  const countries = [
    { id: 'china', label: 'China', data: tariffPolicyData.regional_tariffs.china },
    { id: 'canada-mexico', label: 'Canada/Mexico', data: tariffPolicyData.regional_tariffs.canada_mexico },
    { id: 'eu', label: 'European Union', data: tariffPolicyData.regional_tariffs.european_union },
    { id: 'other-partners', label: 'Other Major Partners', data: tariffPolicyData.regional_tariffs.other_major_trade_partners }
  ];

  countries.forEach(country => {
    const countryNode: G6TreeNode = {
      id: `country-${country.id}`,
      label: country.label,
      style: {
        fill: '#fff',
        stroke: '#ccc',
      },
      children: []
    };

    // 국가별 자식 노드 추가 (기존 코드에서 변환)
    if (country.id === 'china') {
      const chinaData = country.data as ChinaRegionalTariff;
      if (chinaData.base_tariff_rate) {
        countryNode.children = countryNode.children || [];
        countryNode.children.push({
          id: `${countryNode.id}-base-tariff`,
          label: `Base Tariff: ${chinaData.base_tariff_rate}`,
          keyword: 'China Base Tariff',
          details: chinaData,
          style: {
            fill: '#5D70B4',
            stroke: '#5D70B4',
          },
          labelCfg: {
            style: {
              fill: 'white',
            },
          }
        });
      }
      
      // 특별 조항 추가
      if (chinaData.special_provisions && Array.isArray(chinaData.special_provisions)) {
        chinaData.special_provisions.forEach((provision: ChinaSpecialProvision, idx: number) => {
          const provisionNode: G6TreeNode = {
            id: `${countryNode.id}-provision-${idx}`,
            label: provision.category,
            details: provision,
            style: {
              fill: '#f4f4f4',
              stroke: '#ddd',
            }
          };
          
          if (provision.tariff_rate) {
            provisionNode.children = [{
              id: `${provisionNode.id}-rate`,
              label: `Tariff: ${provision.tariff_rate}`,
              keyword: `China ${provision.category} Tariff`,
              details: provision,
              style: {
                fill: '#82D0D4',
                stroke: '#82D0D4',
              },
              labelCfg: {
                style: {
                  fill: 'black',
                },
              }
            }];
          }
          
          countryNode.children = countryNode.children || [];
          countryNode.children.push(provisionNode);
        });
      }
    }
    
    // ... 다른 국가들에 대한 데이터 변환 로직도 필요에 따라 추가 ...
    
    // 루트 노드에 국가 노드 추가
    rootNode.children?.push(countryNode);
  });

  return rootNode;
};

// G6 Tree 데이터 생성 함수 - Item View
const generateItemViewData = (): G6TreeNode => {
  if (!tariffPolicyData.item_specific_tariffs) {
    console.error('No item specific tariffs data found');
    return { id: 'empty', label: 'No data available' };
  }
  
  const rootNode: G6TreeNode = {
    id: 'item-root',
    label: 'Tariffs by Product Category',
    style: {
      fill: '#5D70B4',
      stroke: '#5D70B4',
      radius: 4,
    },
    labelCfg: {
      style: {
        fill: 'white',
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    children: []
  };

  // 제품 카테고리 노드 추가
  const productCategories = [
    { id: 'automotive', label: 'Automotive', data: tariffPolicyData.item_specific_tariffs.automotive },
    { id: 'steel-aluminum', label: 'Steel & Aluminum', data: tariffPolicyData.item_specific_tariffs.steel_aluminum },
    { id: 'electronics', label: 'Electronics & Technology', data: tariffPolicyData.item_specific_tariffs.electronics_technology },
    { id: 'apparel', label: 'Apparel & Textiles', data: tariffPolicyData.item_specific_tariffs.apparel_textiles },
    { id: 'agricultural', label: 'Agricultural Products', data: tariffPolicyData.item_specific_tariffs.agricultural_products },
    { id: 'other-items', label: 'Other Items', data: tariffPolicyData.item_specific_tariffs.other_items }
  ];

  productCategories.forEach(category => {
    const categoryNode: G6TreeNode = {
      id: `item-${category.id}`,
      label: category.label,
      style: {
        fill: '#fff',
        stroke: '#ccc',
      },
      children: []
    };
    
    // 카테고리별 자식 노드 추가 (기존 코드에서 변환)
    // ...카테고리별 특화된 로직 추가...
    
    // 루트 노드에 카테고리 노드 추가
    rootNode.children?.push(categoryNode);
  });

  return rootNode;
};

// 뷰 타입 선택 컴포넌트
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
          backgroundColor: viewType === 'policy' ? '#5D70B4' : '#f0f0f0',
          color: viewType === 'policy' ? 'white' : '#333',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: viewType === 'policy' ? 'bold' : 'normal',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        Policy View
      </button>
      <button 
        onClick={() => setViewType('country')}
        style={{ 
          padding: '8px 16px',
          backgroundColor: viewType === 'country' ? '#5D70B4' : '#f0f0f0',
          color: viewType === 'country' ? 'white' : '#333',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: viewType === 'country' ? 'bold' : 'normal',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        By Country
      </button>
      <button 
        onClick={() => setViewType('item')}
        style={{ 
          padding: '8px 16px',
          backgroundColor: viewType === 'item' ? '#5D70B4' : '#f0f0f0',
          color: viewType === 'item' ? 'white' : '#333',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: viewType === 'item' ? 'bold' : 'normal',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        By Product
      </button>
    </div>
  );
};

// 세부 정보 패널 인터페이스
interface DetailedNodeInfo {
  title: string;
  description?: string;
  details?: {
    label: string;
    value: any;
  }[];
}

export default function TariffDiagram() {
  const [viewType, setViewType] = useState<ViewType>('policy');
  const { setSelectedTariffKeyword } = useSharedState();
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<DetailedNodeInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  useEffect(() => {
    // 컴포넌트가 마운트될 때 G6 등록
    if (!containerRef.current) return;
    
    // 모바일 장치 지원을 위한 기본 설정
    G6.registerNode(
      'rect-node',
      {
        draw(cfg: any, group: any) {
          const width = cfg.style?.width || 120;
          const height = cfg.style?.height || 40;
          const radius = cfg.style?.radius || 4;
          
          const keyshape = group.addShape('rect', {
            attrs: {
              x: -width / 2,
              y: -height / 2,
              width,
              height,
              radius,
              fill: cfg.style?.fill || '#fff',
              stroke: cfg.style?.stroke || '#ccc',
              cursor: 'pointer',
              lineWidth: 1.5,
              ...cfg.style,
            },
            name: 'rect-node-keyshape',
          });
          
          // 텍스트 추가
          group.addShape('text', {
            attrs: {
              text: cfg.label || '',
              x: 0,
              y: 0,
              textAlign: 'center',
              textBaseline: 'middle',
              fill: cfg.labelCfg?.style?.fill || '#333',
              fontSize: cfg.labelCfg?.style?.fontSize || 12,
              fontWeight: cfg.labelCfg?.style?.fontWeight || 'normal',
              cursor: 'pointer',
              ...cfg.labelCfg?.style,
            },
            name: 'rect-node-label',
          });
          
          return keyshape;
        },
      },
      'single-node',
    );
    
    return () => {
      if (graphRef.current) {
        graphRef.current.destroy();
        graphRef.current = null;
      }
    };
  }, []);

  // 뷰 타입에 따라 G6 트리 다이어그램 업데이트
  useEffect(() => {
    if (!containerRef.current) return;
    
    // 현재 뷰 타입에 따라 데이터 생성
    let treeData: G6TreeNode;
    if (viewType === 'policy') {
      treeData = generatePolicyViewData();
    } else if (viewType === 'country') {
      treeData = generateCountryViewData();
    } else {
      treeData = generateItemViewData();
    }
    
    // 기존 그래프가 있으면 제거
    if (graphRef.current) {
      graphRef.current.destroy();
    }
    
    // 컨테이너 너비 계산
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 600;
    
    // 새 그래프 인스턴스 생성
    graphRef.current = new G6.TreeGraph({
      container: container,
      width,
      height,
      modes: {
        default: ['drag-canvas', 'zoom-canvas'],
      },
      defaultNode: {
        type: 'rect-node',
        size: [120, 40],
        style: {
          fill: '#fff',
          stroke: '#ccc',
          radius: 4,
        },
        labelCfg: {
          style: {
            fill: '#333',
            fontSize: 12,
          },
        },
      },
      defaultEdge: {
        type: 'cubic-horizontal',
        style: {
          stroke: '#aaa',
          endArrow: true,
        },
      },
      layout: {
        type: 'compactBox',
        direction: 'LR',
        getId: function getId(d: any) {
          return d.id;
        },
        getHeight: function getHeight() {
          return 16;
        },
        getWidth: function getWidth() {
          return 16;
        },
        getVGap: function getVGap() {
          return 40;
        },
        getHGap: function getHGap() {
          return 70;
        },
      },
      fitView: true,
      animate: true,
    });
    
    // 노드 클릭 이벤트 처리
    graphRef.current.on('node:click', (e: any) => {
      const node = e.item.getModel();
      if (node.keyword) {
        setSelectedTariffKeyword(node.keyword);
        
        let details: { label: string; value: any }[] = [];
        let description = '';
        
        if (node.details) {
          if (typeof node.details === 'object') {
            description = node.details.description || '';
            
            details = Object.entries(node.details)
              .filter(([key]) => key !== 'description')
              .map(([key, value]) => ({
                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                value: value
              }));
          }
        }
        
        setSelectedNodeInfo({
          title: node.label,
          description,
          details: details.length > 0 ? details : undefined
        });
      }
    });
    
    // 데이터 로드 및 렌더링
    graphRef.current.data(treeData);
    graphRef.current.render();
    graphRef.current.fitView();
    
    // 창 크기 변경 대응
    const handleResize = () => {
      if (!containerRef.current || !graphRef.current) return;
      const container = containerRef.current;
      const width = container.clientWidth;
      graphRef.current.changeSize(width, 600);
      graphRef.current.fitView();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [viewType, setSelectedTariffKeyword]);

  // 세부 정보 패널 컴포넌트
  const DetailPanel = () => {
    if (!selectedNodeInfo) return null;
    
    return (
      <div style={{
        position: 'absolute',
        right: '20px',
        top: '100px',
        width: '300px',
        padding: '15px',
        backgroundColor: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: '8px',
        zIndex: 10,
        border: '1px solid #ddd',
        maxHeight: '600px',
        overflowY: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '15px',
          borderBottom: '1px solid #eee',
          paddingBottom: '10px' 
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '16px',
            color: '#333',
            fontWeight: 'bold'
          }}>{selectedNodeInfo.title}</h3>
          <button 
            onClick={() => setSelectedNodeInfo(null)}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '16px',
              color: '#666',
              padding: '4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>
        
        {selectedNodeInfo.description && (
          <p style={{ 
            margin: '10px 0', 
            fontSize: '14px',
            color: '#444',
          }}>{selectedNodeInfo.description}</p>
        )}
        
        {selectedNodeInfo.details && selectedNodeInfo.details.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            {selectedNodeInfo.details.map((detail, idx) => (
              <div key={idx} style={{ 
                marginBottom: '10px',
                padding: '8px',
                backgroundColor: idx % 2 === 0 ? '#f8f9fa' : 'transparent',
                borderRadius: '4px'
              }}>
                <strong style={{ 
                  fontSize: '13px',
                  color: '#5D70B4',
                  display: 'block',
                  marginBottom: '3px'
                }}>{detail.label}:</strong> 
                <span style={{ 
                  fontSize: '14px', 
                  color: '#333',
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

  // 다이어그램 사용 안내 컴포넌트
  const DiagramGuide = () => (
    <div style={{
      position: 'absolute',
      left: '20px',
      bottom: '20px',
      padding: '8px 12px',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '13px',
      color: '#666',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      maxWidth: '250px'
    }}>
      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>다이어그램 사용법:</p>
      <ul style={{ margin: '0', paddingLeft: '20px' }}>
        <li>캔버스를 드래그하여 이동</li>
        <li>마우스 휠로 확대/축소</li>
        <li>노드를 클릭하면 세부 정보 표시</li>
      </ul>
    </div>
  );

  // 컨테이너 스타일
  const containerStyles = {
    width: '100%',
    height: '800px',
    position: 'relative' as const,
    padding: '15px',
  };

  return (
    <div style={containerStyles}>
      <h2 style={{ textAlign: 'center', margin: '0 0 15px 0', color: '#333' }}>
        Trump 2025 Tariff Policy Visualization
      </h2>
      
      <ViewTypeSelector viewType={viewType} setViewType={setViewType} />
      
      <div 
        ref={containerRef} 
        style={{ 
          height: '600px', 
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          position: 'relative'
        }}
      >
        {/* G6 트리 그래프가 이 컨테이너에 렌더링됨 */}
      </div>
      
      <DiagramGuide />
      {selectedNodeInfo && <DetailPanel />}
    </div>
  );
} 