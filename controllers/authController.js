import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id, secret, expiresIn) => {
  return jwt.sign({ id }, secret, { expiresIn });
};

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password });

    const accessToken = generateToken(
      user._id,
      process.env.JWT_SECRET,
      process.env.ACCESS_TOKEN_EXPIRE
    );
    const refreshToken = generateToken(
      user._id,
      process.env.JWT_REFRESH_SECRET,
      process.env.REFRESH_TOKEN_EXPIRE
    );

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select(
      "-refreshTokenVersion -createdAt -updatedAt -__v"
    );
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const accessToken = generateToken(
      user._id,
      process.env.JWT_SECRET,
      process.env.ACCESS_TOKEN_EXPIRE
    );
    const refreshToken = generateToken(
      user._id,
      process.env.JWT_REFRESH_SECRET,
      process.env.REFRESH_TOKEN_EXPIRE
    );
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.refreshTokenVersion;
    res.json({ safeUser, accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refreshAccessToken = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token required" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = generateToken(
      decoded.id,
      process.env.JWT_SECRET,
      process.env.ACCESS_TOKEN_EXPIRE
    );
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};
