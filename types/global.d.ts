export {};

declare global {
  interface Window {
    paymentBrickController: {
      getFormData: () => Promise<{ formData: any }>;
      submit: () => Promise<void>;
    };
  }
}
