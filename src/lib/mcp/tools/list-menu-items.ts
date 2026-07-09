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
  name: "list_menu_items",
  title: "List menu items",
  description: "List Kookoos menu items, optionally filtered by category slug or availability.",
  inputSchema: {
    category_slug: z.string().optional().describe("Optional category slug to filter by."),
    available_only: z.boolean().optional().describe("Only return items marked available."),
    limit: z.number().int().min(1).max(200).optional().describe("Max items to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category_slug, available_only, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    let query = sb
      .from("menu_items")
      .select("id,name,description,price,category_id,is_available,image_url,categories(slug,name)")
      .limit(limit ?? 50);
    if (available_only) query = query.eq("is_available", true);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const filtered = category_slug
      ? (data ?? []).filter((row: any) => row.categories?.slug === category_slug)
      : data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify(filtered) }],
      structuredContent: { items: filtered },
    };
  },
});
