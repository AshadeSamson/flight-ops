import { Request, Response } from "express";
import login from "../../services/authServices/login";
import forgotPassword from "../../services/authServices/forgotPassword";
import resetPassword from "../../services/authServices/resetPassword";



export async function loginHandler(req: Request, res: Response) {
    await login(req, res);
}

export async function forgotPasswordHandler(req: Request, res: Response) {
    await forgotPassword(req, res);
}

export async function resetPasswordHandler(req: Request, res: Response) {
    await resetPassword(req, res);
}