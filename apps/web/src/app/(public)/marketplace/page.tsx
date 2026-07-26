import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ATLAS Marketplace",
  description: "Future digital assets for the ATLAS Global Intelligence Platform.",
};

export default function MarketplacePage() {
  return (
    <main className="marketplace-placeholder">
      <p>ATLAS · GLOBAL INTELLIGENCE PLATFORM</p>
      <h1>ATLAS Marketplace</h1>
      <div className="marketplace-status" role="status">Coming soon</div>
      <p>Digital products, e-books, downloadable files, digital art, templates, source code, datasets, licenses, and future digital assets.</p>
    </main>
  );
}
