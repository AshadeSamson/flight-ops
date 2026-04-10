import { Request, Response } from "express";
import register from "../../services/authServices/registration";
import verifyEmail from "../../services/authServices/verifyEmail";
import login from "../../services/authServices/login";
import logout from "../../services/authServices/logout";
import refreshToken from "../../services/authServices/refreshToken";
import forgotPassword from "../../services/authServices/forgotPassword";
import resetPassword from "../../services/authServices/resetPassword";


export async function registerHandler(req: Request, res: Response) {
    await register(req, res);
}

export async function verifyEmailHandler(req: Request, res: Response) {
    await verifyEmail(req, res);
}

export async function loginHandler(req: Request, res: Response) {
    await login(req, res);
}

export async function logoutHandler(req: Request, res: Response) {
    await logout(req, res);
}

export async function refreshTokenHandler(req: Request, res: Response) {
    await refreshToken(req, res);
}

export async function forgotPasswordHandler(req: Request, res: Response) {
    await forgotPassword(req, res);
}

export async function resetPasswordHandler(req: Request, res: Response) {
    await resetPassword(req, res);
}