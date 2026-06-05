const db = require('../db');

/**
 * Log a user or system activity event to the audit ledger.
 * Automatically resolves user metadata and extracts request IP/User-Agent.
 * 
 * @param {Object} req - The Express Request object (optional)
 * @param {Object} logData - Audit event payload
 * @param {string} [logData.userId] - The ID of the acting user
 * @param {string} [logData.userName] - The name of the user (resolved automatically if omitted)
 * @param {string} [logData.userEmail] - The email of the user (resolved automatically if omitted)
 * @param {string} [logData.userRole] - The role of the user (resolved automatically if omitted)
 * @param {string} logData.eventType - Event categorization ('LOGIN', 'REGISTRATION', 'BOOKING', 'PAYMENT', 'ADMIN', etc.)
 * @param {string} logData.action - Specific text action identifier (e.g. 'ACCOUNT_LOGIN', 'SERVICE_CREATE')
 * @param {string|Object} [logData.details] - String or JSON object with details (legacy details field)
 * @param {string|Object} [logData.metadata] - String or JSON object representing change log / parameters
 */
const logActivity = async (req, { 
  userId, 
  userName, 
  userEmail, 
  userRole, 
  eventType, 
  action, 
  details, 
  metadata 
}) => {
  try {
    let resolvedId = userId;
    let resolvedName = userName;
    let resolvedEmail = userEmail;
    let resolvedRole = userRole;

    // 1. Resolve actor details from the request session if not explicitly provided
    if (req && req.user && !resolvedId) {
      resolvedId = req.user.id;
      resolvedName = req.user.name;
      resolvedEmail = req.user.email;
      resolvedRole = req.user.role;
    }

    // 2. Fetch from DB if we only have userId but missing profile details
    if (resolvedId && (!resolvedName || !resolvedEmail || !resolvedRole)) {
      const user = await db.user.findUnique({ where: { id: resolvedId } });
      if (user) {
        resolvedName = user.name;
        resolvedEmail = user.email;
        resolvedRole = user.role;
      }
    }

    // 3. Extract request parameters
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress) : null;
    const userAgent = req ? req.headers['user-agent'] : null;

    // 4. Clean IP address from IPv6 prefix
    const cleanIp = ipAddress ? ipAddress.split(',')[0].trim().replace('::ffff:', '') : null;

    // 5. Structure payload
    const data = {
      userId: resolvedId || null,
      userName: resolvedName || null,
      userEmail: resolvedEmail || null,
      userRole: resolvedRole || null,
      eventType: eventType || 'SYSTEM',
      action,
      details: details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : null,
      metadata: metadata ? (typeof metadata === 'object' ? JSON.stringify(metadata) : String(metadata)) : null,
      ipAddress: cleanIp,
      userAgent: userAgent || null
    };

    // 6. Write to database (Neon Postgres or Sandbox)
    const log = await db.auditLog.create({ data });
    console.log(`📝 [Audit Ledger] Logged Action [${action}] (${eventType}) for ${resolvedEmail || 'System/Guest'}`);
    return log;
  } catch (err) {
    console.error('⚠️ [Audit Ledger] Error creating audit log:', err.message);
  }
};

module.exports = { logActivity };
