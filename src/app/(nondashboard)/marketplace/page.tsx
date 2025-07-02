import { Suspense } from "react";
import SellerMarketplaceContent from "./SellerMarketplaceContent";

export default function SellerMarketplacePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SellerMarketplaceContent />
    </Suspense>
  );
}