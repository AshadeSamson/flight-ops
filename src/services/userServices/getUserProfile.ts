import { Request, Response } from "express";


export default async function getUserProfile(req: Request, res: Response) {
    try {
        const user = (req as any).user;

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        } 

        return res.status(200).json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
        });
}
}