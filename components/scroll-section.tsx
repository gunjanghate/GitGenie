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
  return (
    <div className="scroll-stack-section" style={{ zIndex }}>
      <div className="sticky-wrapper w-full">
        {children}
      </div>
    </div>
  );
}