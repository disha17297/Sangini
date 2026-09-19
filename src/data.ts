import { Medicine, FamilyContact, StepGuide } from './types';

export const initialMedicines: Medicine[] = [
  {
    id: 'med-1',
    name: 'Amlodipine 5mg',
    hindiName: 'एम्लोडिपिन 5mg (ब्लड प्रेशर)',
    dosage: '1 tablet with water',
    timeOfDay: 'morning',
    timeLabel: '8:30 AM',
    takenToday: true,
    withFood: true,
    notes: 'For healthy blood pressure. Take after breakfast.',
  },
  {
    id: 'med-2',
    name: 'Metformin 500mg',
    hindiName: 'मेटफॉर्मिन 500mg (शुगर नियंत्रण)',
    dosage: '1 tablet after meals',
    timeOfDay: 'afternoon',
    timeLabel: '1:30 PM',
    takenToday: false,
    withFood: true,
    notes: 'Take right after lunch with a glass of water.',
  },
  {
    id: 'med-3',
    name: 'Shelcal 500 (Calcium + D3)',
    hindiName: 'शेलकल 500 (कैल्शियम और हड्डियां)',
    dosage: '1 tablet with warm milk',
    timeOfDay: 'night',
    timeLabel: '9:00 PM',
    takenToday: false,
    withFood: true,
    notes: 'Strengthens bones. Best taken before sleeping with warm milk.',
  },
];

export const initialFamilyContacts: FamilyContact[] = [
  {
    id: 'fam-1',
    name: 'Rahul Sharma',
    relation: 'Son (Primary Contact)',
    relationHi: 'बेटा (राहुल)',
    phone: '+919876543210',
    avatarBg: 'bg-amber-700',
    initials: 'RS',
  },
  {
    id: 'fam-2',
    name: 'Priya Sharma',
    relation: 'Daughter',
    relationHi: 'बेटी (प्रिया)',
    phone: '+919812345678',
    avatarBg: 'bg-emerald-700',
    initials: 'PS',
  },
  {
    id: 'fam-3',
    name: 'Aarav (Grandson)',
    relation: 'Grandson (Tech Helper)',
    relationHi: 'पोता (आरव)',
    phone: '+919845678901',
    avatarBg: 'bg-blue-700',
    initials: 'AS',
  },
  {
    id: 'fam-4',
    name: 'Dr. Anand Verma',
    relation: 'Family Physician',
    relationHi: 'पारिवारिक डॉक्टर (वर्मा जी)',
    phone: '+919823456789',
    avatarBg: 'bg-rose-700',
    initials: 'AV',
  },
];

export const stepGuides: StepGuide[] = [
  {
    id: 'guide-electricity-bill',
    titleEn: 'How to Safely Pay an Electricity Bill Online',
    titleHi: 'बिजली का बिल ऑनलाइन सुरक्षित कैसे भरें',
    category: 'banking',
    iconName: 'Zap',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Locate Your Consumer Number (CA Number)',
        headingHi: 'अपने बिल पर उपभोक्ता संख्या (CA Number) ढूंढें',
        descriptionEn:
          'Take your paper electricity bill from last month. Look at the top-right corner for a 9 or 10-digit number labeled "CA No." or "Consumer Number".',
        descriptionHi:
          'पिछले महीने का कागज़ का बिल हाथ में लें। ऊपर दाईं तरफ देखें, वहां 9 या 10 अंकों का "CA Number" या "Consumer Number" लिखा होगा।',
        cautionEn: 'Tip: You only need this number. You never need to enter passwords.',
        cautionHi: 'सलाह: केवल यह नंबर चाहिए। इसके लिए कोई पासवर्ड डालने की जरूरत नहीं होती।',
        actionLabelEn: 'I have the number ready',
        actionLabelHi: 'मेरे पास नंबर तैयार है',
      },
      {
        stepNumber: 2,
        headingEn: 'Open Verified Bill App or Board Portal',
        headingHi: 'अधिकृत बिजली बोर्ड ऐप या बैंक ऐप खोलें',
        descriptionEn:
          'Open your trusted banking app, Google Pay, or the electricity board portal. Tap on "Electricity" or "Bills". Never use links sent in random SMS.',
        descriptionHi:
          'अपने फोन में गूगल पे, फोन पे या बिजली बोर्ड का आधिकारिक ऐप खोलें। "Electricity" या "Bill" पर छुएं। कभी किसी अनजान SMS के लिंक को न खोलें।',
        cautionEn: 'Safety Rule: Always verify the name matches your official board (e.g. BSES, TATA Power, Mahavitaran).',
        cautionHi: 'सुरक्षा नियम: हमेशा जांचें कि बोर्ड का नाम सही है (जैसे BSES, टाटा पावर आदि)।',
        actionLabelEn: 'App opened safely',
        actionLabelHi: 'ऐप सुरक्षित रूप से खुल गया',
      },
      {
        stepNumber: 3,
        headingEn: 'Check Name and Amount Before Paying',
        headingHi: 'भुगतान से पहले नाम और रकम ध्यान से मिलाएं',
        descriptionEn:
          'When you enter your CA Number, the screen will automatically show your Name and exact amount. Verify that the name is YOUR name, not a stranger.',
        descriptionHi:
          'जैसे ही आप CA नंबर डालेंगे, स्क्रीन पर आपका नाम और सही रकम अपने आप आ जाएगी। जांच लें कि नाम आपका ही है।',
        cautionEn: 'Check: If the name does not match, stop immediately and ask family.',
        cautionHi: 'सावधानी: अगर नाम आपका नहीं है, तो आगे न बढ़ें और बच्चों से पूछें।',
        actionLabelEn: 'Name matches my bill',
        actionLabelHi: 'नाम बिल्कुल सही है',
      },
      {
        stepNumber: 4,
        headingEn: 'Pay Securely and Keep the Receipt',
        headingHi: 'सुरक्षित भुगतान करें और रसीद संभाल कर रखें',
        descriptionEn:
          'Enter your secret UPI PIN only on your phone keypad. Take a screenshot of the "Success" screen or note the transaction number.',
        descriptionHi:
          'अपना गोपनीय UPI पिन सिर्फ अपने फोन पर डालें। "सफल" (Success) स्क्रीन का स्क्रीनशॉट ले लें या डायरी में नंबर लिख लें।',
        cautionEn: 'Remember: UPI PIN is ONLY entered to SEND money, never to RECEIVE money.',
        cautionHi: 'याद रखें: UPI पिन केवल पैसे भेजने के लिए होता है, पैसे पाने के लिए कभी पिन नहीं डाला जाता।',
        actionLabelEn: 'Bill Paid Successfully!',
        actionLabelHi: 'बिल का भुगतान पूरा हुआ!',
      },
    ],
  },
  {
    id: 'guide-video-call',
    titleEn: 'How to Make a WhatsApp Video Call to Grandchildren',
    titleHi: 'पोते-पोतियों या बच्चों को WhatsApp वीडियो कॉल कैसे करें',
    category: 'communication',
    iconName: 'Video',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Open WhatsApp on Your Phone',
        headingHi: 'फोन में WhatsApp ऐप खोलें',
        descriptionEn:
          'Find the green WhatsApp icon with the white telephone picture. Tap it gently once with your finger.',
        descriptionHi:
          'हरे रंग के WhatsApp आइकन को देखें जिसमें सफेद फोन बना है। उस पर अपनी उंगली से एक बार छुएं।',
        actionLabelEn: 'WhatsApp is open',
        actionLabelHi: 'WhatsApp खुल गया है',
      },
      {
        stepNumber: 2,
        headingEn: 'Find Your Child or Grandchild’s Name',
        headingHi: 'अपने बच्चे या पोते का नाम सूची में ढूंढें',
        descriptionEn:
          'Scroll gently with your thumb until you see their name and photo. Tap on their name once to open the chat.',
        descriptionHi:
          'अंगूठे से हल्के से ऊपर-नीचे करें जब तक उनका नाम या फोटो न दिख जाए। उनके नाम पर एक बार छुएं।',
        actionLabelEn: 'Chat is open',
        actionLabelHi: 'बातचीत खुल गई',
      },
      {
        stepNumber: 3,
        headingEn: 'Tap the Small Video Camera Icon at the Top',
        headingHi: 'ऊपर दाईं तरफ छोटे वीडियो कैमरे के निशान पर छुएं',
        descriptionEn:
          'Look at the top right bar. You will see a small symbol that looks like a video camera next to the phone symbol. Tap the camera symbol.',
        descriptionHi:
          'स्क्रीन के सबसे ऊपर दाईं तरफ देखें। फोन के बगल में एक छोटा वीडियो कैमरा बना दिखेगा। उस कैमरे पर छुएं।',
        cautionEn: 'Make sure you are sitting in a comfortable, well-lit room so they can see your warm smile!',
        cautionHi: 'अच्छी रोशनी वाली जगह बैठें ताकि बच्चे आपकी प्यारी मुस्कान देख सकें!',
        actionLabelEn: 'Camera tapped',
        actionLabelHi: 'कैमरे पर छू दिया',
      },
      {
        stepNumber: 4,
        headingEn: 'Talk and Hold Phone in Front of Your Face',
        headingHi: 'फोन को चेहरे के सामने रखें और बातचीत करें',
        descriptionEn:
          'When they pick up, you will see their face on the screen! Hold the phone at eye level. When finished, tap the red telephone button to end the call.',
        descriptionHi:
          'जैसे ही वे फोन उठाएंगे, स्क्रीन पर उनका चेहरा दिखेगा! फोन को थोड़ा सामने रखें। बात खत्म होने पर लाल फोन वाले बटन से कॉल काटें।',
        actionLabelEn: 'Call finished happily!',
        actionLabelHi: 'कॉल पूरी हुई!',
      },
    ],
  },
  {
    id: 'guide-spot-scams',
    titleEn: 'How to Spot a Fake Bank Call or OTP Fraud',
    titleHi: 'नकली बैंक कॉल और OTP धोखाधड़ी को कैसे पहचानें',
    category: 'safety',
    iconName: 'ShieldAlert',
    steps: [
      {
        stepNumber: 1,
        headingEn: 'Recognize the Scam Call Pattern',
        headingHi: 'धोखेबाज कॉलर के बोलने का तरीका पहचानें',
        descriptionEn:
          'The caller sounds in a big hurry. They say: "Your ATM is blocked!", "Your pension is stopped!", or "You won a prize!". They try to frighten or rush you.',
        descriptionHi:
          'फोन करने वाला बहुत जल्दबाजी दिखाएगा। वह कहेगा: "आपका एटीएम बंद हो रहा है!", "आपकी पेंशन रुक गई है!" वे आपको डराने या उतावला करने की कोशिश करते हैं।',
        cautionEn: 'Golden Rule: Genuine officials NEVER speak with panic or urgency. You can always hang up.',
        cautionHi: 'सुनहरा नियम: असली बैंक अधिकारी कभी डराते नहीं हैं। आप तुरंत फोन काट सकते हैं।',
        actionLabelEn: 'Understood the pattern',
        actionLabelHi: 'यह बात समझ आ गई',
      },
      {
        stepNumber: 2,
        headingEn: 'They Ask for a 4 or 6 Digit Code (OTP)',
        headingHi: 'वे आपसे 4 या 6 अंकों का कोड (OTP) मांगते हैं',
        descriptionEn:
          'They say: "A code has come to your phone. Tell me the numbers to unlock your account." THIS IS A SCAM. That code is their way to steal your money.',
        descriptionHi:
          'वे कहेंगे: "आपके फोन पर एक नंबर आया है, खाता चालू रखने के लिए वह कोड बताएं।" यह सरासर धोखा है! उस कोड से वे आपके बैंक से पैसे निकालते हैं।',
        cautionEn: 'Strict Rule: Never, ever read out or type that code for ANY caller in the world.',
        cautionHi: 'कड़ा नियम: दुनिया के किसी भी कॉलर को यह कोड कभी न बताएं।',
        actionLabelEn: 'I will NEVER share OTP',
        actionLabelHi: 'मैं कभी OTP नहीं बताऊंगा/बताऊंगी',
      },
      {
        stepNumber: 3,
        headingEn: 'What to Say and Do: Simply Hang Up',
        headingHi: 'आपको क्या करना चाहिए: तुरंत फोन काट दें',
        descriptionEn:
          'Just say calmly: "I will visit my local branch with my son tomorrow." Then press the red button to hang up. Do not argue. Call your family contact right away.',
        descriptionHi:
          'शांत भाव से कहें: "मैं कल अपने बेटे के साथ बैंक शाखा जाकर पता करूँगा।" और लाल बटन दबाकर फोन काट दें। बहस न करें। तुरंत अपने बच्चों को फोन करें।',
        actionLabelEn: 'I feel confident & safe',
        actionLabelHi: 'मुझे पूरा आत्मविश्वास है',
      },
    ],
  },
];
