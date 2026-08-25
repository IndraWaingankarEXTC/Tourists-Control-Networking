import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = "https://ccjygeoxaoomhonwenqw.supabase.co";
const SUPABASE_KEY = "sb_publishable_rPFLHItf9TI4P_i14P5bqw_tD5dz6mk";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const POLICE_TEST_DESK_NUMBER = "+918591314313";
const GEOFENCE_POLL_MS = 15000;
const LOCATION_PUSH_MS = 20000;

const state = {
  currentRole: "tourist",
  userCoords: { latitude: 18.9894, longitude: 73.1175 },
  gpsIsReal: false,
  currentUserProfile: null,
  touristMap: null,
  touristMarker: null,
  geofenceCircle: null,
  geofenceZone: null,
  lastGeofenceState: null,
  activeSosAlertId: null,
  staffSession: null,
  superAdminPasscode: null,
  locationWatchId: null,
  locationPushTimer: null,
  geofenceTimer: null,
  sosFromGeofence: false
};

const LS_USER_ID_KEY = "touristSafetyUserId";
const LS_LANG_KEY = "touristSafetyLang";
const SS_STAFF_KEY = "touristSafetyStaffSession";
const SS_SUPERADMIN_KEY = "touristSafetySuperAdmin";

/* =========================================================
   TRANSLATIONS
========================================================= */

const TRANSLATIONS = {

  en: {
    eyebrow:"MULTI-DESTINATION DISPATCH & ID GRID",
    heroTitle1:"Access Control",
    heroTitle2:"System",
    heroSub:"Select your authorization tier to access live telemetry and safety ID cards.",
    publicEntry:"PUBLIC ENTRY",
    userPortal:"User Portal",
    userPortalDesc:"Register as a tourist or volunteer, generate digital safety ID card.",
    zoneAuthority:"ZONE AUTHORITY",
    staffCommand:"Staff Command",
    staffCommandDesc:"Monitor real-time alerts, configure desk phone, and broadcast WhatsApp dispatches.",
    headOfPlatform:"HEAD OF PLATFORM",
    masterControl:"Master Control",
    masterControlDesc:"Global oversight across all active tourist destinations.",

    registerTourist:"Register Tourist",
    registerVolunteer:"Register Volunteer",
    registering:"Registering…",
    completeRegistration:"Complete Registration & Generate ID",
    registrationComplete:"Registration complete — your safety ID card is ready.",
    duplicatePhone:"This phone number is already registered — try Sign In instead.",
    registrationFailed:"Registration failed. Please check your details and try again.",

    insideSafe:"Inside Safe Zone",
    outsideSafe:"Outside Safe Zone",
    monitored:"Monitored by local destination command center.",

    sendSOS:"SEND LIVE SOS",
    sendingSOS:"SENDING SOS…",
    sosActive:"SOS ACTIVE — HELP EN ROUTE",
    sosSent:"SOS sent. Command HQ and your emergency contact have been notified.",
    sosFailed:"Could not send SOS — check your connection and try again.",

    locationDenied:"Location permission denied — using an approximate default position.",
    photoSkipped:"Photo upload skipped — continuing registration without it.",
    safeMessage:"Understood — glad you're safe. Stay alert near the zone boundary.",

    signinNotFound:"No profile found for that phone number.",
    loginFailed:"Login failed — please try again.",
    incorrectPasscode:"Incorrect passcode for this zone.",
    masterPasscode:"Incorrect master passcode.",
    invalidZone:"Invalid zone credentials",

    alertResolved:"Alert marked resolved.",
    resolveFailed:"Could not resolve alert.",
    zoneDataFailed:"Could not load zone data.",
    masterDataFailed:"Could not load master control data.",

    noZoneRegistrations:"No registrations yet for this zone.",
    noRegistrations:"No registrations yet.",

    victimContact:"Victim Contact",
    policeDesk:"Police Desk",
    zoneHQ:"Zone HQ",
    primary:"Primary",
    send:"Send",
    markResolved:"Mark Resolved",
    call:"Call",

    safe:"Safe",
    sos:"SOS",
    global:"GLOBAL",

    welcomeBack:"Welcome back, {name}.",
    needSignin:"You need to be signed in to send an SOS.",
    sessionRestore:"Could not restore your session — please sign in again.",

    emergencyAlert:"EMERGENCY DISTRESS ALERT - TOURIST SAFETY GRID",
    name:"Name",
    phone:"Phone",
    zone:"Zone",
    bloodGroup:"Blood Group",
    coordinates:"Coordinates",
    status:"Status"
  },

  hi: {
    eyebrow:"मल्टी-डेस्टिनेशन डिस्पैच और आईडी ग्रिड",
    heroTitle1:"एक्सेस कंट्रोल",
    heroTitle2:"सिस्टम",
    heroSub:"लाइव टेलीमेट्री और सुरक्षा आईडी कार्ड तक पहुँचने के लिए अपना अधिकार स्तर चुनें।",
    publicEntry:"सार्वजनिक प्रवेश",
    userPortal:"यूज़र पोर्टल",
    userPortalDesc:"पर्यटक या स्वयंसेवक के रूप में पंजीकरण करें और डिजिटल सुरक्षा आईडी कार्ड बनाएं।",
    zoneAuthority:"ज़ोन प्राधिकरण",
    staffCommand:"स्टाफ कमांड",
    staffCommandDesc:"रीयल-टाइम अलर्ट देखें, डेस्क फ़ोन सेट करें और व्हाट्सऐप डिस्पैच भेजें।",
    headOfPlatform:"प्लेटफ़ॉर्म प्रमुख",
    masterControl:"मास्टर कंट्रोल",
    masterControlDesc:"सभी सक्रिय पर्यटक गंतव्यों पर वैश्विक निगरानी।",

    registerTourist:"पर्यटक पंजीकरण",
    registerVolunteer:"स्वयंसेवक पंजीकरण",
    registering:"पंजीकरण हो रहा है…",
    completeRegistration:"पंजीकरण पूरा करें और आईडी बनाएं",
    registrationComplete:"पंजीकरण पूरा हुआ — आपकी सुरक्षा आईडी तैयार है।",
    duplicatePhone:"यह फ़ोन नंबर पहले से पंजीकृत है — साइन इन करें।",
    registrationFailed:"पंजीकरण विफल हुआ। विवरण जाँचकर फिर प्रयास करें।",

    insideSafe:"सुरक्षित क्षेत्र में",
    outsideSafe:"सुरक्षित क्षेत्र से बाहर",
    monitored:"स्थानीय गंतव्य कमांड सेंटर द्वारा निगरानी की जा रही है।",

    sendSOS:"लाइव SOS भेजें",
    sendingSOS:"SOS भेजा जा रहा है…",
    sosActive:"SOS सक्रिय — सहायता रास्ते में है",
    sosSent:"SOS भेज दिया गया। कमांड मुख्यालय और आपातकालीन संपर्क को सूचित किया गया है।",
    sosFailed:"SOS नहीं भेजा जा सका — कनेक्शन जाँचकर फिर प्रयास करें।",

    locationDenied:"लोकेशन अनुमति नहीं मिली — अनुमानित स्थान का उपयोग किया जा रहा है।",
    photoSkipped:"फ़ोटो अपलोड नहीं हुई — पंजीकरण बिना फ़ोटो के जारी है।",
    safeMessage:"समझ गया — खुशी है कि आप सुरक्षित हैं। ज़ोन सीमा के पास सतर्क रहें।",

    signinNotFound:"इस फ़ोन नंबर के लिए कोई प्रोफ़ाइल नहीं मिली।",
    loginFailed:"लॉगिन विफल — फिर प्रयास करें।",
    incorrectPasscode:"इस ज़ोन का पासकोड गलत है।",
    masterPasscode:"मास्टर पासकोड गलत है।",
    invalidZone:"ज़ोन क्रेडेंशियल अमान्य हैं",

    alertResolved:"अलर्ट को हल किया गया है।",
    resolveFailed:"अलर्ट हल नहीं किया जा सका।",
    zoneDataFailed:"ज़ोन डेटा लोड नहीं हो सका।",
    masterDataFailed:"मास्टर कंट्रोल डेटा लोड नहीं हो सका।",

    noZoneRegistrations:"इस ज़ोन के लिए अभी कोई पंजीकरण नहीं है।",
    noRegistrations:"अभी कोई पंजीकरण नहीं है।",

    victimContact:"पीड़ित संपर्क",
    policeDesk:"पुलिस डेस्क",
    zoneHQ:"ज़ोन मुख्यालय",
    primary:"प्राथमिक",
    send:"भेजें",
    markResolved:"हल किया गया",
    call:"कॉल",

    safe:"सुरक्षित",
    sos:"SOS",
    global:"वैश्विक",

    welcomeBack:"वापसी पर स्वागत है, {name}।",
    needSignin:"SOS भेजने के लिए साइन इन करना आवश्यक है।",
    sessionRestore:"सत्र पुनर्स्थापित नहीं हो सका — कृपया फिर साइन इन करें।",

    emergencyAlert:"आपातकालीन सहायता अलर्ट - पर्यटक सुरक्षा ग्रिड",
    name:"नाम",
    phone:"फ़ोन",
    zone:"ज़ोन",
    bloodGroup:"ब्लड ग्रुप",
    coordinates:"निर्देशांक",
    status:"स्थिति"
  },

  mr: {
    eyebrow:"मल्टी-डेस्टिनेशन डिस्पॅच आणि आयडी ग्रिड",
    heroTitle1:"अॅक्सेस कंट्रोल",
    heroTitle2:"सिस्टम",
    heroSub:"लाइव्ह टेलिमेट्री आणि सुरक्षा आयडी कार्डसाठी तुमचा अधिकार स्तर निवडा.",
    publicEntry:"सार्वजनिक प्रवेश",
    userPortal:"वापरकर्ता पोर्टल",
    userPortalDesc:"पर्यटक किंवा स्वयंसेवक म्हणून नोंदणी करा आणि डिजिटल सुरक्षा आयडी तयार करा.",
    zoneAuthority:"झोन प्राधिकरण",
    staffCommand:"स्टाफ कमांड",
    staffCommandDesc:"रिअल-टाइम अलर्ट पाहा, डेस्क फोन सेट करा आणि WhatsApp डिस्पॅच पाठवा.",
    headOfPlatform:"प्लॅटफॉर्म प्रमुख",
    masterControl:"मास्टर कंट्रोल",
    masterControlDesc:"सर्व सक्रिय पर्यटन स्थळांवर जागतिक देखरेख.",

    registerTourist:"पर्यटक नोंदणी",
    registerVolunteer:"स्वयंसेवक नोंदणी",
    registering:"नोंदणी सुरू आहे…",
    completeRegistration:"नोंदणी पूर्ण करा आणि आयडी तयार करा",
    registrationComplete:"नोंदणी पूर्ण झाली — तुमचे सुरक्षा आयडी तयार आहे.",
    duplicatePhone:"हा फोन नंबर आधीच नोंदणीकृत आहे — साइन इन करा.",
    registrationFailed:"नोंदणी अयशस्वी झाली. तपशील तपासून पुन्हा प्रयत्न करा.",

    insideSafe:"सुरक्षित क्षेत्रात",
    outsideSafe:"सुरक्षित क्षेत्राबाहेर",
    monitored:"स्थानिक गंतव्य कमांड सेंटरकडून देखरेख केली जात आहे.",

    sendSOS:"लाइव्ह SOS पाठवा",
    sendingSOS:"SOS पाठवत आहे…",
    sosActive:"SOS सक्रिय — मदत मार्गावर आहे",
    sosSent:"SOS पाठवला आहे. कमांड मुख्यालय आणि आपत्कालीन संपर्काला कळवले आहे.",
    sosFailed:"SOS पाठवता आले नाही — कनेक्शन तपासून पुन्हा प्रयत्न करा.",

    locationDenied:"स्थानाची परवानगी नाकारली — अंदाजे स्थान वापरले जात आहे.",
    photoSkipped:"फोटो अपलोड वगळला — फोटोशिवाय नोंदणी सुरू ठेवत आहे.",
    safeMessage:"समजले — तुम्ही सुरक्षित आहात याचा आनंद आहे. झोन सीमेवर सावध राहा.",

    signinNotFound:"या फोन नंबरसाठी प्रोफाइल सापडले नाही.",
    loginFailed:"लॉगिन अयशस्वी — पुन्हा प्रयत्न करा.",
    incorrectPasscode:"या झोनचा पासकोड चुकीचा आहे.",
    masterPasscode:"मास्टर पासकोड चुकीचा आहे.",
    invalidZone:"झोन क्रेडेन्शियल्स अमान्य आहेत",

    alertResolved:"अलर्ट सोडवला गेला आहे.",
    resolveFailed:"अलर्ट सोडवता आला नाही.",
    zoneDataFailed:"झोन डेटा लोड करता आला नाही.",
    masterDataFailed:"मास्टर कंट्रोल डेटा लोड करता आला नाही.",

    noZoneRegistrations:"या झोनसाठी अजून नोंदणी नाही.",
    noRegistrations:"अजून नोंदणी नाही.",

    victimContact:"पीडित संपर्क",
    policeDesk:"पोलीस डेस्क",
    zoneHQ:"झोन मुख्यालय",
    primary:"प्राथमिक",
    send:"पाठवा",
    markResolved:"सोडवले",
    call:"कॉल",

    safe:"सुरक्षित",
    sos:"SOS",
    global:"जागतिक",

    welcomeBack:"पुन्हा स्वागत आहे, {name}.",
    needSignin:"SOS पाठवण्यासाठी साइन इन करणे आवश्यक आहे.",
    sessionRestore:"सत्र पुनर्संचयित करता आले नाही — कृपया पुन्हा साइन इन करा.",

    emergencyAlert:"आपत्कालीन मदत अलर्ट - पर्यटक सुरक्षा ग्रिड",
    name:"नाव",
    phone:"फोन",
    zone:"झोन",
    bloodGroup:"ब्लड ग्रुप",
    coordinates:"निर्देशांक",
    status:"स्थिती"
  },

  gu: {
    eyebrow:"મલ્ટી-ડેસ્ટિનેશન ડિસ્પેચ અને આઈડી ગ્રિડ",
    heroTitle1:"ઍક્સેસ કંટ્રોલ",
    heroTitle2:"સિસ્ટમ",
    heroSub:"લાઇવ ટેલિમેટ્રી અને સુરક્ષા આઈડી કાર્ડ માટે તમારો અધિકાર સ્તર પસંદ કરો.",
    publicEntry:"જાહેર પ્રવેશ",
    userPortal:"યુઝર પોર્ટલ",
    userPortalDesc:"પ્રવાસી અથવા સ્વયંસેવક તરીકે નોંધણી કરો અને ડિજિટલ સુરક્ષા આઈડી બનાવો.",
    zoneAuthority:"ઝોન સત્તા",
    staffCommand:"સ્ટાફ કમાન્ડ",
    staffCommandDesc:"રીઅલ-ટાઇમ એલર્ટ જુઓ, ડેસ્ક ફોન સેટ કરો અને WhatsApp ડિસ્પેચ મોકલો.",
    headOfPlatform:"પ્લેટફોર્મ વડા",
    masterControl:"માસ્ટર કંટ્રોલ",
    masterControlDesc:"તમામ સક્રિય પ્રવાસન સ્થળોની વૈશ્વિક દેખરેખ.",

    registerTourist:"પ્રવાસી નોંધણી",
    registerVolunteer:"સ્વયંસેવક નોંધણી",
    registering:"નોંધણી થઈ રહી છે…",
    completeRegistration:"નોંધણી પૂર્ણ કરો અને આઈડી બનાવો",
    registrationComplete:"નોંધણી પૂર્ણ — તમારી સુરક્ષા આઈડી તૈયાર છે.",
    duplicatePhone:"આ ફોન નંબર પહેલેથી નોંધાયેલ છે — સાઇન ઇન કરો.",
    registrationFailed:"નોંધણી નિષ્ફળ. વિગતો તપાસીને ફરી પ્રયાસ કરો.",

    insideSafe:"સુરક્ષિત ઝોનમાં",
    outsideSafe:"સુરક્ષિત ઝોનની બહાર",
    monitored:"સ્થાનિક ડેસ્ટિનેશન કમાન્ડ સેન્ટર દ્વારા દેખરેખ રાખવામાં આવે છે.",

    sendSOS:"લાઇવ SOS મોકલો",
    sendingSOS:"SOS મોકલાઈ રહ્યું છે…",
    sosActive:"SOS સક્રિય — મદદ આવી રહી છે",
    sosSent:"SOS મોકલાયું. કમાન્ડ HQ અને આપાતકાલીન સંપર્કને જાણ કરવામાં આવી છે.",
    sosFailed:"SOS મોકલી શકાયું નહીં — કનેક્શન તપાસીને ફરી પ્રયાસ કરો.",

    locationDenied:"સ્થાનની પરવાનગી ન મળી — અંદાજિત સ્થાનનો ઉપયોગ થઈ રહ્યો છે.",
    photoSkipped:"ફોટો અપલોડ છોડવામાં આવ્યો — ફોટા વિના નોંધણી ચાલુ છે.",
    safeMessage:"સમજાયું — તમે સુરક્ષિત છો તેનો આનંદ છે. ઝોનની સીમા પાસે સાવચેત રહો.",

    signinNotFound:"આ ફોન નંબર માટે પ્રોફાઇલ મળી નથી.",
    loginFailed:"લૉગિન નિષ્ફળ — ફરી પ્રયાસ કરો.",
    incorrectPasscode:"આ ઝોનનો પાસકોડ ખોટો છે.",
    masterPasscode:"માસ્ટર પાસકોડ ખોટો છે.",
    invalidZone:"ઝોન ક્રેડેન્શિયલ્સ અમાન્ય છે",

    alertResolved:"એલર્ટ ઉકેલાયું છે.",
    resolveFailed:"એલર્ટ ઉકેલી શકાયું નહીં.",
    zoneDataFailed:"ઝોન ડેટા લોડ થઈ શક્યો નહીં.",
    masterDataFailed:"માસ્ટર કંટ્રોલ ડેટા લોડ થઈ શક્યો નહીં.",

    noZoneRegistrations:"આ ઝોન માટે હજુ નોંધણી નથી.",
    noRegistrations:"હજુ નોંધણી નથી.",

    victimContact:"પીડિત સંપર્ક",
    policeDesk:"પોલીસ ડેસ્ક",
    zoneHQ:"ઝોન મુખ્યાલય",
    primary:"પ્રાથમિક",
    send:"મોકલો",
    markResolved:"ઉકેલાયેલ",
    call:"કૉલ",

    safe:"સુરક્ષિત",
    sos:"SOS",
    global:"વૈશ્વિક",

    welcomeBack:"ફરી સ્વાગત છે, {name}.",
    needSignin:"SOS મોકલવા માટે સાઇન ઇન કરવું જરૂરી છે.",
    sessionRestore:"સત્ર પુનઃસ્થાપિત થઈ શક્યું નથી — ફરી સાઇન ઇન કરો.",

    emergencyAlert:"કટોકટી સહાય એલર્ટ - પ્રવાસી સુરક્ષા ગ્રિડ",
    name:"નામ",
    phone:"ફોન",
    zone:"ઝોન",
    bloodGroup:"બ્લડ ગ્રુપ",
    coordinates:"કોઓર્ડિનેટ્સ",
    status:"સ્થિતિ"
  },

  bn: {
    eyebrow:"মাল্টি-ডেস্টিনেশন ডিসপ্যাচ ও আইডি গ্রিড",
    heroTitle1:"অ্যাক্সেস কন্ট্রোল",
    heroTitle2:"সিস্টেম",
    heroSub:"লাইভ টেলিমেট্রি ও নিরাপত্তা আইডি কার্ডে প্রবেশের জন্য আপনার অনুমোদন স্তর নির্বাচন করুন।",
    publicEntry:"সর্বজনীন প্রবেশ",
    userPortal:"ইউজার পোর্টাল",
    userPortalDesc:"পর্যটক বা স্বেচ্ছাসেবক হিসেবে নিবন্ধন করুন এবং ডিজিটাল নিরাপত্তা আইডি তৈরি করুন।",
    zoneAuthority:"জোন কর্তৃপক্ষ",
    staffCommand:"স্টাফ কমান্ড",
    staffCommandDesc:"রিয়েল-টাইম সতর্কতা দেখুন, ডেস্ক ফোন সেট করুন এবং WhatsApp ডিসপ্যাচ পাঠান।",
    headOfPlatform:"প্ল্যাটফর্ম প্রধান",
    masterControl:"মাস্টার কন্ট্রোল",
    masterControlDesc:"সক্রিয় সব পর্যটন গন্তব্যের বৈশ্বিক নজরদারি।",

    registerTourist:"পর্যটক নিবন্ধন",
    registerVolunteer:"স্বেচ্ছাসেবক নিবন্ধন",
    registering:"নিবন্ধন হচ্ছে…",
    completeRegistration:"নিবন্ধন সম্পূর্ণ করুন ও আইডি তৈরি করুন",
    registrationComplete:"নিবন্ধন সম্পূর্ণ — আপনার নিরাপত্তা আইডি প্রস্তুত।",
    duplicatePhone:"এই ফোন নম্বর ইতিমধ্যে নিবন্ধিত — সাইন ইন করুন।",
    registrationFailed:"নিবন্ধন ব্যর্থ হয়েছে। তথ্য পরীক্ষা করে আবার চেষ্টা করুন।",

    insideSafe:"নিরাপদ জোনের ভিতরে",
    outsideSafe:"নিরাপদ জোনের বাইরে",
    monitored:"স্থানীয় গন্তব্য কমান্ড সেন্টার নজরদারি করছে।",

    sendSOS:"লাইভ SOS পাঠান",
    sendingSOS:"SOS পাঠানো হচ্ছে…",
    sosActive:"SOS সক্রিয় — সাহায্য আসছে",
    sosSent:"SOS পাঠানো হয়েছে। কমান্ড HQ ও জরুরি যোগাযোগকে জানানো হয়েছে।",
    sosFailed:"SOS পাঠানো যায়নি — সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।",

    locationDenied:"লোকেশন অনুমতি দেওয়া হয়নি — আনুমানিক অবস্থান ব্যবহার করা হচ্ছে।",
    photoSkipped:"ছবি আপলোড বাদ দেওয়া হয়েছে — ছবি ছাড়াই নিবন্ধন চলছে।",
    safeMessage:"বুঝেছি — আপনি নিরাপদ আছেন জেনে ভালো লাগছে। জোনের সীমানায় সতর্ক থাকুন।",

    signinNotFound:"এই ফোন নম্বরের কোনো প্রোফাইল পাওয়া যায়নি।",
    loginFailed:"লগইন ব্যর্থ — আবার চেষ্টা করুন।",
    incorrectPasscode:"এই জোনের পাসকোড ভুল।",
    masterPasscode:"মাস্টার পাসকোড ভুল।",
    invalidZone:"জোনের তথ্য সঠিক নয়",

    alertResolved:"সতর্কতা সমাধান করা হয়েছে।",
    resolveFailed:"সতর্কতা সমাধান করা যায়নি।",
    zoneDataFailed:"জোনের তথ্য লোড করা যায়নি।",
    masterDataFailed:"মাস্টার কন্ট্রোল তথ্য লোড করা যায়নি।",

    noZoneRegistrations:"এই জোনে এখনও কোনো নিবন্ধন নেই।",
    noRegistrations:"এখনও কোনো নিবন্ধন নেই।",

    victimContact:"ভিকটিম যোগাযোগ",
    policeDesk:"পুলিশ ডেস্ক",
    zoneHQ:"জোন সদর দপ্তর",
    primary:"প্রাথমিক",
    send:"পাঠান",
    markResolved:"সমাধান করা হয়েছে",
    call:"কল",

    safe:"নিরাপদ",
    sos:"SOS",
    global:"সর্বজনীন",

    welcomeBack:"আবার স্বাগতম, {name}.",
    needSignin:"SOS পাঠাতে সাইন ইন করতে হবে।",
    sessionRestore:"সেশন পুনরুদ্ধার করা যায়নি — আবার সাইন ইন করুন।",

    emergencyAlert:"জরুরি সহায়তা সতর্কতা - পর্যটক নিরাপত্তা গ্রিড",
    name:"নাম",
    phone:"ফোন",
    zone:"জোন",
    bloodGroup:"রক্তের গ্রুপ",
    coordinates:"স্থানাঙ্ক",
    status:"অবস্থা"
  },

  ta: {
    eyebrow:"பல இலக்கு டிஸ்பாட்ச் மற்றும் ஐடி கிரிட்",
    heroTitle1:"அணுகல் கட்டுப்பாடு",
    heroTitle2:"அமைப்பு",
    heroSub:"நேரடி டெலிமெட்ரி மற்றும் பாதுகாப்பு ஐடி கார்டுகளை அணுக உங்கள் அனுமதி நிலையைத் தேர்ந்தெடுக்கவும்.",
    publicEntry:"பொது நுழைவு",
    userPortal:"பயனர் போர்டல்",
    userPortalDesc:"சுற்றுலாப் பயணி அல்லது தன்னார்வலராக பதிவு செய்து டிஜிட்டல் பாதுகாப்பு ஐடியை உருவாக்கவும்.",
    zoneAuthority:"மண்டல அதிகாரம்",
    staffCommand:"ஊழியர் கட்டுப்பாடு",
    staffCommandDesc:"நேரடி எச்சரிக்கைகளை கண்காணித்து, டெஸ்க் தொலைபேசியை அமைத்து WhatsApp அனுப்பவும்.",
    headOfPlatform:"தளத் தலைவர்",
    masterControl:"மாஸ்டர் கட்டுப்பாடு",
    masterControlDesc:"அனைத்து செயலில் உள்ள சுற்றுலா இடங்களையும் கண்காணிக்கவும்.",

    registerTourist:"சுற்றுலாப் பயணி பதிவு",
    registerVolunteer:"தன்னார்வலர் பதிவு",
    registering:"பதிவு செய்யப்படுகிறது…",
    completeRegistration:"பதிவை முடித்து ஐடியை உருவாக்கவும்",
    registrationComplete:"பதிவு முடிந்தது — உங்கள் பாதுகாப்பு ஐடி தயாராக உள்ளது.",
    duplicatePhone:"இந்த தொலைபேசி எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது — உள்நுழையவும்.",
    registrationFailed:"பதிவு தோல்வியடைந்தது. விவரங்களைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",

    insideSafe:"பாதுகாப்பான மண்டலத்தில்",
    outsideSafe:"பாதுகாப்பான மண்டலத்திற்கு வெளியே",
    monitored:"உள்ளூர் கட்டளை மையம் கண்காணிக்கிறது.",

    sendSOS:"நேரடி SOS அனுப்பவும்",
    sendingSOS:"SOS அனுப்பப்படுகிறது…",
    sosActive:"SOS செயலில் — உதவி வருகிறது",
    sosSent:"SOS அனுப்பப்பட்டது. கட்டளை மையத்திற்கும் அவசர தொடர்பிற்கும் தகவல் அனுப்பப்பட்டது.",
    sosFailed:"SOS அனுப்ப முடியவில்லை — இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",

    locationDenied:"இருப்பிட அனுமதி மறுக்கப்பட்டது — தோராயமான இருப்பிடம் பயன்படுத்தப்படுகிறது.",
    photoSkipped:"புகைப்படப் பதிவேற்றம் தவிர்க்கப்பட்டது — புகைப்படமின்றி பதிவு தொடர்கிறது.",
    safeMessage:"புரிந்தது — நீங்கள் பாதுகாப்பாக இருப்பதில் மகிழ்ச்சி. மண்டல எல்லையில் எச்சரிக்கையாக இருங்கள்.",

    signinNotFound:"இந்த தொலைபேசி எண்ணுக்கு சுயவிவரம் கிடைக்கவில்லை.",
    loginFailed:"உள்நுழைவு தோல்வி — மீண்டும் முயற்சிக்கவும்.",
    incorrectPasscode:"இந்த மண்டலத்தின் கடவுக்குறியீடு தவறானது.",
    masterPasscode:"மாஸ்டர் கடவுக்குறியீடு தவறானது.",
    invalidZone:"மண்டல சான்றுகள் தவறானவை",

    alertResolved:"எச்சரிக்கை தீர்க்கப்பட்டது.",
    resolveFailed:"எச்சரிக்கையைத் தீர்க்க முடியவில்லை.",
    zoneDataFailed:"மண்டலத் தரவை ஏற்ற முடியவில்லை.",
    masterDataFailed:"மாஸ்டர் கட்டுப்பாட்டு தரவை ஏற்ற முடியவில்லை.",

    noZoneRegistrations:"இந்த மண்டலத்தில் இன்னும் பதிவுகள் இல்லை.",
    noRegistrations:"இன்னும் பதிவுகள் இல்லை.",

    victimContact:"பாதிக்கப்பட்டவர் தொடர்பு",
    policeDesk:"காவல் மேசை",
    zoneHQ:"மண்டல தலைமையகம்",
    primary:"முதன்மை",
    send:"அனுப்பு",
    markResolved:"தீர்க்கப்பட்டது",
    call:"அழைப்பு",

    safe:"பாதுகாப்பானது",
    sos:"SOS",
    global:"உலகளாவிய",

    welcomeBack:"மீண்டும் வரவேற்கிறோம், {name}.",
    needSignin:"SOS அனுப்ப உள்நுழைய வேண்டும்.",
    sessionRestore:"அமர்வை மீட்டெடுக்க முடியவில்லை — மீண்டும் உள்நுழையவும்.",

    emergencyAlert:"அவசர உதவி எச்சரிக்கை - சுற்றுலா பாதுகாப்பு கிரிட்",
    name:"பெயர்",
    phone:"தொலைபேசி",
    zone:"மண்டலம்",
    bloodGroup:"இரத்த வகை",
    coordinates:"ஆயத்தொலைவுகள்",
    status:"நிலை"
  },

  te: {
    eyebrow:"మల్టీ-డెస్టినేషన్ డిస్పాచ్ & ఐడి గ్రిడ్",
    heroTitle1:"యాక్సెస్ కంట్రోల్",
    heroTitle2:"సిస్టమ్",
    heroSub:"లైవ్ టెలిమెట్రీ మరియు సేఫ్టీ ఐడి కార్డులను యాక్సెస్ చేయడానికి మీ అధికార స్థాయిని ఎంచుకోండి.",
    publicEntry:"పబ్లిక్ ఎంట్రీ",
    userPortal:"యూజర్ పోర్టల్",
    userPortalDesc:"పర్యాటకుడు లేదా వాలంటీర్‌గా నమోదు చేసుకుని డిజిటల్ సేఫ్టీ ఐడిని రూపొందించండి.",
    zoneAuthority:"జోన్ అధికారం",
    staffCommand:"స్టాఫ్ కమాండ్",
    staffCommandDesc:"రియల్-టైమ్ అలర్ట్‌లను పర్యవేక్షించి, డెస్క్ ఫోన్‌ను కాన్ఫిగర్ చేసి WhatsApp డిస్పాచ్ పంపండి.",
    headOfPlatform:"ప్లాట్‌ఫారమ్ అధిపతి",
    masterControl:"మాస్టర్ కంట్రోల్",
    masterControlDesc:"అన్ని క్రియాశీల పర్యాటక గమ్యస్థానాలపై పర్యవేక్షణ.",

    registerTourist:"పర్యాటక నమోదు",
    registerVolunteer:"వాలంటీర్ నమోదు",
    registering:"నమోదు జరుగుతోంది…",
    completeRegistration:"నమోదు పూర్తి చేసి ఐడిని రూపొందించండి",
    registrationComplete:"నమోదు పూర్తయింది — మీ సేఫ్టీ ఐడి సిద్ధంగా ఉంది.",
    duplicatePhone:"ఈ ఫోన్ నంబర్ ఇప్పటికే నమోదైంది — సైన్ ఇన్ చేయండి.",
    registrationFailed:"నమోదు విఫలమైంది. వివరాలను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",

    insideSafe:"సురక్షిత జోన్‌లో",
    outsideSafe:"సురక్షిత జోన్ వెలుపల",
    monitored:"స్థానిక కమాండ్ సెంటర్ పర్యవేక్షిస్తోంది.",

    sendSOS:"లైవ్ SOS పంపండి",
    sendingSOS:"SOS పంపుతోంది…",
    sosActive:"SOS యాక్టివ్ — సహాయం వస్తోంది",
    sosSent:"SOS పంపబడింది. కమాండ్ HQ మరియు అత్యవసర సంప్రదింపులకు సమాచారం ఇచ్చాం.",
    sosFailed:"SOS పంపలేకపోయాం — కనెక్షన్ తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",

    locationDenied:"స్థాన అనుమతి నిరాకరించబడింది — అంచనా స్థానాన్ని ఉపయోగిస్తున్నాం.",
    photoSkipped:"ఫోటో అప్‌లోడ్ దాటవేయబడింది — ఫోటో లేకుండా నమోదు కొనసాగుతోంది.",
    safeMessage:"అర్థమైంది — మీరు సురక్షితంగా ఉన్నందుకు సంతోషం. జోన్ సరిహద్దులో అప్రమత్తంగా ఉండండి.",

    signinNotFound:"ఈ ఫోన్ నంబర్‌కు ప్రొఫైల్ కనుగొనబడలేదు.",
    loginFailed:"లాగిన్ విఫలమైంది — మళ్లీ ప్రయత్నించండి.",
    incorrectPasscode:"ఈ జోన్ పాస్‌కోడ్ తప్పు.",
    masterPasscode:"మాస్టర్ పాస్‌కోడ్ తప్పు.",
    invalidZone:"జోన్ ఆధారాలు చెల్లవు",

    alertResolved:"అలర్ట్ పరిష్కరించబడింది.",
    resolveFailed:"అలర్ట్‌ను పరిష్కరించలేకపోయాం.",
    zoneDataFailed:"జోన్ డేటాను లోడ్ చేయలేకపోయాం.",
    masterDataFailed:"మాస్టర్ కంట్రోల్ డేటాను లోడ్ చేయలేకపోయాం.",

    noZoneRegistrations:"ఈ జోన్‌లో ఇంకా నమోదు లేదు.",
    noRegistrations:"ఇంకా నమోదు లేదు.",

    victimContact:"బాధితుడి సంప్రదింపు",
    policeDesk:"పోలీస్ డెస్క్",
    zoneHQ:"జోన్ ప్రధాన కార్యాలయం",
    primary:"ప్రాథమిక",
    send:"పంపండి",
    markResolved:"పరిష్కరించబడింది",
    call:"కాల్",

    safe:"సురక్షితం",
    sos:"SOS",
    global:"ప్రపంచవ్యాప్త",

    welcomeBack:"తిరిగి స్వాగతం, {name}.",
    needSignin:"SOS పంపడానికి సైన్ ఇన్ చేయాలి.",
    sessionRestore:"సెషన్‌ను పునరుద్ధరించలేకపోయాం — మళ్లీ సైన్ ఇన్ చేయండి.",

    emergencyAlert:"అత్యవసర సహాయ హెచ్చరిక - పర్యాటక భద్రతా గ్రిడ్",
    name:"పేరు",
    phone:"ఫోన్",
    zone:"జోన్",
    bloodGroup:"రక్త వర్గం",
    coordinates:"కోఆర్డినేట్లు",
    status:"స్థితి"
  },

  kn: {
    eyebrow:"ಮಲ್ಟಿ-ಡೆಸ್ಟಿನೇಶನ್ ಡಿಸ್ಪ್ಯಾಚ್ ಮತ್ತು ಐಡಿ ಗ್ರಿಡ್",
    heroTitle1:"ಆಕ್ಸೆಸ್ ಕಂಟ್ರೋಲ್",
    heroTitle2:"ಸಿಸ್ಟಮ್",
    heroSub:"ಲೈವ್ ಟೆಲಿಮೆಟ್ರಿ ಮತ್ತು ಸುರಕ್ಷತಾ ಐಡಿ ಕಾರ್ಡ್‌ಗಳಿಗೆ ನಿಮ್ಮ ಅಧಿಕಾರ ಮಟ್ಟವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    publicEntry:"ಸಾರ್ವಜನಿಕ ಪ್ರವೇಶ",
    userPortal:"ಬಳಕೆದಾರ ಪೋರ್ಟಲ್",
    userPortalDesc:"ಪ್ರವಾಸಿ ಅಥವಾ ಸ್ವಯಂಸೇವಕರಾಗಿ ನೋಂದಾಯಿಸಿ ಮತ್ತು ಡಿಜಿಟಲ್ ಸುರಕ್ಷತಾ ಐಡಿ ರಚಿಸಿ.",
    zoneAuthority:"ವಲಯ ಪ್ರಾಧಿಕಾರ",
    staffCommand:"ಸ್ಟಾಫ್ ಕಮಾಂಡ್",
    staffCommandDesc:"ರಿಯಲ್-ಟೈಮ್ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಗಮನಿಸಿ, ಡೆಸ್ಕ್ ಫೋನ್ ಹೊಂದಿಸಿ ಮತ್ತು WhatsApp ಡಿಸ್ಪ್ಯಾಚ್ ಕಳುಹಿಸಿ.",
    headOfPlatform:"ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಮುಖ್ಯಸ್ಥ",
    masterControl:"ಮಾಸ್ಟರ್ ಕಂಟ್ರೋಲ್",
    masterControlDesc:"ಎಲ್ಲಾ ಸಕ್ರಿಯ ಪ್ರವಾಸಿ ಸ್ಥಳಗಳ ಜಾಗತಿಕ ಮೇಲ್ವಿಚಾರಣೆ.",

    registerTourist:"ಪ್ರವಾಸಿ ನೋಂದಣಿ",
    registerVolunteer:"ಸ್ವಯಂಸೇವಕ ನೋಂದಣಿ",
    registering:"ನೋಂದಣಿ ನಡೆಯುತ್ತಿದೆ…",
    completeRegistration:"ನೋಂದಣಿ ಪೂರ್ಣಗೊಳಿಸಿ ಮತ್ತು ಐಡಿ ರಚಿಸಿ",
    registrationComplete:"ನೋಂದಣಿ ಪೂರ್ಣ — ನಿಮ್ಮ ಸುರಕ್ಷತಾ ಐಡಿ ಸಿದ್ಧವಾಗಿದೆ.",
    duplicatePhone:"ಈ ಫೋನ್ ಸಂಖ್ಯೆ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ — ಸೈನ್ ಇನ್ ಮಾಡಿ.",
    registrationFailed:"ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ. ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",

    insideSafe:"ಸುರಕ್ಷಿತ ವಲಯದೊಳಗೆ",
    outsideSafe:"ಸುರಕ್ಷಿತ ವಲಯದ ಹೊರಗೆ",
    monitored:"ಸ್ಥಳೀಯ ಕಮಾಂಡ್ ಸೆಂಟರ್ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡುತ್ತಿದೆ.",

    sendSOS:"ಲೈವ್ SOS ಕಳುಹಿಸಿ",
    sendingSOS:"SOS ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…",
    sosActive:"SOS ಸಕ್ರಿಯ — ಸಹಾಯ ಬರುತ್ತಿದೆ",
    sosSent:"SOS ಕಳುಹಿಸಲಾಗಿದೆ. ಕಮಾಂಡ್ HQ ಮತ್ತು ತುರ್ತು ಸಂಪರ್ಕಕ್ಕೆ ಮಾಹಿತಿ ನೀಡಲಾಗಿದೆ.",
    sosFailed:"SOS ಕಳುಹಿಸಲಾಗಲಿಲ್ಲ — ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",

    locationDenied:"ಸ್ಥಳ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ — ಅಂದಾಜು ಸ್ಥಳ ಬಳಸಲಾಗುತ್ತಿದೆ.",
    photoSkipped:"ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಬಿಟ್ಟುಹೋಗಿದೆ — ಫೋಟೋ ಇಲ್ಲದೆ ನೋಂದಣಿ ಮುಂದುವರಿಯುತ್ತಿದೆ.",
    safeMessage:"ಅರ್ಥವಾಯಿತು — ನೀವು ಸುರಕ್ಷಿತವಾಗಿರುವುದು ಸಂತೋಷ. ವಲಯದ ಗಡಿಯಲ್ಲಿ ಎಚ್ಚರಿಕೆಯಿಂದಿರಿ.",

    signinNotFound:"ಈ ಫೋನ್ ಸಂಖ್ಯೆಗೆ ಪ್ರೊಫೈಲ್ ಕಂಡುಬಂದಿಲ್ಲ.",
    loginFailed:"ಲಾಗಿನ್ ವಿಫಲ — ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    incorrectPasscode:"ಈ ವಲಯದ ಪಾಸ್‌ಕೋಡ್ ತಪ್ಪಾಗಿದೆ.",
    masterPasscode:"ಮಾಸ್ಟರ್ ಪಾಸ್‌ಕೋಡ್ ತಪ್ಪಾಗಿದೆ.",
    invalidZone:"ವಲಯದ ವಿವರಗಳು ಅಮಾನ್ಯ",

    alertResolved:"ಎಚ್ಚರಿಕೆ ಪರಿಹರಿಸಲಾಗಿದೆ.",
    resolveFailed:"ಎಚ್ಚರಿಕೆಯನ್ನು ಪರಿಹರಿಸಲಾಗಲಿಲ್ಲ.",
    zoneDataFailed:"ವಲಯದ ಡೇಟಾ ಲೋಡ್ ಆಗಲಿಲ್ಲ.",
    masterDataFailed:"ಮಾಸ್ಟರ್ ಕಂಟ್ರೋಲ್ ಡೇಟಾ ಲೋಡ್ ಆಗಲಿಲ್ಲ.",

    noZoneRegistrations:"ಈ ವಲಯದಲ್ಲಿ ಇನ್ನೂ ನೋಂದಣಿಗಳಿಲ್ಲ.",
    noRegistrations:"ಇನ್ನೂ ನೋಂದಣಿಗಳಿಲ್ಲ.",

    victimContact:"ಪೀಡಿತ ಸಂಪರ್ಕ",
    policeDesk:"ಪೊಲೀಸ್ ಡೆಸ್ಕ್",
    zoneHQ:"ವಲಯ ಮುಖ್ಯ ಕಚೇರಿ",
    primary:"ಪ್ರಾಥಮಿಕ",
    send:"ಕಳುಹಿಸಿ",
    markResolved:"ಪರಿಹರಿಸಲಾಗಿದೆ",
    call:"ಕರೆ",

    safe:"ಸುರಕ್ಷಿತ",
    sos:"SOS",
    global:"ಜಾಗತಿಕ",

    welcomeBack:"ಮತ್ತೆ ಸ್ವಾಗತ, {name}.",
    needSignin:"SOS ಕಳುಹಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಬೇಕು.",
    sessionRestore:"ಸೆಷನ್ ಮರುಸ್ಥಾಪಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ — ಮತ್ತೆ ಸೈನ್ ಇನ್ ಮಾಡಿ.",

    emergencyAlert:"ತುರ್ತು ಸಹಾಯ ಎಚ್ಚರಿಕೆ - ಪ್ರವಾಸಿ ಸುರಕ್ಷತಾ ಗ್ರಿಡ್",
    name:"ಹೆಸರು",
    phone:"ಫೋನ್",
    zone:"ವಲಯ",
    bloodGroup:"ರಕ್ತದ ಗುಂಪು",
    coordinates:"ನಿರ್ದೇಶಾಂಕಗಳು",
    status:"ಸ್ಥಿತಿ"
  },

  ml: {
    eyebrow:"മൾട്ടി-ഡെസ്റ്റിനേഷൻ ഡിസ്പാച്ച് & ഐഡി ഗ്രിഡ്",
    heroTitle1:"ആക്സസ് കൺട്രോൾ",
    heroTitle2:"സിസ്റ്റം",
    heroSub:"ലൈവ് ടെലിമെട്രിയും സുരക്ഷാ ഐഡി കാർഡുകളും ആക്സസ് ചെയ്യാൻ നിങ്ങളുടെ അനുമതി നില തിരഞ്ഞെടുക്കുക.",
    publicEntry:"പൊതു പ്രവേശനം",
    userPortal:"യൂസർ പോർട്ടൽ",
    userPortalDesc:"ടൂറിസ്റ്റായോ വോളന്റിയറായോ രജിസ്റ്റർ ചെയ്ത് ഡിജിറ്റൽ സുരക്ഷാ ഐഡി സൃഷ്ടിക്കുക.",
    zoneAuthority:"സോൺ അതോറിറ്റി",
    staffCommand:"സ്റ്റാഫ് കമാൻഡ്",
    staffCommandDesc:"റിയൽ-ടൈം അലർട്ടുകൾ നിരീക്ഷിച്ച് ഡെസ്ക് ഫോൺ ക്രമീകരിക്കുകയും WhatsApp ഡിസ്പാച്ച് അയയ്ക്കുകയും ചെയ്യുക.",
    headOfPlatform:"പ്ലാറ്റ്ഫോം മേധാവി",
    masterControl:"മാസ്റ്റർ കൺട്രോൾ",
    masterControlDesc:"സജീവമായ എല്ലാ വിനോദസഞ്ചാര കേന്ദ്രങ്ങളുടെയും ആഗോള മേൽനോട്ടം.",

    registerTourist:"ടൂറിസ്റ്റ് രജിസ്ട്രേഷൻ",
    registerVolunteer:"വോളന്റിയർ രജിസ്ട്രേഷൻ",
    registering:"രജിസ്ട്രേഷൻ നടക്കുന്നു…",
    completeRegistration:"രജിസ്ട്രേഷൻ പൂർത്തിയാക്കി ഐഡി സൃഷ്ടിക്കുക",
    registrationComplete:"രജിസ്ട്രേഷൻ പൂർത്തിയായി — നിങ്ങളുടെ സുരക്ഷാ ഐഡി തയ്യാറാണ്.",
    duplicatePhone:"ഈ ഫോൺ നമ്പർ ഇതിനകം രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട് — സൈൻ ഇൻ ചെയ്യുക.",
    registrationFailed:"രജിസ്ട്രേഷൻ പരാജയപ്പെട്ടു. വിവരങ്ങൾ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.",

    insideSafe:"സുരക്ഷിത സോണിനുള്ളിൽ",
    outsideSafe:"സുരക്ഷിത സോണിന് പുറത്ത്",
    monitored:"പ്രാദേശിക കമാൻഡ് സെന്റർ നിരീക്ഷിക്കുന്നു.",

    sendSOS:"ലൈവ് SOS അയയ്ക്കുക",
    sendingSOS:"SOS അയയ്ക്കുന്നു…",
    sosActive:"SOS സജീവം — സഹായം വരുന്നു",
    sosSent:"SOS അയച്ചു. കമാൻഡ് HQ-യെയും അടിയന്തര ബന്ധത്തെയും അറിയിച്ചു.",
    sosFailed:"SOS അയയ്ക്കാൻ കഴിഞ്ഞില്ല — കണക്ഷൻ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.",

    locationDenied:"ലൊക്കേഷൻ അനുമതി നിഷേധിച്ചു — ഏകദേശ സ്ഥാനം ഉപയോഗിക്കുന്നു.",
    photoSkipped:"ഫോട്ടോ അപ്‌ലോഡ് ഒഴിവാക്കി — ഫോട്ടോ ഇല്ലാതെ രജിസ്ട്രേഷൻ തുടരുന്നു.",
    safeMessage:"മനസ്സിലായി — നിങ്ങൾ സുരക്ഷിതരാണെന്നതിൽ സന്തോഷം. സോൺ അതിർത്തിക്ക് സമീപം ജാഗ്രത പാലിക്കുക.",

    signinNotFound:"ഈ ഫോൺ നമ്പറിനായി പ്രൊഫൈൽ കണ്ടെത്തിയില്ല.",
    loginFailed:"ലോഗിൻ പരാജയപ്പെട്ടു — വീണ്ടും ശ്രമിക്കുക.",
    incorrectPasscode:"ഈ സോണിന്റെ പാസ്‌കോഡ് തെറ്റാണ്.",
    masterPasscode:"മാസ്റ്റർ പാസ്‌കോഡ് തെറ്റാണ്.",
    invalidZone:"സോൺ ക്രെഡൻഷ്യലുകൾ അസാധുവാണ്",

    alertResolved:"അലർട്ട് പരിഹരിച്ചു.",
    resolveFailed:"അലർട്ട് പരിഹരിക്കാൻ കഴിഞ്ഞില്ല.",
    zoneDataFailed:"സോൺ ഡാറ്റ ലോഡ് ചെയ്യാനായില്ല.",
    masterDataFailed:"മാസ്റ്റർ കൺട്രോൾ ഡാറ്റ ലോഡ് ചെയ്യാനായില്ല.",

    noZoneRegistrations:"ഈ സോണിൽ രജിസ്ട്രേഷനുകളൊന്നുമില്ല.",
    noRegistrations:"ഇതുവരെ രജിസ്ട്രേഷനുകളില്ല.",

    victimContact:"ബാധിത ബന്ധപ്പെടൽ",
    policeDesk:"പോലീസ് ഡെസ്ക്",
    zoneHQ:"സോൺ ഹെഡ്ക്വാർട്ടേഴ്സ്",
    primary:"പ്രാഥമിക",
    send:"അയയ്ക്കുക",
    markResolved:"പരിഹരിച്ചു",
    call:"വിളിക്കുക",

    safe:"സുരക്ഷിതം",
    sos:"SOS",
    global:"ആഗോള",

    welcomeBack:"വീണ്ടും സ്വാഗതം, {name}.",
    needSignin:"SOS അയയ്ക്കാൻ സൈൻ ഇൻ ചെയ്യണം.",
    sessionRestore:"സെഷൻ പുനഃസ്ഥാപിക്കാൻ കഴിഞ്ഞില്ല — വീണ്ടും സൈൻ ഇൻ ചെയ്യുക.",

    emergencyAlert:"അടിയന്തര സഹായ അലർട്ട് - ടൂറിസ്റ്റ് സുരക്ഷാ ഗ്രിഡ്",
    name:"പേര്",
    phone:"ഫോൺ",
    zone:"സോൺ",
    bloodGroup:"രക്തഗ്രൂപ്പ്",
    coordinates:"കോർഡിനേറ്റുകൾ",
    status:"നില"
  },

  pa: {
    eyebrow:"ਮਲਟੀ-ਡੈਸਟੀਨੇਸ਼ਨ ਡਿਸਪੈਚ ਅਤੇ ਆਈਡੀ ਗ੍ਰਿਡ",
    heroTitle1:"ਐਕਸੈੱਸ ਕੰਟਰੋਲ",
    heroTitle2:"ਸਿਸਟਮ",
    heroSub:"ਲਾਈਵ ਟੈਲੀਮੈਟਰੀ ਅਤੇ ਸੇਫਟੀ ਆਈਡੀ ਕਾਰਡਾਂ ਲਈ ਆਪਣਾ ਅਧਿਕਾਰ ਪੱਧਰ ਚੁਣੋ।",
    publicEntry:"ਜਨਤਕ ਦਾਖਲਾ",
    userPortal:"ਯੂਜ਼ਰ ਪੋਰਟਲ",
    userPortalDesc:"ਸੈਲਾਨੀ ਜਾਂ ਵਲੰਟੀਅਰ ਵਜੋਂ ਰਜਿਸਟਰ ਕਰੋ ਅਤੇ ਡਿਜ਼ਿਟਲ ਸੇਫਟੀ ਆਈਡੀ ਬਣਾਓ।",
    zoneAuthority:"ਜ਼ੋਨ ਅਥਾਰਟੀ",
    staffCommand:"ਸਟਾਫ਼ ਕਮਾਂਡ",
    staffCommandDesc:"ਰੀਅਲ-ਟਾਈਮ ਅਲਰਟ ਦੇਖੋ, ਡੈਸਕ ਫੋਨ ਸੈੱਟ ਕਰੋ ਅਤੇ WhatsApp ਡਿਸਪੈਚ ਭੇਜੋ।",
    headOfPlatform:"ਪਲੇਟਫਾਰਮ ਮੁਖੀ",
    masterControl:"ਮਾਸਟਰ ਕੰਟਰੋਲ",
    masterControlDesc:"ਸਾਰੇ ਸਰਗਰਮ ਸੈਰ-ਸਪਾਟਾ ਸਥਾਨਾਂ ਦੀ ਵਿਸ਼ਵ ਪੱਧਰੀ ਨਿਗਰਾਨੀ।",

    registerTourist:"ਸੈਲਾਨੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ",
    registerVolunteer:"ਵਲੰਟੀਅਰ ਰਜਿਸਟ੍ਰੇਸ਼ਨ",
    registering:"ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਹੋ ਰਹੀ ਹੈ…",
    completeRegistration:"ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਪੂਰੀ ਕਰੋ ਅਤੇ ਆਈਡੀ ਬਣਾਓ",
    registrationComplete:"ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਪੂਰੀ — ਤੁਹਾਡੀ ਸੇਫਟੀ ਆਈਡੀ ਤਿਆਰ ਹੈ।",
    duplicatePhone:"ਇਹ ਫੋਨ ਨੰਬਰ ਪਹਿਲਾਂ ਹੀ ਰਜਿਸਟਰ ਹੈ — ਸਾਈਨ ਇਨ ਕਰੋ।",
    registrationFailed:"ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਅਸਫਲ ਹੋਈ। ਵੇਰਵੇ ਜਾਂਚ ਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",

    insideSafe:"ਸੁਰੱਖਿਅਤ ਜ਼ੋਨ ਵਿੱਚ",
    outsideSafe:"ਸੁਰੱਖਿਅਤ ਜ਼ੋਨ ਤੋਂ ਬਾਹਰ",
    monitored:"ਸਥਾਨਕ ਕਮਾਂਡ ਸੈਂਟਰ ਨਿਗਰਾਨੀ ਕਰ ਰਿਹਾ ਹੈ।",

    sendSOS:"ਲਾਈਵ SOS ਭੇਜੋ",
    sendingSOS:"SOS ਭੇਜਿਆ ਜਾ ਰਿਹਾ ਹੈ…",
    sosActive:"SOS ਸਰਗਰਮ — ਮਦਦ ਆ ਰਹੀ ਹੈ",
    sosSent:"SOS ਭੇਜਿਆ ਗਿਆ। ਕਮਾਂਡ HQ ਅਤੇ ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ ਨੂੰ ਸੂਚਿਤ ਕੀਤਾ ਗਿਆ ਹੈ।",
    sosFailed:"SOS ਨਹੀਂ ਭੇਜਿਆ ਜਾ ਸਕਿਆ — ਕਨੈਕਸ਼ਨ ਜਾਂਚ ਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",

    locationDenied:"ਲੋਕੇਸ਼ਨ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਮਿਲੀ — ਅਨੁਮਾਨਿਤ ਸਥਾਨ ਵਰਤਿਆ ਜਾ ਰਿਹਾ ਹੈ।",
    photoSkipped:"ਫੋਟੋ ਅਪਲੋਡ ਛੱਡ ਦਿੱਤੀ — ਫੋਟੋ ਤੋਂ ਬਿਨਾਂ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਜਾਰੀ ਹੈ।",
    safeMessage:"ਸਮਝ ਗਿਆ — ਖੁਸ਼ੀ ਹੈ ਕਿ ਤੁਸੀਂ ਸੁਰੱਖਿਅਤ ਹੋ। ਜ਼ੋਨ ਦੀ ਹੱਦ ਨੇੜੇ ਸਾਵਧਾਨ ਰਹੋ।",

    signinNotFound:"ਇਸ ਫੋਨ ਨੰਬਰ ਲਈ ਪ੍ਰੋਫਾਈਲ ਨਹੀਂ ਮਿਲੀ।",
    loginFailed:"ਲੌਗਇਨ ਅਸਫਲ — ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    incorrectPasscode:"ਇਸ ਜ਼ੋਨ ਦਾ ਪਾਸਕੋਡ ਗਲਤ ਹੈ।",
    masterPasscode:"ਮਾਸਟਰ ਪਾਸਕੋਡ ਗਲਤ ਹੈ।",
    invalidZone:"ਜ਼ੋਨ ਕ੍ਰੈਡੈਂਸ਼ਲ ਗਲਤ ਹਨ",

    alertResolved:"ਅਲਰਟ ਹੱਲ ਕੀਤਾ ਗਿਆ ਹੈ।",
    resolveFailed:"ਅਲਰਟ ਹੱਲ ਨਹੀਂ ਕੀਤਾ ਜਾ ਸਕਿਆ।",
    zoneDataFailed:"ਜ਼ੋਨ ਡਾਟਾ ਲੋਡ ਨਹੀਂ ਹੋਇਆ।",
    masterDataFailed:"ਮਾਸਟਰ ਕੰਟਰੋਲ ਡਾਟਾ ਲੋਡ ਨਹੀਂ ਹੋਇਆ।",

    noZoneRegistrations:"ਇਸ ਜ਼ੋਨ ਲਈ ਅਜੇ ਕੋਈ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਨਹੀਂ।",
    noRegistrations:"ਅਜੇ ਕੋਈ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਨਹੀਂ।",

    victimContact:"ਪੀੜਤ ਸੰਪਰਕ",
    policeDesk:"ਪੁਲਿਸ ਡੈਸਕ",
    zoneHQ:"ਜ਼ੋਨ ਹੈੱਡਕੁਆਰਟਰ",
    primary:"ਮੁੱਖ",
    send:"ਭੇਜੋ",
    markResolved:"ਹੱਲ ਕੀਤਾ",
    call:"ਕਾਲ",

    safe:"ਸੁਰੱਖਿਅਤ",
    sos:"SOS",
    global:"ਵਿਸ਼ਵ ਪੱਧਰੀ",

    welcomeBack:"ਵਾਪਸ ਸੁਆਗਤ ਹੈ, {name}.",
    needSignin:"SOS ਭੇਜਣ ਲਈ ਸਾਈਨ ਇਨ ਕਰਨਾ ਲਾਜ਼ਮੀ ਹੈ.",
    sessionRestore:"ਸੈਸ਼ਨ ਮੁੜ ਪ੍ਰਾਪਤ ਨਹੀਂ ਹੋਇਆ — ਦੁਬਾਰਾ ਸਾਈਨ ਇਨ ਕਰੋ।",

    emergencyAlert:"ਐਮਰਜੈਂਸੀ ਸਹਾਇਤਾ ਅਲਰਟ - ਟੂਰਿਸਟ ਸੇਫਟੀ ਗ੍ਰਿਡ",
    name:"ਨਾਮ",
    phone:"ਫੋਨ",
    zone:"ਜ਼ੋਨ",
    bloodGroup:"ਬਲੱਡ ਗਰੁੱਪ",
    coordinates:"ਕੋਆਰਡੀਨੇਟਸ",
    status:"ਸਥਿਤੀ"
  },

  ur: {
    eyebrow:"ملٹی ڈیسٹینیشن ڈسپیچ اینڈ آئی ڈی گرڈ",
    heroTitle1:"ایکسیس کنٹرول",
    heroTitle2:"سسٹم",
    heroSub:"لائیو ٹیلی میٹری اور سیفٹی آئی ڈی کارڈ تک رسائی کے لیے اپنا درجہ منتخب کریں۔",
    publicEntry:"عوامی رسائی",
    userPortal:"یوزر پورٹل",
    userPortalDesc:"بطور سیاح یا رضاکار رجسٹر کریں اور ڈیجیٹل سیفٹی آئی ڈی بنائیں۔",
    zoneAuthority:"زون اتھارٹی",
    staffCommand:"اسٹاف کمانڈ",
    staffCommandDesc:"ریئل ٹائم الرٹس دیکھیں، ڈیسک فون سیٹ کریں اور واٹس ایپ ڈسپیچ بھیجیں۔",
    headOfPlatform:"پلیٹ فارم سربراہ",
    masterControl:"ماسٹر کنٹرول",
    masterControlDesc:"تمام فعال سیاحتی مقامات پر عالمی نگرانی۔",

    registerTourist:"سیاح رجسٹریشن",
    registerVolunteer:"رضاکار رجسٹریشن",
    registering:"رجسٹریشن ہو رہی ہے…",
    completeRegistration:"رجسٹریشن مکمل کریں اور آئی ڈی بنائیں",
    registrationComplete:"رجسٹریشن مکمل — آپ کی سیفٹی آئی ڈی تیار ہے۔",
    duplicatePhone:"یہ فون نمبر پہلے سے رجسٹر ہے — سائن اِن کریں۔",
    registrationFailed:"رجسٹریشن ناکام ہوئی۔ تفصیلات چیک کرکے دوبارہ کوشش کریں۔",

    insideSafe:"محفوظ زون کے اندر",
    outsideSafe:"محفوظ زون سے باہر",
    monitored:"مقامی کمانڈ سینٹر نگرانی کر رہا ہے۔",

    sendSOS:"لائیو SOS بھیجیں",
    sendingSOS:"SOS بھیجا جا رہا ہے…",
    sosActive:"SOS فعال — مدد راستے میں ہے",
    sosSent:"SOS بھیج دیا گیا۔ کمانڈ HQ اور ہنگامی رابطے کو اطلاع دے دی گئی ہے۔",
    sosFailed:"SOS نہیں بھیجا جا سکا — کنکشن چیک کرکے دوبارہ کوشش کریں۔",

    locationDenied:"مقام کی اجازت نہیں ملی — اندازاً مقام استعمال کیا جا رہا ہے۔",
    photoSkipped:"تصویر اپ لوڈ چھوڑ دی گئی — تصویر کے بغیر رجسٹریشن جاری ہے۔",
    safeMessage:"سمجھ گیا — خوشی ہے کہ آپ محفوظ ہیں۔ زون کی حدود کے قریب محتاط رہیں۔",

    signinNotFound:"اس فون نمبر کے لیے پروفائل نہیں ملا۔",
    loginFailed:"لاگ اِن ناکام — دوبارہ کوشش کریں۔",
    incorrectPasscode:"اس زون کا پاس کوڈ غلط ہے۔",
    masterPasscode:"ماسٹر پاس کوڈ غلط ہے۔",
    invalidZone:"زون کی اسناد درست نہیں",

    alertResolved:"الرٹ حل کر دیا گیا ہے۔",
    resolveFailed:"الرٹ حل نہیں کیا جا سکا۔",
    zoneDataFailed:"زون کا ڈیٹا لوڈ نہیں ہو سکا۔",
    masterDataFailed:"ماسٹر کنٹرول ڈیٹا لوڈ نہیں ہو سکا۔",

    noZoneRegistrations:"اس زون کے لیے ابھی کوئی رجسٹریشن نہیں۔",
    noRegistrations:"ابھی کوئی رجسٹریشن نہیں۔",

    victimContact:"متاثرہ شخص کا رابطہ",
    policeDesk:"پولیس ڈیسک",
    zoneHQ:"زون ہیڈکوارٹر",
    primary:"بنیادی",
    send:"بھیجیں",
    markResolved:"حل شدہ",
    call:"کال",

    safe:"محفوظ",
    sos:"SOS",
    global:"عالمی",

    welcomeBack:"خوش آمدید، {name}.",
    needSignin:"SOS بھیجنے کے لیے سائن اِن کرنا ضروری ہے۔",
    sessionRestore:"سیشن بحال نہیں ہو سکا — دوبارہ سائن اِن کریں۔",

    emergencyAlert:"ہنگامی امدادی الرٹ - ٹورسٹ سیفٹی گرڈ",
    name:"نام",
    phone:"فون",
    zone:"زون",
    bloodGroup:"بلڈ گروپ",
    coordinates:"مقام",
    status:"حالت"
  }
};

const RTL_LANGS = new Set(["ur"]);

/* =========================================================
   TRANSLATION ENGINE
========================================================= */

function t(key, vars = {}) {
  const lang = localStorage.getItem(LS_LANG_KEY) || "en";

  let value =
    TRANSLATIONS[lang]?.[key] ??
    TRANSLATIONS.en[key] ??
    key;

  Object.entries(vars).forEach(([name, valueToInsert]) => {
    value = value.replaceAll(
      `{${name}}`,
      String(valueToInsert)
    );
  });

  return value;
}

function applyTranslation(lang) {

  const safeLang =
    TRANSLATIONS[lang]
      ? lang
      : "en";

  const dict = TRANSLATIONS[safeLang];

  document.querySelectorAll("[data-i18n]").forEach(el => {

    const key = el.getAttribute("data-i18n");

    if (dict[key]) {
      el.textContent = dict[key];
    }

  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {

    const key =
      el.getAttribute("data-i18n-placeholder");

    if (dict[key]) {
      el.placeholder = dict[key];
    }

  });

  document.querySelectorAll("[data-i18n-title]").forEach(el => {

    const key =
      el.getAttribute("data-i18n-title");

    if (dict[key]) {
      el.title = dict[key];
    }

  });

  document.body.dir =
    RTL_LANGS.has(safeLang)
      ? "rtl"
      : "ltr";

  document.documentElement.lang =
    safeLang;
}

function refreshDynamicLanguage() {

  const regTitle =
    document.getElementById("regTitle");

  if (regTitle) {

    regTitle.textContent =
      state.currentRole === "volunteer"
        ? t("registerVolunteer")
        : t("registerTourist");

  }

  const sosLabel =
    document.getElementById("sosLabel");

  if (
    sosLabel &&
    !sosLabel.classList.contains("active")
  ) {
    sosLabel.textContent = t("sendSOS");
  }

  const geofenceTitle =
    document.getElementById("geofenceTitle");

  const geofenceDesc =
    document.getElementById("geofenceDesc");

  if (
    geofenceTitle &&
    state.lastGeofenceState
  ) {

    if (state.lastGeofenceState === "safe") {

      geofenceTitle.textContent =
        t("insideSafe");

      if (geofenceDesc) {
        geofenceDesc.textContent =
          t("monitored");
      }

    }

  }
}

function setLanguage(lang) {

  const safeLang =
    TRANSLATIONS[lang]
      ? lang
      : "en";

  localStorage.setItem(
    LS_LANG_KEY,
    safeLang
  );

  applyTranslation(safeLang);
  refreshDynamicLanguage();
}

/* =========================================================
   GENERAL UI
========================================================= */

function showToast(message, type = "info") {

  const container =
    document.getElementById("toastContainer");

  if (!container) return;

  const el =
    document.createElement("div");

  el.className =
    `toast ${type}`;

  el.textContent =
    message;

  container.appendChild(el);

  setTimeout(
    () => el.remove(),
    5000
  );
}

function setFormError(errorElId, message) {

  const el =
    document.getElementById(errorElId);

  if (!el) return;

  if (!message) {

    el.style.display = "none";
    el.textContent = "";

    return;
  }

  el.style.display = "block";
  el.textContent = message;
}

function setButtonBusy(
  btn,
  busy,
  busyLabel,
  idleLabel
) {

  if (!btn) return;

  btn.disabled = busy;

  btn.textContent =
    busy
      ? busyLabel
      : idleLabel;
}

/* =========================================================
   PORTALS
========================================================= */

const ALL_PORTAL_IDS = [
  "portalGateway",
  "userPortal",
  "staffPortal",
  "superAdminPortal"
];

const ZONE_LABELS = {
  portalGateway: "SECURE NETWORK",
  userPortal: "TOURIST SESSION",
  staffPortal: "STAFF COMMAND",
  superAdminPortal: "MASTER CONTROL"
};

function switchPortal(id) {

  ALL_PORTAL_IDS.forEach(pid => {

    const el =
      document.getElementById(pid);

    if (el) {

      el.style.display =
        pid === id
          ? ""
          : "none";

    }

  });

  const navZone =
    document.getElementById(
      "activeNavbarZone"
    );

  if (navZone) {

    navZone.textContent =
      ZONE_LABELS[id] ||
      "SECURE NETWORK";

  }

  closeModal();
}

/* =========================================================
   MODALS
========================================================= */

const TOP_LEVEL_MODALS =
  new Set([
    "idCardModal",
    "sosVerificationModal"
  ]);

function openModal(id) {

  if (TOP_LEVEL_MODALS.has(id)) {

    const modal =
      document.getElementById(id);

    if (modal) {
      modal.style.display = "flex";
    }

    return;
  }

  const overlay =
    document.getElementById(
      "modalOverlay"
    );

  if (!overlay) return;

  document
    .querySelectorAll(
      "#modalOverlay .glass-modal, #modalOverlay .auth-modal"
    )
    .forEach(sec => {

      sec.style.display = "none";

    });

  overlay.style.display = "flex";

  const modal =
    document.getElementById(id);

  if (modal) {
    modal.style.display = "block";
  }
}

function closeModal() {

  const overlay =
    document.getElementById(
      "modalOverlay"
    );

  if (overlay) {
    overlay.style.display = "none";
  }

  const idCard =
    document.getElementById(
      "idCardModal"
    );

  if (idCard) {
    idCard.style.display = "none";
  }

  setFormError(
    "staffAuthError",
    ""
  );

  setFormError(
    "superAdminAuthError",
    ""
  );

  setFormError(
    "signInError",
    ""
  );

  setFormError(
    "regError",
    ""
  );
}

/* =========================================================
   GPS
========================================================= */

async function getAccurateGPS() {

  if (!navigator.geolocation) {
    return state.userCoords;
  }

  return new Promise(resolve => {

    navigator.geolocation.getCurrentPosition(

      pos => {

        state.gpsIsReal = true;

        state.userCoords = {

          latitude:
            parseFloat(
              pos.coords.latitude
                .toFixed(6)
            ),

          longitude:
            parseFloat(
              pos.coords.longitude
                .toFixed(6)
            )

        };

        resolve(
          state.userCoords
        );

      },

      () => {

        showToast(
          t("locationDenied"),
          "error"
        );

        resolve(
          state.userCoords
        );

      },

      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 0
      }

    );

  });
}

/* =========================================================
   DISTANCE
========================================================= */

function haversineKm(
  lat1,
  lon1,
  lat2,
  lon2
) {

  const R = 6371;

  const dLat =
    (lat2 - lat1) *
    Math.PI / 180;

  const dLon =
    (lon2 - lon1) *
    Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

/* =========================================================
   LIVE TRACKING
========================================================= */

function startLiveTracking() {

  if (
    !navigator.geolocation ||
    state.locationWatchId !== null
  ) {
    return;
  }

  state.locationWatchId =
    navigator.geolocation.watchPosition(

      pos => {

        state.gpsIsReal = true;

        state.userCoords = {

          latitude:
            parseFloat(
              pos.coords.latitude
                .toFixed(6)
            ),

          longitude:
            parseFloat(
              pos.coords.longitude
                .toFixed(6)
            )

        };

        if (state.touristMarker) {

          state.touristMarker.setLatLng([
            state.userCoords.latitude,
            state.userCoords.longitude
          ]);

        }

      },

      null,

      {
        enableHighAccuracy: true,
        maximumAge: 2000
      }

    );

  state.locationPushTimer =
    setInterval(async () => {

      const uid =
        localStorage.getItem(
          LS_USER_ID_KEY
        );

      if (!uid) return;

      try {

        await supabase.rpc(
          "update_location",
          {
            p_user_id: uid,
            p_lat:
              state.userCoords.latitude,
            p_lng:
              state.userCoords.longitude
          }
        );

      } catch (e) {

        /* Non-fatal */

      }

    }, LOCATION_PUSH_MS);

  state.geofenceTimer =
    setInterval(
      checkGeofence,
      GEOFENCE_POLL_MS
    );
}

function stopLiveTracking() {

  if (
    state.locationWatchId !== null
  ) {

    navigator.geolocation.clearWatch(
      state.locationWatchId
    );

    state.locationWatchId = null;
  }

  if (state.locationPushTimer) {

    clearInterval(
      state.locationPushTimer
    );

    state.locationPushTimer = null;
  }

  if (state.geofenceTimer) {

    clearInterval(
      state.geofenceTimer
    );

    state.geofenceTimer = null;
  }
}

/* =========================================================
   WHATSAPP
========================================================= */

function generateWhatsAppDistressPayload(
  user,
  coords,
  fromStaffDesk = null
) {

  const mapsUrl =
    `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;

  const deskInfo =
    fromStaffDesk
      ? `\n*Dispatched By HQ Desk:* ${fromStaffDesk}`
      : "";

  const message =
`🚨 *${t("emergencyAlert")}* 🚨

*${t("name")}:* ${user.name}
*${t("phone")}:* ${user.phone}
*${t("zone")}:* ${user.zone_code || t("global")}
*${t("bloodGroup")}:* ${user.blood_group || "--"}
*${t("coordinates")}:* ${coords.latitude}, ${coords.longitude}${deskInfo}

*Live Radar Location:* ${mapsUrl}

*${t("status")}:* Command units have been notified. Help is being coordinated.`;

  return encodeURIComponent(
    message
  );
}

function waLink(
  phone,
  encodedMsg
) {

  const digits =
    (phone || "")
      .replace(/[^0-9]/g, "");

  return `https://wa.me/${digits}?text=${encodedMsg}`;
}

function renderWhatsAppLinks(
  containerId,
  recipients,
  encodedMsg,
  autoOpenFirst
) {

  const container =
    document.getElementById(
      containerId
    );

  if (!container) return;

  container.innerHTML = "";

  recipients.forEach(
    (r, idx) => {

      if (!r.phone) return;

      const a =
        document.createElement("a");

      a.className =
        "wa-link-btn";

      a.href =
        waLink(
          r.phone,
          encodedMsg
        );

      a.target = "_blank";
      a.rel = "noopener noreferrer";

      a.innerHTML =
        `<span>${r.label}</span>
         <span>📲 ${t("send")}</span>`;

      container.appendChild(a);

      if (
        idx === 0 &&
        autoOpenFirst
      ) {

        window.open(
          a.href,
          "_blank",
          "noopener,noreferrer"
        );

      }

    }
  );
}

async function triggerWhatsAppBroadcast(
  user,
  coords,
  fromStaffDesk = null
) {

  const encodedMsg =
    generateWhatsAppDistressPayload(
      user,
      coords,
      fromStaffDesk
    );

  const recipients = [

    {
      label:
        `${t("victimContact")} — ${user.emergency_contact_name || t("primary")}`,
      phone:
        user.emergency_contact_phone
    },

    {
      label:
        t("policeDesk"),
      phone:
        POLICE_TEST_DESK_NUMBER
    }

  ];

  if (
    state.geofenceZone?.desk_phone
  ) {

    recipients.push({
      label:
        `${t("zoneHQ")} — ${user.zone_code}`,
      phone:
        state.geofenceZone.desk_phone
    });

  }

  const panel =
    document.getElementById(
      "whatsappDispatchPanel"
    );

  if (panel) {
    panel.style.display = "block";
  }

  renderWhatsAppLinks(
    "whatsappLinksContainer",
    recipients,
    encodedMsg,
    true
  );
}

/* =========================================================
   MAP
========================================================= */

function initTouristMap(coords) {

  const container =
    document.getElementById(
      "touristMap"
    );

  if (
    !container ||
    typeof L === "undefined"
  ) {
    return;
  }

  if (state.touristMap) {

    state.touristMap.remove();
    state.touristMap = null;

  }

  state.touristMap =
    L.map(
      container,
      {
        zoomControl: false,
        attributionControl: false
      }
    )
    .setView(
      [
        coords.latitude,
        coords.longitude
      ],
      14
    );

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19
    }
  ).addTo(
    state.touristMap
  );

  state.touristMarker =
    L.marker([
      coords.latitude,
      coords.longitude
    ])
    .addTo(
      state.touristMap
    );
}

function drawGeofenceCircle(zone) {

  if (
    !state.touristMap ||
    !zone
  ) {
    return;
  }

  if (state.geofenceCircle) {

    state.touristMap.removeLayer(
      state.geofenceCircle
    );

  }

  state.geofenceCircle =
    L.circle(
      [
        zone.lat,
        zone.lng
      ],
      {
        radius:
          (zone.radius_km || 5) *
          1000,

        color: "#38bdf8",
        fillColor: "#38bdf8",
        fillOpacity: 0.08,
        weight: 1.5
      }
    )
    .addTo(
      state.touristMap
    );
}

/* =========================================================
   ID CARD
========================================================= */

function buildIdQrUrl(profile) {

  const payload =
    JSON.stringify({

      id: profile.id,
      name: profile.name,
      phone: profile.phone,
      zone: profile.zone_code,
      blood: profile.blood_group,
      emergency:
        profile.emergency_contact_phone

    });

  return (
    "https://api.qrserver.com/v1/create-qr-code/" +
    "?size=200x200&margin=6&data=" +
    encodeURIComponent(payload)
  );
}

function renderIdCard(profile) {

  document.getElementById(
    "badgeName"
  ).textContent =
    profile.name || "--";

  document.getElementById(
    "badgeRole"
  ).textContent =
    (profile.role || "--")
      .toUpperCase();

  document.getElementById(
    "badgeZone"
  ).textContent =
    profile.zone_code || "--";

  document.getElementById(
    "badgePhone"
  ).textContent =
    profile.phone || "--";

  document.getElementById(
    "badgeBlood"
  ).textContent =
    profile.blood_group || "--";

  document.getElementById(
    "badgeEmerg"
  ).textContent =
    profile.emergency_contact_name
      ? `${profile.emergency_contact_name} (${profile.emergency_contact_phone})`
      : "--";

  document.getElementById(
    "badgeQrCode"
  ).src =
    buildIdQrUrl(profile);

  const photoImg =
    document.getElementById(
      "badgePhoto"
    );

  const placeholder =
    document.getElementById(
      "badgePhotoPlaceholder"
    );

  if (profile.photo_url) {

    photoImg.src =
      profile.photo_url;

    photoImg.style.display =
      "block";

    placeholder.style.display =
      "none";

  } else {

    photoImg.style.display =
      "none";

    placeholder.style.display =
      "flex";

  }
}

/* =========================================================
   USER SESSION
========================================================= */

async function enterUserMode() {

  switchPortal(
    "userPortal"
  );

  const uid =
    localStorage.getItem(
      LS_USER_ID_KEY
    );

  if (uid) {

    const loaded =
      await loadLoggedInUser(
        uid
      );

    if (!loaded) {

      localStorage.removeItem(
        LS_USER_ID_KEY
      );

    }

  } else {

    showLoggedOutUI();

  }
}

function showLoggedOutUI() {

  document.getElementById(
    "loggedOutSection"
  ).style.display = "";

  document.getElementById(
    "loggedInSection"
  ).style.display = "none";

  stopLiveTracking();
}

async function showLoggedInUI(profile) {

  state.currentUserProfile =
    profile;

  document.getElementById(
    "loggedOutSection"
  ).style.display = "none";

  document.getElementById(
    "loggedInSection"
  ).style.display = "flex";

  document.getElementById(
    "loggedInSection"
  ).style.flexDirection =
    "column";

  document.getElementById(
    "activeUserZoneBadge"
  ).textContent =
    profile.zone_code || "--";

  document.getElementById(
    "activeUserName"
  ).textContent =
    profile.name || "--";

  document.getElementById(
    "activeUserRole"
  ).textContent =
    (profile.role || "--")
      .toUpperCase();

  renderIdCard(profile);

  await getAccurateGPS();

  initTouristMap(
    state.userCoords
  );

  await loadGeofenceZone(
    profile.zone_code
  );

  startLiveTracking();

  checkGeofence();
}

async function loadLoggedInUser(
  userId
) {

  try {

    const {
      data,
      error
    } =
      await supabase.rpc(
        "get_profile",
        {
          p_user_id: userId
        }
      );

    if (
      error ||
      !data
    ) {
      throw (
        error ||
        new Error(
          "Profile not found"
        )
      );
    }

    await showLoggedInUI(
      data
    );

    return true;

  } catch (e) {

    console.error(
      "SESSION RESTORE ERROR:",
      e
    );

    showToast(
      t("sessionRestore"),
      "error"
    );

    return false;
  }
}

function signOut() {

  localStorage.removeItem(
    LS_USER_ID_KEY
  );

  stopLiveTracking();

  state.currentUserProfile =
    null;

  state.activeSosAlertId =
    null;

  const panel =
    document.getElementById(
      "whatsappDispatchPanel"
    );

  if (panel) {
    panel.style.display = "none";
  }

  showLoggedOutUI();
}

/* =========================================================
   GEOFENCE
========================================================= */

async function loadGeofenceZone(
  zoneCode
) {

  try {

    const {
      data,
      error
    } =
      await supabase.rpc(
        "get_zone_geofence",
        {
          p_zone: zoneCode
        }
      );

    if (
      error ||
      !data
    ) {
      throw (
        error ||
        new Error(
          "No geofence data"
        )
      );
    }

    state.geofenceZone =
      data;

    drawGeofenceCircle(
      data
    );

  } catch (e) {

    console.error(
      "GEOFENCE ERROR:",
      e
    );

    state.geofenceZone =
      null;
  }
}

async function checkGeofence() {

  if (
    !state.geofenceZone ||
    !state.currentUserProfile
  ) {
    return;
  }

  const dist =
    haversineKm(
      state.userCoords.latitude,
      state.userCoords.longitude,
      state.geofenceZone.lat,
      state.geofenceZone.lng
    );

  const inside =
    dist <=
    (
      state.geofenceZone.radius_km ||
      5
    );

  const banner =
    document.getElementById(
      "geofenceBanner"
    );

  const dot =
    document.getElementById(
      "geofenceDot"
    );

  const title =
    document.getElementById(
      "geofenceTitle"
    );

  const desc =
    document.getElementById(
      "geofenceDesc"
    );

  if (inside) {

    banner.classList.remove(
      "breach"
    );

    dot.classList.remove(
      "unsafe"
    );

    dot.classList.add(
      "safe"
    );

    title.textContent =
      t("insideSafe");

    desc.textContent =
      t("monitored");

  } else {

    banner.classList.add(
      "breach"
    );

    dot.classList.remove(
      "safe"
    );

    dot.classList.add(
      "unsafe"
    );

    title.textContent =
      t("outsideSafe");

    desc.textContent =
      `${dist.toFixed(1)} km from the monitored boundary.`;
  }

  if (
    state.lastGeofenceState !== "unsafe" &&
    !inside
  ) {

    promptSOSVerification(
      true
    );
  }

  state.lastGeofenceState =
    inside
      ? "safe"
      : "unsafe";
}

/* =========================================================
   SOS
========================================================= */

function promptSOSVerification(
  fromGeofenceBreach
) {

  state.sosFromGeofence =
    !!fromGeofenceBreach;

  openModal(
    "sosVerificationModal"
  );
}

async function handleVerificationResult(
  isSafe
) {

  const modal =
    document.getElementById(
      "sosVerificationModal"
    );

  if (modal) {
    modal.style.display =
      "none";
  }

  if (isSafe) {

    if (
      state.sosFromGeofence
    ) {

      showToast(
        t("safeMessage"),
        "success"
      );

    }

    return;
  }

  await sendLiveSOS();
}

async function sendLiveSOS() {

  const uid =
    localStorage.getItem(
      LS_USER_ID_KEY
    );

  const profile =
    state.currentUserProfile;

  if (
    !uid ||
    !profile
  ) {

    showToast(
      t("needSignin"),
      "error"
    );

    return;
  }

  const sosBtn =
    document.getElementById(
      "sosBtn"
    );

  const sosLabel =
    document.getElementById(
      "sosLabel"
    );

  sosBtn.classList.add(
    "active"
  );

  sosLabel.textContent =
    t("sendingSOS");

  try {

    const {
      data,
      error
    } =
      await supabase.rpc(
        "trigger_sos",
        {
          p_user_id: uid,
          p_lat:
            state.userCoords.latitude,
          p_lng:
            state.userCoords.longitude
        }
      );

    if (error) {
      throw error;
    }

    state.activeSosAlertId =
      data.alert_id;

    sosLabel.textContent =
      t("sosActive");

    await triggerWhatsAppBroadcast(
      profile,
      state.userCoords,
      data.desk_phone || null
    );

    showToast(
      t("sosSent"),
      "success"
    );

  } catch (e) {

    console.error(
      "SOS ERROR:",
      e
    );

    sosBtn.classList.remove(
      "active"
    );

    sosLabel.textContent =
      t("sendSOS");

    showToast(
      t("sosFailed"),
      "error"
    );
  }
}

/* =========================================================
   PHOTO UPLOAD
========================================================= */

async function uploadProfilePhoto(
  file,
  phone
) {

  if (!file) {
    return null;
  }

  try {

    const ext =
      file.name
        .split(".")
        .pop();

    const path =
      `${phone.replace(/[^0-9]/g, "")}-${Date.now()}.${ext}`;

    const {
      error
    } =
      await supabase
        .storage
        .from("tourist-photos")
        .upload(
          path,
          file,
          {
            upsert: true
          }
        );

    if (error) {
      throw error;
    }

    const {
      data
    } =
      supabase
        .storage
        .from("tourist-photos")
        .getPublicUrl(
          path
        );

    return (
      data?.publicUrl ||
      null
    );

  } catch (e) {

    console.error(
      "PHOTO UPLOAD ERROR:",
      e
    );

    showToast(
      t("photoSkipped"),
      "error"
    );

    return null;
  }
}

/* =========================================================
   REGISTRATION
========================================================= */

function openRegistration(
  role
) {

  state.currentRole =
    role;

  const title =
    document.getElementById(
      "regTitle"
    );

  if (title) {

    title.textContent =
      role === "volunteer"
        ? t("registerVolunteer")
        : t("registerTourist");

  }

  const form =
    document.getElementById(
      "registrationForm"
    );

  if (form) {
    form.reset();
  }

  setFormError(
    "regError",
    ""
  );

  openModal(
    "registrationPage"
  );
}

async function handleRegistrationSubmit(
  ev
) {

  ev.preventDefault();

  setFormError(
    "regError",
    ""
  );

  const btn =
    document.getElementById(
      "regSubmitBtn"
    );

  setButtonBusy(
    btn,
    true,
    t("registering"),
    t("completeRegistration")
  );

  const zoneEl =
    document.getElementById(
      "regZone"
    );

  const nameEl =
    document.getElementById(
      "regName"
    );

  const phoneEl =
    document.getElementById(
      "regPhone"
    );

  const bloodEl =
    document.getElementById(
      "regBlood"
    );

  const emergNameEl =
    document.getElementById(
      "regEmergName"
    );

  const emergPhoneEl =
    document.getElementById(
      "regEmergPhone"
    );

  const photoEl =
    document.getElementById(
      "regPhoto"
    );

  const zone =
    zoneEl?.value
      .trim()
      .toUpperCase();

  const name =
    nameEl?.value
      .trim();

  const phone =
    phoneEl?.value
      .trim();

  const blood =
    bloodEl?.value ||
    null;

  const emergName =
    emergNameEl?.value
      .trim();

  const emergPhone =
    emergPhoneEl?.value
      .trim();

  const photoFile =
    photoEl?.files?.[0] ||
    null;

  /* IMPORTANT:
     Validate before calling Supabase.
  */

  if (
    !zone ||
    !name ||
    !phone ||
    !emergName ||
    !emergPhone
  ) {

    setFormError(
      "regError",
      t("registrationFailed")
    );

    setButtonBusy(
      btn,
      false,
      t("registering"),
      t("completeRegistration")
    );

    return;
  }

  try {

    /* Get GPS first */

    await getAccurateGPS();

    /* Upload photo if provided */

    const photoUrl =
      await uploadProfilePhoto(
        photoFile,
        phone
      );

    /* Call your existing Supabase RPC */

    const {
      data,
      error
    } =
      await supabase.rpc(
        "register_profile",
        {
          p_zone: zone,
          p_name: name,
          p_phone: phone,
          p_role:
            state.currentRole,
          p_blood:
            blood,
          p_emerg_name:
            emergName,
          p_emerg_phone:
            emergPhone,
          p_photo_url:
            photoUrl,
          p_lat:
            Number(
              state.userCoords.latitude
            ),
          p_lng:
            Number(
              state.userCoords.longitude
            )
        }
      );

    if (error) {
      throw error;
    }

    /*
      Supabase should return the inserted
      user as JSON from register_profile.
    */

    if (
      !data ||
      !data.id
    ) {

      throw new Error(
        "Registration RPC returned no user profile."
      );

    }

    localStorage.setItem(
      LS_USER_ID_KEY,
      data.id
    );

    closeModal();

    await showLoggedInUI(
      data
    );

    openModal(
      "idCardModal"
    );

    showToast(
      t("registrationComplete"),
      "success"
    );

  } catch (e) {

    /*
      KEEP THE REAL ERROR IN CONSOLE.
      This is extremely important for debugging
      Supabase registration problems.
    */

    console.error(
      "========== REGISTRATION ERROR =========="
    );

    console.error(
      e
    );

    console.error(
      "Message:",
      e?.message
    );

    console.error(
      "Details:",
      e?.details
    );

    console.error(
      "Hint:",
      e?.hint
    );

    console.error(
      "Code:",
      e?.code
    );

    console.error(
      "========================================"
    );

    const raw =
      String(
        e?.message ||
        e?.details ||
        e?.hint ||
        e ||
        ""
      ).toLowerCase();

    const duplicate =
      raw.includes(
        "duplicate"
      ) ||
      raw.includes(
        "unique"
      ) ||
      raw.includes(
        "users_phone_key"
      );

    setFormError(
      "regError",
      duplicate
        ? t("duplicatePhone")
        : `${t("registrationFailed")} ${e?.message || ""}`
    );

  } finally {

    setButtonBusy(
      btn,
      false,
      t("registering"),
      t("completeRegistration")
    );
  }
}

/* =========================================================
   SIGN IN
========================================================= */

async function handleSignInSubmit(
  ev
) {

  ev.preventDefault();

  setFormError(
    "signInError",
    ""
  );

  const phone =
    document
      .getElementById(
        "signInPhoneInput"
      )
      .value
      .trim();

  try {

    const {
      data,
      error
    } =
      await supabase.rpc(
        "sign_in_by_phone",
        {
          p_phone: phone
        }
      );

    if (
      error ||
      !data
    ) {

      throw (
        error ||
        new Error(
          "Not found"
        )
      );

    }

    localStorage.setItem(
      LS_USER_ID_KEY,
      data.id
    );

    closeModal();

    await showLoggedInUI(
      data
    );

    showToast(
      t(
        "welcomeBack",
        {
          name: data.name
        }
      ),
      "success"
    );

  } catch (e) {

    console.error(
      "SIGN IN ERROR:",
      e
    );

    setFormError(
      "signInError",
      t("signinNotFound")
    );
  }
}

/* =========================================================
   STAFF LOGIN
========================================================= */

async function handleStaffAuthSubmit(
  ev
) {

  ev.preventDefault();

  setFormError(
    "staffAuthError",
    ""
  );

  const zone =
    document
      .getElementById(
        "staffZoneInput"
      )
      .value
      .trim()
      .toUpperCase();

  const phone =
    document
      .getElementById(
        "staffPhoneInput"
      )
      .value
      .trim();

  const passcode =
    document
      .getElementById(
        "staffPasscodeInput"
      )
      .value;

  try {

    await getAccurateGPS();

    const {
      data,
      error
    } =
      await supabase.rpc(
        "zone_login",
        {
          p_zone: zone,
          p_phone: phone,
          p_passcode:
            passcode,
          p_lat:
            state.userCoords.latitude,
          p_lng:
            state.userCoords.longitude
        }
      );

    if (error) {
      throw error;
    }

    if (!data) {

      setFormError(
        "staffAuthError",
        t("incorrectPasscode")
      );

      return;
    }

    state.staffSession = {
      zone,
      phone,
      passcode
    };

    sessionStorage.setItem(
      SS_STAFF_KEY,
      JSON.stringify({
        zone,
        phone
      })
    );

    document.getElementById(
      "staffZoneDisplayHeader"
    ).textContent =
      zone;

    document.getElementById(
      "staffPhoneDisplayHeader"
    ).textContent =
      phone;

    closeModal();

    switchPortal(
      "staffPortal"
    );

    await loadStaffData();

  } catch (e) {

    console.error(
      "STAFF LOGIN ERROR:",
      e
    );

    setFormError(
      "staffAuthError",
      t("loginFailed")
    );
  }
}

/* =========================================================
   STATUS
========================================================= */

function statusPillHtml(
  hasSos
) {

  return hasSos

    ? `<span class="status-pill sos">
         <span class="dot"></span>
         ${t("sos")}
       </span>`

    : `<span class="status-pill safe">
         <span class="dot"></span>
         ${t("safe")}
       </span>`;
}

/* =========================================================
   STAFF DASHBOARD
========================================================= */

async function loadStaffData() {

  if (!state.staffSession) {
    return;
  }

  try {

    const {
      data,
      error
    } =
      await supabase.rpc(
        "staff_dashboard",
        {
          p_zone:
            state.staffSession.zone,
          p_passcode:
            state.staffSession.passcode
        }
      );

    if (error) {
      throw error;
    }

    const rows =
      data.users || [];

    const activeSos =
      data.active_sos || [];

    document.getElementById(
      "mTotal"
    ).textContent =
      rows.length;

    document.getElementById(
      "mTourists"
    ).textContent =
      rows.filter(
        r => r.role === "tourist"
      ).length;

    document.getElementById(
      "mVolunteers"
    ).textContent =
      rows.filter(
        r => r.role === "volunteer"
      ).length;

    document.getElementById(
      "mSOS"
    ).textContent =
      activeSos.length;

    const queue =
      document.getElementById(
        "staffEmergencyQueue"
      );

    const queueList =
      document.getElementById(
        "staffEmergencyQueueList"
      );

    queueList.innerHTML = "";

    if (activeSos.length) {

      queue.style.display =
        "block";

      activeSos.forEach(a => {

        const wrap =
          document.createElement(
            "div"
          );

        wrap.style.cssText =
          "display:flex; flex-direction:column; gap:6px; background:rgba(0,0,0,0.2); padding:10px; border-radius:9px;";

        wrap.innerHTML =
          `<strong style="font-size:12.5px;">
             ${a.name} — ${a.phone}
           </strong>`;

        const linkWrap =
          document.createElement(
            "div"
          );

        linkWrap.style.cssText =
          "display:flex; gap:6px; flex-wrap:wrap;";

        const encodedMsg =
          generateWhatsAppDistressPayload(
            a,
            {
              latitude:
                a.latitude,
              longitude:
                a.longitude
            },
            state.staffSession.phone
          );

        [
          {
            label:
              t("victimContact"),
            phone:
              a.emergency_contact_phone
          },

          {
            label:
              t("policeDesk"),
            phone:
              POLICE_TEST_DESK_NUMBER
          }

        ].forEach(r => {

          if (!r.phone) {
            return;
          }

          const link =
            document.createElement(
              "a"
            );

          link.className =
            "wa-link-btn";

          link.href =
            waLink(
              r.phone,
              encodedMsg
            );

          link.target =
            "_blank";

          link.rel =
            "noopener noreferrer";

          link.innerHTML =
            `<span>${r.label}</span>
             <span>📲</span>`;

          linkWrap.appendChild(
            link
          );

        });

        const resolveBtn =
          document.createElement(
            "button"
          );

        resolveBtn.className =
          "row-action-btn resolve";

        resolveBtn.textContent =
          t("markResolved");

        resolveBtn.onclick =
          () =>
            resolveSosAlert(
              a.alert_id
            );

        wrap.appendChild(
          linkWrap
        );

        wrap.appendChild(
          resolveBtn
        );

        queueList.appendChild(
          wrap
        );

      });

    } else {

      queue.style.display =
        "none";

    }

    const tbody =
      document.getElementById(
        "staffTableBody"
      );

    tbody.innerHTML =
      rows.map(r => `

        <tr>

          <td>
            ${statusPillHtml(
              activeSos.some(
                a =>
                  a.user_id === r.id
              )
            )}
          </td>

          <td>
            ${r.name}
          </td>

          <td>
            ${(r.role || "")
              .toUpperCase()}
          </td>

          <td>
            ${r.phone}
          </td>

          <td>
            ${r.blood_group || "--"}
          </td>

          <td>
            ${r.emergency_contact_name || "--"}
            (${r.emergency_contact_phone || "--"})
          </td>

          <td>
            ${
              r.latitude != null
                ? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`
                : "--"
            }
          </td>

          <td>
            <a
              class="row-action-btn"
              href="tel:${r.phone}"
            >
              ${t("call")}
            </a>
          </td>

        </tr>

      `).join("")

      ||

      `<tr>
         <td
           colspan="8"
           style="text-align:center; color:var(--text-lo);"
         >
           ${t("noZoneRegistrations")}
         </td>
       </tr>`;

  } catch (e) {

    console.error(
      "STAFF DASHBOARD ERROR:",
      e
    );

    showToast(
      t("zoneDataFailed"),
      "error"
    );
  }
}

/* =========================================================
   RESOLVE SOS
========================================================= */

async function resolveSosAlert(
  alertId
) {

  if (!state.staffSession) {
    return;
  }

  try {

    const {
      error
    } =
      await supabase.rpc(
        "resolve_sos",
        {
          p_alert_id:
            alertId,
          p_zone:
            state.staffSession.zone,
          p_passcode:
            state.staffSession.passcode
        }
      );

    if (error) {
      throw error;
    }

    showToast(
      t("alertResolved"),
      "success"
    );

    await loadStaffData();

  } catch (e) {

    console.error(
      "RESOLVE SOS ERROR:",
      e
    );

    showToast(
      t("resolveFailed"),
      "error"
    );
  }
}

/* =========================================================
   EXIT STAFF
========================================================= */

function exitStaff() {

  state.staffSession =
    null;

  sessionStorage.removeItem(
    SS_STAFF_KEY
  );

  switchPortal(
    "portalGateway"
  );
}

/* =========================================================
   SUPER ADMIN
========================================================= */

async function handleSuperAdminAuthSubmit(
  ev
) {

  ev.preventDefault();

  setFormError(
    "superAdminAuthError",
    ""
  );

  const passcode =
    document
      .getElementById(
        "superAdminPasscodeInput"
      )
      .value;

  try {

    const {
      data,
      error
    } =
      await supabase.rpc(
        "superadmin_login",
        {
          p_passcode:
            passcode
        }
      );

    if (error) {
      throw error;
    }

    if (!data) {

      setFormError(
        "superAdminAuthError",
        t("masterPasscode")
      );

      return;
    }

    state.superAdminPasscode =
      passcode;

    sessionStorage.setItem(
      SS_SUPERADMIN_KEY,
      "1"
    );

    closeModal();

    switchPortal(
      "superAdminPortal"
    );

    await loadSuperAdminData();

  } catch (e) {

    console.error(
      "SUPER ADMIN LOGIN ERROR:",
      e
    );

    setFormError(
      "superAdminAuthError",
      t("loginFailed")
    );
  }
}

async function loadSuperAdminData() {

  if (!state.superAdminPasscode) {
    return;
  }

  try {

    const {
      data,
      error
    } =
      await supabase.rpc(
        "superadmin_dashboard",
        {
          p_passcode:
            state.superAdminPasscode
        }
      );

    if (error) {
      throw error;
    }

    const rows =
      data.users || [];

    document.getElementById(
      "saZones"
    ).textContent =
      new Set(
        rows.map(
          r => r.zone_code
        )
      ).size;

    document.getElementById(
      "saTotal"
    ).textContent =
      rows.length;

    document.getElementById(
      "saSOS"
    ).textContent =
      (
        data.active_sos || []
      ).length;

    const tbody =
      document.getElementById(
        "superAdminTableBody"
      );

    tbody.innerHTML =
      rows.map(r => `

        <tr>

          <td>
            ${r.zone_code || "--"}
          </td>

          <td>
            ${statusPillHtml(
              (data.active_sos || [])
                .some(
                  a =>
                    a.user_id === r.id
                )
            )}
          </td>

          <td>
            ${r.name}
          </td>

          <td>
            ${(r.role || "")
              .toUpperCase()}
          </td>

          <td>
            ${r.phone}
          </td>

          <td>
            ${
              r.latitude != null
                ? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`
                : "--"
            }
          </td>

        </tr>

      `).join("")

      ||

      `<tr>
         <td
           colspan="6"
           style="text-align:center; color:var(--text-lo);"
         >
           ${t("noRegistrations")}
         </td>
       </tr>`;

  } catch (e) {

    console.error(
      "MASTER CONTROL ERROR:",
      e
    );

    showToast(
      t("masterDataFailed"),
      "error"
    );
  }
}

/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.switchPortal =
  switchPortal;

window.openModal =
  openModal;

window.closeModal =
  closeModal;

window.setLanguage =
  setLanguage;

window.enterUserMode =
  enterUserMode;

window.openRegistration =
  openRegistration;

window.signOut =
  signOut;

window.promptSOSVerification =
  promptSOSVerification;

window.handleVerificationResult =
  handleVerificationResult;

window.loadStaffData =
  loadStaffData;

window.exitStaff =
  exitStaff;

window.loadSuperAdminData =
  loadSuperAdminData;

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const savedLang =
      localStorage.getItem(
        LS_LANG_KEY
      ) || "en";

    const langSelect =
      document.getElementById(
        "langSelect"
      );

    if (langSelect) {
      langSelect.value =
        savedLang;
    }

    applyTranslation(
      savedLang
    );

    refreshDynamicLanguage();

    /* Registration */

    const registrationForm =
      document.getElementById(
        "registrationForm"
      );

    if (registrationForm) {

      registrationForm.addEventListener(
        "submit",
        handleRegistrationSubmit
      );

    }

    /* User sign in */

    const userSignInForm =
      document.getElementById(
        "userSignInForm"
      );

    if (userSignInForm) {

      userSignInForm.addEventListener(
        "submit",
        handleSignInSubmit
      );

    }

    /* Staff login */

    const staffAuthForm =
      document.getElementById(
        "staffAuthForm"
      );

    if (staffAuthForm) {

      staffAuthForm.addEventListener(
        "submit",
        handleStaffAuthSubmit
      );

    }

    /* Super admin */

    const superAdminAuthForm =
      document.getElementById(
        "superAdminAuthForm"
      );

    if (superAdminAuthForm) {

      superAdminAuthForm.addEventListener(
        "submit",
        handleSuperAdminAuthSubmit
      );

    }

    /* Restore staff session */

    const savedStaff =
      sessionStorage.getItem(
        SS_STAFF_KEY
      );

    if (savedStaff) {

      try {

        const {
          zone,
          phone
        } =
          JSON.parse(
            savedStaff
          );

        const zoneInput =
          document.getElementById(
            "staffZoneInput"
          );

        const phoneInput =
          document.getElementById(
            "staffPhoneInput"
          );

        if (zoneInput) {
          zoneInput.value =
            zone || "";
        }

        if (phoneInput) {
          phoneInput.value =
            phone || "";
        }

      } catch (e) {

        console.error(
          "STAFF SESSION RESTORE ERROR:",
          e
        );

      }

    }

  }
);
