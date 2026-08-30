import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { server } from "@/test/msw";
import { renderApp } from "@/test/render";
import { API, DIRECTOR_ME, authedHandlers } from "@/test/handlers";
import { api } from "@/shared/api/client";
import { clearSubscriptionExpired } from "@/shared/api/subscription";
import { AppRouter } from "@/app/router";

const ORG = {
  id: "o-1",
  name: "Chilonzor Arena MCHJ",
  logoUrl: null,
  phone: null,
  address: null,
  timezone: "Asia/Tashkent",
  currency: "UZS",
  subscriptionStatus: "EXPIRED",
  subscriptionEndsAt: "2026-08-01T00:00:00.000Z",
  createdAt: "2026-08-25T12:54:16.392Z",
  updatedAt: "2026-08-25T12:54:16.392Z",
};

const XABAR = "Obuna muddati tugagan. To'lovni amalga oshiring.";

beforeEach(() => {
  clearSubscriptionExpired();
});

describe("Obuna tugagani banneri", () => {
  it("402 kelganda butun ilova ustida chiqadi", async () => {
    server.use(
      ...authedHandlers(DIRECTOR_ME),
      http.get(`${API}/organizations/current`, () => HttpResponse.json(ORG)),
      http.patch(`${API}/organizations/current`, () =>
        HttpResponse.json(
          { code: "SUBSCRIPTION_EXPIRED", message: XABAR },
          { status: 402 },
        ),
      ),
    );
    renderApp(<AppRouter />, { route: "/organization" });

    expect(await screen.findByText("Chilonzor Arena MCHJ")).toBeInTheDocument();
    expect(screen.queryByText(XABAR)).not.toBeInTheDocument();

    // Yozish urinishi 402 qaytaradi — banner shundan keyin chiqadi.
    await api
      .patch("/organizations/current", { phone: "+998712000000" })
      .catch(() => {});

    expect(await screen.findByText(XABAR)).toBeInTheDocument();
  });

  it("yozish yana ishlaganda banner yo`qoladi", async () => {
    let expired = true;
    server.use(
      ...authedHandlers(DIRECTOR_ME),
      http.get(`${API}/organizations/current`, () => HttpResponse.json(ORG)),
      http.patch(`${API}/organizations/current`, () =>
        expired
          ? HttpResponse.json(
              { code: "SUBSCRIPTION_EXPIRED", message: XABAR },
              { status: 402 },
            )
          : HttpResponse.json(ORG),
      ),
    );
    renderApp(<AppRouter />, { route: "/organization" });

    await api.patch("/organizations/current", {}).catch(() => {});
    expect(await screen.findByText(XABAR)).toBeInTheDocument();

    expired = false;
    await api.patch("/organizations/current", {});

    await waitFor(() =>
      expect(screen.queryByText(XABAR)).not.toBeInTheDocument(),
    );
  });
});
