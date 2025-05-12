# Tariff Information Visualization Project

## Project Overview

This project is a web application that visualizes tariff information for hardware products imported into the United States and provides related news. Users can search for HS codes (Harmonized System classification), view tariff rates by country of origin through visual diagrams, and filter the latest tariff-related news.

## Why This Project Exists

This project was created after observing international trade professionals struggling to track and explain the constantly changing tariff news and regulations. Additionally, we noticed some people were misinterpreting or spreading inaccurate information about tariffs for various purposes. This project aims to provide people with accurate information about tariff rates.

## Key Features
- **HS Code Search**: Search for Harmonized System codes and descriptions to find product information
- **Tariff Rate Diagrams**: Visual diagrams showing tariff rates by origin (China, Canada/Mexico, other regions)
- **News Feed**: Latest tariff-related news provided via RSS feed with keyword filtering
- **Interactive UI**: Automatic news filtering based on selected items in the diagram
- **OR Search Support**: Enhanced news filtering with OR operators for more relevant results
- **Latest Tariff Updates**: Including the June 2025 US-China 90-day tariff reduction agreement

## Technology Stack
- **Framework**: [Next.js](https://nextjs.org/) (React-based full-stack framework)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Data Visualization**: [React Flow](https://reactflow.dev/)
- **Data Processing**: 
  - [PapaParse](https://www.papaparse.com/): CSV file parsing
  - [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser): RSS feed parsing
- **Type System**: [TypeScript](https://www.typescriptlang.org/)

## Live Demo

Visit our [live demo site](https://tariff-cyan.vercel.app/) to use the application directly.

## Project Structure

```
tariff/
├── public/                  # Static files and CSV data files
│   ├── Harmonized System Data.csv      # HS code data
│   └── Harmonized System Sections.csv  # HS section data
├── src/
│   ├── app/                 # Next.js app router
│   │   └── api/             # API routes
│   │       └── rss/         # RSS feed proxy API
│   ├── components/          # React components
│   │   ├── NewsFeed.tsx     # News feed component
│   │   └── TariffDiagram.tsx # Tariff rate diagram component
│   ├── context/             # React contexts
│   │   └── AppContext.tsx   # App state sharing context
│   └── lib/                 # Utility functions
│       └── dataHandler.ts   # CSV data processing logic
└── ...                      # Other configuration files
```

## Data Sources

- **HS Code Data**: `public/Harmonized System Data.csv`
- **HS Section Data**: `public/Harmonized System Sections.csv`
- **News Data**: External RSS feeds (fetched via API routes from Google News)
- **Tariff Policy Data**: JSON data structure representing current tariff policies

## Contributing

### For Developers

If you want to contribute to the source code:

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```
4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
5. Make your changes
6. Commit your changes: `git commit -m 'Add some amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Submit a Pull Request

### For Non-Developers

You can also contribute by:
- Reporting bugs
- Suggesting new features
- Improving documentation
- Sharing the project

## License

This project is distributed under the Apache 2.0 License. See the `LICENSE` file for more information.

## Contact

Project Manager: haebom@kakao.com
You can also report bugs or request features through [GitHub Issues](https://github.com/haebom/tariff/issues).

        