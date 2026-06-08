const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { logActivity } = require('../utils/auditLogger');

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
  logActivity(res.req, {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    eventType: 'LOGIN',
    action: 'ACCOUNT_LOGIN',
    details: { email: user.email, role: user.role }
  });

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

    logActivity(req, {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      eventType: 'REGISTRATION',
      action: 'ACCOUNT_CREATED',
      details: { email: user.email, name: user.name, phone: user.phone }
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Unable to complete registration. Please try again shortly.' });
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
  const { email, password } = req.body;
  console.log(`[LOGIN TRACE] 🛡️ Login request initiated for email: ${email}`);
  
  try {
    if (!email || !password) {
      console.warn(`[LOGIN TRACE] ⚠️ Missing login credentials.`);
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    console.log(`[LOGIN TRACE] Step 1: Querying user from database...`);
    const user = await db.user.findUnique({ 
      where: { email }
    });
    console.log(`[LOGIN TRACE] Database query completed. User found: ${!!user}`);

    if (!user || user.role === 'WORKER') {
      console.warn(`[AUTH FAILURE] Login failed for ${email}: User account not found or role WORKER restricted.`);
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    console.log(`[LOGIN TRACE] Step 2: Comparing bcrypt passwords...`);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`[LOGIN TRACE] Bcrypt comparison completed. Match result: ${isMatch}`);
    
    if (!isMatch) {
      console.warn(`[AUTH FAILURE] Login failed for ${email}: Incorrect password.`);
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    console.log(`[LOGIN TRACE] Step 3: Triggering WhatsApp admin notification...`);
    sendAdminWhatsAppNotification(user.name, user.phone, user.email, 'Login');

    console.log(`[LOGIN TRACE] Step 4: Structuring token response...`);
    sendTokenResponse(user, 200, res);
    console.log(`[LOGIN TRACE] ✅ Login response sent successfully.`);
  } catch (error) {
    console.error('💥 [LOGIN AUDIT ERROR] Exception caught during user login flow:', error.message);
    
    console.error(`[AUTH FAILURE] Login failed for ${email}: ${error.message}`);
    
    const isDbError = error.message?.toLowerCase().includes('connection') || 
                      error.message?.toLowerCase().includes('timeout') || 
                      error.message?.toLowerCase().includes('pool') ||
                      error.message?.toLowerCase().includes('socket') ||
                      error.code?.startsWith('P'); // Prisma database error code
                      
    if (isDbError) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database is temporarily unavailable. Please try again shortly.' 
      });
    }
    
    res.status(500).json({ success: false, message: 'An internal server error occurred. Please try again shortly.' });
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
          logActivity(req, {
            userId: decoded.userId,
            userEmail: decoded.email,
            userRole: decoded.role,
            eventType: 'LOGIN',
            action: 'ACCOUNT_LOGOUT',
            details: { email: decoded.email }
          });
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
    res.status(500).json({ success: false, message: 'Unable to log out. Please try again shortly.' });
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
    console.log('Query Parameters:', JSON.stringify({ where: { id: req.user.id } }, null, 2));
    console.log('------------------------------');
    const user = await db.user.findUnique({
      where: { id: req.user.id }
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
    res.status(500).json({ success: false, message: 'An unexpected error occurred. Please try again shortly.' });
  }
};

const { sendEmail } = require('../utils/email');

// Helper to send real OTP email via Nodemailer SMTP with auto-retry
const sendOTPEmail = async (email, otp) => {
  const subject = 'JK Home Care - OTP Verification Code';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #06b6d4; text-align: center;">JK Home Care</h2>
      <p>Hello,</p>
      <p>Thank you for choosing JK Home Care. Use the following One-Time Password (OTP) to complete your verification:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a; background-color: #f1f5f9; padding: 10px 20px; border-radius: 4px; border: 1px dashed #cbd5e1;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 14px;">This code is valid for 10 minutes. If you did not request this verification, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="text-align: center; color: #94a3b8; font-size: 12px;">© 2026 JK Home Care. All rights reserved.</p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html: htmlContent });
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

    const otp = Math.floor(100000 + Math.random() * 900000);
    otps[email] = otp;
    console.log(`✉️ [Mail Gateway] Generating OTP for ${email}: ${otp}`);

    // Trigger the actual email send asynchronously
    sendOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP Code sent successfully. Please check your email.',
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined // Expose OTP only in development/test
    });
  } catch (error) {
    console.error('Send OTP error:', error);
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
      message: 'Reset instructions sent to your email.',
      resetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'An unexpected error occurred. Please try again shortly.' });
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
    res.status(500).json({ success: false, message: 'Unable to join waitlist. Please try again shortly.' });
  }
};

/**
 * Sync Supabase User
 */
exports.syncSupabase = async (req, res) => {
  try {
    const { id, email, name, phone, role, pincode, serviceArea, password } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required for syncing.' });
    }

    // Check if phone already registered by another account to prevent unique constraint crashes
    if (phone) {
      const existingPhoneUser = await db.user.findUnique({ where: { phone } });
      if (existingPhoneUser && existingPhoneUser.email !== email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Phone number is already registered under another account. Please use a different number or log in.' 
        });
      }
    }

    // Check if user already exists in User table to avoid foreign key violations
    let user = await db.user.findUnique({ where: { email } });
    if (!user) {
      const hashedPassword = password ? bcrypt.hashSync(password, 10) : bcrypt.hashSync(Math.random().toString(36), 10);
      
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
      logActivity(req, {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        eventType: 'REGISTRATION',
        action: 'ACCOUNT_CREATED',
        details: { email: user.email, name: user.name, phone: user.phone }
      });
    } else {
      console.log('USER INSERT RESPONSE: User already exists in db.user', user);
      const updateData = {};
      if (name && !user.name) updateData.name = name;
      if (phone && (!user.phone || user.phone === '0000000000')) updateData.phone = phone;
      if (pincode && !user.pincode) updateData.pincode = pincode;
      if (serviceArea && !user.serviceArea) updateData.serviceArea = serviceArea;
      if (Object.keys(updateData).length > 0) {
        user = await db.user.update({
          where: { id: user.id },
          data: updateData
        });
      }
    }

    const { accessToken, refreshToken } = signTokens(user.id, user.email, 'USER');

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

    logActivity(req, {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: 'USER',
      eventType: 'LOGIN',
      action: 'ACCOUNT_LOGIN',
      details: { email: user.email, role: 'USER' }
    });

    // WhatsApp Notification
    sendAdminWhatsAppNotification(user.name, user.phone, user.email, 'Registration / Login');

    const userResponse = { ...user };
    delete userResponse.password;

    res.status(200).json({
      success: true,
      user: { ...userResponse, role: 'USER' },
      token: accessToken,
      message: 'Supabase sync successful.'
    });
  } catch (error) {
    console.error('Supabase sync error:', error);
    res.status(500).json({ success: false, message: 'Account synchronization failed. Please try again shortly.' });
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
      where: { email }
    });

    if (!user) {
      // User doesn't exist yet (this is the signup flow)
      logActivity(req, {
        userId: null,
        userEmail: email,
        eventType: 'LOGIN',
        action: 'OTP_VERIFICATION',
        details: { email, success: true, message: 'OTP verified for new user signup' }
      });

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

    logActivity(req, {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      eventType: 'LOGIN',
      action: 'OTP_VERIFICATION',
      details: { email: user.email, role: user.role, method: 'OTP' }
    });

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
    res.status(500).json({ success: false, message: 'Unable to verify OTP. Please try again shortly.' });
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

    logActivity(req, {
      userId: userId,
      eventType: 'USER',
      action: 'PROFILE_UPDATED',
      details: {
        updatedFields: Object.keys(updateData).filter(k => k !== 'password')
      }
    });

    const userResponse = { ...updatedUser };
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: userResponse
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Unable to update profile. Please try again shortly.' });
  }
};

/**
 * Google Login (checks if email exists in database, else returns error)
 */
exports.googleLogin = async (req, res) => {
  const { email } = req.body;
  console.log(`[GOOGLE LOGIN TRACE] 🛡️ Google login request initiated for email: ${email}`);

  try {
    if (!email) {
      console.warn(`[GOOGLE LOGIN TRACE] ⚠️ Missing Google email.`);
      return res.status(400).json({ success: false, message: 'Please provide email.' });
    }

    console.log(`[GOOGLE LOGIN TRACE] Step 1: Querying user from database...`);
    const user = await db.user.findUnique({ 
      where: { email }
    });
    console.log(`[GOOGLE LOGIN TRACE] Database query completed. User found: ${!!user}`);

    if (!user) {
      console.warn(`[GOOGLE LOGIN TRACE] ⚠️ Authentication failed: User email ${email} not found.`);
      return res.status(404).json({ success: false, message: 'Account not found. Please register first.' });
    }

    console.log(`[GOOGLE LOGIN TRACE] Step 2: Triggering WhatsApp admin notification...`);
    sendAdminWhatsAppNotification(user.name, user.phone, user.email, 'Google Login');

    console.log(`[GOOGLE LOGIN TRACE] Step 3: Structuring token response...`);
    sendTokenResponse(user, 200, res);
    console.log(`[GOOGLE LOGIN TRACE] ✅ Google Login response sent successfully.`);
  } catch (error) {
    console.error('💥 [GOOGLE LOGIN ERROR] Exception caught:', error);
    res.status(500).json({ success: false, message: 'Unable to complete Google login. Please try again shortly.' });
  }
};


