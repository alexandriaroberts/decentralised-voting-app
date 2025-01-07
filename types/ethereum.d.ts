interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on(
      eventName: 'accountsChanged',
      handler: (accounts: string[]) => void
    ): void;
    on(eventName: 'chainChanged', handler: (chainId: string) => void): void;
    on(eventName: string, handler: (...args: unknown[]) => void): void;
    removeListener(
      eventName: string,
      handler: (...args: unknown[]) => void
    ): void;
  };
}
