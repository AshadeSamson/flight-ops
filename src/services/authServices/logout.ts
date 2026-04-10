import { Request, Response } from "express";

export default async function logout(req: Request, res: Response) {
    try {
        res.clearCookie("refreshToken", {
            path: "/",
            sameSite: "lax",
        });
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}