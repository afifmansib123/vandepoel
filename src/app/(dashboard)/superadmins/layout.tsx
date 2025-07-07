import React from "react";

// This layout can be expanded later if the superadmin section needs a unique structure.
// For now, it just passes children through, relying on the main dashboard layout.
export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full w-full">{children}</div>;
}