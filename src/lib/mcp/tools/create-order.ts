import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_order",
  title: "Create order",
  description: "Place a new Kookoos order for the signed-in user with the given items, phone, and delivery address.",
  inputSchema: {
    phone: z.string().min(6).describe("Contact phone number for the order."),
    delivery_address: z.string().min(3).describe("Full delivery address."),
    notes: z.string().optional().describe("Optional special instructions."),
    items: z
      .array(
        z.object({
          name: z.string().min(1),
          price: z.number().nonnegative(),
          quantity: z.number().int().min(1),
        }),
      )
      .min(1)
      .describe("Line items to include in the order."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ phone, delivery_address, notes, items }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const { data: order, error: orderError } = await sb
      .from("orders")
      .insert({
        user_id: ctx.getUserId(),
        total_amount: total,
        delivery_address,
        phone,
        notes: notes ?? null,
        status: "pending",
      })
      .select()
      .single();
    if (orderError || !order) {
      return { content: [{ type: "text", text: orderError?.message ?? "Failed to create order" }], isError: true };
    }
    const rows = items.map((i) => ({
      order_id: order.id,
      item_name: i.name,
      item_price: i.price,
      quantity: i.quantity,
    }));
    const { error: itemsError } = await sb.from("order_items").insert(rows);
    if (itemsError) {
      return { content: [{ type: "text", text: itemsError.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Order ${order.id} placed. Total: TSh ${total.toLocaleString()}` }],
      structuredContent: { order_id: order.id, total_amount: total, status: order.status },
    };
  },
});
