import { UserRole } from "../enum/enum";

export class UserModel {
    idUser!: number;
    firstName!: string;
    lastName!: string;
    email!: string;
    role!: UserRole;
    jobPercent!: number;
    isActive!: boolean;
    createdAt!: string;
    updatedAt!: string;
}

export class UserDto {
    firstName!: string;
    lastName?: string | null;
    email!: string;
    role?: UserRole;
    jobPercent?: number;
    isActive?: boolean;
}

export class TokenUser {
    idUser!: number;
    role!: UserRole;
}

export class AuthResponseModel {
    token!: string;
    user!: UserModel;
}


//request.user is set by verify-token
declare global {
    namespace Express {
        interface Request {
            user?: TokenUser;
        }
    }
}
