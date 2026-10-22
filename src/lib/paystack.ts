export function paystackKey() {
  return (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined)?.trim() || "";
}

export function startPaystack(opts: {
  email: string;
  amountNaira: number;
  onSuccess: (ref: string) => void;
  onClose?: () => void;
}): Promise<void> {
  const key = paystackKey();
  if (!key) {
    return Promise.reject(new Error("checkout-unconfigured"));
  }
  return new Promise((resolve, reject) => {
    const w = window as unknown as {
      PaystackPop?: {
        setup: (o: Record<string, unknown>) => { openIframe: () => void };
      };
    };
    const run = () => {
      if (!w.PaystackPop) {
        reject(new Error("checkout-unconfigured"));
        return;
      }
      const ref = `nte_${Date.now()}`;
      const handler = w.PaystackPop.setup({
        key,
        email: opts.email,
        amount: Math.round(opts.amountNaira * 100),
        currency: "NGN",
        ref,
        callback: () => {
          opts.onSuccess(ref);
          resolve();
        },
        onClose: () => {
          opts.onClose?.();
          reject(new Error("closed"));
        },
      });
      handler.openIframe();
    };
    if (w.PaystackPop) {
      run();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.onload = run;
    s.onerror = () => reject(new Error("checkout-unconfigured"));
    document.body.appendChild(s);
  });
}
