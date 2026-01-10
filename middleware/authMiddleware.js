import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const authHeaders = req.headers.authorization;

  if (!authHeaders) {
    return res.status(400).json({ mesasge: "No token provided" });
  }

  const token = authHeaders.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // role & userId avalable wverywhere
    next();
  } catch (err) {
    return res.status(400).json({ message: "Token is invalid or expired" });
  }
};

export default authMiddleware;
