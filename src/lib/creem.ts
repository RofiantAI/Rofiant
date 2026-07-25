import { Creem } from "creem";

export const creem = new Creem({
  server: process.env.NODE_ENV === "production" ? "prod" : "test",
  apiKey: process.env.CREEM_API_KEY ?? "",
});

export const PLAN_PRODUCT_IDS: Record<string, string> = {
  pro:   process.env.CREEM_PRODUCT_ID_PRO   ?? "",
  ultra: process.env.CREEM_PRODUCT_ID_ULTRA ?? "",
};

// Pro product configured in Creem without a trial period, used once a user has
// already burned their one free trial (see /api/checkout).
export const PRO_PRODUCT_ID_NO_TRIAL = process.env.CREEM_PRODUCT_ID_PRO_NO_TRIAL ?? "";
