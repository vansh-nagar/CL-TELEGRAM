import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    messages: [
      {
        message: String,
        sender: String,
        reciver: String,
        time: String,
      },
    ],
    accessToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.GenerateRefreshToken = async function () {
  return jwt.sign({ id: this._id }, process.env.refreshTokenSecret, {
    expiresIn: "30d",
  });
};
userSchema.methods.GenerateAccessToken = async function () {
  return jwt.sign(
    { id: this._id, username: this.username },
    process.env.accessTokenSecret,
    {
      expiresIn: "5d",
    }
  );
};

export const User = mongoose.model("User", userSchema);
