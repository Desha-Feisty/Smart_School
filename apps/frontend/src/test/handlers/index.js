import { setupWorker } from "msw/browser";
import handlers from "./api.js";

export const worker = setupWorker(...handlers);

export async function initMSW() {
    await worker.start({
        onUnhandledRequest: "bypass",
        quiet: true,
    });
}