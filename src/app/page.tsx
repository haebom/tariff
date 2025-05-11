'use client';

// src/app/page.tsx

import HSSearchSidebar from "@/components/HSSearchSidebar";
import TariffDiagram from "@/components/TariffDiagram";
import NewsFeed from "@/components/NewsFeed";

export default function HomePage() {
  return (
    <main className="page-container"> {/* Corresponds to #container in CSS */}
      <HSSearchSidebar />
      
      <section className="main-content-area"> {/* Corresponds to #main-content */}
        <h2>Hardware Products Imported To The United States From</h2>
        <div id="tariff-visualization" className="tariff-visualization-container">
          <TariffDiagram />
        </div>
      </section>

      <aside className="sidebar" id="sidebar-right"> {/* Corresponds to #sidebar-right */}
        <h2>Latest News (Tariff)</h2>
        <NewsFeed />
      </aside>
    </main>
  );
}
