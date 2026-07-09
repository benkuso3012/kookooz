import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMenuItems from "./tools/list-menu-items";
import listMyOrders from "./tools/list-my-orders";
import getOrder from "./tools/get-order";
import createOrder from "./tools/create-order";
import listStores from "./tools/list-stores";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "kookoos-mcp",
  title: "Kookoos",
  version: "0.1.0",
  instructions:
    "Tools for Kookoos, a Tanzanian street-food restaurant. Browse the menu, view store locations, place delivery orders, and check your own order history. All order tools act as the signed-in Kookoos user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listMenuItems, listStores, listMyOrders, getOrder, createOrder],
});
