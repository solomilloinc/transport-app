export {};

declare global {
  interface Window {
    cardPaymentBrickController?: {
      submit: () => Promise<void>;
      unmount?: () => void;
    } | null;
  }
}
