import { Creem } from "creem";

export const creem = new Creem({
  server: process.env.NODE_ENV === "production" ? "prod" : "test",
  apiKey: process.env.CREEM_API_KEY ?? "",
});

export const PLAN_PRODUCT_IDS: Record<string, string> = {
  pro:   process.env.CREEM_PRODUCT_ID_PRO   ?? "",
  ultra: process.env.CREEM_PRODUCT_ID_ULTRA ?? "",
};
