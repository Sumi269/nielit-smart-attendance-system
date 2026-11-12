export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required."
      });
    }

    // Owner inherits all permissions.
    if (
      req.user.role === "owner" ||
      allowedRoles.includes(req.user.role)
    ) {
      return next();
    }

    return res.status(403).json({
      error: "You do not have permission to perform this action."
    });
  };
}