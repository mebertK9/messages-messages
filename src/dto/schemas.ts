import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createProductSchema = z.object({
  name: z.string().min(1),
});

export const updateProductSchema = z.object({
  preferredShopId: z.string().uuid(),
});

export const createWishSchema = z.object({
  productId: z.string().uuid(),
});

export const createTripStopSchema = z.object({
  shopId: z.string().uuid(),
  wishIds: z.array(z.string().uuid()).default([]),
});

export const createTripSchema = z.object({
  stops: z.array(createTripStopSchema).min(1),
});

export const completeStopSchema = z.object({
  notFoundWishIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateNotificationSchema = z.object({
  read: z.boolean(),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type CreateProductRequest = z.infer<typeof createProductSchema>;
export type UpdateProductRequest = z.infer<typeof updateProductSchema>;
export type CreateWishRequest = z.infer<typeof createWishSchema>;
export type CreateTripStopRequest = z.infer<typeof createTripStopSchema>;
export type CreateTripRequest = z.infer<typeof createTripSchema>;
export type CompleteStopRequest = z.infer<typeof completeStopSchema>;
export type UpdateNotificationRequest = z.infer<typeof updateNotificationSchema>;
