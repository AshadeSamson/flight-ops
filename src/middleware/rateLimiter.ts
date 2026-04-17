import rateLimit, { ipKeyGenerator }  from "express-rate-limit";

//  Shared key generator
const keyGenerator = (req: any) => {
  const user = req.user;

  if (user?.id) {
    return `user:${user.id}`;
  }

  return `ip:${ipKeyGenerator(req)}`; 
};

//  Auth limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator,
  message: {
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Report limiter
export const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator,
  message: {
    message: "Too many reports submitted. Please slow down.",
  },
});

//  Upload limiter
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator,
  message: {
    message: "Too many file uploads. Please try again later.",
  },
});

//  General limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  keyGenerator,
  message: {
    message: "Too many requests. Please try again later.",
  },
});