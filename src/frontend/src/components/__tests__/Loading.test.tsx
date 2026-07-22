import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Loading } from "../Loading";

describe("Loading", () => {
  it("defaults to a generic loading message", () => {
    render(<Loading />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders a custom message when provided", () => {
    render(<Loading message="Loading notes..." />);

    expect(screen.getByText("Loading notes...")).toBeInTheDocument();
  });
});
