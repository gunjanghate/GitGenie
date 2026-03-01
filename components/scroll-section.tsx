"use client";
import React from "react";

interface ScrollSectionProps {
  children: React.ReactNode;
  zIndex?: number;
}

export default function ScrollSection({
  children,
  zIndex = 0,
}: ScrollSectionProps) {
  // zIndex can be provided to ensure later sections stack on top
  return (
    <div className="scroll-stack-section" style={{ zIndex }}>
      <div className="sticky-wrapper min-h-screen w-full">{children}</div>
    </div>
  );
}
