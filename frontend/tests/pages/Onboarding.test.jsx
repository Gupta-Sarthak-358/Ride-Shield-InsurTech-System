import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";

import Onboarding from "../../src/pages/Onboarding";
import { locationsApi } from "../../src/api/locations";
import { policiesApi } from "../../src/api/policies";
import { workersApi } from "../../src/api/workers";
import { STORAGE_KEYS } from "../../src/utils/constants";

const mockNavigate = vi.fn();
const mockLoginWorker = vi.fn();

vi.mock("../../src/auth/AuthContext", () => ({
  useAuth: () => ({
    loginWorker: mockLoginWorker,
  }),
}));

vi.mock("../../src/api/locations", () => ({
  locationsApi: {
    cities: vi.fn(),
    zones: vi.fn(),
  },
}));

vi.mock("../../src/api/workers", () => ({
  workersApi: {
    register: vi.fn(),
  },
}));

vi.mock("../../src/api/policies", () => ({
  policiesApi: {
    create: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderOnboarding() {
  return render(
    <MemoryRouter>
      <Onboarding />
    </MemoryRouter>,
  );
}

describe("Onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    locationsApi.cities.mockResolvedValue({
      data: [{ id: 1, slug: "delhi", display_name: "Delhi" }],
    });
    locationsApi.zones.mockResolvedValue({
      data: [{ id: 2, slug: "south_delhi", display_name: "South Delhi" }],
    });
    policiesApi.create.mockResolvedValue({
      data: {
        message: "Policy purchased",
        policy: { plan_display_name: "Smart Protect" },
      },
    });
  });

  it("shows inline validation and blocks register when passwords do not match", async () => {
    renderOnboarding();

    await waitFor(() => expect(locationsApi.cities).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: "Rahul Kumar" } });
    fireEvent.change(screen.getByLabelText(/Phone number/i), { target: { value: "+919876543210" } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: "WorkerPass1" } });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: "Mismatch123" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Register worker/i }));

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(workersApi.register).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it("restores a saved draft from session storage", async () => {
    sessionStorage.setItem(
      STORAGE_KEYS.onboardingDraft,
      JSON.stringify({
        step: "register",
        form: {
          name: "Draft Worker",
          phone: "+919999999999",
          password: "DraftPass1",
          confirm_password: "DraftPass1",
          city: "delhi",
          zone: "south_delhi",
          platform: "swiggy",
          self_reported_income: 950,
          working_hours: 10,
          consent_given: true,
        },
      }),
    );

    renderOnboarding();

    expect(await screen.findByDisplayValue("Draft Worker")).toBeInTheDocument();
    expect(screen.getByDisplayValue("+919999999999")).toBeInTheDocument();
    expect(screen.getByText(/Decent password|Strong password/i)).toBeInTheDocument();
  });

  it("advances to plan selection after successful registration without logging in immediately", async () => {
    workersApi.register.mockResolvedValue({
      data: {
        worker_id: 42,
        name: "Rahul Kumar",
        city: "delhi",
        zone: "south_delhi",
        platform: "zomato",
        risk_score: 0.45,
        risk_breakdown: {},
        recommended_plan: "smart_protect",
        available_plans: [
          {
            plan_name: "smart_protect",
            display_name: "Smart Protect",
            plan_display_name: "Smart Protect",
            description: "Weather and platform protection",
            weekly_premium: 39,
            coverage_cap: 600,
            triggers_covered: ["rain", "platform_outage"],
            base_price: 39,
            plan_factor: 1.5,
            risk_score: 0.45,
            is_recommended: true,
          },
        ],
      },
    });

    renderOnboarding();

    await waitFor(() => expect(locationsApi.cities).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: "Rahul Kumar" } });
    fireEvent.change(screen.getByLabelText(/Phone number/i), { target: { value: "+919876543210" } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: "WorkerPass1" } });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: "WorkerPass1" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Register worker/i }));

    expect(await screen.findByText(/Purchase selected plan/i)).toBeInTheDocument();
    expect(workersApi.register).toHaveBeenCalledTimes(1);
    expect(mockLoginWorker).not.toHaveBeenCalled();
    expect(localStorage.getItem("rideshield.workerId")).toBeNull();
  });

  it("does not refetch cities when the selected city changes", async () => {
    locationsApi.cities.mockResolvedValue({
      data: [
        { id: 1, slug: "delhi", display_name: "Delhi" },
        { id: 2, slug: "mumbai", display_name: "Mumbai" },
      ],
    });
    locationsApi.zones.mockImplementation(async (citySlug) => ({
      data: citySlug === "mumbai"
        ? [{ id: 3, slug: "western_suburbs", display_name: "Western Suburbs" }]
        : [{ id: 2, slug: "south_delhi", display_name: "South Delhi" }],
    }));

    renderOnboarding();

    await waitFor(() => expect(locationsApi.cities).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText(/City/i), { target: { value: "mumbai" } });

    await waitFor(() => expect(locationsApi.zones).toHaveBeenLastCalledWith("mumbai"));
    expect(locationsApi.cities).toHaveBeenCalledTimes(1);
  });
});
