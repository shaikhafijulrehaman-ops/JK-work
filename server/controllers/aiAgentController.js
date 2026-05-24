const db = require('../db');

/**
 * Decoupled AI Call Agent simulation service (Telugu + English)
 * Extracts parameters and creates a mock booking in the system.
 */
exports.simulateCallInput = async (req, res) => {
  try {
    const { transcript, language } = req.body;

    if (!transcript) {
      return res.status(400).json({ success: false, message: 'Please provide vocal or text transcript.' });
    }

    const text = transcript.toLowerCase();
    let serviceCategory = 'Cleaning';
    let serviceName = 'Full House Deep Cleaning';
    let detectedPrice = 3499.0;
    let serviceId = 's-2'; // Default deep cleaning
    
    console.log(`🎙️ [AI Call Agent] Parsing call transcript in [${language || 'English'}]: "${transcript}"`);

    // 1. Relational Entity Extraction Mock
    if (text.includes('clean') || text.includes('illu') || text.includes('shubram')) {
      if (text.includes('bathroom') || text.includes('snanada')) {
        serviceName = 'Bathroom Deep Cleaning';
        detectedPrice = 749.0;
        serviceId = 's-3';
      } else if (text.includes('kitchen') || text.includes('vantage')) {
        serviceName = 'Full Kitchen Cleaning';
        detectedPrice = 499.0;
        serviceId = 's-4';
      } else if (text.includes('dust') || text.includes('dhulu')) {
        serviceName = 'Dust Cleaning';
        detectedPrice = 149.0;
        serviceId = 's-5';
      }
    } else if (text.includes('electrician') || text.includes('current') || text.includes('fan') || text.includes('light')) {
      serviceName = 'Electrician Service';
      serviceCategory = 'Technical';
      detectedPrice = 499.0;
      serviceId = 's-9';
    } else if (text.includes('baby') || text.includes('papak') || text.includes('child')) {
      serviceName = 'Baby Care';
      serviceCategory = 'Care';
      detectedPrice = 799.0;
      serviceId = 's-1';
    } else if (text.includes('shifting') || text.includes('shift') || text.includes('maney')) {
      serviceName = 'House Shifting';
      serviceCategory = 'Shifting';
      detectedPrice = 3499.0;
      serviceId = 's-6';
    } else if (text.includes('cook') || text.includes('vanta') || text.includes('cooking')) {
      serviceName = 'Cooking Service';
      serviceCategory = 'Cooking';
      detectedPrice = 149.0;
      serviceId = 's-7';
    }

    // 2. Extract address or fall back to Anchepalya default
    let address = 'Prestige Jindal City, Anchepalya, Bengaluru';
    if (text.includes('flat') || text.includes('block')) {
      // Simulate capturing exact numbers
      const match = text.match(/(flat|block)\s*(\d+|\w+)/i);
      if (match) {
        address = `${match[0].toUpperCase()}, Prestige Jindal City, Anchepalya, Bengaluru - 560073`;
      }
    }

    // 3. Setup dates and time slots
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Simulate booking under the logged-in user or a default call-agent user
    const userId = req.user ? req.user.id : 'user-cust';
    const area = await db.serviceArea.findUnique({ where: { pincode: '560073' } }) || { id: 'sa-1' };

    // Register a pending booking automatically!
    const booking = await db.booking.create({
      data: {
        userId,
        serviceAreaId: area.id,
        status: 'PENDING',
        scheduledAt: tomorrow,
        timeSlot: '11:00 AM - 12:00 PM',
        address,
        phone: req.user ? '9876543210' : '8431588235', // Dynamic contact
        totalPrice: detectedPrice,
        discountApplied: 0.0,
        finalPrice: detectedPrice,
        paymentStatus: 'UNPAID',
        paymentMethod: 'UPI',
        items: {
          createMany: {
            data: [
              {
                serviceId,
                quantity: 1,
                price: detectedPrice
              }
            ]
          }
        }
      }
    });

    // Notify Customer about automated booking
    await db.notification.create({
      data: {
        userId,
        type: 'BOOKING_ALERT',
        title: 'Booking Created via AI Call Agent!',
        message: `Our vocal AI parsed your call and registered: "${serviceName}" at "${address}" for tomorrow. Ref #${booking.id.substring(0,8)}.`
      }
    }).catch(() => {});

    // Bilingual speech response mockup
    let voiceResponse = `Got it! I have scheduled a ${serviceName} for tomorrow at ${address}. A booking request has been placed under reference ${booking.id.substring(0,8)}. You will receive a WhatsApp confirmation. Thank you!`;
    if (language === 'Telugu') {
      voiceResponse = `సరేనండి! రేపటి కోసం మీ ${serviceName} బుకింగ్ విజయవంతంగా నమోదు చేయబడింది. మీ చిరునామా: ${address}. మీ రిఫరెన్స్ నంబర్: ${booking.id.substring(0,8)}. ధన్యవాదాలు!`;
    }

    res.status(201).json({
      success: true,
      message: 'AI Agent parsed transcript and auto-created booking.',
      extractedEntities: {
        service: serviceName,
        category: serviceCategory,
        price: detectedPrice,
        address
      },
      voiceResponse,
      booking
    });
  } catch (error) {
    console.error('AI call agent simulation error:', error);
    res.status(500).json({ success: false, message: 'AI Call agent failed to process call transcript.' });
  }
};
