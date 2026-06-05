const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const otps = {};

// Helper to send mock WhatsApp notification to Admin
const sendAdminWhatsAppNotification = (name, mobile, email, action) => {
  const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  console.log(`
==================================================
💬 [WhatsApp Dispatch mock to ADMIN]
New Customer Activity

Name: ${name || 'N/A'}
Mobile: ${mobile || 'N/A'}
Email: ${email || 'N/A'}

Action: ${action}

Time: ${time}
==================================================
`);
};


// Helper to sign JWT tokens
const signTokens = (userId, email, role) => {
  const accessToken = jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || 'jk_enterprises_super_jwt_secret_token_2026',
    { expiresIn: '7d' }
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
  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

  // Log user audit log
  db.auditLog.create({
    data: {
      userId: user.id,
      action: 'ACCOUNT_LOGIN',
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
      email, password, name, phone, pincode, serviceArea
    } = req.body;

    if (!email || !password || !name || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide all required basic fields.' });
    }

    // Check if email or phone already exists
    console.log('--- BEFORE findUnique Call ---');
    console.log('Prisma Instance:', db.isSandbox() ? 'Sandbox fallback active' : 'Live Prisma connected');
    console.log('Model Name: User');
    console.log('Query Parameters:', JSON.stringify({ where: { email } }, null, 2));
    console.log('------------------------------');
    const existingEmail = await db.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email address already registered.' });
    }

    console.log('--- BEFORE findUnique Call ---');
    console.log('Prisma Instance:', db.isSandbox() ? 'Sandbox fallback active' : 'Live Prisma connected');
    console.log('Model Name: User');
    console.log('Query Parameters:', JSON.stringify({ where: { phone } }, null, 2));
    console.log('------------------------------');
    const existingPhone = await db.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'Phone number already registered.' });
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User record as USER (customer)
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: 'USER',
        isEmailVerified: true,
        isPhoneVerified: true,
        pincode: pincode || null,
        serviceArea: serviceArea || null
      }
    });

    // WhatsApp Notification
    sendAdminWhatsAppNotification(user.name, user.phone, user.email, 'Registration');

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'ACCOUNT_CREATED',
        details: JSON.stringify({ email: user.email, name: user.name, phone: user.phone }),
        ipAddress: req.ip
      }
    }).catch(e => {});

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

/**
 * Register a Service Partner (role = WORKER, approvalStatus = PENDING)
 */
exports.registerPartner = async (req, res) => {
  return res.status(400).json({ 
    success: false, 
    message: 'Service Partner registration is no longer supported on this platform.' 
  });
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

    console.log('--- BEFORE findUnique Call ---');
    console.log('Prisma Instance:', db.isSandbox() ? 'Sandbox fallback active' : 'Live Prisma connected');
    console.log('Model Name: User');
    console.log('Query Parameters:', JSON.stringify({ where: { email } }, null, 2));
    console.log('------------------------------');
    const user = await db.user.findUnique({ 
      where: { email }
    });

    if (!user || user.role === 'WORKER') {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // WhatsApp Notification
    sendAdminWhatsAppNotification(user.name, user.phone, user.email, 'Login');

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
    console.log('--- BEFORE findUnique Call ---');
    console.log('Prisma Instance:', db.isSandbox() ? 'Sandbox fallback active' : 'Live Prisma connected');
    console.log('Model Name: Session');
    console.log('Query Parameters:', JSON.stringify({ where: { refreshToken: token }, include: { user: true } }, null, 2));
    console.log('------------------------------');
    const session = await db.session.findUnique({
      where: { refreshToken: token },
      include: { user: true }
    });

    if (!session || new Date() > session.expiresAt) {
      return res.status(401).json({ success: false, message: 'Session expired or invalidated. Please log in again.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'jk_enterprises_super_jwt_refresh_secret_token_2026');
    console.log('--- BEFORE findUnique Call ---');
    console.log('Prisma Instance:', db.isSandbox() ? 'Sandbox fallback active' : 'Live Prisma connected');
    console.log('Model Name: User');
    console.log('Query Parameters:', JSON.stringify({ where: { id: decoded.userId } }, null, 2));
    console.log('------------------------------');
    const user = session.user || await db.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User record not found.' });
    }

    const { accessToken } = signTokens(user.id, user.email, user.role);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'jk_enterprises_super_jwt_refresh_secret_token_2026');
        if (decoded && decoded.userId) {
          await db.auditLog.create({
            data: {
              userId: decoded.userId,
              action: 'ACCOUNT_LOGOUT',
              details: JSON.stringify({ email: decoded.email }),
              ipAddress: req.ip
            }
          }).catch(() => {});
        }
      } catch (err) {}
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
    console.log('--- BEFORE findUnique Call ---');
    console.log('Prisma Instance:', db.isSandbox() ? 'Sandbox fallback active' : 'Live Prisma connected');
    console.log('Model Name: User');
    console.log('Query Parameters:', JSON.stringify({ where: { id: req.user.id }, include: { workerProfile: true } }, null, 2));
    console.log('------------------------------');
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
 * Mock Email OTP Login Simulation
 */
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email address.' });
    }

    // Simulated Email dispatch
    const otp = Math.floor(100000 + Math.random() * 900000);
    otps[email] = otp;
    console.log(`✉️ [Mail Gateway mock] To: ${email} - OTP Code: ${otp} (JK Enterprises Email OTP Verification)`);

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

    console.log('--- BEFORE findUnique Call ---');
    console.log('Prisma Instance:', db.isSandbox() ? 'Sandbox fallback active' : 'Live Prisma connected');
    console.log('Model Name: User');
    console.log('Query Parameters:', JSON.stringify({ where: { email } }, null, 2));
    console.log('------------------------------');
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

/**
 * Register user details in waitlist
 */
exports.joinWaitlist = async (req, res) => {
  try {
    const { name, mobile, email, selectedArea, pincode, location, latitude, longitude } = req.body;
    if (!name || !mobile || !email) {
      return res.status(400).json({ success: false, message: 'Please provide name, mobile, and email.' });
    }

    const waitlistEntry = await db.waitlist.create({
      data: {
        name,
        mobile,
        email,
        selected_area: selectedArea || location || '',
        pincode: pincode || '',
        location: location || selectedArea || '',
        latitude: latitude !== undefined && latitude !== null ? parseFloat(latitude) : null,
        longitude: longitude !== undefined && longitude !== null ? parseFloat(longitude) : null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist!',
      data: waitlistEntry
    });
  } catch (error) {
    console.error('Waitlist join error:', error);
    res.status(500).json({ success: false, message: 'Server error during waitlist submission.' });
  }
};

/**
 * Sync Supabase User
 */
exports.syncSupabase = async (req, res) => {
  try {
    const { id, email, name, phone, role, pincode, serviceArea } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required for syncing.' });
    }

    // Check if user already exists in User table to avoid foreign key violations
    let user = await db.user.findUnique({ where: { email } });
    if (!user) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync(Math.random().toString(36), 10);
      
      // Avoid phone constraint violations by checking existence
      let userPhone = phone || '0000000000';
      if (phone) {
        const existingPhoneUser = await db.user.findUnique({ where: { phone } });
        if (existingPhoneUser) {
          userPhone = `${phone}_${Date.now()}`;
        }
      }

      user = await db.user.create({
        data: {
          id: id || undefined,
          email,
          password: hashedPassword,
          name: name || 'User',
          phone: userPhone,
          role: 'USER',
          pincode: pincode || null,
          serviceArea: serviceArea || null
        }
      });
      console.log('USER INSERT RESPONSE: User created successfully in db.user', user);
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'ACCOUNT_CREATED',
          details: JSON.stringify({ email: user.email, name: user.name, phone: user.phone }),
          ipAddress: req.ip
        }
      }).catch(e => {});
    } else {
      console.log('USER INSERT RESPONSE: User already exists in db.user', user);
    }

    // Check if customer already exists
    console.log('--- BEFORE findUnique Call ---');
    console.log('Prisma Instance:', db.isSandbox() ? 'Sandbox fallback active' : 'Live Prisma connected');
    console.log('Model Name: Customer');
    console.log('Query Parameters:', JSON.stringify({ where: { email } }, null, 2));
    console.log('------------------------------');
    let customer = await db.customer.findUnique({ where: { email } });

    if (!customer) {
      // Create customer if not exists
      customer = await db.customer.create({
        data: {
          id: id || user.id || undefined,
          email,
          name: name || 'User',
          phone: phone || '0000000000',
          pincode: pincode || null,
          serviceArea: serviceArea || null
        }
      });
      console.log('CUSTOMER INSERT RESPONSE: Customer created successfully', customer);
    } else {
      console.log('CUSTOMER INSERT RESPONSE: Customer already exists', customer);
    }

    const { accessToken, refreshToken } = signTokens(customer.id, customer.email, 'USER');

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };

    await db.session.create({
      data: {
        userId: customer.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    }).catch(e => console.warn('Prisma session creation log:', e.message));

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    await db.auditLog.create({
      data: {
        userId: customer.id,
        action: 'ACCOUNT_LOGIN',
        details: JSON.stringify({ email: customer.email, role: 'USER' }),
        ipAddress: req.ip
      }
    }).catch(e => {});

    // WhatsApp Notification
    sendAdminWhatsAppNotification(customer.name, customer.phone, customer.email, 'Registration / Login');

    res.status(200).json({
      success: true,
      user: { ...customer, role: 'USER' },
      token: accessToken,
      message: 'Supabase sync successful.'
    });
  } catch (error) {
    console.error('Supabase sync error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during supabase sync.' });
  }
};

/**
 * Verify OTP Code and login or proceed
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP code.' });
    }

    const cachedOtp = otps[email];
    if (!cachedOtp || String(cachedOtp) !== String(code)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
    }

    // Clear OTP code from cache
    delete otps[email];

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
      include: { workerProfile: true }
    });

    if (!user) {
      // User doesn't exist yet (this is the signup flow)
      await db.auditLog.create({
        data: {
          userId: null,
          action: 'OTP_VERIFICATION',
          details: JSON.stringify({ email, success: true, message: 'OTP verified for new user signup' }),
          ipAddress: req.ip
        }
      }).catch(() => {});

      return res.status(200).json({
        success: true,
        userExists: false,
        message: 'OTP verification successful.'
      });
    }

    // User exists (this is the login flow)
    const { accessToken, refreshToken } = signTokens(user.id, user.email, user.role);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };

    await db.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    }).catch(e => console.warn('Prisma session creation log:', e.message));

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'OTP_VERIFICATION',
        details: JSON.stringify({ email: user.email, role: user.role, method: 'OTP' }),
        ipAddress: req.ip
      }
    }).catch(() => {});

    // Remove password from response
    const userResponse = { ...user };
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      userExists: true,
      user: userResponse,
      token: accessToken
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
  }
};

/**
 * Update User Profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, password, pincode, serviceArea } = req.body;

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email && email !== user.email) {
      const existingEmail = await db.user.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already in use.' });
      }
      updateData.email = email;
    }
    if (phone && phone !== user.phone) {
      const existingPhone = await db.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({ success: false, message: 'Phone number already in use.' });
      }
      updateData.phone = phone;
    }
    if (password) {
      updateData.password = bcrypt.hashSync(password, 10);
    }
    if (pincode) updateData.pincode = pincode;
    if (serviceArea) updateData.serviceArea = serviceArea;

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData
    });

    await db.auditLog.create({
      data: {
        userId: userId,
        action: 'PROFILE_UPDATED',
        details: JSON.stringify({
          updatedFields: Object.keys(updateData).filter(k => k !== 'password')
        }),
        ipAddress: req.ip
      }
    }).catch(() => {});

    const userResponse = { ...updatedUser };
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: userResponse
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error during profile update.' });
  }
};


