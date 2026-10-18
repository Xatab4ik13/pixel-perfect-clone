
import { PLANS } from "@/lib/plans";
import { json } from "@/server/http";


export const handlers = {
      GET: () =>
        json({
          plans: PLANS.map((p) => ({ id: p.id, name: p.name, price: p.price, days: p.days })),
        }),
    };
