# Paste-ready prompt for Replit Agent (BamBoozle backend): add POST /api/chat-parse

Copy everything below the line into the Replit Agent chat for the **BamBoozle** app, then publish.

---

Please add a new backend endpoint **POST /api/chat-parse** to the Express server. It turns a short natural-language search request from the BamBoozle v2 web app into exactly ONE structured command. It must never return free text, venue names it invented, prices, hours or deals.

**Model:** use the existing Gemini integration (same `GoogleGenAI` client as `/api/analyze-menu`), model `gemini-2.5-flash`, `temperature: 0`, with **function calling** and `toolConfig: { functionCallingConfig: { mode: "ANY" } }` so it must call exactly one of the four functions below.

**Request:** JSON `{ "text": string, "today": string }` where `today` looks like `"Fri 2026-10-23 16:05"` (Las Vegas time).
- Reject with 400 if `text` is missing/empty or longer than **300 characters**, or `today` is longer than 40 characters.
- Rate limit: **10 requests per minute per IP** (use the existing `rateLimit` helper with its own group name and a max of 10; return 429 on overflow).

**Response (200):** `{ "cmd": "<function name>", "args": { ...function arguments } }` taken directly from the model's single function call. If the model returns no function call, respond 422 `{ "error": "no command" }`. On timeout (8 s) respond 504. Validate args server-side against the schemas below (drop the request with 422 if any arg is unknown or not an allowed value).

**CORS:** allow the origin **https://xosoftware.github.io** for this endpoint (add `xosoftware.github.io` to the allowed CORS domains, e.g. append it to the domains passed to `createCorsMiddleware`). Methods POST and OPTIONS, header Content-Type. Do not allow other origins.

**Functions (declare exactly these; all parameters optional unless noted):**

1. `find_venues`
   - `item` string (a dish or drink, e.g. "burger", "margarita")
   - `deal_type` enum: `happy_hour`, `brunch`, `late_night`, `any`
   - `day` enum: `today`, `now`, `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`
   - `time_from`, `time_to` string "HH:MM" 24-hour Las Vegas time
   - `near` string: `me`, `home`, or a venue name exactly as the user said it
   - `radius_miles` number (0.05–50)
   - `route_from`, `route_to` string: `me`, `home`, or a venue name (both or neither)
   - `price_max` number, `in_kind` boolean, `min_rating` number 0–5
   - `sort` enum: `distance`, `rating`, `ending_soon`
   - `limit` integer 1–10
2. `cheapest_items` — `item` (**required**), `venue`, `near`, `radius_miles`, `route_from`, `route_to`, `deal_type`, `price_max`, `min_rating`, `limit` (same types as above)
3. `open_spot` — `venue` string (**required**), `tab` enum: `happy_hour`, `brunch`, `dinner`, `drinks`
4. `clarify` — `question` string (**required**), short question asking the user what they mean

**System instruction** (insert the `today` value):

> You convert BamBoozle search requests into exactly one tool call: find_venues, cheapest_items, open_spot, or clarify. Use only the listed parameters and enum values. Never name venues, prices, hours or deals yourself; only copy a venue name if the user typed it. 'Near me' = near: me. 'Home' = near: home. If no distance is given, use 1 mile (omit radius_miles). "Now", "right now", "open now" = day: now. "Tonight" = day: today, time_from 17:00, time_to 02:00. Day names map to mon..sun. "Between A and B" or "on my way from A to B" = route_from/route_to. "Cheapest"/"least expensive" = cheapest_items. "Open/show <venue> <tab> menu" = open_spot. Use clarify only when the request is too vague or not about food/drink deals. Today is {today}, Las Vegas time.

**Few-shot examples** (add as prior user/model turns or in the instruction):

| User text | Function call |
|---|---|
| happy hour near me now | `find_venues {deal_type:"happy_hour", day:"now", near:"me"}` |
| cheapest burger within half a mile | `cheapest_items {item:"burger", near:"me", radius_miles:0.5}` |
| happy hours between home and Ocean Prime | `find_venues {deal_type:"happy_hour", route_from:"home", route_to:"Ocean Prime"}` |
| open Ocean Prime drinks menu | `open_spot {venue:"Ocean Prime", tab:"drinks"}` |
| brunch near home on sunday under $20 | `find_venues {deal_type:"brunch", day:"sun", near:"home", price_max:20}` |
| top rated late night spots tonight within 2 miles | `find_venues {deal_type:"late_night", day:"today", time_from:"17:00", time_to:"02:00", near:"me", radius_miles:2, sort:"rating"}` |
| inKind happy hours ending soon | `find_venues {deal_type:"happy_hour", day:"now", in_kind:true, near:"me", sort:"ending_soon"}` |
| cheapest margarita near Caesars Palace | `cheapest_items {item:"margarita", near:"Caesars Palace"}` |
| what's good | `clarify {question:"What are you looking for — e.g. happy hour near you now, or the cheapest tacos near home?"}` |

**Do not** store the text, add tables, or change any existing route. Log only errors. When done, publish the app so `https://bamboozle.mobile/api/chat-parse` is live, and confirm with a curl that sends `Origin: https://xosoftware.github.io` and gets `Access-Control-Allow-Origin: https://xosoftware.github.io` back.
