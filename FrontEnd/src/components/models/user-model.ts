import type { MemberRole, UserRole } from "./enum";

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
    lastName?: string;
    email!: string;
    role!: UserRole;
    jobPercent!: number;
    isActive!: boolean;
}

export class UserProjectDto {
    idProject!: number;
    memberRole!: MemberRole;
}

//Token comes in an httpOnly cookie - not in the response
export class AuthResponseModel {
    user!: UserModel;
    expiresAt!: number;
}
