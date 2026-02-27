import React from "react";
import { render, screen } from "@testing-library/react";
import ScrollSection from "../scroll-section";

test("renders ScrollSection and applies sticky wrapper", () => {
  render(
    <ScrollSection zIndex={123}>
      <div data-testid="inner">Inner content</div>
    </ScrollSection>,
  );

  // sticky wrapper exists
  const sticky = document.querySelector(".sticky-wrapper");
  expect(sticky).toBeTruthy();

  // inner content rendered
  expect(screen.getByTestId("inner")).toBeInTheDocument();

  // inline style zIndex should be set on outer container
  const outer = document.querySelector(".scroll-stack-section") as HTMLElement;
  expect(outer).toBeTruthy();
  if (outer) {
    // style may be present as inline style
    expect(outer.style.zIndex).toBe("123");
  }
});
