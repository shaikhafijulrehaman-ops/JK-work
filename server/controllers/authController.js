const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Helper to sign JWT tokens
const signTokens = (userId, email, role) => {
  const accessToken = jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || 'jk_enterprises_super_jwt_secret_token_2026',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, email, role },
    process.env.JWT_REFRESH_SECRET || 'jk_enterprises_super_jwt_refresh_secret_token_2026',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Set secure HttpOnly cookies
const sendTokenResponse = (user, statusCode, res) => {
  const { accessToken, refreshToken } = signTokens(user.id, user.email, user.role);

  // Set cookies options
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  // Add session entry to DB
  db.session.create({
    data: {
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  }).catch(e => console.warn('Prisma session creation log:', e.message));

  // Send access and refresh token inside secure HttpOnly cookies
  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 mins
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

  // Log user audit log
  db.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_LOGIN',
      details: JSON.stringify({ email: user.email, role: user.role }),
      ipAddress: res.req.ip
    }
  }).catch(e => {});

  // Remove password from response
  const userResponse = { ...user };
  delete userResponse.password;

  res.status(statusCode).json({
    success: true,
    user: userResponse,
    token: accessToken // Sent for client headers if wanted
  });
};

/**
 * Register User / Worker
 */
exports.register = async (req, res) => {
  try {
    const { 
      email, password, name, phone, role,
      aadhaar, experience, profilePhoto, address, bankDetails, emergencyContact, availability, category 
    } = req.body;

    if (!email || !password || !name || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide all required basic fields.' });
    }

    // Check if email or phone already exists
    const existingEmail = await db.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email address already registered.' });
    }

    const existingPhone = await db.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'Phone number already registered.' });
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User record
    const userRole = role === 'WORKER' ? 'WORKER' : 'USER';
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: userRole,
        isEmailVerified: true,
        isPhoneVerified: true
      }
    });

    // If role is WORKER, instantiate worker profile with pending status
    if (userRole === 'WORKER') {
      const worker = await db.worker.create({
        data: {
          userId: user.id,
          status: 'AVAILABLE', // Still AVAILABLE technically if they are online, but approvalStatus prevents bookings
          approvalStatus: 'PENDING',
          aadhaar: aadhaar || null,
          experienceYears: experience ? parseInt(experience) : null,
          profilePhoto: profilePhoto || null,
          address: address || null,
          bankDetails: bankDetails ? JSON.stringify(bankDetails) : null,
          emergencyContact: emergencyContact || null,
          availability: availability ? JSON.stringify(availability) : null,
          rating: 5.0,
          commissionRate: 0.70 // Default 70% commission
        }
      });

      // Default to Electrician if category is not mapped, or try to find by name
      let defaultSkill = await db.service.findFirst({ where: { name: { contains: category || 'Electrician', mode: 'insensitive' } } });
      if (!defaultSkill) {
        defaultSkill = await db.service.findFirst();
      }
      if (defaultSkill) {
        await db.workerSkill.create({
          data: {
            workerId: worker.id,
            serviceId: defaultSkill.id
          }
        });
      }
    }

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

/**
 * Login User / Worker / Admin
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await db.user.findUnique({ 
      where: { email },
      include: { workerProfile: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/**
 * Verify Session / Refresh Access Token
 */
exports.refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    // Verify session in database first (token rotation check)
    const session = await db.session.findUnique({
      where: { refreshToken: token },
      include: { user: true }
    });

    if (!session || new Date() > session.expiresAt) {
      return res.status(401).json({ success: false, message: 'Session expired or invalidated. Please log in again.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'jk_enterprises_super_jwt_refresh_secret_token_2026');
    const user = session.user || await db.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User record not found.' });
    }

    const { accessToken } = signTokens(user.id, user.email, user.role);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    const userResponse = { ...user };
    delete userResponse.password;

    res.status(200).json({
      success: true,
      user: userResponse,
      token: accessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
};

/**
 * Logout User (Clears cookies and session entry)
 */
exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      // Remove session from DB
      await db.session.delete({ where: { refreshToken: token } }).catch(() => {});
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error during logout.' });
  }
};

/**
 * Get Me (returns logged-in user profile)
 */
exports.getMe = async (req, res) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user.id },
      include: { workerProfile: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    const userResponse = { ...user };
    delete userResponse.password;

    res.status(200).json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * Mock Phone OTP Login Simulation
 */
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please provide phone number.' });
    }

    // Simulated SMS dispatch
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log(`💬 [SMS Gateway mock] To: ${phone} - OTP Code: ${otp} (JK Enterprises Booking Gateway verification)`);

    res.status(200).json({
      success: true,
      message: 'OTP Code sent successfully. Check console log for code.',
      otp: otp // Exposed for local simulation convenience
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
};

/**
 * Mock Forgot Password Request
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email address.' });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user registered with this email.' });
    }

    const resetToken = Math.random().toString(36).substring(2, 10).toUpperCase();
    console.log(`✉️ [Mail Gateway mock] To: ${email} - Reset code: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: 'Reset instructions sent to your email. Check console log for code.',
      resetToken // Simulated for ease
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
