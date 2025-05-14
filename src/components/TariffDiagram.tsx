'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSharedState } from '@/context/AppContext';
import G6, { TreeGraph, INode, ShapeStyle, TreeGraphData, ModelConfig, IGroup, IShape } from '@antv/g6';
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

// Tree data interface definition for G6
interface G6TreeNode extends TreeGraphData {
  id: string;
  label: string;
  style?: ShapeStyle;
  children?: G6TreeNode[];
  type?: string;
  labelCfg?: {
    style?: ShapeStyle;
  };
  keyword?: string;
  details?: unknown;  // using unknown instead of any
}

// Using specific font weight type for G6
type G6FontWeight = 'normal' | 'bold' | 'bolder' | 'lighter' | number;

// G6 event object type definition
interface G6Event {
  item: INode;
  target: unknown;
  x: number;
  y: number;
  canvasX: number;
  canvasY: number;
}

// G6 Tree data generation function - Policy View
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

// Added TariffCalculationExample component to show $100 tariff calculation example
const TariffCalculationExample = () => {
  return (
    <div style={{
      position: 'absolute',
      right: '20px',
      bottom: '20px',
      padding: '15px',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: '8px',
      border: '1px solid #ddd',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      maxWidth: '300px',
      fontSize: '14px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Tariff Calculation Example:</h4>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '5px' }}>
          <strong>Product value:</strong> <span>$100.00</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '5px' }}>
          <strong>US content (30%):</strong> <span>$30.00</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '5px' }}>
          <strong>Non-US content (70%):</strong> <span>$70.00</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '5px' }}>
          <strong>Tariff rate:</strong> <span>25%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #5D70B4', paddingBottom: '5px', marginBottom: '5px' }}>
          <strong>Tariff applied to:</strong> <span>$70.00</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#5D70B4', fontSize: '16px' }}>
          <strong>Total tariff:</strong> <span>$17.50</span>
        </div>
      </div>
      <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
        Note: US content portion is exempt from tariff when it exceeds 20% of the total value.
      </p>
    </div>
  );
};

// Function to generate country view data
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
        fontWeight: 'bold' as G6FontWeight,
      },
    },
    children: []
  };

  // Add nodes for major countries/regions
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

    // Add child nodes for each country (transform from existing code)
    if (country.id === 'china') {
      // Explicitly type China data
      const chinaData = country.data as ChinaRegionalTariff;
      
      if (chinaData.base_tariff_rate) {
        countryNode.children = countryNode.children || [];
        countryNode.children.push({
          id: `${countryNode.id}-base-tariff`,
          label: `Base Tariff: ${chinaData.base_tariff_rate}`,
          keyword: 'China Base Tariff',
          details: chinaData as unknown,  // cast to unknown
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
      
      // Add special provisions
      if (chinaData.special_provisions && Array.isArray(chinaData.special_provisions)) {
        chinaData.special_provisions.forEach((provision: ChinaSpecialProvision, idx: number) => {
          const provisionNode: G6TreeNode = {
            id: `${countryNode.id}-provision-${idx}`,
            label: provision.category,
            details: provision as unknown,  // cast to unknown
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
              details: provision as unknown,  // cast to unknown
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
    
    // ... additional data transformation logic for other countries as needed ...
    
    // Add country node to root node
    rootNode.children?.push(countryNode);
  });

  return rootNode;
};

// Function to generate item view data
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

// View type selector component
const ViewTypeSelector = ({ viewType, setViewType }: { viewType: ViewType, setViewType: (type: ViewType) => void }) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      marginBottom: '20px',
      gap: '10px',
      flexWrap: 'wrap' // Allow buttons to wrap on mobile
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
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          margin: '4px' // Margin for mobile spacing
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
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          margin: '4px' // Margin for mobile spacing
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
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          margin: '4px' // Margin for mobile spacing
        }}
      >
        By Product
      </button>
    </div>
  );
};

// Detail panel interface
interface DetailedNodeInfo {
  title: string;
  description?: string;
  details?: {
    label: string;
    value: unknown;
  }[];
}

export default function TariffDiagram() {
  const [viewType, setViewType] = useState<ViewType>('policy');
  const { setSelectedTariffKeyword } = useSharedState();
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<DetailedNodeInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<TreeGraph | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    // Register G6 when component mounts
    if (!containerRef.current) return;
    
    // Basic settings for mobile device support
    G6.registerNode(
      'rect-node',
      {
        draw(cfg: ModelConfig, group: IGroup): IShape {
          if (!cfg || !group) return group.addShape('rect', { attrs: {x: 0, y: 0, width: 0, height: 0 }}); // Return default shape
          
          const style = cfg.style || {};
          const labelCfg = (cfg.labelCfg as { style?: ShapeStyle } || {});
          
          const width = (style.width as number) || 120;
          const height = (style.height as number) || 40;
          const radius = (style.radius as number) || 4;
          
          const keyshape = group.addShape('rect', {
            attrs: {
              x: -width / 2,
              y: -height / 2,
              width,
              height,
              radius,
              fill: (style.fill as string) || '#fff',
              stroke: (style.stroke as string) || '#ccc',
              cursor: 'pointer',
              lineWidth: 1.5,
              ...style,
            },
            name: 'rect-node-keyshape',
          });
          
          // Add text
          const labelStyle = labelCfg.style || {};
          group.addShape('text', {
            attrs: {
              text: cfg.label || '',
              x: 0,
              y: 0,
              textAlign: 'center',
              textBaseline: 'middle',
              fill: (labelStyle.fill as string) || '#333',
              fontSize: (labelStyle.fontSize as number) || 12,
              fontWeight: (labelStyle.fontWeight as G6FontWeight) || 'normal',
              cursor: 'pointer',
              ...labelStyle,
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

  // Update G6 tree diagram based on view type
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Generate data based on current view type
    let treeData: G6TreeNode;
    if (viewType === 'policy') {
      treeData = generatePolicyViewData();
    } else if (viewType === 'country') {
      treeData = generateCountryViewData();
    } else {
      treeData = generateItemViewData();
    }
    
    // Remove existing graph
    if (graphRef.current) {
      graphRef.current.destroy();
    }
    
    // Calculate container width
    const container = containerRef.current;
    const width = container.clientWidth;
    // Reduce height on mobile
    const height = isMobile ? 450 : 600;
    
    // Create new graph instance
    graphRef.current = new G6.TreeGraph({
      container: container,
      width,
      height,
      modes: {
        default: isMobile ? ['drag-canvas', 'zoom-canvas', 'drag-node'] : ['drag-canvas', 'zoom-canvas'],
      },
      defaultNode: {
        type: 'rect-node',
        size: isMobile ? [100, 35] : [120, 40],
        style: {
          fill: '#fff',
          stroke: '#ccc',
          radius: 4,
        },
        labelCfg: {
          style: {
            fill: '#333',
            fontSize: isMobile ? 10 : 12,
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
        getId: function getId(d: ModelConfig) {
          return d.id;
        },
        getHeight: function getHeight() {
          return isMobile ? 12 : 16;
        },
        getWidth: function getWidth() {
          return isMobile ? 12 : 16;
        },
        getVGap: function getVGap() {
          return isMobile ? 20 : 40;
        },
        getHGap: function getHGap() {
          return isMobile ? 50 : 70;
        },
      },
      fitView: true,
      animate: true,
      // Start smaller on mobile
      minZoom: isMobile ? 0.3 : 0.5,
      maxZoom: 2,
    });
    
    // Handle node click events
    graphRef.current.on('node:click', (e: G6Event) => {
      const nodeModel = e.item.getModel() as G6TreeNode;
      if (nodeModel.keyword) {
        setSelectedTariffKeyword(nodeModel.keyword);
        
        let details: { label: string; value: unknown }[] = [];
        let description = '';
        
        if (nodeModel.details) {
          if (typeof nodeModel.details === 'object' && nodeModel.details !== null) {
            // Explicitly check object type and null
            const detailsObj = nodeModel.details as Record<string, unknown>;
            description = (detailsObj.description as string) || '';
            
            details = Object.entries(detailsObj)
              .filter(([key]) => key !== 'description')
              .map(([key, value]) => ({
                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                value: value
              }));
          }
        }
        
        setSelectedNodeInfo({
          title: nodeModel.label,
          description,
          details: details.length > 0 ? details : undefined
        });
      }
    });
    
    // Load and render data
    graphRef.current.data(treeData);
    graphRef.current.render();
    graphRef.current.fitView();
    
    // Adjust initial zoom level on mobile
    if (isMobile) {
      graphRef.current.zoomTo(0.5);
    }
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !graphRef.current) return;
      const container = containerRef.current;
      const width = container.clientWidth;
      const height = isMobile ? 450 : 600;
      graphRef.current.changeSize(width, height);
      graphRef.current.fitView();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [viewType, setSelectedTariffKeyword, isMobile]);

  // Detail panel component
  const DetailPanel = () => {
    if (!selectedNodeInfo) return null;
    
    return (
      <div style={{
        position: 'absolute',
        right: isMobile ? '10px' : '20px',
        top: isMobile ? '70px' : '100px',
        width: isMobile ? 'calc(100% - 20px)' : '300px',
        padding: '15px',
        backgroundColor: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: '8px',
        zIndex: 10,
        border: '1px solid #ddd',
        maxHeight: isMobile ? '300px' : '600px',
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
            fontSize: isMobile ? '14px' : '16px',
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
            fontSize: isMobile ? '12px' : '14px',
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
                  fontSize: isMobile ? '11px' : '13px',
                  color: '#5D70B4',
                  display: 'block',
                  marginBottom: '3px'
                }}>{detail.label}:</strong> 
                <span style={{ 
                  fontSize: isMobile ? '12px' : '14px', 
                  color: '#333',
                  wordBreak: 'break-word',
                  whiteSpace: typeof detail.value === 'object' && detail.value !== null ? 'pre-wrap' : 'normal',
                  fontFamily: typeof detail.value === 'object' && detail.value !== null ? 'monospace' : 'inherit'
                }}>
                  {typeof detail.value === 'object' && detail.value !== null
                    ? JSON.stringify(detail.value, null, 2)
                    : String(detail.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Diagram usage guide component
  const DiagramGuide = () => (
    <div style={{
      position: 'absolute',
      left: isMobile ? '10px' : '20px',
      bottom: isMobile ? '10px' : '20px',
      padding: isMobile ? '6px 10px' : '8px 12px',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: isMobile ? '11px' : '13px',
      color: '#666',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      maxWidth: isMobile ? '200px' : '250px'
    }}>
      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>How to use this diagram:</p>
      <ul style={{ margin: '0', paddingLeft: '20px' }}>
        <li>Drag canvas to move</li>
        <li>Use mouse wheel to zoom in/out</li>
        <li>Click a node to view details</li>
        {isMobile && <li>Use two-finger gestures to zoom</li>}
      </ul>
    </div>
  );

  // Container styles
  const containerStyles = {
    width: '100%',
    height: isMobile ? '600px' : '800px',
    position: 'relative' as const,
    padding: isMobile ? '10px' : '15px',
  };

  return (
    <div style={containerStyles}>
      <h2 style={{ 
        textAlign: 'center', 
        margin: '0 0 15px 0', 
        color: '#333', 
        fontSize: isMobile ? '18px' : '24px'
      }}>
        Trump 2025 Tariff Policy Visualization
      </h2>
      
      <ViewTypeSelector viewType={viewType} setViewType={setViewType} />
      
      <div 
        ref={containerRef} 
        style={{ 
          height: isMobile ? '450px' : '600px', 
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          position: 'relative'
        }}
      >
        {/* G6 tree graph will be rendered in this container */}
      </div>
      
      <DiagramGuide />
      {selectedNodeInfo && <DetailPanel />}
      <TariffCalculationExample />
    </div>
  );
} 