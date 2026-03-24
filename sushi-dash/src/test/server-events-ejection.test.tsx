import React from "react";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useServerEvents } from "@/hooks/useServerEvents";

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

type MessageHandler = ((event: { data: string }) => void) | null;

class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  onmessage: MessageHandler = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close() {}

  emit(event: unknown) {
    this.onmessage?.({ data: JSON.stringify(event) });
  }
}

function ServerEventsProbe({ tableId, onEjected }: { tableId: string; onEjected: () => void }) {
  useServerEvents({ tableId, onEjected, enabled: true });
  return null;
}

function renderProbe(tableId: string, onEjected: () => void) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ServerEventsProbe tableId={tableId} onEjected={onEjected} />
    </QueryClientProvider>
  );
}

describe("Server events customer ejection", () => {
  const originalEventSource = global.EventSource;

  beforeEach(() => {
    MockEventSource.instances = [];
    (global as any).EventSource = MockEventSource;
  });

  afterAll(() => {
    (global as any).EventSource = originalEventSource;
  });

  it("ejects customer when pin changes for the same table", async () => {
    const onEjected = jest.fn();
    renderProbe("12", onEjected);

    expect(MockEventSource.instances).toHaveLength(1);
    MockEventSource.instances[0].emit({ type: "pin-changed", tableId: 12 });

    await waitFor(() => {
      expect(onEjected).toHaveBeenCalledTimes(1);
    });
  });

  it("does not eject customer when another table pin changes", async () => {
    const onEjected = jest.fn();
    renderProbe("12", onEjected);

    expect(MockEventSource.instances).toHaveLength(1);
    MockEventSource.instances[0].emit({ type: "pin-changed", tableId: 99 });

    await waitFor(() => {
      expect(onEjected).not.toHaveBeenCalled();
    });
  });
});
