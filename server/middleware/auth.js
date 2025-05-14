import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  try {
    // Check for token in cookies first
    const cookieToken = req.cookies.token;

    // Then check Authorization header
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.split(" ")[1];

    // Use cookie token if available, otherwise use header token
    const token = cookieToken || headerToken;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      // Clear the cookie if it's expired
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      return res
        .status(401)
        .json({ message: "Token expired. Please login again." });
    }
    res.status(401).json({ message: "Invalid token" });
  }
};

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};
