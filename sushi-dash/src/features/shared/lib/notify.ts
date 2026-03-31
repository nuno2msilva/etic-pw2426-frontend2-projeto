export async function notifySuccess(message: string): Promise<void> {
  const { toast } = await import("sonner");
  toast.success(message);
}

export async function notifyError(message: string): Promise<void> {
  const { toast } = await import("sonner");
  toast.error(message);
}
