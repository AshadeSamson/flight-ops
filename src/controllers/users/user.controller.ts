import { Request, Response } from "express";
import createUser from "../../services/userServices/createUser";
import getAllUsers from "../../services/userServices/getAllUsers";
import getAUser from "../../services/userServices/getSingleUser";
import updateUser from "../../services/userServices/updateUser";
import getUserProfile from "../../services/userServices/getUserProfile";


export async function createUserHandler(req: Request, res: Response) {
    await createUser(req, res);
}

export async function getAllUsersHandler(req: Request, res: Response) {
    await getAllUsers(req, res);
}

export async function getAUserHandler(req: Request, res: Response) {
    await getAUser(req, res);
}

export async function updateUserHandler(req: Request, res: Response) {
    await updateUser(req, res);
}

export async function getUserProfileHandler(req: Request, res: Response) {
    await getUserProfile(req, res);
}