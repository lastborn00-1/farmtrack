import { z } from 'zod';

export const feedIngredientSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Ingredient name is required"),
  quantityKg: z.number().min(0, "Quantity cannot be negative"),
  totalPrice: z.number().min(0, "Price cannot be negative"),
});

export const feedProductionSchema = z.object({
  date: z.string(),
  recipeName: z.string().min(1, "Recipe name is required"),
  targetBagSizeKg: z.number().min(1, "Bag size must be greater than 0"),
  ingredients: z.array(feedIngredientSchema),
  overheadCosts: z.object({
    milling: z.number().min(0),
    transport: z.number().min(0),
    other: z.number().min(0),
  }),
  totalWeightKg: z.number(),
  totalCost: z.number(),
  bagsProduced: z.number(),
  costPerBag: z.number(),
  inventoryItemId: z.string().optional(),
});

export type FeedIngredient = z.infer<typeof feedIngredientSchema>;
export type FeedProductionLog = z.infer<typeof feedProductionSchema>;
