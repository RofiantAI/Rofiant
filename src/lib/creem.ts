import { Creem } from "creem";

export const creem = new Creem({
  apiKey: process.env.CREEM_API_KEY ?? "",
});

export const PLAN_PRODUCT_IDS: Record<string, string> = {
  pro:  process.env.CREEM_PRODUCT_ID_PRO  ?? "",
  team: process.env.CREEM_PRODUCT_ID_TEAM ?? "",
};
