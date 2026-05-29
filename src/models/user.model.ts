import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Describes the raw data fields
export interface IUser {
  name: string;
  email: string;
  password: string;
}

// Describes the custom instance methods on the document
export interface IUserMethods {
  matchedPassword(enteredPassword: string): Promise<boolean>;
}

// combines data fields knowledge + methods knowledge into one model type
type UserModel = mongoose.Model<IUser, {}, IUserMethods>;

// Wire all three into the Schema
const userSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

// Hash the password before saving it to database
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// compares and checks the hashed password with the recieved password
userSchema.methods.matchedPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel = mongoose.model<IUser, UserModel>("user", userSchema);

export default userModel;
