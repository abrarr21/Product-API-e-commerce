import type { Request } from "express";

export interface AuthentcatedRequest extends Request {
  user?: {
    id: string;
  };
}
