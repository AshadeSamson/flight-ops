import { RequestHandler } from "express";

export default function asyncHandler(fn: RequestHandler): RequestHandler {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
