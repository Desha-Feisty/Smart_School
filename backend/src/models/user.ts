import { Schema, model, Model } from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
dotenv.config();
export interface IUser {
    name: string;
    email: string;
    password: string;
    role: string;
}
interface UserMethods {
    comparePassword(enteredPassword: string): Promise<boolean>;
    createToken(): Promise<string>;
}
type UserModel = Model<IUser, {}, UserMethods>;
const userSchema = new Schema<IUser, UserModel, UserMethods>(
    {
        name: {
            type: String,
            required: true,
            maxlength: 40,
            minlength: 6,
        },
        email: {
            type: String,
            required: true,
            match: /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/,
            unique: true,
        },
        password: {
            type: String,
            minlength: 6,
            maxlength: 20,
        },
        role: {
            type: String,
            enum: ["teacher", "student", "admin"],
            required: true,
        },
    },
    { timestamps: true },
);

userSchema.pre("save", async function hashPassword() {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (
    enteredPassword: string,
): Promise<boolean> {
    const check = await bcrypt.compare(enteredPassword, this.password);
    return check;
};

userSchema.methods.createToken = async function () {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("JWT_SECRET is missing during token generation!");
        throw new Error("JWT secret is not found");
    }
    console.log(
        "Signing token with secret starting with:",
        secret.substring(0, 3),
    );
    const expiresIn: StringValue | number = (process.env.JWT_LIFETIME ??
        "1h") as StringValue;
    if (!expiresIn) throw new Error("Token expiresIn is undefined");
    const token = jwt.sign(
        { _id: this._id.toString(), role: this.role },
        secret,
        {
            expiresIn,
        },
    );
    return token;
};

export default model<IUser, UserModel>("User", userSchema);
