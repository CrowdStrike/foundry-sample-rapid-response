import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import * as router from "react-router-dom";
import Header from "@/components/job-details/Header";
import {
  hostGroupsEntities,
  hostsEntities,
  jobRR01,
  jobRR05,
} from "@/mock/data/fixtures";
import { Job } from "@/lib/validations/api-validation";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...(actual as object) } as unknown;
});

describe("job-details: Header", () => {
  beforeEach(() => {
    vi.spyOn(router, "useRouteLoaderData").mockReturnValue({
      hostGroupsEntities,
      hostsEntities,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders job details correctly", () => {
    const { getByText } = render(
      <BrowserRouter>
        <Header job={jobRR01 as Job} />
      </BrowserRouter>,
    );

    expect(getByText("First Job RR")).toBeInTheDocument();
    expect(getByText("Description")).toBeInTheDocument();
    expect(getByText("First Job RR description")).toBeInTheDocument();
  });

  it("renders job details correctly; without description", () => {
    const { getByText, queryByText } = render(
      <BrowserRouter>
        <Header job={jobRR05 as Job} />
      </BrowserRouter>,
    );

    expect(getByText("Fifth Job Test RR")).toBeInTheDocument();
    expect(queryByText("Description")).not.toBeInTheDocument();
  });
});
