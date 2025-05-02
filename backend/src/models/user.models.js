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
    avatar: {
      type: String,
      default:
        "http://res.cloudinary.com/dz12pywzs/image/upload/v1745119245/u6i5ls7c8k9kabholrtp.png",
    },
    dob: {
      type: Date,
    },
    chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
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
