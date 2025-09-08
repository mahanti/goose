import { toast } from 'sonner';

export interface ToastServiceOptions {
  silent?: boolean;
  shouldThrow?: boolean;
}

export default class ToastService {
  private silent: boolean = false;
  private shouldThrow: boolean = false;

  // Create a singleton instance
  private static instance: ToastService;

  public static getInstance(): ToastService {
    if (!ToastService.instance) {
      ToastService.instance = new ToastService();
    }
    return ToastService.instance;
  }

  configure(options: ToastServiceOptions = {}): void {
    if (options.silent !== undefined) {
      this.silent = options.silent;
    }

    if (options.shouldThrow !== undefined) {
      this.shouldThrow = options.shouldThrow;
    }
  }

  error({ title, msg, traceback }: { title: string; msg: string; traceback: string }): void {
    if (!this.silent) {
      toastError({ title, msg, traceback });
    }

    if (this.shouldThrow) {
      throw new Error(msg);
    }
  }

  loading({ title, msg }: { title: string; msg: string }): string | number | undefined {
    if (this.silent) {
      return undefined;
    }

    const toastId = toastLoading({ title, msg });

    return toastId;
  }

  success({ title, msg }: { title: string; msg: string }): void {
    if (this.silent) {
      return;
    }
    toastSuccess({ title, msg });
  }

  dismiss(toastId?: string | number): void {
    if (toastId) toast.dismiss(toastId);
  }

  /**
   * Handle errors with consistent logging and toast notifications
   * Consolidates the functionality of the original handleError function
   */
  handleError(title: string, message: string, options: ToastServiceOptions = {}): void {
    this.configure(options);
    this.error({
      title: title || 'Error',
      msg: message,
      traceback: message,
    });
  }
}

// Export a singleton instance for use throughout the app
export const toastService = ToastService.getInstance();

type ToastSuccessProps = { title?: string; msg?: string; toastOptions?: any };
export function toastSuccess({ title, msg, toastOptions = {} }: ToastSuccessProps) {
  const message = title && msg ? `${title}: ${msg}` : title || msg || '';
  return toast.success(message, {
    duration: 3000,
    ...toastOptions
  });
}

type ToastErrorProps = {
  title?: string;
  msg?: string;
  traceback?: string;
  toastOptions?: any;
};

export function toastError({ title, msg, traceback, toastOptions }: ToastErrorProps) {
  const message = title && msg ? `${title}: ${msg}` : title || msg || '';
  return toast.error(message, {
    duration: traceback ? Infinity : 5000,
    action: traceback ? {
      label: 'Copy error',
      onClick: () => navigator.clipboard.writeText(traceback)
    } : undefined,
    ...toastOptions
  });
}

type ToastLoadingProps = {
  title?: string;
  msg?: string;
  toastOptions?: any;
};

export function toastLoading({ title, msg, toastOptions }: ToastLoadingProps) {
  const message = title && msg ? `${title}: ${msg}` : title || msg || '';
  return toast.loading(message, {
    duration: Infinity,
    ...toastOptions
  });
}

type ToastInfoProps = {
  title?: string;
  msg?: string;
  toastOptions?: any;
};

export function toastInfo({ title, msg, toastOptions }: ToastInfoProps) {
  const message = title && msg ? `${title}: ${msg}` : title || msg || '';
  return toast.info(message, toastOptions);
}
