import { Request, Response, NextFunction } from "express";


function requireRole(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ message: "Unauthorized: No user information found" });
        }   

        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
        }

        next();
    };
}

export default requireRole;