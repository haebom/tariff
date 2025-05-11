'use client';

// src/app/page.tsx

import HSSearchSidebar from "@/components/HSSearchSidebar";
import TariffDiagram from "@/components/TariffDiagram";
import NewsFeed from "@/components/NewsFeed";

export default function HomePage() {
  return (
    <main className="page-container flex h-screen overflow-hidden bg-background text-foreground"> {/* Added flex, h-screen, overflow-hidden and base bg/text colors */}
      <HSSearchSidebar />
      
      <section className="main-content-area flex flex-col flex-grow overflow-hidden"> {/* Added flex, flex-col, overflow-hidden */}
        <h2 className="flex-shrink-0 p-4 text-center text-lg font-semibold border-b border-border-color">Hardware Products Imported To The United States From</h2> {/* Added flex-shrink-0, padding, styling, and border */}
        <div id="tariff-visualization" className="tariff-visualization-container flex-grow overflow-y-auto p-4"> {/* Added flex-grow, overflow-y-auto, and padding */}
          <TariffDiagram />
        </div>
      </section>

      <aside className="sidebar flex flex-col overflow-hidden border-l border-border-color" id="sidebar-right"> {/* Added flex, flex-col, overflow-hidden and border */}
        <h2 className="flex-shrink-0 p-4 text-lg font-semibold border-b border-border-color">Latest News (Tariff)</h2> {/* Added flex-shrink-0, padding, styling, and border */}
        <div className="flex-grow overflow-y-auto p-1"> {/* Added flex-grow, overflow-y-auto and padding */}
            <NewsFeed />
        </div>
      </aside>
    </main>
  );
}
