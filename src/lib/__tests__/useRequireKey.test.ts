/**
 * @jest-environment jsdom
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useRequireKey } from "@/lib/useRequireKey";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

function KeyGate() {
  const { checking } = useRequireKey();
  return createElement("span", null, checking ? "checking" : "ready");
}

let container: HTMLDivElement;
let root: Root;

function mockStatus(body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => body,
  }) as unknown as typeof fetch;
}

async function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(KeyGate));
  });
}

beforeEach(() => {
  mockPush.mockClear();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("useRequireKey", () => {
  it("sends the user to /onboarding when no key is connected", async () => {
    mockStatus({ hasKey: false, provider: null });
    await render();
    expect(global.fetch).toHaveBeenCalledWith("/api/byok/status");
    expect(mockPush).toHaveBeenCalledWith("/onboarding");
  });

  it("leaves the user in place when a key is connected", async () => {
    mockStatus({ hasKey: true, provider: "gemini" });
    await render();
    expect(mockPush).not.toHaveBeenCalled();
    expect(container.textContent).toBe("ready");
  });

  it("does not redirect while the status check is still unanswered", async () => {
    // A slow network must not bounce a user who does have a key
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as unknown as typeof fetch;
    await render();
    expect(mockPush).not.toHaveBeenCalled();
    expect(container.textContent).toBe("checking");
  });
});
