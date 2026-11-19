import { MemberRole, UserRole } from "../enum/enum";

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

export class UserProjectDto {
    idProject!: number;
    memberRole!: MemberRole;
}

export class TokenUser {
    idUser!: number;
    role!: UserRole;
}

//Token goes only in the httpOnly cookie - the browser gets the user and when the session ends
export class AuthResponseModel {
    user!: UserModel;
    expiresAt!: number;
}

export class LoginResult {
    token!: string;
    user!: UserModel;
    expiresAt!: number;
}


//request.user is set by verify-token
declare global {
    namespace Express {
        interface Request {
            user?: TokenUser;
        }
    }
}
