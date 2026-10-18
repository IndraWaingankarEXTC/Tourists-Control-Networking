import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ==========================================
// 1. SUPABASE INITIALIZATION
// ==========================================
const SUPABASE_URL = "https://ccjygeoxaoomhonwenqw.supabase.co";
const SUPABASE_KEY = "sb_publishable_rPFLHItf9TI4P_i14P5bqw_tD5dz6mk";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SUPERADMIN_PASSCODE = "SUPERADMIN2026";

let selectedRole = null;
let isEmergencyActive = false;
let emergencyInterval = null;
let activeRescueTarget = null;
let compassInterval = null;

let dismissedVolunteerSOS = new Set();
let dismissedCommandSOS = new Set();

let activeCameraMediaStream = null;

let verifiedGpsCoords = null;
let verifiedGpsAccuracy = null;
let gpsWatchId = null;
let wakeLockSentinel = null;

let victimMapInstance = null;
let victimMarkers = {};

let volunteerMapInstance = null;
let volunteerMarkers = {};

let staffMapInstances = {};
let staffMarkers = {};

let touristOverviewMapInstance = null;
let touristOverviewMarker = null;
let touristOverviewGeofenceCircle = null;

let staffGeofenceMapInstance = null;
let staffGeofenceCircle = null;
let staffGeofenceCenterMarker = null;

let activeZoneGeofence = {
  latitude: null,
  longitude: null,
  radiusKm: 2.5
};

let lastGeofenceCheckinTime = 0;
let checkinCountdownInterval = null;

let currentSelectedLanguage = localStorage.getItem("preferredLanguage") || "en";

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

// ==========================================
// 2. 11 PROMINENT INDIAN LANGUAGES DICTIONARY
// ==========================================
const TRANSLATIONS = {
  en: {
    brand_title: "Tourist Safety",
    dynamic_grid: "DYNAMIC GRID",
    switch_portal: "Switch Portal",
    hero_heritage: "MULTI-DESTINATION GEOFENCE & RESCUE GRID",
    access_control: "Access Control",
    system: "System",
    select_auth: "Select your access authorization level to enter the safety grid.",
    public_entry: "PUBLIC ENTRY",
    user_portal: "User Portal",
    user_portal_desc: "Register with a live selfie verification and generate your Digital Safety Passport.",
    zone_authority: "ZONE AUTHORITY",
    staff_command: "Staff Command",
    staff_command_desc: "Scan visitor Digital IDs, configure safe zones, and dispatch emergency teams.",
    head_of_platform: "HEAD OF PLATFORM",
    master_control: "Master Control",
    master_control_desc: "Global oversight across all active destination zones, Digital IDs, and live telemetry feeds.",
    tourist_dashboard: "Tourist Safety Dashboard",
    dashboard_subtitle: "Explore safely within certified destination boundaries with your verified Digital Safety ID.",
    register_tourist: "Register as Tourist",
    register_tourist_desc: "Create your safety profile with a quick live selfie verification.",
    register_volunteer: "Register as Volunteer",
    register_volunteer_desc: "Join the regional response network to protect and aid nearby tourists.",
    signin_phone: "Sign In with Phone",
    signin_desc: "Restore your active session, Digital ID QR, and safety boundary.",
    official_passport: "OFFICIAL DIGITAL SAFETY PASSPORT",
    verified: "VERIFIED",
    phone_label: "Phone:",
    blood_group_label: "Blood Group:",
    emergency_contact_label: "Emergency Contact:",
    stay_address_label: "Stay / Address:",
    qr_hint: "💡 This QR code contains real emergency information for authorities.",
    inside_safe_zone: "Inside Safe Zone",
    safe_perimeter_desc: "Certified tourist perimeter monitored by local command center.",
    outside_safe_zone: "⚠️ Outside Certified Safe Zone",
    send_sos: "SEND LIVE SOS",
    cancel_sos: "CANCEL SOS (ACTIVE)",
    emergency_assistance: "EMERGENCY ASSISTANCE",
    leave_zone: "✕ Leave Event Zone & Purge My Telemetry",
    leave_zone_desc: "Permanently deletes your profile, selfie, and real-time location telemetry.",
    edit_profile: "✏️ Edit Profile",
    log_out: "Log Out",
    refresh: "↻ Refresh",
    zone_command: "Zone Command:",
    total_in_zone: "Total In Zone",
    active_tourists: "Active Tourists",
    volunteers_ready: "Volunteers Ready",
    active_zone_alerts: "Active Zone Alerts",
    safe_zone_editor: "🗺️ Safe Zone Geofence Editor (Shaded Green Region)",
    save_geofence: "💾 Save Geofence Boundary",
    field_deployment: "⚡ Field Deployment & Live Location Tracker",
    status_normal: "Normal",
    status_sos: "🚨 SOS ACTIVE",
    status_responder: "⚡ RESPONDER IN RANGE",
    view_qr: "🔍 View QR",
    view_id: "🔍 View ID",
    call_victim: "📞 Call Victim",
    command_route: "🗺️ Command Route",
    volunteer_route: "🗺️ Volunteer Route",
    deploy_hq: "✓ DEPLOY HQ UNIT",
    stand_by: "✕ STAND BY",
    yes_assist: "✓ YES, ASSIST",
    no_decline: "✕ NO",
    safe_chilling: "✓ I'm Safe / Chilling",
    need_help: "🚨 I Need Help",
    lang_select_label: "Preferred Language:"
  },
  hi: {
    brand_title: "पर्यटक सुरक्षा",
    dynamic_grid: "डायनामिक ग्रिड",
    switch_portal: "पोर्टल बदलें",
    hero_heritage: "मल्टी-डेस्टिनेशन जियोफेंस और बचाव ग्रिड",
    access_control: "एक्सेस कंट्रोल",
    system: "प्रणाली",
    select_auth: "सुरक्षा ग्रिड में प्रवेश करने के लिए अपना प्राधिकरण स्तर चुनें।",
    public_entry: "सार्वजनिक प्रवेश",
    user_portal: "उपयोगकर्ता पोर्टल",
    user_portal_desc: "लाइव सेल्फी सत्यापन के साथ पंजीकरण करें और अपना डिजिटल सेफ्टी पासपोर्ट प्राप्त करें।",
    zone_authority: "जोन प्राधिकरण",
    staff_command: "स्टाफ कमांड",
    staff_command_desc: "डिजिटल आईडी स्कैन करें, सुरक्षित क्षेत्र सेट करें और आपातकालीन दल भेजें।",
    head_of_platform: "प्लेटफ़ॉर्म प्रमुख",
    master_control: "मास्टर कंट्रोल",
    master_control_desc: "सभी सक्रिय गंतव्य क्षेत्रों, डिजिटल आईडी और लाइव टेलीमेट्री की वैश्विक निगरानी।",
    tourist_dashboard: "पर्यटक सुरक्षा डैशबोर्ड",
    dashboard_subtitle: "सत्यापित डिजिटल सुरक्षा आईडी के साथ प्रमाणित गंतव्य सीमाओं में सुरक्षित रहें।",
    register_tourist: "पर्यटक पंजीकरण",
    register_tourist_desc: "त्वरित लाइव सेल्फी सत्यापन के साथ अपनी सुरक्षा प्रोफ़ाइल बनाएं।",
    register_volunteer: "स्वयंसेवक पंजीकरण",
    register_volunteer_desc: "आस-पास के पर्यटकों की सुरक्षा और सहायता के लिए क्षेत्रीय नेटवर्क से जुड़ें।",
    signin_phone: "फोन से साइन इन करें",
    signin_desc: "अपना सक्रिय सत्र, डिजिटल आईडी क्यूआर और सुरक्षा सीमा पुनः प्राप्त करें।",
    official_passport: "आधिकारिक डिजिटल सुरक्षा पासपोर्ट",
    verified: "सत्यापित",
    phone_label: "फ़ोन:",
    blood_group_label: "रक्त समूह:",
    emergency_contact_label: "आपातकालीन संपर्क:",
    stay_address_label: "ठहरने का पता:",
    qr_hint: "💡 इस क्यूआर कोड में अधिकारियों के लिए वास्तविक आपातकालीन जानकारी शामिल है।",
    inside_safe_zone: "सुरक्षित क्षेत्र के अंदर",
    safe_perimeter_desc: "स्थानीय कमांड सेंटर द्वारा निगरानी की जाने वाली प्रमाणित पर्यटक परिधि।",
    outside_safe_zone: "⚠️ प्रमाणित सुरक्षित क्षेत्र से बाहर",
    send_sos: "लाइव संकट संकेत भेजें (SOS)",
    cancel_sos: "संकट संकेत रद्द करें (सक्रिय)",
    emergency_assistance: "आपातकालीन सहायता",
    leave_zone: "✕ इवेंट जोन छोड़ें और टेलीमेट्री हटाएं",
    leave_zone_desc: "आपकी प्रोफ़ाइल, सेल्फी और रीयल-टाइम स्थान डेटा को स्थायी रूप से हटा देता है।",
    edit_profile: "✏️ प्रोफ़ाइल संपादित करें",
    log_out: "लॉग आउट",
    refresh: "↻ रीफ़्रेश",
    zone_command: "जोन कमांड:",
    total_in_zone: "जोन में कुल",
    active_tourists: "सक्रिय पर्यटक",
    volunteers_ready: "तैयार स्वयंसेवक",
    active_zone_alerts: "सक्रिय अलर्ट",
    safe_zone_editor: "🗺️ सुरक्षित क्षेत्र जियोफेंस संपादक (हरा क्षेत्र)",
    save_geofence: "💾 जियोफेंस सीमा सहेजें",
    field_deployment: "⚡ फील्ड तैनाती और लाइव लोकेशन ट्रैकर",
    status_normal: "सामान्य",
    status_sos: "🚨 संकट सक्रिय",
    status_responder: "⚡ मददगार पास में है",
    view_qr: "🔍 क्यूआर देखें",
    view_id: "🔍 आईडी देखें",
    call_victim: "📞 पीड़ित को कॉल करें",
    command_route: "🗺️ कमांड मार्ग",
    volunteer_route: "🗺️ स्वयंसेवक मार्ग",
    deploy_hq: "✓ कमांड यूनिट भेजें",
    stand_by: "✕ प्रतीक्षा करें",
    yes_assist: "✓ हाँ, सहायता करें",
    no_decline: "✕ नहीं",
    safe_chilling: "✓ मैं सुरक्षित हूँ",
    need_help: "🚨 मुझे मदद चाहिए",
    lang_select_label: "पसंदीदा भाषा:"
  },
  mr: {
    brand_title: "पर्यटक सुरक्षा",
    dynamic_grid: "डायनॅमिक ग्रिड",
    switch_portal: "पोर्टल बदला",
    hero_heritage: "मल्टी-डेस्टिनेशन जिओफेन्स आणि बचाव यंत्रणा",
    access_control: "प्रवेश नियंत्रण",
    system: "प्रणाली",
    select_auth: "सुरक्षा ग्रिडमध्ये प्रवेश करण्यासाठी आपला अधिकृत स्तर निवडा.",
    public_entry: "सार्वजनिक प्रवेश",
    user_portal: "वापरकर्ता पोर्टल",
    user_portal_desc: "थेट सेल्फी पडताळणीसह नोंदणी करा आणि आपले डिजिटल सेफ्टी पासपोर्ट मिळवा.",
    zone_authority: "झोन प्राधिकरण",
    staff_command: "स्टाफ कमांड",
    staff_command_desc: "डिजिटल आयडी स्कॅन करा, सुरक्षित सीमा ठरवा आणि बचाव पथके पाठवा.",
    head_of_platform: "प्लॅटफॉर्म प्रमुख",
    master_control: "मास्टर कंट्रोल",
    master_control_desc: "सर्व सक्रिय पर्यटन क्षेत्रे, डिजिटल आयडी आणि थेट स्थानाचे निरीक्षण.",
    tourist_dashboard: "पर्यटक सुरक्षा डॅशबोर्ड",
    dashboard_subtitle: "डिजिटल सुरक्षा आयडीसह प्रमाणित क्षेत्रात सुरक्षित प्रवास करा.",
    register_tourist: "पर्यटक म्हणून नोंदणी करा",
    register_tourist_desc: "जलद थेट सेल्फी पडताळणीसह आपले सुरक्षा प्रोफाइल तयार करा.",
    register_volunteer: "स्वयंसेवक म्हणून नोंदणी करा",
    register_volunteer_desc: "पर्यटकांच्या रक्षणासाठी प्रादेशिक सुरक्षा नेटवर्कमध्ये सामील व्हा.",
    signin_phone: "फोन नंबरने साइन इन करा",
    signin_desc: "आपले सक्रिय सत्र, डिजिटल आयडी क्यूआर आणि सुरक्षित सीमा पुन्हा मिळवा.",
    official_passport: "अधिकृत डिजिटल सुरक्षा पासपोर्ट",
    verified: "प्रमाणित",
    phone_label: "फोन:",
    blood_group_label: "रक्तगट:",
    emergency_contact_label: "आपत्कालीन संपर्क:",
    stay_address_label: "मुक्कामाचा पत्ता:",
    qr_hint: "💡 या क्यूआर कोडमध्ये अधिकाऱ्यांसाठी खरी आपत्कालीन माहिती आहे.",
    inside_safe_zone: "सुरक्षित क्षेत्रात आहात",
    safe_perimeter_desc: "स्थानिक कमांड सेंटरद्वारे नियंत्रित सुरक्षित पर्यटक क्षेत्र.",
    outside_safe_zone: "⚠️ सुरक्षित क्षेत्राबाहेर पडला आहात",
    send_sos: "तातडीची मदत मागा (SOS)",
    cancel_sos: "मदत मागणी रद्द करा (सक्रिय)",
    emergency_assistance: "आपत्कालीन साहाय्य",
    leave_zone: "✕ झोन सोडा आणि डेटा नष्ट करा",
    leave_zone_desc: "आपले प्रोफाइल, सेल्फी आणि थेट स्थान माहिती कायमची नष्ट केली जाईल.",
    edit_profile: "✏️ प्रोफाइल बदला",
    log_out: "लॉग आउट",
    refresh: "↻ रिफ्रेश",
    zone_command: "झोन कमांड:",
    total_in_zone: "झोनमधील एकूण",
    active_tourists: "सक्रिय पर्यटक",
    volunteers_ready: "उपलब्ध स्वयंसेवक",
    active_zone_alerts: "सक्रिय धोके",
    safe_zone_editor: "🗺️ सुरक्षित क्षेत्र जिओफेन्स एडिटर (हिरवा भाग)",
    save_geofence: "💾 सुरक्षित सीमा सेव्ह करा",
    field_deployment: "⚡ फील्ड तैनाती आणि थेट स्थान ट्रॅकर",
    status_normal: "सामान्य",
    status_sos: "🚨 आणीबाणी सक्रिय",
    status_responder: "⚡ मदतनीस जवळ आहे",
    view_qr: "🔍 क्यूआर पाहा",
    view_id: "🔍 आयडी पाहा",
    call_victim: "📞 कॉल करा",
    command_route: "🗺️ कमांड मार्ग",
    volunteer_route: "🗺️ स्वयंसेवक मार्ग",
    deploy_hq: "✓ कमांड पथक पाठवा",
    stand_by: "✕ थांबा",
    yes_assist: "✓ होय, मदत करतो",
    no_decline: "✕ नाही",
    safe_chilling: "✓ मी सुरक्षित आहे",
    need_help: "🚨 मला मदत हवी आहे",
    lang_select_label: "निवडलेली भाषा:"
  },
  pa: {
    brand_title: "ਯਾਤਰੀ ਸੁਰੱਖਿਆ",
    dynamic_grid: "ਡਾਇਨਾਮਿਕ ਗਰਿੱਡ",
    switch_portal: "ਪੋਰਟਲ ਬਦਲੋ",
    hero_heritage: "ਜੀਓਫੈਂਸ ਅਤੇ ਬਚਾਅ ਨੈੱਟਵਰਕ",
    access_control: "ਪਹੁੰਚ ਕੰਟਰੋਲ",
    system: "ਸਿਸਟਮ",
    select_auth: "ਸੁਰੱਖਿਆ ਗਰਿੱਡ ਵਿੱਚ ਦਾਖਲ ਹੋਣ ਲਈ ਪੱਧਰ ਚੁਣੋ।",
    public_entry: "ਜਨਤਕ ਦਾਖਲਾ",
    user_portal: "ਯੂਜ਼ਰ ਪੋਰਟਲ",
    user_portal_desc: "ਲਾਈਵ ਸੈਲਫੀ ਨਾਲ ਰਜਿਸਟਰ ਕਰੋ ਅਤੇ ਡਿਜੀਟਲ ਸੇਫਟੀ ਪਾਸਪੋਰਟ ਪ੍ਰਾਪਤ ਕਰੋ।",
    zone_authority: "ਜ਼ੋਨ ਅਥਾਰਟੀ",
    staff_command: "ਸਟਾਫ ਕਮਾਂਡ",
    staff_command_desc: "ਡਿਜੀਟਲ ਆਈਡੀ ਸਕੈਨ ਕਰੋ ਅਤੇ ਬਚਾਅ ਟੀਮਾਂ ਭੇਜੋ।",
    head_of_platform: "ਮੁੱਖ ਨਿਯੰਤਰਕ",
    master_control: "ਮਾਸਟਰ ਕੰਟਰੋਲ",
    master_control_desc: "ਸਾਰੇ ਸਰਗਰਮ ਜ਼ੋਨਾਂ ਅਤੇ ਟੈਲੀਮੈਟਰੀ ਦੀ ਨਿਗਰਾਨੀ।",
    tourist_dashboard: "ਯਾਤਰੀ ਸੁਰੱਖਿਆ ਡੈਸ਼ਬੋਰਡ",
    dashboard_subtitle: "ਪ੍ਰਮਾਣਿਤ ਸੁਰੱਖਿਅਤ ਖੇਤਰਾਂ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਯਾਤਰਾ ਕਰੋ।",
    register_tourist: "ਯਾਤਰੀ ਵਜੋਂ ਰਜਿਸਟਰ ਕਰੋ",
    register_tourist_desc: "ਲਾਈਵ ਸੈਲਫੀ ਨਾਲ ਆਪਣੀ ਸੁਰੱਖਿਆ ਪ੍ਰੋਫਾਈਲ ਬਣਾਓ।",
    register_volunteer: "ਵਲੰਟੀਅਰ ਵਜੋਂ ਰਜਿਸਟਰ ਕਰੋ",
    register_volunteer_desc: "ਯਾਤਰੀਆਂ ਦੀ ਮਦਦ ਲਈ ਨੈੱਟਵਰਕ ਨਾਲ ਜੁੜੋ।",
    signin_phone: "ਫੋਨ ਨਾਲ ਸਾਈਨ ਇਨ ਕਰੋ",
    signin_desc: "ਆਪਣਾ ਸੈਸ਼ਨ ਅਤੇ ਡਿਜੀਟਲ ਆਈਡੀ ਬਹਾਲ ਕਰੋ।",
    official_passport: "ਅਧਿਕਾਰਤ ਡਿਜੀਟਲ ਸੁਰੱਖਿਆ ਪਾਸਪੋਰਟ",
    verified: "ਪ੍ਰਮਾਣਿਤ",
    phone_label: "ਫੋਨ:",
    blood_group_label: "ਖੂਨ ਦਾ ਗਰੁੱਪ:",
    emergency_contact_label: "ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ:",
    stay_address_label: "ਰਿਹਾਇਸ਼ ਦਾ ਪਤਾ:",
    qr_hint: "💡 ਇਸ QR ਕੋਡ ਵਿੱਚ ਅਧਿਕਾਰੀਆਂ ਲਈ ਜਾਣਕਾਰੀ ਹੈ।",
    inside_safe_zone: "ਸੁਰੱਖਿਅਤ ਖੇਤਰ ਦੇ ਅੰਦਰ",
    safe_perimeter_desc: "ਕਮਾਂਡ ਸੈਂਟਰ ਦੀ ਨਿਗਰਾਨੀ ਹੇਠ ਸੁਰੱਖਿਅਤ ਖੇਤਰ।",
    outside_safe_zone: "⚠️ ਸੁਰੱਖਿਅਤ ਖੇਤਰ ਤੋਂ ਬਾਹਰ",
    send_sos: "ਮਦਦ ਮੰਗੋ (SOS)",
    cancel_sos: "ਰੱਦ ਕਰੋ (ਸਰਗਰਮ)",
    emergency_assistance: "ਐਮਰਜੈਂਸੀ ਸਹਾਇਤਾ",
    leave_zone: "✕ ਜ਼ੋਨ ਛੱਡੋ ਅਤੇ ਡਾਟਾ ਮਿਟਾਓ",
    leave_zone_desc: "ਤੁਹਾਡਾ ਪ੍ਰੋਫਾਈਲ ਅਤੇ ਲਾਈਵ ਲੋਕੇਸ਼ਨ ਪੱਕੇ ਤੌਰ 'ਤੇ ਹਟਾ ਦਿੱਤੇ ਜਾਣਗੇ।",
    edit_profile: "✏️ ਪ੍ਰੋਫਾਈਲ ਬਦਲੋ",
    log_out: "ਲੌਗ ਆਉਟ",
    refresh: "↻ ਤਾਜ਼ਾ ਕਰੋ",
    zone_command: "ਜ਼ੋਨ ਕਮਾਂਡ:",
    total_in_zone: "ਜ਼ੋਨ ਵਿੱਚ ਕੁੱਲ",
    active_tourists: "ਸਰਗਰਮ ਯਾਤਰੀ",
    volunteers_ready: "ਤਿਆਰ ਵਲੰਟੀਅਰ",
    active_zone_alerts: "ਸਰਗਰਮ ਅਲਰਟ",
    safe_zone_editor: "🗺️ ਸੁਰੱਖਿਅਤ ਖੇਤਰ ਸੰਪਾਦਕ",
    save_geofence: "💾 ਸੀਮਾ ਸੁਰੱਖਿਅਤ ਕਰੋ",
    field_deployment: "⚡ ਲਾਈਵ ਲੋਕੇਸ਼ਨ ਟਰੈਕਰ",
    status_normal: "ਆਮ",
    status_sos: "🚨 ਐਮਰਜੈਂਸੀ ਸਰਗਰਮ",
    status_responder: "⚡ ਮਦਦਗਾਰ ਨੇੜੇ ਹੈ",
    view_qr: "🔍 QR ਦੇਖੋ",
    view_id: "🔍 ਆਈਡੀ ਦੇਖੋ",
    call_victim: "📞 ਕਾਲ ਕਰੋ",
    command_route: "🗺️ ਕਮਾਂਡ ਰੂਟ",
    volunteer_route: "🗺️ ਵਲੰਟੀਅਰ ਰੂਟ",
    deploy_hq: "✓ ਟੀਮ ਭੇਜੋ",
    stand_by: "✕ ਉਡੀਕ ਕਰੋ",
    yes_assist: "✓ ਹਾਂ, ਮਦਦ ਕਰੋ",
    no_decline: "✕ ਨਹੀਂ",
    safe_chilling: "✓ ਮੈਂ ਸੁਰੱਖਿਅਤ ਹਾਂ",
    need_help: "🚨 ਮੈਨੂੰ ਮਦਦ ਚਾਹੀਦੀ ਹੈ",
    lang_select_label: "ਭਾਸ਼ਾ ਚੁਣੋ:"
  },
  gu: {
    brand_title: "પ્રવાસી સુરક્ષા",
    dynamic_grid: "ડાયનેમિક ગ્રીડ",
    switch_portal: "પોર્ટલ બદલો",
    hero_heritage: "જીઓફેન્સ અને બચાવ નેટવર્ક",
    access_control: "એક્સેસ કંટ્રોલ",
    system: "સિસ્ટમ",
    select_auth: "સુરક્ષા ગ્રીડમાં પ્રવેશવા માટે સત્તા સ્તર પસંદ કરો.",
    public_entry: "જાહેર પ્રવેશ",
    user_portal: "વપરાશકર્તા પોર્ટલ",
    user_portal_desc: "લાઈવ સેલ્ફી વેરિફિકેશન સાથે નોંધણી કરો અને ડિજિટલ સેફ્ટી પાસપોર્ટ મેળવો.",
    zone_authority: "ઝોન સત્તામંડળ",
    staff_command: "સ્ટાફ કમાન્ડ",
    staff_command_desc: "ડિજિટલ આઈડી સ્કેન કરો, સલામત સીમાઓ નક્કી કરો અને બચાવ ટીમ મોકલો.",
    head_of_platform: "પ્લેટફોર્મ પ્રમુખ",
    master_control: "માસ્ટર કંટ્રોલ",
    master_control_desc: "તમામ સક્રિય ઝોન અને લાઇવ ટેલિમેટ્રીનું વૈશ્વિક નિરીક્ષણ.",
    tourist_dashboard: "પ્રવાસી સુરક્ષા ડેશબોર્ડ",
    dashboard_subtitle: "ડિજિટલ સુરક્ષા આઈડી સાથે પ્રમાણિત વિસ્તારમાં સુરક્ષિત રહો.",
    register_tourist: "પ્રવાસી તરીકે નોંધણી કરો",
    register_tourist_desc: "ઝડપી લાઇવ સેલ્ફી વેરિફિકેશન સાથે સુરક્ષા પ્રોફાઇલ બનાવો.",
    register_volunteer: "સ્વયંસેવક તરીકે નોંધણી કરો",
    register_volunteer_desc: "પ્રવાસીઓની સુરક્ષા માટે પ્રાદેશિક નેટવર્કમાં જોડાઓ.",
    signin_phone: "ફોનથી સાઇન ઇન કરો",
    signin_desc: "તમારું સત્ર અને ડિજિટલ આઈડી પુનઃપ્રાપ્ત કરો.",
    official_passport: "સત્તાવાર ડિજિટલ સુરક્ષા પાસપોર્ટ",
    verified: "પ્રમાણિત",
    phone_label: "ફોન:",
    blood_group_label: "બ્લડ ગ્રુપ:",
    emergency_contact_label: "કટોકટી સંપર્ક:",
    stay_address_label: "રહેઠાણનું સરનામું:",
    qr_hint: "💡 આ QR કોડમાં અધિકારીઓ માટે વાસ્તવિક કટોકટીની માહિતી છે.",
    inside_safe_zone: "સલામત વિસ્તારની અંદર",
    safe_perimeter_desc: "સ્થાનિક કમાન્ડ સેન્ટર દ્વારા મોનિટર કરાયેલ વિસ્તાર.",
    outside_safe_zone: "⚠️ સલામત વિસ્તારની બહાર",
    send_sos: "કટોકટી સહાય મોકલો (SOS)",
    cancel_sos: "સહાય રદ કરો (સક્રિય)",
    emergency_assistance: "કટોકટી સહાય",
    leave_zone: "✕ ઝોન છોડો અને ડેટા કાઢી નાખો",
    leave_zone_desc: "તમારી પ્રોફાઇલ, સેલ્ફી અને લાઇવ લોકેશન કાયમ માટે કાઢી નાખવામાં આવશે.",
    edit_profile: "✏️ પ્રોફાઇલ સંપાદિત કરો",
    log_out: "લૉગ આઉટ",
    refresh: "↻ રિફ્રેશ",
    zone_command: "ઝોન કમાન્ડ:",
    total_in_zone: "ઝોનમાં કુલ",
    active_tourists: "સક્રિય પ્રવાસીઓ",
    volunteers_ready: "તૈયાર સ્વયંસેવકો",
    active_zone_alerts: "સક્રિય ચેતવણીઓ",
    safe_zone_editor: "🗺️ સુરક્ષિત ક્ષેત્ર એડિટર",
    save_geofence: "💾 સીમા સાચવો",
    field_deployment: "⚡ લાઇવ લોકેશન ટ્રેકર",
    status_normal: "સામાન્ય",
    status_sos: "🚨 કટોકટી સક્રિય",
    status_responder: "⚡ મદદગાર નજીક છે",
    view_qr: "🔍 QR જુઓ",
    view_id: "🔍 આઈડી જુઓ",
    call_victim: "📞 કૉલ કરો",
    command_route: "🗺️ કમાન્ડ રૂટ",
    volunteer_route: "🗺️ સ્વયંસેવક રૂટ",
    deploy_hq: "✓ ટીમ મોકલો",
    stand_by: "✕ રાહ જુઓ",
    yes_assist: "✓ હા, મદદ કરો",
    no_decline: "✕ ના",
    safe_chilling: "✓ હું સુરક્ષિત છું",
    need_help: "🚨 મને મદદ જોઈએ છે",
    lang_select_label: "પસંદગીની ભાષા:"
  },
  bn: {
    brand_title: "পর্যটক নিরাপত্তা",
    dynamic_grid: "ডায়নামিক গ্রিড",
    switch_portal: "পোর্টাল পরিবর্তন",
    hero_heritage: "জিওফেন্স ও উদ্ধার নেটওয়ার্ক",
    access_control: "অ্যাক্সেস কন্ট্রোল",
    system: "সিস্টেম",
    select_auth: "সুরক্ষা গ্রিডে প্রবেশের জন্য আপনার স্তর নির্বাচন করুন।",
    public_entry: "পাবলিক এন্ট্রি",
    user_portal: "ইউজার পোর্টাল",
    user_portal_desc: "লাইভ সেলফি যাচাইয়ের মাধ্যমে নিবন্ধন করুন এবং ডিজিটাল পাসপোর্ট পান।",
    zone_authority: "জোন কর্তৃপক্ষ",
    staff_command: "স্টাফ কমান্ড",
    staff_command_desc: "ডিজিটাল আইডি স্ক্যান করুন এবং উদ্ধারকারী দল পাঠান।",
    head_of_platform: "প্ল্যাটফর্ম প্রধান",
    master_control: "মাস্টার কন্ট্রোল",
    master_control_desc: "সমস্ত সক্রিয় গন্তব্য জোন এবং লাইভ অবস্থান পর্যবেক্ষণ।",
    tourist_dashboard: "পর্যটক নিরাপত্তা ড্যাশবোর্ড",
    dashboard_subtitle: "ডিজিটাল নিরাপত্তা আইডির সাথে সুরক্ষিত অঞ্চলে ভ্রমণ করুন।",
    register_tourist: "পর্যটক হিসেবে নিবন্ধন",
    register_tourist_desc: "লাইভ সেলফি যাচাইয়ের মাধ্যমে নিরাপত্তা প্রোফাইল তৈরি করুন।",
    register_volunteer: "স্বেচ্ছাসেবক হিসেবে নিবন্ধন",
    register_volunteer_desc: "পর্যটকদের সাহায্যের জন্য আঞ্চলিক নেটওয়ার্কে যোগ দিন।",
    signin_phone: "ফোন দিয়ে সাইন ইন করুন",
    signin_desc: "আপনার সক্রিয় সেশন এবং ডিজিটাল আইডি পুনরুদ্ধার করুন।",
    official_passport: "অফিসিয়াল ডিজিটাল নিরাপত্তা পাসপোর্ট",
    verified: "যাচাইকৃত",
    phone_label: "ফোন:",
    blood_group_label: "রক্তের গ্রুপ:",
    emergency_contact_label: "জরুরী যোগাযোগ:",
    stay_address_label: "থাকার ঠিকানা:",
    qr_hint: "💡 এই QR কোডে কর্তৃপক্ষের জন্য তথ্য রয়েছে।",
    inside_safe_zone: "নিরাপদ অঞ্চলের ভিতরে",
    safe_perimeter_desc: "কমান্ড সেন্টার দ্বারা পর্যবেক্ষণকৃত নিরাপদ এলাকা।",
    outside_safe_zone: "⚠️ নিরাপদ অঞ্চলের বাইরে",
    send_sos: "জরুরী সাহায্য পাঠান (SOS)",
    cancel_sos: "বাতিল করুন (সক্রিয়)",
    emergency_assistance: "জরুরী সহায়তা",
    leave_zone: "✕ জোন ত্যাগ করুন এবং ডেটা মুছুন",
    leave_zone_desc: "আপনার প্রোফাইল, সেলফি এবং অবস্থান স্থায়ীভাবে মুছে ফেলা হবে।",
    edit_profile: "✏️ প্রোফাইল সম্পাদনা",
    log_out: "লগ আউট",
    refresh: "↻ রিফ্রেশ",
    zone_command: "জোন কমান্ড:",
    total_in_zone: "জোনে মোট",
    active_tourists: "সক্রিয় পর্যটক",
    volunteers_ready: "প্রস্তুত স্বেচ্ছাসেবক",
    active_zone_alerts: "সক্রিয় সতর্কতা",
    safe_zone_editor: "🗺️ নিরাপদ অঞ্চল সম্পাদক",
    save_geofence: "💾 সীমানা সংরক্ষণ করুন",
    field_deployment: "⚡ লাইভ লোকেশন ট্র্যাকার",
    status_normal: "স্বাভাবিক",
    status_sos: "🚨 জরুরী অবস্থা সক্রিয়",
    status_responder: "⚡ সাহায্যকারী কাছাকাছি",
    view_qr: "🔍 QR দেখুন",
    view_id: "🔍 আইডি দেখুন",
    call_victim: "📞 কল করুন",
    command_route: "🗺️ কমান্ড রুট",
    volunteer_route: "🗺️ স্বেচ্ছাসেবক রুট",
    deploy_hq: "✓ দল পাঠান",
    stand_by: "✕ অপেক্ষা করুন",
    yes_assist: "✓ হ্যাঁ, সাহায্য করুন",
    no_decline: "✕ না",
    safe_chilling: "✓ আমি নিরাপদ আছি",
    need_help: "🚨 আমার সাহায্য প্রয়োজন",
    lang_select_label: "পছন্দের ভাষা:"
  },
  or: {
    brand_title: "ପର୍ଯ୍ୟଟକ ସୁରକ୍ଷା",
    dynamic_grid: "ଡାଇନାମିକ ଗ୍ରୀଡ୍",
    switch_portal: "ପୋର୍ଟାଲ୍ ବଦଳାନ୍ତୁ",
    hero_heritage: "ଜିଓଫେନ୍ସ ଏବଂ ଉଦ୍ଧାର ନେଟୱାର୍କ",
    access_control: "ଆକ୍ସେସ୍ କଣ୍ଟ୍ରୋଲ୍",
    system: "ସିଷ୍ଟମ୍",
    select_auth: "ସୁରକ୍ଷା ଗ୍ରୀଡରେ ପ୍ରବେଶ କରିବାକୁ ସ୍ତର ବାଛନ୍ତୁ।",
    public_entry: "ସାଧାରଣ ପ୍ରବେଶ",
    user_portal: "ୟୁଜର ପୋର୍ଟାଲ୍",
    user_portal_desc: "ଲାଇଭ୍ ସେଲଫି ସହିତ ପଞ୍ଜିକରଣ କରନ୍ତୁ ଏବଂ ଡିଜିଟାଲ୍ ସୁରକ୍ଷା ପାସପୋର୍ଟ ପାଆନ୍ତୁ।",
    zone_authority: "ଜୋନ୍ ପ୍ରାଧିକରଣ",
    staff_command: "ଷ୍ଟାଫ୍ କମାଣ୍ଡ",
    staff_command_desc: "ଡିଜିଟାଲ୍ ଆଇଡି ସ୍କାନ୍ କରନ୍ତୁ ଏବଂ ଉଦ୍ଧାରକାରୀ ଦଳ ପଠାନ୍ତୁ।",
    head_of_platform: "ପ୍ଲାଟଫର୍ମ ମୁଖ୍ୟ",
    master_control: "ମାଷ୍ଟର କଣ୍ଟ୍ରୋଲ୍",
    master_control_desc: "ସମସ୍ତ ଜୋନ୍ ଏବଂ ଲାଇଭ୍ ଟେଲିମେଟ୍ରି ଉପରେ ନଜର।",
    tourist_dashboard: "ପର୍ଯ୍ୟଟକ ସୁରକ୍ଷା ଡ୍ୟାସବୋର୍ଡ",
    dashboard_subtitle: "ପ୍ରମାଣିତ ସୁରକ୍ଷିତ ସୀମା ମଧ୍ୟରେ ସୁରକ୍ଷିତ ଭାବରେ ଭ୍ରମଣ କରନ୍ତୁ।",
    register_tourist: "ପର୍ଯ୍ୟଟକ ଭାବରେ ପଞ୍ଜିକରଣ",
    register_tourist_desc: "ଲାଇଭ୍ ସେଲଫି ଯାଞ୍ଚ ସହିତ ସୁରକ୍ଷା ପ୍ରୋଫାଇଲ୍ ସୃଷ୍ଟି କରନ୍ତୁ।",
    register_volunteer: "ସ୍ୱେଚ୍ଛାସେବୀ ଭାବରେ ପଞ୍ଜିକରଣ",
    register_volunteer_desc: "ପର୍ଯ୍ୟଟକଙ୍କୁ ସାହାଯ୍ୟ କରିବା ପାଇଁ ନେଟୱାର୍କରେ ଯୋଗ ଦିଅନ୍ତୁ।",
    signin_phone: "ଫୋନ୍ ସହିତ ସାଇନ୍ ଇନ୍ କରନ୍ତୁ",
    signin_desc: "ଆପଣଙ୍କର ସକ୍ରିୟ ସେସନ୍ ଏବଂ ଡିଜିଟାଲ୍ ଆଇଡି ପୁନରୁଦ୍ଧାର କରନ୍ତୁ।",
    official_passport: "ଅଫିସିଆଲ୍ ଡିଜିଟାଲ୍ ସୁରକ୍ଷା ପାସପୋର୍ଟ",
    verified: "ପ୍ରମାଣିତ",
    phone_label: "ଫୋନ୍:",
    blood_group_label: "ରକ୍ତ ବର୍ଗ:",
    emergency_contact_label: "ଜରୁରୀକାଳୀନ ଯୋଗାଯୋଗ:",
    stay_address_label: "ରହିବା ଠିକଣା:",
    qr_hint: "💡 ଏହି QR କୋଡରେ ପ୍ରକୃତ ସୂଚନା ରହିଛି।",
    inside_safe_zone: "ସୁରକ୍ଷିତ ଅଞ୍ଚଳ ଭିତରେ",
    safe_perimeter_desc: "କମାଣ୍ଡ ସେଣ୍ଟର ଦ୍ୱାରା ନିରୀକ୍ଷଣ କରାଯାଉଥିବା ସୁରକ୍ଷିତ ଅଞ୍ଚଳ।",
    outside_safe_zone: "⚠️ ସୁରକ୍ଷିତ ଅଞ୍ଚଳ ବାହାରେ",
    send_sos: "ଜରୁରୀକାଳୀନ ସହାୟତା (SOS)",
    cancel_sos: "ବାତିଲ କରନ୍ତୁ (ସକ୍ରିୟ)",
    emergency_assistance: "ଜରୁରୀକାଳୀନ ସହାୟତା",
    leave_zone: "✕ ଜୋନ୍ ଛାଡନ୍ତୁ ଏବଂ ଡାଟା ଲିଭାନ୍ତୁ",
    leave_zone_desc: "ଆପଣଙ୍କର ପ୍ରୋଫାଇଲ୍ ଏବଂ ଲୋକେସନ୍ ସ୍ଥାୟୀ ଭାବରେ ଡିଲିଟ୍ ହୋଇଯିବ।",
    edit_profile: "✏️ ପ୍ରୋଫାଇଲ୍ ସଂଶୋଧନ",
    log_out: "ଲଗ୍ ଆଉଟ୍",
    refresh: "↻ ରିଫ୍ରେଶ୍",
    zone_command: "ଜୋନ୍ କମାଣ୍ଡ:",
    total_in_zone: "ଜୋନରେ ସମୁଦାୟ",
    active_tourists: "ସକ୍ରିୟ ପର୍ଯ୍ୟଟକ",
    volunteers_ready: "ପ୍ରସ୍ତୁତ ସ୍ୱେଚ୍ଛାସେବୀ",
    active_zone_alerts: "ସକ୍ରିୟ ଚେତାବନୀ",
    safe_zone_editor: "🗺️ ସୁରକ୍ଷିତ ଅଞ୍ଚଳ ସମ୍ପାଦକ",
    save_geofence: "💾 ସୀମା ସଂରକ୍ଷଣ କରନ୍ତୁ",
    field_deployment: "⚡ ଲାଇଭ୍ ଲୋକେସନ୍ ଟ୍ରାକର୍",
    status_normal: "ସାଧାରଣ",
    status_sos: "🚨 ଆପତକାଳ ସକ୍ରିୟ",
    status_responder: "⚡ ସାହାଯ୍ୟକାରୀ ନିକଟରେ",
    view_qr: "🔍 QR ଦେଖନ୍ତୁ",
    view_id: "🔍 ଆଇଡି ଦେଖନ୍ତୁ",
    call_victim: "📞 କଲ୍ କରନ୍ତୁ",
    command_route: "🗺️ କମାଣ୍ଡ ରୁଟ୍",
    volunteer_route: "🗺️ ସ୍ୱେଚ୍ଛାସେବୀ ରୁଟ୍",
    deploy_hq: "✓ ଟିମ୍ ପଠାନ୍ତୁ",
    stand_by: "✕ ଅପେକ୍ଷା କରନ୍ତୁ",
    yes_assist: "✓ ହଁ, ସାହାଯ୍ୟ କରନ୍ତୁ",
    no_decline: "✕ ନା",
    safe_chilling: "✓ ମୁଁ ସୁରକ୍ଷିତ ଅଛି",
    need_help: "🚨 ମୋତେ ସାହାଯ୍ୟ ଦରକାର",
    lang_select_label: "ଭାଷା ବାଛନ୍ତୁ:"
  },
  ta: {
    brand_title: "சுற்றுலா பாதுகாப்பு",
    dynamic_grid: "டைனமிக் கிரிட்",
    switch_portal: "போர்ட்டல் மாற்று",
    hero_heritage: "ஜியோஃபென்ஸ் மற்றும் மீட்பு வலைப்பின்னல்",
    access_control: "அணுகல் கட்டுப்பாடு",
    system: "அமைப்பு",
    select_auth: "பாதுகாப்பு அமைப்பில் நுழைய உங்கள் நிலையைத் தேர்ந்தெடுக்கவும்.",
    public_entry: "பொது நுழைவு",
    user_portal: "பயனர் போர்ட்டல்",
    user_portal_desc: "நேரலை செல்ஃபி சரிபார்ப்புடன் பதிவு செய்து டிஜிட்டல் பாஸ்போர்ட்டைப் பெறுங்கள்.",
    zone_authority: "மண்டல அதிகாரம்",
    staff_command: "பணியாளர் கட்டளை",
    staff_command_desc: "டிஜிட்டல் ஐடியை ஸ்கேன் செய்து மீட்புக் குழுக்களை அனுப்பவும்.",
    head_of_platform: "தளத் தலைவர்",
    master_control: "முதன்மை கட்டுப்பாடு",
    master_control_desc: "அனைத்து மண்டலங்கள் மற்றும் நேரலை கண்காணிப்பு.",
    tourist_dashboard: "சுற்றுலா பாதுகாப்பு டாஷ்போர்டு",
    dashboard_subtitle: "டிஜிட்டல் பாதுகாப்பு ஐடியுடன் சான்றளிக்கப்பட்ட எல்லைகளில் பாதுகாப்பாக இருங்கள்.",
    register_tourist: "சுற்றுலாவாசியாக பதிவு செய்க",
    register_tourist_desc: "செல்ஃபி சரிபார்ப்புடன் பாதுகாப்பு சுயவிவரத்தை உருவாக்கவும்.",
    register_volunteer: "தன்னார்வலராக பதிவு செய்க",
    register_volunteer_desc: "சுற்றுலாப் பயணிகளுக்கு உதவ பாதுகாப்பு நெட்வொர்க்கில் இணையுங்கள்.",
    signin_phone: "தொலைபேசி மூலம் உள்நுழைக",
    signin_desc: "உங்கள் அமர்வு மற்றும் டிஜிட்டல் ஐடியை மீட்டெடுக்கவும்.",
    official_passport: "அதிகாரப்பூர்வ டிஜிட்டல் பாதுகாப்பு பாஸ்போர்ட்",
    verified: "சரிபார்க்கப்பட்டது",
    phone_label: "தொலைபேசி:",
    blood_group_label: "இரத்த வகை:",
    emergency_contact_label: "அவசர தொடர்பு:",
    stay_address_label: "தங்கும் முகவரி:",
    qr_hint: "💡 இந்த QR குறியீட்டில் அதிகாரிகளுக்கான அவசர தகவல் உள்ளது.",
    inside_safe_zone: "பாதுகாப்பான பகுதிக்குள்",
    safe_perimeter_desc: "கட்டளை மையத்தால் கண்காணிக்கப்படும் பாதுகாப்பான பகுதி.",
    outside_safe_zone: "⚠️ பாதுகாப்பான பகுதிக்கு வெளியே",
    send_sos: "அவசர உதவி கோரிக்கை (SOS)",
    cancel_sos: "ரத்து செய் (செயலில்)",
    emergency_assistance: "அவசர உதவி",
    leave_zone: "✕ வெளியேறி தரவை நீக்கு",
    leave_zone_desc: "சுயவிவரம் மற்றும் இருப்பிடத் தரவு நிரந்தரமாக நீக்கப்படும்.",
    edit_profile: "✏️ சுயவிவரம் திருத்து",
    log_out: "வெளியேறு",
    refresh: "↻ புதுப்பி",
    zone_command: "மண்டல கட்டளை:",
    total_in_zone: "மண்டலத்தில் மொத்தம்",
    active_tourists: "செயலில் உள்ள சுற்றுலாப் பயணிகள்",
    volunteers_ready: "தயாராக உள்ள தன்னார்வலர்கள்",
    active_zone_alerts: "செயலில் உள்ள எச்சரிக்கைகள்",
    safe_zone_editor: "🗺️ பாதுகாப்பான பகுதி எடிட்டர்",
    save_geofence: "💾 எல்லையை சேமிக்கவும்",
    field_deployment: "⚡ நேரலை இருப்பிட கண்காணிப்பு",
    status_normal: "இயல்பு",
    status_sos: "🚨 அவசரநிலை செயலில்",
    status_responder: "⚡ உதவியாளர் அருகில்",
    view_qr: "🔍 QR காண்க",
    view_id: "🔍 ஐடி காண்க",
    call_victim: "📞 அழைக்கவும்",
    command_route: "🗺️ கட்டளை வழி",
    volunteer_route: "🗺️ தன்னார்வலர் வழி",
    deploy_hq: "✓ குழுவை அனுப்பவும்",
    stand_by: "✕ காத்திருக்கவும்",
    yes_assist: "✓ ஆம், உதவவும்",
    no_decline: "✕ இல்லை",
    safe_chilling: "✓ நான் பாதுகாப்பாக உள்ளேன்",
    need_help: "🚨 எனக்கு உதவி தேவை",
    lang_select_label: "மொழியைத் தேர்ந்தெடுக்கவும்:"
  },
  te: {
    brand_title: "పర్యాటక భద్రత",
    dynamic_grid: "డైనమిక్ గ్రిడ్",
    switch_portal: "పోర్టల్ మార్చండి",
    hero_heritage: "జియోఫెన్స్ మరియు రెస్క్యూ నెట్‌వర్క్",
    access_control: "యాక్సెస్ కంట్రోల్",
    system: "సిస్టమ్",
    select_auth: "భద్రతా గ్రిడ్‌లోకి ప్రవేశించడానికి స్థాయిని ఎంచుకోండి.",
    public_entry: "పబ్లిక్ ఎంట్రీ",
    user_portal: "యూజర్ పోర్టల్",
    user_portal_desc: "లైవ్ సెల్ఫీ వెరిఫికేషన్‌తో నమోదు చేసుకోండి మరియు డిజిటల్ పాస్‌పోర్ట్ పొందండి.",
    zone_authority: "జోన్ అథారిటీ",
    staff_command: "స్టాఫ్ కమాండ్",
    staff_command_desc: "డిజిటల్ ఐడీని స్కాన్ చేయండి మరియు రెస్క్యూ బృందాలను పంపండి.",
    head_of_platform: "ప్లాట్‌ఫామ్ హెడ్",
    master_control: "మాస్టర్ కంట్రోల్",
    master_control_desc: "అన్ని యాక్టివ్ జోన్లు మరియు లైవ్ లొకేషన్ పర్యవేక్షణ.",
    tourist_dashboard: "పర్యాటక భద్రతా డాష్‌బోర్డ్",
    dashboard_subtitle: "డిజిటల్ సేఫ్టీ ఐడీతో సురక్షిత ప్రాంతాలలో ప్రయాణించండి.",
    register_tourist: "పర్యాటకుడిగా నమోదు చేయండి",
    register_tourist_desc: "సెల్ఫీ వెరిఫికేషన్‌తో భద్రతా ప్రొఫైల్‌ను సృష్టించండి.",
    register_volunteer: "వాలంటీర్‌గా నమోదు చేయండి",
    register_volunteer_desc: "పర్యాటకులకు సహాయం చేయడానికి నెట్‌వర్క్‌లో చేరండి.",
    signin_phone: "ఫోన్ ద్వారా సైన్ ఇన్ చేయండి",
    signin_desc: "మీ సెషన్ మరియు డిజిటల్ ఐడీని పునరుద్ధరించండి.",
    official_passport: "అధికారిక డిజిటల్ భద్రతా పాస్‌పోర్ట్",
    verified: "ధృవీకరించబడింది",
    phone_label: "ఫోన్:",
    blood_group_label: "రక్త వర్గం:",
    emergency_contact_label: "అత్యవసర సంప్రదింపు:",
    stay_address_label: "నివాస చిరునామా:",
    qr_hint: "💡 ఈ QR కోడ్ అధికారుల కోసం నిజమైన సమాచారాన్ని కలిగి ఉంది.",
    inside_safe_zone: "సురక్షిత ప్రాంతం లోపల",
    safe_perimeter_desc: "కమాండ్ సెంటర్ ద్వారా పర్యవేక్షించబడే ప్రాంతం.",
    outside_safe_zone: "⚠️ సురక్షిత ప్రాంతం వెలుపల",
    send_sos: "అత్యవసర సహాయం (SOS)",
    cancel_sos: "రద్దు చేయండి (యాక్టివ్)",
    emergency_assistance: "అత్యవసర సహాయం",
    leave_zone: "✕ జోన్ నుండి నిష్క్రమించండి",
    leave_zone_desc: "మీ ప్రొఫైల్ మరియు లొకేషన్ డేటా శాశ్వతంగా తొలగించబడుతుంది.",
    edit_profile: "✏️ ప్రొఫైల్ సవరించండి",
    log_out: "లాగ్ అవుట్",
    refresh: "↻ రీఫ్రెష్",
    zone_command: "జోన్ కమాండ్:",
    total_in_zone: "జోన్‌లో మొత్తం",
    active_tourists: "యాక్టివ్ పర్యాటకులు",
    volunteers_ready: "సిద్ధంగా ఉన్న వాలంటీర్లు",
    active_zone_alerts: "యాక్టివ్ హెచ్చరికలు",
    safe_zone_editor: "🗺️ సేఫ్ జోన్ ఎడిటర్",
    save_geofence: "💾 సరిహద్దును సేవ్ చేయండి",
    field_deployment: "⚡ లైవ్ లొకేషన్ ట్రాకర్",
    status_normal: "సాధారణం",
    status_sos: "🚨 అత్యవసర పరిస్థితి",
    status_responder: "⚡ సహాయకుడు సమీపంలో ఉన్నారు",
    view_qr: "🔍 QR చూడండి",
    view_id: "🔍 ఐడీ చూడండి",
    call_victim: "📞 కాల్ చేయండి",
    command_route: "🗺️ కమాండ్ రూట్",
    volunteer_route: "🗺️ వాలంటీర్ రూట్",
    deploy_hq: "✓ బృందాన్ని పంపండి",
    stand_by: "✕ వేచి ఉండండి",
    yes_assist: "✓ అవును, సహాయం చేయండి",
    no_decline: "✕ లేదు",
    safe_chilling: "✓ నేను సురక్షితంగా ఉన్నాను",
    need_help: "🚨 నాకు సహాయం కావాలి",
    lang_select_label: "భాషను ఎంచుకోండి:"
  },
  ml: {
    brand_title: "ടൂറിസ്റ്റ് സുരക്ഷ",
    dynamic_grid: "ഡൈനാമിക് ഗ്രിഡ്",
    switch_portal: "പോർട്ടൽ മാറ്റുക",
    hero_heritage: "ജിയോഫെൻസ് & റെസ്ക്യൂ നെറ്റ്‌വർക്ക്",
    access_control: "ആക്സസ് കൺട്രോൾ",
    system: "സിസ്റ്റം",
    select_auth: "സുരക്ഷാ ഗ്രിഡിൽ പ്രവേശിക്കാൻ ലെവൽ തിരഞ്ഞെടുക്കുക.",
    public_entry: "പബ്ലിക് എൻട്രി",
    user_portal: "യൂസർ പോർട്ടൽ",
    user_portal_desc: "ലൈവ് സെൽഫി വെരിഫിക്കേഷൻ വഴി രജിസ്റ്റർ ചെയ്ത് ഡിജിറ്റൽ പാസ്‌പോർട്ട് നേടുക.",
    zone_authority: "സോൺ അതോറിറ്റി",
    staff_command: "സ്റ്റാഫ് കമാൻഡ്",
    staff_command_desc: "ഡിജിറ്റൽ ഐഡി സ്കാൻ ചെയ്യുക, രക്ഷാപ്രവർത്തകരെ അയക്കുക.",
    head_of_platform: "പ്ലാറ്റ്‌ഫോം മേധാവി",
    master_control: "മാസ്റ്റർ കൺട്രോൾ",
    master_control_desc: "എല്ലാ സോണുകളുടെയും തത്സമയ ലൊക്കേഷന്റെയും നിരീക്ഷണം.",
    tourist_dashboard: "ടൂറിസ്റ്റ് സുരക്ഷാ ഡാഷ്‌ബോർഡ്",
    dashboard_subtitle: "ഡിജിറ്റൽ സുരക്ഷാ ഐഡിയോടെ സുരക്ഷിതമായി യാത്ര ചെയ്യുക.",
    register_tourist: "ടൂറിസ്റ്റായി രജിസ്റ്റർ ചെയ്യുക",
    register_tourist_desc: "സെൽഫി വെരിഫിക്കേഷനിലൂടെ സുരക്ഷാ പ്രൊഫൈൽ ഉണ്ടാക്കുക.",
    register_volunteer: "വോളണ്ടിയറായി രജിസ്റ്റർ ചെയ്യുക",
    register_volunteer_desc: "സഞ്ചാരികളെ സഹായിക്കാൻ നെറ്റ്‌വർക്കിൽ ചേരുക.",
    signin_phone: "ഫോൺ ഉപയോഗിച്ച് സൈൻ ഇൻ ചെയ്യുക",
    signin_desc: "സെഷനും ഡിജിറ്റൽ ഐഡിയും വീണ്ടെടുക്കുക.",
    official_passport: "ഔദ്യോഗിക ഡിജിറ്റൽ സുരക്ഷാ പാസ്‌പോർട്ട്",
    verified: "സ്ഥിരീകരിച്ചു",
    phone_label: "ഫോൺ:",
    blood_group_label: "രക്തഗ്രൂപ്പ്:",
    emergency_contact_label: "അടിയന്തര സമ്പർക്കം:",
    stay_address_label: "താമസിക്കുന്ന വിലാസം:",
    qr_hint: "💡 ഈ QR കോഡിൽ അധികാരികൾക്കായുള്ള വിവരങ്ങൾ അടങ്ങിയിരിക്കുന്നു.",
    inside_safe_zone: "സുരക്ഷിത മേഖലയ്ക്കുള്ളിൽ",
    safe_perimeter_desc: "കൺട്രോൾ റൂം നിരീക്ഷിക്കുന്ന സുരക്ഷിത പ്രദേശം.",
    outside_safe_zone: "⚠️ സുരക്ഷിത മേഖലയ്ക്ക് പുറത്ത്",
    send_sos: "അടിയന്തര സഹായം അയക്കുക (SOS)",
    cancel_sos: "റദ്ദാക്കുക (സജീവം)",
    emergency_assistance: "അടിയന്തര സഹായം",
    leave_zone: "✕ സോൺ വിടുക, ഡാറ്റ നീക്കം ചെയ്യുക",
    leave_zone_desc: "നിങ്ങളുടെ പ്രൊഫൈലും ലൊക്കേഷൻ വിവരങ്ങളും ശാശ്വതമായി ഇല്ലാതാക്കും.",
    edit_profile: "✏️ പ്രൊഫൈൽ എഡിറ്റ് ചെയ്യുക",
    log_out: "ലോഗ് ഔട്ട്",
    refresh: "↻ പുതുക്കുക",
    zone_command: "സോൺ കമാൻഡ്:",
    total_in_zone: "സോണിൽ ആകെ",
    active_tourists: "സജീവ ടൂറിസ്റ്റുകൾ",
    volunteers_ready: "സന്നദ്ധപ്രവർത്തകർ",
    active_zone_alerts: "സജീവ അലേർട്ടുകൾ",
    safe_zone_editor: "🗺️ സുരക്ഷിത മേഖല എഡിറ്റർ",
    save_geofence: "💾 അതിർത്തി സേവ് ചെയ്യുക",
    field_deployment: "⚡ തത്സമയ ലൊക്കേഷൻ ട്രാക്കർ",
    status_normal: "സാധാരണം",
    status_sos: "🚨 അടിയന്തരാവസ്ഥ",
    status_responder: "⚡ സഹായി സമീപത്തുണ്ട്",
    view_qr: "🔍 QR കാണുക",
    view_id: "🔍 ഐഡി കാണുക",
    call_victim: "📞 വിളിക്കുക",
    command_route: "🗺️ കമാൻഡ് റൂട്ട്",
    volunteer_route: "🗺️ വോളണ്ടിയർ റൂട്ട്",
    deploy_hq: "✓ ടീമിനെ അയക്കുക",
    stand_by: "✕ കാത്തിരിക്കുക",
    yes_assist: "✓ അതെ, സഹായിക്കാം",
    no_decline: "✕ ഇല്ല",
    safe_chilling: "✓ ഞാൻ സുരക്ഷിതനാണ്",
    need_help: "🚨 എനിക്ക് സഹായം വേണം",
    lang_select_label: "ഭാഷ തിരഞ്ഞെടുക്കുക:"
  },
  ur: {
    brand_title: "سیاحتی تحفظ",
    dynamic_grid: "ڈائنامک گرڈ",
    switch_portal: "پورٹل تبدیل کریں",
    hero_heritage: "جیو فینس اور ریسکیو نیٹ ورک",
    access_control: "رسائی کنٹرول",
    system: "نظام",
    select_auth: "حفاظتی گرڈ میں داخل ہونے کے لیے سطح منتخب کریں۔",
    public_entry: "عوامی داخلہ",
    user_portal: "صارف پورٹل",
    user_portal_desc: "سیلفی تصدیق کے ساتھ رجسٹر ہوں اور ڈیجیٹل پاسپورٹ حاصل کریں۔",
    zone_authority: "زون اتھارٹی",
    staff_command: "اسٹاف کمانڈ",
    staff_command_desc: "ڈیجیٹل کارڈ اسکین کریں اور امدادی ٹیمیں روانہ کریں۔",
    head_of_platform: "پلیٹ فارم ہیڈ",
    master_control: "ماسٹر کنٹرول",
    master_control_desc: "تمام فعال زونز اور لائیو لوکیشن کی مکمل نگرانی۔",
    tourist_dashboard: "سیاحتی تحفظ ڈیش بورڈ",
    dashboard_subtitle: "ڈیجیٹل شناختی کارڈ کے ساتھ محفوظ زون میں سفر کریں۔",
    register_tourist: "بطور سیاح رجسٹر ہوں",
    register_tourist_desc: "لائیو سیلفی تصدیق کے ساتھ اپنا پروفائل بنائیں۔",
    register_volunteer: "بطور رضاکار رجسٹر ہوں",
    register_volunteer_desc: "سیاحوں کی مدد کے لیے نیٹ ورک میں شامل ہوں۔",
    signin_phone: "فون کے ذریعے سائن ان کریں",
    signin_desc: "اپنا فعال سیشن اور ڈیجیٹل شناختی کارڈ بحال کریں۔",
    official_passport: "سرکاری ڈیجیٹل سیفٹی پاسپورٹ",
    verified: "تصدیق شدہ",
    phone_label: "فون:",
    blood_group_label: "بلڈ گروپ:",
    emergency_contact_label: "ہنگامی رابطہ:",
    stay_address_label: "رہائش کا پتہ:",
    qr_hint: "💡 اس QR کوڈ میں حکام کے لیے اہم معلومات موجود ہیں۔",
    inside_safe_zone: "محفوظ علاقے کے اندر",
    safe_perimeter_desc: "کمانڈ سینٹر کے زیر نگرانی محفوظ سیاحتی علاقہ۔",
    outside_safe_zone: "⚠️ محفوظ علاقے سے باہر",
    send_sos: "ہنگامی مدد بھیجیں (SOS)",
    cancel_sos: "منسوخ کریں (فعال)",
    emergency_assistance: "ہنگامی امداد",
    leave_zone: "✕ زون چھوڑیں اور ڈیٹا حذف کریں",
    leave_zone_desc: "آپ کا پروفائل اور لوکیشن ڈیٹا مستقل طور پر ہٹا دیا جائے گا۔",
    edit_profile: "✏️ پروفائل تبدیل کریں",
    log_out: "لاگ آؤٹ",
    refresh: "↻ ریفریش",
    zone_command: "زون کمانڈ:",
    total_in_zone: "زون میں کل",
    active_tourists: "فعال سیاح",
    volunteers_ready: "تیار رضاکار",
    active_zone_alerts: "فعال الرٹس",
    safe_zone_editor: "🗺️ محفوظ زون ایڈیٹر",
    save_geofence: "💾 حد محفوظ کریں",
    field_deployment: "⚡ لائیو لوکیشن ٹریکر",
    status_normal: "عام",
    status_sos: "🚨 ایمرجنسی فعال",
    status_responder: "⚡ مددگار قریب ہے",
    view_qr: "🔍 QR دیکھیں",
    view_id: "🔍 شناختی کارڈ دیکھیں",
    call_victim: "📞 کال کریں",
    command_route: "🗺️ کمانڈ راستہ",
    volunteer_route: "🗺️ رضاکار راستہ",
    deploy_hq: "✓ ٹیم روانہ کریں",
    stand_by: "✕ انتظار کریں",
    yes_assist: "✓ ہاں، مدد کریں",
    no_decline: "✕ نہیں",
    safe_chilling: "✓ میں محفوظ ہوں",
    need_help: "🚨 مجھے مدد درکار ہے",
    lang_select_label: "زبان منتخب کریں:"
  }
};

window.changeAppLanguage = function(lang) {
  if (!TRANSLATIONS[lang]) lang = "en";
  currentSelectedLanguage = lang;
  localStorage.setItem("preferredLanguage", lang);

  if (lang === "ur") {
    document.body.setAttribute("dir", "rtl");
  } else {
    document.body.removeAttribute("dir");
  }

  const t = TRANSLATIONS[lang];

  // Dynamically update UI texts if matching IDs exist
  const textMapping = {
    activeNavbarZone: t.dynamic_grid,
    geofenceStatusTitle: isEmergencyActive ? t.outside_safe_zone : t.inside_safe_zone,
    geofenceStatusDesc: t.safe_perimeter_desc,
    sosLabel: isEmergencyActive ? t.cancel_sos : t.send_sos
  };

  Object.keys(textMapping).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = textMapping[id];
  });

  // Re-render state views
  updateUserStateView();
  if (sessionStorage.getItem("staffAuthenticated") === "true") {
    window.loadStaffMonitoringData();
  }
  if (sessionStorage.getItem("superAdminAuthenticated") === "true") {
    window.loadSuperAdminMatrix();
  }
};

// ==========================================
// 3. LIVE SELFIE CAMERA ENGINE
// ==========================================
window.stopLiveCameraStream = function() {
  if (activeCameraMediaStream) {
    activeCameraMediaStream.getTracks().forEach(track => track.stop());
    activeCameraMediaStream = null;
  }
};

window.handleNativeSelfieCapture = function(event, previewId, placeholderId, hiddenInputId, videoId, captureBtnId, retakeBtnId) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Data = e.target.result;
    
    const preview = document.getElementById(previewId);
    const placeholder = document.getElementById(placeholderId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const video = document.getElementById(videoId);
    const captureBtn = document.getElementById(captureBtnId);
    const retakeBtn = document.getElementById(retakeBtnId);

    if (hiddenInput) hiddenInput.value = base64Data;
    if (preview) {
      preview.src = base64Data;
      preview.style.display = "block";
    }
    if (placeholder) placeholder.style.display = "none";
    if (video) video.style.display = "none";
    if (captureBtn) captureBtn.style.display = "none";
    if (retakeBtn) retakeBtn.style.display = "inline-block";

    window.stopLiveCameraStream();
  };
  reader.readAsDataURL(file);
};

window.startLiveCamera = async function(videoId, previewId, placeholderId, captureBtnId, retakeBtnId) {
  window.stopLiveCameraStream();
  const video = document.getElementById(videoId);
  const preview = document.getElementById(previewId);
  const placeholder = document.getElementById(placeholderId);
  const captureBtn = document.getElementById(captureBtnId);
  const retakeBtn = document.getElementById(retakeBtnId);

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Live stream camera is not supported. Use the '📱 Tap to Open Camera' button instead.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } },
      audio: false
    });

    activeCameraMediaStream = stream;
    video.srcObject = stream;
    video.style.display = "block";
    if (preview) preview.style.display = "none";
    if (placeholder) placeholder.style.display = "none";
    if (captureBtn) captureBtn.style.display = "inline-block";
    if (retakeBtn) retakeBtn.style.display = "none";
  } catch (err) {
    alert(`Could not start live stream: ${err.message}. Please use '📱 Tap to Open Camera'.`);
  }
};

window.captureLiveSelfie = function(videoId, canvasId, previewId, placeholderId, hiddenInputId, captureBtnId, retakeBtnId) {
  const video = document.getElementById(videoId);
  const canvas = document.getElementById(canvasId);
  const preview = document.getElementById(previewId);
  const placeholder = document.getElementById(placeholderId);
  const hiddenInput = document.getElementById(hiddenInputId);
  const captureBtn = document.getElementById(captureBtnId);
  const retakeBtn = document.getElementById(retakeBtnId);

  if (!video || !canvas) return;

  const width = video.videoWidth || 320;
  const height = video.videoHeight || 320;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, width, height);

  const base64Data = canvas.toDataURL('image/jpeg', 0.85);

  if (hiddenInput) hiddenInput.value = base64Data;
  if (preview) {
    preview.src = base64Data;
    preview.style.display = "block";
  }
  if (placeholder) placeholder.style.display = "none";

  video.style.display = "none";
  if (captureBtn) captureBtn.style.display = "none";
  if (retakeBtn) retakeBtn.style.display = "inline-block";

  window.stopLiveCameraStream();
};

window.retakeLiveSelfie = function(videoId, previewId, placeholderId, hiddenInputId, captureBtnId, retakeBtnId) {
  const hiddenInput = document.getElementById(hiddenInputId);
  if (hiddenInput) hiddenInput.value = "";
  window.startLiveCamera(videoId, previewId, placeholderId, captureBtnId, retakeBtnId);
};

// ==========================================
// 4. REAL SCANNER-COMPLIANT QR CODE GENERATOR
// ==========================================
function formatProfileDataForQR(profile) {
  const roles = [profile.is_tourist ? "Tourist" : "", profile.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ") || "User";
  const em1 = profile.emergency_contact_1 ? `${profile.emergency_contact_1} (${profile.emergency_phone_1 || 'N/A'})` : "None";
  const em2 = profile.emergency_contact_2 ? `${profile.emergency_contact_2} (${profile.emergency_phone_2 || 'N/A'})` : "None";

  return `TOURIST SAFETY DIGITAL ID
Name: ${profile.name || 'N/A'}
Role: ${roles}
Zone: ${profile.zone_code || 'UNASSIGNED'}
Lang: ${(profile.preferred_language || currentSelectedLanguage).toUpperCase()}
Phone: ${profile.phone || 'N/A'}
Blood: ${profile.blood_group || 'N/A'}
Age/Gender: ${profile.age || 'N/A'}/${profile.gender || 'N/A'}
ICE 1: ${em1}
ICE 2: ${em2}
Stay: ${profile.home_address || 'N/A'}`;
}

function renderQRCodeInElement(elementId, text, size = 180) {
  const container = document.getElementById(elementId);
  if (!container) return;
  
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(text)}`;
  container.innerHTML = `<img src="${qrUrl}" width="${size}" height="${size}" alt="Digital ID QR Code" style="display:block; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.2);">`;
}

window.inspectUserProfileQR = function(encodedProfileJson) {
  try {
    const profile = JSON.parse(decodeURIComponent(encodedProfileJson));
    const modal = document.getElementById("qrInspectionModal");
    const overlay = document.getElementById("modalOverlay");
    const titleEl = document.getElementById("inspectModalName");
    const detailsEl = document.getElementById("inspectQRTextDetails");
    const selfieImg = document.getElementById("inspectSelfieImg");

    if (titleEl) titleEl.innerText = `${profile.name}'s Verified ID`;
    if (selfieImg) selfieImg.src = profile.photo_url || DEFAULT_AVATAR;

    const qrText = formatProfileDataForQR(profile);
    renderQRCodeInElement("inspectQRCodeContainer", qrText, 200);

    if (detailsEl) {
      detailsEl.innerHTML = `
        <div><strong>Zone:</strong> <span style="color:#ffd000;">${profile.zone_code || 'UNASSIGNED'}</span></div>
        <div><strong>Language:</strong> <span style="color:#38bdf8;">${(profile.preferred_language || 'en').toUpperCase()}</span></div>
        <div><strong>Role:</strong> ${[profile.is_tourist ? "Tourist" : "", profile.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ")}</div>
        <div><strong>Phone:</strong> <a href="tel:${profile.phone}" style="color:#38bdf8;">${profile.phone || 'N/A'}</a></div>
        <div><strong>Blood Group:</strong> <span style="color:#ef4444; font-weight:700;">${profile.blood_group || 'N/A'}</span></div>
        <div><strong>Primary Contact:</strong> ${profile.emergency_contact_1 || 'N/A'} (${profile.emergency_phone_1 || 'N/A'})</div>
        <div><strong>Stay Address:</strong> ${profile.home_address || 'N/A'}</div>
      `;
    }

    if (overlay) overlay.style.display = "flex";
    if (modal) modal.style.display = "block";
  } catch (err) {
    console.error("QR Inspection Error:", err);
  }
};

// ==========================================
// 5. GPS & TELEMETRY ENGINE
// ==========================================
async function requestScreenWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
    }
  } catch (err) {
    console.warn('WakeLock note:', err.message);
  }
}

async function broadcastLocationTelemetry(lat, lon, accuracy) {
  verifiedGpsCoords = { latitude: lat, longitude: lon };
  verifiedGpsAccuracy = accuracy || 5;

  const userId = localStorage.getItem("touristSafetyUserId");
  const isStaffActive = sessionStorage.getItem("staffAuthenticated") === "true";
  const staffZone = sessionStorage.getItem("staffZoneCode");

  if (userId) {
    await Promise.all([
      supabase.from("profiles").update({
        latitude: lat,
        longitude: lon,
        last_seen: new Date().toISOString()
      }).eq("id", userId),
      supabase.from("locations").insert({
        user_id: userId,
        latitude: lat,
        longitude: lon
      })
    ]);
  }

  if (isStaffActive && staffZone) {
    await supabase.from("command_center_location").upsert({
      id: `HQ_${staffZone}`,
      zone_code: staffZone,
      latitude: lat,
      longitude: lon,
      updated_at: new Date().toISOString()
    });
  }

  if (touristOverviewMapInstance && touristOverviewMarker) {
    touristOverviewMarker.setLatLng([lat, lon]);
  }
}

function startHighPrecisionGpsWatcher() {
  if (!navigator.geolocation) return;

  requestScreenWakeLock();

  if (gpsWatchId !== null) {
    navigator.geolocation.clearWatch(gpsWatchId);
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      broadcastLocationTelemetry(Number(pos.coords.latitude), Number(pos.coords.longitude), Math.round(pos.coords.accuracy));
    },
    (err) => console.warn("Fast GPS lock note:", err.message),
    { enableHighAccuracy: false, timeout: 2000, maximumAge: 30000 }
  );

  gpsWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const lat = Number(pos.coords.latitude);
      const lon = Number(pos.coords.longitude);
      const acc = Math.round(pos.coords.accuracy);
      broadcastLocationTelemetry(lat, lon, acc);
    },
    (err) => console.warn("Continuous GPS watch note:", err.message),
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

startHighPrecisionGpsWatcher();

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    requestScreenWakeLock();
    startHighPrecisionGpsWatcher();
  }
});

async function getLiveGpsCoordinates() {
  if (verifiedGpsCoords) return verifiedGpsCoords;

  return new Promise((resolve) => {
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(verifiedGpsCoords || { latitude: 18.9894, longitude: 73.1175 });
      }
    }, 2000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          verifiedGpsCoords = {
            latitude: Number(pos.coords.latitude),
            longitude: Number(pos.coords.longitude)
          };
          resolve(verifiedGpsCoords);
        }
      },
      () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(verifiedGpsCoords || { latitude: 18.9894, longitude: 73.1175 });
        }
      },
      { enableHighAccuracy: true, timeout: 1800, maximumAge: 2000 }
    );
  });
}

async function getLiveCommandHQData(zoneCode) {
  const fallback = await getLiveGpsCoordinates();
  if (!zoneCode) return { latitude: fallback.latitude, longitude: fallback.longitude, phone: 'N/A' };

  const [hqRes, zoneRes] = await Promise.all([
    supabase.from("command_center_location").select("latitude, longitude, contact_phone").eq("id", `HQ_${zoneCode}`).maybeSingle(),
    supabase.from("destination_zones").select("contact_phone").eq("zone_code", zoneCode).maybeSingle()
  ]);

  const phone = hqRes.data?.contact_phone || zoneRes.data?.contact_phone || "Command Helpline";
  const latitude = hqRes.data?.latitude ? Number(hqRes.data.latitude) : fallback.latitude;
  const longitude = hqRes.data?.longitude ? Number(hqRes.data.longitude) : fallback.longitude;

  return { latitude, longitude, phone };
}

// ==========================================
// 6. EMERGENCY SIREN SYNTHESIZER
// ==========================================
class SirenSynthesizer {
  constructor() {
    this.audioCtx = null;
    this.oscillator = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.sirenLoop = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
  }

  playWarningBeep() {
    this.init();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.4);
  }

  start() {
    this.init();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    if (this.isPlaying) return;

    this.oscillator = this.audioCtx.createOscillator();
    this.gainNode = this.audioCtx.createGain();
    this.oscillator.type = 'sawtooth';

    const t = this.audioCtx.currentTime;
    this.oscillator.frequency.setValueAtTime(600, t);
    this.oscillator.frequency.linearRampToValueAtTime(1000, t + 0.45);
    this.oscillator.frequency.linearRampToValueAtTime(600, t + 0.9);

    this.gainNode.gain.setValueAtTime(0.3, t);
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
    this.oscillator.start();
    this.isPlaying = true;

    this.sirenLoop = setInterval(() => {
      if (!this.isPlaying) return;
      const now = this.audioCtx.currentTime;
      this.oscillator.frequency.cancelScheduledValues(now);
      this.oscillator.frequency.setValueAtTime(600, now);
      this.oscillator.frequency.linearRampToValueAtTime(1050, now + 0.45);
      this.oscillator.frequency.linearRampToValueAtTime(600, now + 0.9);
    }, 900);
  }

  stop() {
    if (this.sirenLoop) clearInterval(this.sirenLoop);
    if (this.oscillator && this.isPlaying) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.isPlaying = false;
    }
  }
}

const siren = new SirenSynthesizer();

// ==========================================
// 7. DISTANCE & ROUTE HELPERS
// ==========================================
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined || lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.cos(dLon);
  let brng = Math.atan2(y, x) * (180 / Math.PI);
  return (brng + 360) % 360;
}

function calculateRouteAndETA(straightDistanceKm) {
  const roadDistance = straightDistanceKm * 1.35;
  const avgSpeedKmh = 40.0;
  const timeInMinutes = Math.ceil((roadDistance / avgSpeedKmh) * 60);

  let etaText = "";
  if (straightDistanceKm < 0.05) {
    etaText = "Arrived (Same Spot)";
  } else if (timeInMinutes < 60) {
    etaText = `~${timeInMinutes} min driving`;
  } else {
    const hrs = Math.floor(timeInMinutes / 60);
    const mins = timeInMinutes % 60;
    etaText = `~${hrs} hr ${mins} min driving`;
  }

  return { roadDistanceKm: roadDistance, etaText: etaText };
}

function formatDistance(distKm) {
  if (distKm < 0.02) return "0 m (Same Spot)";
  if (distKm < 1.0) return `${Math.round(distKm * 1000)} m`;
  return `${distKm.toFixed(2)} km`;
}

function getGoogleMapsRouteUrl(originLat, originLon, destLat, destLon) {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${destLat},${destLon}&travelmode=driving`;
}

function createLeafletCustomPin(type, title) {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div class="pin-inner pin-${type}" title="${title}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
}

window.notifyVictimEmergencyContact = function(contactName, contactPhone, victimName, zoneCode, lat, lon) {
  if (!contactPhone || contactPhone === 'N/A') {
    alert("No phone number registered for this emergency contact.");
    return;
  }

  let cleanPhone = contactPhone.replace(/[^\d+]/g, '');
  if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.substring(1);
  }

  const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
  
  const alertMessage = `🚨 *EMERGENCY DISTRESS ALERT - ${zoneCode} COMMAND CENTER* 🚨\n\n` +
    `Dear ${contactName},\n` +
    `Your contact *${victimName}* has triggered an active SOS distress alert in *${zoneCode}* zone.\n\n` +
    `📍 *Live Location:* ${mapsUrl}\n` +
    `⏰ *Time:* ${new Date().toLocaleTimeString()}\n\n` +
    `Local Command Center and search & rescue teams have been dispatched. Please stand by or reach out to the local emergency authority.`;

  const encodedMessage = encodeURIComponent(alertMessage);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
  
  const newWin = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  if (newWin) {
    newWin.opener = null;
  }
};

// ==========================================
// 8. GEOFENCE BOUNDARY & 20-MIN CHECK-IN
// ==========================================
async function fetchNearbyAIContext(lat, lon) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const query = `[out:json][timeout:2];(node(around:65,${lat},${lon})["amenity"~"restaurant|cafe|fast_food|bar|food_court"];node(around:65,${lat},${lon})["tourism"~"attraction|viewpoint|museum|hotel|artwork"];);out body 2;`;
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();

    if (data && data.elements && data.elements.length > 0) {
      const el = data.elements[0];
      const name = el.tags.name || el.tags.amenity || el.tags.tourism || "a local attraction";
      const type = el.tags.amenity ? "eatery / café" : "viewpoint / attraction";
      return { found: true, name: name, type: type };
    }
  } catch (err) {
    console.warn("AI context note:", err.message);
  }
  return { found: false };
}

async function checkTouristGeofenceBoundary() {
  const userId = localStorage.getItem("touristSafetyUserId");
  if (!userId || isEmergencyActive) return;

  const { data: profile } = await supabase.from("profiles").select("zone_code, is_tourist").eq("id", userId).maybeSingle();
  if (!profile || !profile.is_tourist || !profile.zone_code) return;

  const currentZone = profile.zone_code.toUpperCase();

  const { data: zoneRecord } = await supabase
    .from("destination_zones")
    .select("geofence_lat, geofence_lon, geofence_radius_km")
    .eq("zone_code", currentZone)
    .maybeSingle();

  const myCoords = await getLiveGpsCoordinates();

  let centerLat = zoneRecord?.geofence_lat;
  let centerLon = zoneRecord?.geofence_lon;
  let radiusKm = zoneRecord?.geofence_radius_km || 2.5;

  if (!centerLat || !centerLon) {
    centerLat = myCoords.latitude;
    centerLon = myCoords.longitude;
    await supabase.from("destination_zones").update({
      geofence_lat: centerLat,
      geofence_lon: centerLon,
      geofence_radius_km: radiusKm
    }).eq("zone_code", currentZone);
  }

  activeZoneGeofence = { latitude: centerLat, longitude: centerLon, radiusKm: radiusKm };

  renderTouristOverviewMap(myCoords, activeZoneGeofence);

  const distFromCenter = calculateDistanceKm(myCoords.latitude, myCoords.longitude, centerLat, centerLon);
  const isOutside = distFromCenter > radiusKm;

  const banner = document.getElementById("touristGeofenceBanner");
  const title = document.getElementById("geofenceStatusTitle");
  const desc = document.getElementById("geofenceStatusDesc");
  const dot = banner?.querySelector(".geofence-indicator-dot");

  const t = TRANSLATIONS[currentSelectedLanguage] || TRANSLATIONS.en;

  if (isOutside) {
    if (banner) banner.classList.add("breach");
    if (dot) { dot.className = "geofence-indicator-dot breach"; }
    if (title) title.innerText = t.outside_safe_zone;
    if (desc) desc.innerText = `You are ${distFromCenter.toFixed(2)} km away from ${currentZone} safe boundary (Max: ${radiusKm} km).`;

    const now = Date.now();
    const TWENTY_MINUTES_MS = 20 * 60 * 1000;
    if (now - lastGeofenceCheckinTime > TWENTY_MINUTES_MS) {
      triggerGeofenceSafetyCheckin(myCoords.latitude, myCoords.longitude, currentZone);
    }
  } else {
    if (banner) banner.classList.remove("breach");
    if (dot) { dot.className = "geofence-indicator-dot safe"; }
    if (title) title.innerText = t.inside_safe_zone;
    if (desc) desc.innerText = `${t.safe_perimeter_desc} (${distFromCenter.toFixed(2)} km / ${radiusKm} km radius).`;
  }
}

function renderTouristOverviewMap(myCoords, geofence) {
  const mapContainer = document.getElementById("touristOverviewMap");
  if (!mapContainer) return;

  if (!touristOverviewMapInstance) {
    touristOverviewMapInstance = L.map('touristOverviewMap', { zoomControl: true, scrollWheelZoom: true, dragging: true })
      .setView([myCoords.latitude, myCoords.longitude], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(touristOverviewMapInstance);
  }

  if (!touristOverviewMarker) {
    touristOverviewMarker = L.marker([myCoords.latitude, myCoords.longitude], {
      icon: createLeafletCustomPin('victim', 'Your Location')
    }).addTo(touristOverviewMapInstance).bindPopup("👤 <b>You (Tourist)</b>");
  } else {
    touristOverviewMarker.setLatLng([myCoords.latitude, myCoords.longitude]);
  }

  if (geofence.latitude && geofence.longitude) {
    if (!touristOverviewGeofenceCircle) {
      touristOverviewGeofenceCircle = L.circle([geofence.latitude, geofence.longitude], {
        radius: geofence.radiusKm * 1000,
        color: '#10b981',
        fillColor: '#34d399',
        fillOpacity: 0.18,
        weight: 2
      }).addTo(touristOverviewMapInstance).bindPopup("🟢 <b>Safe Tourist Perimeter</b>");
    } else {
      touristOverviewGeofenceCircle.setLatLng([geofence.latitude, geofence.longitude]);
      touristOverviewGeofenceCircle.setRadius(geofence.radiusKm * 1000);
    }
  }

  touristOverviewMapInstance.invalidateSize();
}

function triggerGeofenceSafetyCheckin(lat, lon, zoneCode) {
  const modal = document.getElementById("safetyCheckinModal");
  const contextText = document.getElementById("checkinContextText");
  const countdownEl = document.getElementById("checkinCountdown");
  if (!modal || modal.style.display === "flex") return;

  modal.style.display = "flex";
  lastGeofenceCheckinTime = Date.now();
  siren.playWarningBeep();

  if (contextText) {
    contextText.innerHTML = `You have moved outside the certified <strong>${zoneCode}</strong> safe tourist perimeter.<br>Are you okay, or do you need emergency assistance?`;
  }

  let secondsLeft = 60;
  if (countdownEl) countdownEl.innerText = `${secondsLeft}s`;

  if (checkinCountdownInterval) clearInterval(checkinCountdownInterval);
  checkinCountdownInterval = setInterval(() => {
    secondsLeft -= 1;
    if (countdownEl) countdownEl.innerText = `${secondsLeft}s`;

    if (secondsLeft <= 0) {
      clearInterval(checkinCountdownInterval);
      window.dismissSafetyCheckin(false);
    }
  }, 1000);

  fetchNearbyAIContext(lat, lon).then(poi => {
    if (poi.found && contextText) {
      contextText.innerHTML = `You are outside the <strong>${zoneCode}</strong> safe zone near <strong>${poi.name}</strong> (${poi.type}).<br>Are you chilling or do you need assistance?`;
    }
  });
}

window.dismissSafetyCheckin = async function(isSafe) {
  const modal = document.getElementById("safetyCheckinModal");
  if (modal) modal.style.display = "none";
  if (checkinCountdownInterval) clearInterval(checkinCountdownInterval);

  if (isSafe) {
    lastGeofenceCheckinTime = Date.now();
    alert("Safety confirmed. Stay safe!");
  } else {
    if (!isEmergencyActive) {
      await window.handleSOSToggle();
    }
  }
};

// ==========================================
// 9. STAFF GEOFENCE EDITOR
// ==========================================
window.initStaffGeofenceEditor = async function() {
  const currentZone = sessionStorage.getItem("staffZoneCode");
  if (!currentZone) return;

  const { data: zoneRecord } = await supabase
    .from("destination_zones")
    .select("geofence_lat, geofence_lon, geofence_radius_km")
    .eq("zone_code", currentZone)
    .maybeSingle();

  const currentGps = await getLiveGpsCoordinates();

  const centerLat = zoneRecord?.geofence_lat || currentGps.latitude;
  const centerLon = zoneRecord?.geofence_lon || currentGps.longitude;
  const radiusKm = zoneRecord?.geofence_radius_km || 2.5;

  activeZoneGeofence = { latitude: centerLat, longitude: centerLon, radiusKm: radiusKm };

  const slider = document.getElementById("geofenceRadiusSlider");
  const badge = document.getElementById("currentRadiusBadge");
  if (slider) slider.value = radiusKm;
  if (badge) badge.innerText = `Radius: ${radiusKm} km`;

  const mapContainer = document.getElementById("staffGeofenceEditorMap");
  if (!mapContainer) return;

  if (!staffGeofenceMapInstance) {
    staffGeofenceMapInstance = L.map('staffGeofenceEditorMap', { zoomControl: true, scrollWheelZoom: true, dragging: true })
      .setView([centerLat, centerLon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(staffGeofenceMapInstance);

    staffGeofenceMapInstance.on('click', (e) => {
      activeZoneGeofence.latitude = e.latlng.lat;
      activeZoneGeofence.longitude = e.latlng.lng;
      window.renderStaffGeofenceCircle();
    });
  }

  window.renderStaffGeofenceCircle();
};

window.renderStaffGeofenceCircle = function() {
  if (!staffGeofenceMapInstance) return;

  const pos = [activeZoneGeofence.latitude, activeZoneGeofence.longitude];

  if (!staffGeofenceCenterMarker) {
    staffGeofenceCenterMarker = L.marker(pos, {
      icon: createLeafletCustomPin('command', 'Safe Zone Center')
    }).addTo(staffGeofenceMapInstance).bindPopup("🟢 <b>Safe Zone Center</b>");
  } else {
    staffGeofenceCenterMarker.setLatLng(pos);
  }

  if (!staffGeofenceCircle) {
    staffGeofenceCircle = L.circle(pos, {
      radius: activeZoneGeofence.radiusKm * 1000,
      color: '#10b981',
      fillColor: '#34d399',
      fillOpacity: 0.22,
      weight: 2
    }).addTo(staffGeofenceMapInstance);
  } else {
    staffGeofenceCircle.setLatLng(pos);
    staffGeofenceCircle.setRadius(activeZoneGeofence.radiusKm * 1000);
  }

  staffGeofenceMapInstance.invalidateSize();
};

window.updateGeofenceRadiusFromSlider = function(val) {
  const radius = parseFloat(val);
  activeZoneGeofence.radiusKm = radius;
  const badge = document.getElementById("currentRadiusBadge");
  if (badge) badge.innerText = `Radius: ${radius} km`;
  window.renderStaffGeofenceCircle();
};

window.saveGeofenceConfiguration = async function() {
  const currentZone = sessionStorage.getItem("staffZoneCode");
  if (!currentZone) return;

  const { error } = await supabase
    .from("destination_zones")
    .update({
      geofence_lat: activeZoneGeofence.latitude,
      geofence_lon: activeZoneGeofence.longitude,
      geofence_radius_km: activeZoneGeofence.radiusKm
    })
    .eq("zone_code", currentZone);

  if (error) {
    alert(`Failed to save geofence: ${error.message}`);
  } else {
    alert(`✓ Safe Tourist Boundary for '${currentZone}' updated successfully! (${activeZoneGeofence.radiusKm} km radius)`);
  }
};

// ==========================================
// 10. PORTAL VIEW CONTROLLER
// ==========================================
window.switchPortal = function(portalId) {
  window.stopLiveCameraStream();
  ['portalGateway', 'userPortal', 'staffPortal', 'superAdminPortal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === portalId) ? 'block' : 'none';
  });
  window.closeModal();
};

window.enterUserMode = function() {
  window.switchPortal('userPortal');
  updateUserStateView();
  checkVolunteerDistressSignals();
  checkVictimAidStatus();
  checkTouristGeofenceBoundary();
};

async function updateUserStateView() {
  const userId = localStorage.getItem("touristSafetyUserId");
  const loggedOutSec = document.getElementById("loggedOutSection");
  const loggedInSec = document.getElementById("loggedInSection");
  const nameEl = document.getElementById("activeUserName");
  const roleEl = document.getElementById("activeUserRole");
  const zoneBadge = document.getElementById("activeUserZoneCodeBadge");

  if (!userId) {
    if (loggedOutSec) loggedOutSec.style.display = "block";
    if (loggedInSec) loggedInSec.style.display = "none";
    return;
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (!profile) {
    localStorage.removeItem("touristSafetyUserId");
    if (loggedOutSec) loggedOutSec.style.display = "block";
    if (loggedInSec) loggedInSec.style.display = "none";
    return;
  }

  if (profile.preferred_language && profile.preferred_language !== currentSelectedLanguage) {
    window.changeAppLanguage(profile.preferred_language);
    return;
  }

  if (loggedOutSec) loggedOutSec.style.display = "none";
  if (loggedInSec) loggedInSec.style.display = "block";

  const userRoles = [profile.is_tourist ? "Tourist" : "", profile.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ");

  if (nameEl) nameEl.innerText = profile.name;
  if (roleEl) roleEl.innerText = userRoles || "User";
  if (zoneBadge) zoneBadge.innerText = profile.zone_code || "UNASSIGNED";

  const idNameEl = document.getElementById("digitalIdName");
  const idRoleEl = document.getElementById("digitalIdRole");
  const idPhoneEl = document.getElementById("idPhone");
  const idBloodEl = document.getElementById("idBlood");
  const idEmergencyEl = document.getElementById("idEmergency");
  const idAddressEl = document.getElementById("idAddress");
  const passportPhoto = document.getElementById("passportSelfiePhoto");

  if (idNameEl) idNameEl.innerText = profile.name;
  if (idRoleEl) idRoleEl.innerText = `${userRoles} • Blood: ${profile.blood_group || 'N/A'}`;
  if (idPhoneEl) idPhoneEl.innerText = profile.phone || 'N/A';
  if (idBloodEl) idBloodEl.innerText = profile.blood_group || 'N/A';
  if (idEmergencyEl) idEmergencyEl.innerText = `${profile.emergency_contact_1 || 'N/A'} (${profile.emergency_phone_1 || 'N/A'})`;
  if (idAddressEl) idAddressEl.innerText = profile.home_address || 'N/A';
  if (passportPhoto) passportPhoto.src = profile.photo_url || DEFAULT_AVATAR;

  const qrString = formatProfileDataForQR(profile);
  renderQRCodeInElement("userPersonalQRCode", qrString, 140);

  const { data: activeSOS } = await supabase.from("sos_events").select("*").eq("user_id", userId).eq("status", "ACTIVE");
  const label = document.getElementById("sosLabel");
  const t = TRANSLATIONS[currentSelectedLanguage] || TRANSLATIONS.en;
  if (activeSOS && activeSOS.length > 0) {
    isEmergencyActive = true;
    if (label) label.innerText = t.cancel_sos;
    triggerVisualAlarm(true);
  } else {
    isEmergencyActive = false;
    if (label) label.innerText = t.send_sos;
    triggerVisualAlarm(false);
  }
}

window.signOutCurrentUser = function() {
  localStorage.removeItem("touristSafetyUserId");
  dismissedVolunteerSOS.clear();
  window.closeCompassView();
  updateUserStateView();
  alert("Signed out successfully.");
};

window.openStaffModal = function() {
  window.closeModal();
  const overlay = document.getElementById("modalOverlay");
  const authModal = document.getElementById("staffPasscodeModal");
  if (overlay) overlay.style.display = "flex";
  if (authModal) authModal.style.display = "block";
};

window.openSuperAdminModal = function() {
  window.closeModal();
  const overlay = document.getElementById("modalOverlay");
  const superModal = document.getElementById("superAdminAuthModal");
  if (overlay) overlay.style.display = "flex";
  if (superModal) superModal.style.display = "block";
};

window.openCreateZoneModal = function() {
  window.closeModal();
  const overlay = document.getElementById("modalOverlay");
  const createModal = document.getElementById("createZoneModal");
  if (overlay) overlay.style.display = "flex";
  if (createModal) createModal.style.display = "block";
};

window.openSignInModal = function() {
  window.closeModal();
  const overlay = document.getElementById("modalOverlay");
  const signInModal = document.getElementById("userSignInModal");
  if (overlay) overlay.style.display = "flex";
  if (signInModal) signInModal.style.display = "block";
};

window.openRegistration = function(role) {
  selectedRole = role;
  window.closeModal();

  const overlay = document.getElementById("modalOverlay");
  const reg = document.getElementById("registrationPage");
  const title = document.getElementById("registrationTitle");
  const extraText = document.getElementById("additionalRoleText");

  if (overlay) overlay.style.display = "flex";
  if (reg) reg.style.display = "block";

  if (role === "tourist") {
    if (title) title.innerText = "Tourist Registration";
    if (extraText) extraText.innerText = "Yes, I also want to register as a volunteer responder.";
  } else {
    if (title) title.innerText = "Volunteer Registration";
    if (extraText) extraText.innerText = "Yes, I also want to register as a protected tourist.";
  }
};

window.closeModal = function() {
  window.stopLiveCameraStream();
  ['modalOverlay', 'registrationPage', 'successPage', 'staffPasscodeModal', 'userSignInModal', 'createZoneModal', 'superAdminAuthModal', 'editProfileModal', 'qrInspectionModal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
};

window.exitStaffPortal = function() {
  sessionStorage.removeItem("staffAuthenticated");
  sessionStorage.removeItem("staffZoneCode");
  window.switchPortal("portalGateway");
};

window.exitSuperAdminPortal = function() {
  sessionStorage.removeItem("superAdminAuthenticated");
  window.switchPortal("portalGateway");
};

// ==========================================
// 11. INDIVIDUAL-OWNED PROFILE EDIT
// ==========================================
window.openEditOwnProfileModal = async function() {
  const userId = localStorage.getItem("touristSafetyUserId");
  if (!userId) {
    alert("Please sign in first to edit your profile.");
    return;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    alert("Could not retrieve your profile record.");
    return;
  }

  window.closeModal();

  document.getElementById("editProfileId").value = profile.id;
  document.getElementById("editZoneCode").value = profile.zone_code || "";
  document.getElementById("editName").value = profile.name || "";
  document.getElementById("editAge").value = profile.age || "";
  document.getElementById("editGender").value = profile.gender || "Male";
  document.getElementById("editBloodGroup").value = profile.blood_group || "O+";
  document.getElementById("editPhone").value = profile.phone || "";
  document.getElementById("editEmergency1").value = profile.emergency_contact_1 || "";
  document.getElementById("editEmergencyPhone1").value = profile.emergency_phone_1 || "";
  document.getElementById("editEmergency2").value = profile.emergency_contact_2 || "";
  document.getElementById("editEmergencyPhone2").value = profile.emergency_phone_2 || "";
  document.getElementById("editHomeAddress").value = profile.home_address || "";
  document.getElementById("editIsTourist").checked = profile.is_tourist === true;
  document.getElementById("editIsVolunteer").checked = profile.is_volunteer === true;
  
  const langSelect = document.getElementById("editPreferredLanguage");
  if (langSelect) langSelect.value = profile.preferred_language || currentSelectedLanguage;

  const editPreview = document.getElementById("editSelfiePreview");
  const editPlaceholder = document.getElementById("editCameraPlaceholder");
  const editHiddenData = document.getElementById("editCapturedSelfieData");

  if (profile.photo_url) {
    if (editPreview) {
      editPreview.src = profile.photo_url;
      editPreview.style.display = "block";
    }
    if (editPlaceholder) editPlaceholder.style.display = "none";
    if (editHiddenData) editHiddenData.value = profile.photo_url;
  } else {
    if (editPreview) editPreview.style.display = "none";
    if (editPlaceholder) editPlaceholder.style.display = "flex";
    if (editHiddenData) editHiddenData.value = "";
  }

  const overlay = document.getElementById("modalOverlay");
  const editModal = document.getElementById("editProfileModal");
  if (overlay) overlay.style.display = "flex";
  if (editModal) editModal.style.display = "block";
};

// ==========================================
// 12. MASTER OVERVIEW MATRIX
// ==========================================
window.loadSuperAdminMatrix = async function() {
  const tableBody = document.getElementById("superAdminTableBody");
  const zonesCardsEl = document.getElementById("saZonesCardsContainer");
  if (!tableBody) return;

  try {
    const [zonesRes, profilesRes, sosRes, locsRes, hqRes] = await Promise.all([
      supabase.from("destination_zones").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("sos_events").select("*").eq("status", "ACTIVE"),
      supabase.from("locations").select("*").order("created_at", { ascending: false }),
      supabase.from("command_center_location").select("*")
    ]);

    const zones = zonesRes.data || [];
    const profiles = profilesRes.data || [];
    const activeSOSEvents = sosRes.data || [];
    const locations = locsRes.data || [];
    const hqUnits = hqRes.data || [];

    const activeSOSUserIds = new Set(activeSOSEvents.map(s => String(s.user_id)));

    const userLocationMap = {};
    locations.forEach(loc => {
      if (!userLocationMap[String(loc.user_id)]) {
        userLocationMap[String(loc.user_id)] = {
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude)
        };
      }
    });

    document.getElementById("saZonesCount").innerText = zones.length;
    document.getElementById("saStaffCount").innerText = hqUnits.length;
    document.getElementById("saTouristsCount").innerText = profiles.filter(p => p.is_tourist).length;
    document.getElementById("saSOSCount").innerText = activeSOSUserIds.size;
    document.getElementById("saZoneListBadge").innerText = `${zones.length} Destination Zones Active`;

    if (zonesCardsEl) {
      if (zones.length === 0) {
        zonesCardsEl.innerHTML = `<em style="opacity: 0.7;">No custom zones created yet.</em>`;
      } else {
        zonesCardsEl.innerHTML = zones.map(z => `
          <div class="zone-summary-card">
            <strong>📍 ${z.zone_code}</strong>
            <small>${z.zone_name}</small>
            <div style="margin-top: 6px; font-size: 11px; font-family: monospace; color: #a7f3d0;">
              Helpline: <b>${z.contact_phone || 'N/A'}</b> • Passcode: <b>${z.passcode}</b> • Radius: <b>${z.geofence_radius_km || 2.5}km</b>
            </div>
          </div>
        `).join("");
      }
    }

    if (profiles.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="11" style="text-align:center; opacity:0.7;">No profiles registered across any destination yet.</td></tr>`;
      return;
    }

    const t = TRANSLATIONS[currentSelectedLanguage] || TRANSLATIONS.en;

    tableBody.innerHTML = profiles.map(p => {
      const isCriticalSOS = activeSOSUserIds.has(String(p.id));
      const loc = userLocationMap[String(p.id)] || { latitude: p.latitude, longitude: p.longitude };
      const coordsDisplay = (loc.latitude && loc.longitude) ? `${Number(loc.latitude).toFixed(4)}, ${Number(loc.longitude).toFixed(4)}` : "Live GPS Active";

      let rowClass = isCriticalSOS ? "row-sos-red" : "row-normal";
      let statusTag = isCriticalSOS ? `<span class="status-tag tag-red">${t.status_sos}</span>` : `<span class="status-tag tag-green">${t.status_normal}</span>`;
      const roleBadge = [p.is_tourist ? "Tourist" : "", p.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ");
      const profileJsonEncoded = encodeURIComponent(JSON.stringify(p));

      return `
        <tr class="${rowClass}">
          <td><strong style="color: #ffd000;">${p.zone_code || 'UNASSIGNED'}</strong></td>
          <td>${statusTag}</td>
          <td><img src="${p.photo_url || DEFAULT_AVATAR}" class="table-avatar-img" alt="Selfie"></td>
          <td>
            <button class="table-action-edit-btn" style="background:#ffd000; color:#000; font-weight:700;" onclick="inspectUserProfileQR('${profileJsonEncoded}')">
              ${t.view_qr}
            </button>
          </td>
          <td><strong>${p.name || 'Anonymous'}</strong></td>
          <td>${roleBadge || 'User'} <small style="color:#38bdf8;">(${(p.preferred_language || 'en').toUpperCase()})</small></td>
          <td><a href="tel:${p.phone}" style="color:#ffd000; text-decoration:none; font-weight:700;">📞 ${p.phone || 'N/A'}</a></td>
          <td>${p.blood_group || 'N/A'}</td>
          <td>${p.emergency_contact_1 || 'N/A'} (<a href="tel:${p.emergency_phone_1}" style="color:#fff; text-decoration:none;">${p.emergency_phone_1 || 'N/A'}</a>)</td>
          <td>${p.home_address || 'N/A'}</td>
          <td class="coord-cell">${coordsDisplay}</td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    console.error("Super Admin Load Error:", err);
  }
};

// ==========================================
// 13. STAFF COMMAND MATRIX
// ==========================================
window.loadStaffMonitoringData = async function() {
  const tableBody = document.getElementById("staffTableBody");
  if (!tableBody) return;

  const currentZone = sessionStorage.getItem("staffZoneCode");
  if (!currentZone) return;

  const zoneHeader = document.getElementById("staffZoneDisplayHeader");
  if (zoneHeader) zoneHeader.innerText = currentZone;

  try {
    const [profilesRes, sosRes, locsRes, missionsRes, cmdHQ] = await Promise.all([
      supabase.from("profiles").select("*").eq("zone_code", currentZone).order("created_at", { ascending: false }),
      supabase.from("sos_events").select("*").eq("zone_code", currentZone).eq("status", "ACTIVE"),
      supabase.from("locations").select("*").order("created_at", { ascending: false }),
      supabase.from("rescue_missions").select("*").eq("zone_code", currentZone).eq("status", "EN_ROUTE"),
      getLiveCommandHQData(currentZone)
    ]);

    const profiles = profilesRes.data || [];
    const activeSOSEvents = sosRes.data || [];
    const locations = locsRes.data || [];
    const rawMissions = missionsRes.data || [];

    const activeSOSUserIds = new Set(activeSOSEvents.map(s => String(s.user_id)));
    const activeMissions = rawMissions.filter(m => activeSOSUserIds.has(String(m.target_user_id)));

    const profileMap = {};
    profiles.forEach(p => { profileMap[String(p.id)] = p; });

    const userLocationMap = {};
    locations.forEach(loc => {
      if (!userLocationMap[String(loc.user_id)]) {
        userLocationMap[String(loc.user_id)] = {
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude)
        };
      }
    });

    const t = TRANSLATIONS[currentSelectedLanguage] || TRANSLATIONS.en;

    document.getElementById("mTotal").innerText = profiles.length;
    document.getElementById("mTourists").innerText = profiles.filter(p => p.is_tourist).length;
    document.getElementById("mVolunteers").innerText = profiles.filter(p => p.is_volunteer).length;
    document.getElementById("mSOS").innerText = activeSOSUserIds.size;

    // 1. Dispatch Queue
    const dispatchQueueEl = document.getElementById("commandDispatchQueue");
    const unhandledDistressSignals = activeSOSEvents.filter(sos => {
      const alreadyHandled = dismissedCommandSOS.has(String(sos.id));
      const alreadyDeployed = activeMissions.some(m => m.responder_type === 'COMMAND_CENTER' && String(m.target_user_id) === String(sos.user_id));
      return !alreadyHandled && !alreadyDeployed;
    });

    if (unhandledDistressSignals.length > 0 && dispatchQueueEl) {
      dispatchQueueEl.style.display = "flex";
      dispatchQueueEl.innerHTML = unhandledDistressSignals.map(sos => {
        const victim = profileMap[String(sos.user_id)] || {};
        const victimName = victim.name || "Person in Distress";
        const victimPhone = victim.phone || "N/A";
        const em1Name = victim.emergency_contact_1 || "Primary Contact";
        const em1Phone = victim.emergency_phone_1 || "";
        const em2Name = victim.emergency_contact_2 || "Secondary Contact";
        const em2Phone = victim.emergency_phone_2 || "";
        const lat = sos.latitude;
        const lon = sos.longitude;

        return `
          <div class="command-action-box">
            <div class="dispatch-header">
              <span class="hud-pulse"></span>
              <strong>CRITICAL ALERT (${currentZone}): ${victimName}</strong>
            </div>
            <p>Emergency alert triggered for ${victimName} (${victimPhone}). Dispatch units and alert emergency contacts below:</p>
            <div class="dispatch-actions" style="display:flex; flex-wrap:wrap; gap:8px;">
              <button class="command-btn btn-yes" onclick="dispatchSpecificFromCommandCenter('${sos.id}', '${sos.user_id}', '${currentZone}')">${t.deploy_hq}</button>
              
              ${em1Phone ? `
                <button class="command-btn" style="background:#25D366; color:#fff;" onclick="notifyVictimEmergencyContact('${em1Name}', '${em1Phone}', '${victimName}', '${currentZone}', ${lat}, ${lon})">
                  📲 Alert ${em1Name}
                </button>
              ` : ''}

              ${em2Phone ? `
                <button class="command-btn" style="background:#128C7E; color:#fff;" onclick="notifyVictimEmergencyContact('${em2Name}', '${em2Phone}', '${victimName}', '${currentZone}', ${lat}, ${lon})">
                  📲 Alert ${em2Name}
                </button>
              ` : ''}

              <a href="tel:${victimPhone}" class="command-btn" style="background:#0284c7; color:#fff; text-decoration:none; display:inline-flex; align-items:center;">${t.call_victim}</a>
              <button class="command-btn btn-no" onclick="dismissSpecificCommandPrompt('${sos.id}')">${t.stand_by}</button>
            </div>
          </div>
        `;
      }).join("");
    } else if (dispatchQueueEl) {
      dispatchQueueEl.style.display = "none";
    }

    // 2. Zone Roster Table
    if (profiles.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; opacity:0.7;">No active profiles registered under ${currentZone} yet.</td></tr>`;
    } else {
      tableBody.innerHTML = profiles.map(p => {
        const isCriticalSOS = activeSOSUserIds.has(String(p.id));
        const loc = userLocationMap[String(p.id)] || { latitude: p.latitude, longitude: p.longitude };
        let isNearbyResponder = false;

        if (p.is_volunteer && !isCriticalSOS && activeSOSEvents.length > 0 && loc.latitude && loc.longitude) {
          activeSOSEvents.forEach(sos => {
            const dist = calculateDistanceKm(loc.latitude, loc.longitude, Number(sos.latitude), Number(sos.longitude));
            if (dist <= 25.0) isNearbyResponder = true;
          });
        }

        let rowClass = "row-normal";
        let statusTag = `<span class="status-tag tag-green">${t.status_normal}</span>`;

        if (isCriticalSOS) {
          rowClass = "row-sos-red";
          statusTag = `<span class="status-tag tag-red">${t.status_sos}</span>`;
        } else if (isNearbyResponder) {
          rowClass = "row-responder-yellow";
          statusTag = `<span class="status-tag tag-yellow">${t.status_responder}</span>`;
        }

        const roleBadge = [p.is_tourist ? "Tourist" : "", p.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ");
        const coordsDisplay = (loc.latitude && loc.longitude) ? `${Number(loc.latitude).toFixed(4)}, ${Number(loc.longitude).toFixed(4)}` : `Live GPS Active`;
        const profileJsonEncoded = encodeURIComponent(JSON.stringify(p));

        return `
          <tr class="${rowClass}">
            <td>${statusTag}</td>
            <td><img src="${p.photo_url || DEFAULT_AVATAR}" class="table-avatar-img" alt="Selfie"></td>
            <td>
              <button class="table-action-edit-btn" style="background:#ffd000; color:#000; font-weight:700;" onclick="inspectUserProfileQR('${profileJsonEncoded}')">
                ${t.view_id}
              </button>
            </td>
            <td><strong>${p.name || 'Anonymous'}</strong></td>
            <td>${roleBadge || 'User'} <small style="color:#38bdf8;">(${(p.preferred_language || 'en').toUpperCase()})</small></td>
            <td><a href="tel:${p.phone}" style="color:#ffd000; text-decoration:none; font-weight:700;">📞 ${p.phone || 'N/A'}</a></td>
            <td>${p.blood_group || 'N/A'}</td>
            <td>
              <div>
                <strong>${p.emergency_contact_1 || 'N/A'}:</strong> 
                <a href="tel:${p.emergency_phone_1}" style="color:#fff; text-decoration:none;">${p.emergency_phone_1 || 'N/A'}</a>
                ${(isCriticalSOS && p.emergency_phone_1) ? `
                  <button style="margin-left:6px; background:#25D366; color:#fff; border:none; padding:3px 8px; border-radius:4px; font-size:10px; cursor:pointer; font-weight:bold;" onclick="notifyVictimEmergencyContact('${p.emergency_contact_1}', '${p.emergency_phone_1}', '${p.name}', '${currentZone}', ${loc.latitude}, ${loc.longitude})">
                    📲 Notify
                  </button>
                ` : ''}
              </div>
            </td>
            <td>${p.home_address || 'N/A'}</td>
            <td class="coord-cell">${coordsDisplay}</td>
          </tr>
        `;
      }).join("");
    }

    // 3. Multi-Case Live Maps
    const respondersPanel = document.getElementById("respondersList");
    const responderBadge = document.getElementById("responderCountBadge");
    const multiRadarGrid = document.getElementById("staffMultiRadarGrid");

    const victimMissionsMap = {};
    activeMissions.forEach(m => {
      const vicId = String(m.target_user_id);
      if (!victimMissionsMap[vicId]) victimMissionsMap[vicId] = [];
      victimMissionsMap[vicId].push(m);
    });

    const activeCaseIds = Object.keys(victimMissionsMap);

    Object.keys(staffMapInstances).forEach(id => {
      if (!activeCaseIds.includes(id)) {
        staffMapInstances[id].remove();
        delete staffMapInstances[id];
        delete staffMarkers[id];
        const oldCard = document.getElementById(`cardWrapper_${id}`);
        if (oldCard) oldCard.remove();
      }
    });

    if (multiRadarGrid) {
      const existingCards = multiRadarGrid.querySelectorAll(".radar-card-unit");
      existingCards.forEach(card => {
        const id = card.id.replace("cardWrapper_", "");
        if (!activeCaseIds.includes(id)) {
          card.remove();
        }
      });
    }

    if (activeCaseIds.length > 0) {
      const commandUnits = activeMissions.filter(m => m.responder_type === 'COMMAND_CENTER');
      const volunteerUnits = activeMissions.filter(m => m.responder_type === 'VOLUNTEER');

      if (responderBadge) responderBadge.innerText = `${commandUnits.length} Command • ${volunteerUnits.length} Volunteer(s) Active`;
      if (multiRadarGrid) multiRadarGrid.style.display = "grid";

      activeCaseIds.forEach((vicId, index) => {
        const mapContainerId = `staffCaseMap_${vicId}`;
        let card = document.getElementById(`cardWrapper_${vicId}`);
        const vic = profileMap[vicId] || { name: 'Person in Distress', phone: 'N/A' };

        if (!card && multiRadarGrid) {
          const cardHTML = `
            <div id="cardWrapper_${vicId}" class="radar-card-unit">
              <div class="radar-target-title">🎯 Case #${index + 1}: ${vic.name}</div>
              <div id="${mapContainerId}" class="whatsapp-live-map-window" style="height:190px;"></div>
              <div id="telemetry_${vicId}" class="radar-telemetry-text" style="line-height: 1.4; font-size: 11px;"></div>
            </div>
          `;
          multiRadarGrid.insertAdjacentHTML('beforeend', cardHTML);
        }

        const missions = victimMissionsMap[vicId];
        const hasCommand = missions.some(m => m.responder_type === 'COMMAND_CENTER');
        const volunteerMissions = missions.filter(m => m.responder_type === 'VOLUNTEER');
        const vicLoc = userLocationMap[vicId] || { latitude: vic.latitude || cmdHQ.latitude, longitude: vic.longitude || cmdHQ.longitude };

        let map = staffMapInstances[vicId];
        if (!map) {
          map = L.map(mapContainerId, { zoomControl: true, scrollWheelZoom: true, dragging: true }).setView([vicLoc.latitude, vicLoc.longitude], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
          staffMapInstances[vicId] = map;
          staffMarkers[vicId] = {};
        }

        const currentMarkers = staffMarkers[vicId];

        // Red Pin: Victim
        if (!currentMarkers.victim) {
          currentMarkers.victim = L.marker([vicLoc.latitude, vicLoc.longitude], {
            icon: createLeafletCustomPin('victim', `Victim: ${vic.name}`)
          }).addTo(map).bindPopup(`🎯 <b>${vic.name}</b> (In Distress)`);
        } else {
          currentMarkers.victim.setLatLng([vicLoc.latitude, vicLoc.longitude]);
        }

        // Blue Pin: Command HQ
        let cmdDistanceText = "";
        let cmdMapsUrl = "#";
        if (hasCommand) {
          const cmdPos = [cmdHQ.latitude, cmdHQ.longitude];

          if (!currentMarkers.command) {
            currentMarkers.command = L.marker(cmdPos, {
              icon: createLeafletCustomPin('command', `${currentZone} Command Unit`)
            }).addTo(map).bindPopup(`🔵 <b>${currentZone} Command Unit</b>`);
          } else {
            currentMarkers.command.setLatLng(cmdPos);
          }

          const distKm = calculateDistanceKm(vicLoc.latitude, vicLoc.longitude, cmdPos[0], cmdPos[1]);
          const cmdRoute = calculateRouteAndETA(distKm);
          cmdDistanceText = `Command Unit: ${formatDistance(distKm)} • ${cmdRoute.etaText}`;
          cmdMapsUrl = getGoogleMapsRouteUrl(cmdPos[0], cmdPos[1], vicLoc.latitude, vicLoc.longitude);
        } else if (currentMarkers.command) {
          map.removeLayer(currentMarkers.command);
          delete currentMarkers.command;
        }

        // Yellow Pin: Volunteer
        let volDistanceText = "";
        let volMapsUrl = "#";
        let volCallBtnHTML = "";
        if (volunteerMissions.length > 0) {
          const firstVol = volunteerMissions[0];
          const volLoc = userLocationMap[String(firstVol.volunteer_id)] || vicLoc;
          const volPos = [volLoc.latitude, volLoc.longitude];
          const volProfile = profileMap[String(firstVol.volunteer_id)] || { name: "Volunteer", phone: "N/A" };

          if (!currentMarkers.volunteer) {
            currentMarkers.volunteer = L.marker(volPos, {
              icon: createLeafletCustomPin('volunteer', `Volunteer: ${volProfile.name}`)
            }).addTo(map).bindPopup(`🟡 <b>${volProfile.name}</b> (Volunteer)`);
          } else {
            currentMarkers.volunteer.setLatLng(volPos);
          }

          const distKm = calculateDistanceKm(vicLoc.latitude, vicLoc.longitude, volLoc.latitude, volLoc.longitude);
          const routeInfo = calculateRouteAndETA(distKm);
          volDistanceText = `Volunteer (${volProfile.name}): ${formatDistance(distKm)} • ${routeInfo.etaText}`;
          volMapsUrl = getGoogleMapsRouteUrl(volLoc.latitude, volLoc.longitude, vicLoc.latitude, vicLoc.longitude);
          volCallBtnHTML = `<a href="tel:${volProfile.phone}" style="color:#000; background:#ffd000; padding:4px 8px; border-radius:6px; text-decoration:none; font-size:10px; font-weight:700;">📞 Call Volunteer</a>`;
        } else if (currentMarkers.volunteer) {
          map.removeLayer(currentMarkers.volunteer);
          delete currentMarkers.volunteer;
        }

        const em1Name = vic.emergency_contact_1 || "Primary Contact";
        const em1Phone = vic.emergency_phone_1 || "";
        const profileJsonEncoded = encodeURIComponent(JSON.stringify(vic));

        const telemEl = document.getElementById(`telemetry_${vicId}`);
        if (telemEl) {
          telemEl.innerHTML = `
            ${cmdDistanceText ? `<div style="color:#00d4ff;">🔵 ${cmdDistanceText}</div>` : ''}
            ${volDistanceText ? `<div style="color:#ffd000;">🟡 ${volDistanceText}</div>` : ''}
            <div style="margin-top:6px; display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
              <button class="table-action-edit-btn" style="background:#ffd000; color:#000; font-weight:700; font-size:10px; padding:4px 8px;" onclick="inspectUserProfileQR('${profileJsonEncoded}')">🔍 Digital ID</button>
              <a href="tel:${vic.phone}" style="color:#fff; background:#ef4444; padding:4px 8px; border-radius:6px; text-decoration:none; font-size:10px; font-weight:700;">📞 Call Victim</a>
              ${hasCommand ? `<a href="${cmdMapsUrl}" target="_blank" style="color:#fff; background:#0284c7; padding:4px 8px; border-radius:6px; text-decoration:none; font-size:10px;">${t.command_route}</a>` : ''}
              ${volCallBtnHTML}
              ${volunteerMissions.length > 0 ? `<a href="${volMapsUrl}" target="_blank" style="color:#000; background:#ffd000; padding:4px 8px; border-radius:6px; text-decoration:none; font-size:10px; font-weight:700;">${t.volunteer_route}</a>` : ''}
              ${em1Phone ? `
                <button style="background:#25D366; color:#fff; border:none; padding:4px 8px; border-radius:6px; font-size:10px; font-weight:700; cursor:pointer;" onclick="notifyVictimEmergencyContact('${em1Name}', '${em1Phone}', '${vic.name}', '${currentZone}', ${vicLoc.latitude}, ${vicLoc.longitude})">
                  📲 Alert Contact (${em1Name})
                </button>
              ` : ''}
            </div>
          `;
        }

        map.invalidateSize();
      });

      if (respondersPanel) {
        respondersPanel.innerHTML = activeMissions.map(m => {
          const vic = profileMap[String(m.target_user_id)] || { name: 'Tourist', phone: 'N/A' };
          if (m.responder_type === 'COMMAND_CENTER') {
            return `
              <div class="responder-item" style="border-color: #00d4ff;">
                <strong style="color: #00d4ff;">🔵 ${currentZone} Command Unit</strong> ➔ <span style="color:#ffffff;">ASSISTING: <strong>${vic.name}</strong> (<a href="tel:${vic.phone}" style="color:#ffd000; text-decoration:none;">📞 ${vic.phone}</a>)</span>
              </div>
            `;
          } else {
            const vol = profileMap[String(m.volunteer_id)] || { name: 'Volunteer Unit', phone: 'N/A' };
            return `
              <div class="responder-item" style="border-color: #ffd000;">
                <strong style="color: #ffd000;">🟡 Volunteer: ${vol.name}</strong> (<a href="tel:${vol.phone}" style="color:#ffd000; text-decoration:none;">📞 ${vol.phone}</a>) ➔ <span style="color:#ffffff;">EN ROUTE TO: <strong>${vic.name}</strong> (<a href="tel:${vic.phone}" style="color:#ffd000; text-decoration:none;">📞 ${vic.phone}</a>)</span>
              </div>
            `;
          }
        }).join("");
      }
    } else {
      if (responderBadge) responderBadge.innerText = `0 Responders En Route`;
      if (multiRadarGrid) multiRadarGrid.style.display = "none";
      if (respondersPanel) respondersPanel.innerHTML = `<em>No active rescue missions underway in this zone. Standing by for alerts.</em>`;
    }

  } catch (err) {
    console.error("Staff Data Load Error:", err);
  }
};

window.dispatchSpecificFromCommandCenter = async function(sosId, targetUserId, zoneCode) {
  dismissedCommandSOS.add(String(sosId));

  const { error } = await supabase.from("rescue_missions").insert({
    sos_id: String(sosId),
    zone_code: zoneCode,
    responder_type: 'COMMAND_CENTER',
    target_user_id: String(targetUserId),
    status: "EN_ROUTE"
  });

  if (error) {
    alert("Dispatch error: " + error.message);
  } else {
    window.loadStaffMonitoringData();
  }
};

window.dismissSpecificCommandPrompt = function(sosId) {
  dismissedCommandSOS.add(String(sosId));
  window.loadStaffMonitoringData();
};

// ==========================================
// 14. VOLUNTEER DISPATCH & ROUTING
// ==========================================
async function checkVolunteerDistressSignals() {
  const userId = localStorage.getItem("touristSafetyUserId");
  if (!userId) return;

  try {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (!profile || profile.is_volunteer !== true || !profile.zone_code) {
      window.closeCompassView();
      return;
    }

    const myZone = profile.zone_code;

    const { data: myActiveSOS } = await supabase
      .from("sos_events")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "ACTIVE");

    if (myActiveSOS && myActiveSOS.length > 0) {
      window.closeCompassView();
      return;
    }

    const { data: sosEvents } = await supabase
      .from("sos_events")
      .select("*")
      .eq("zone_code", myZone)
      .eq("status", "ACTIVE")
      .neq("user_id", userId);

    const hudWidget = document.getElementById("volunteerHudWidget");

    if (!sosEvents || sosEvents.length === 0) {
      window.closeCompassView();
      return;
    }

    const { data: myMissions } = await supabase
      .from("rescue_missions")
      .select("*")
      .eq("volunteer_id", String(userId))
      .eq("status", "EN_ROUTE");

    if (myMissions && myMissions.length > 0) {
      const activeMission = myMissions[0];
      const matchingSOS = sosEvents.find(s => String(s.id) === String(activeMission.sos_id) || String(s.user_id) === String(activeMission.target_user_id));
      
      if (matchingSOS) {
        activeRescueTarget = matchingSOS;
        if (hudWidget) hudWidget.style.display = "block";
        document.getElementById("hudDispatchPrompt").style.display = "none";
        document.getElementById("hudCompassView").style.display = "block";
        
        if (!compassInterval) {
          updateVolunteerLocationConvergence(myZone);
          compassInterval = setInterval(() => updateVolunteerLocationConvergence(myZone), 2000);
        }
        return;
      }
    }

    const availableAlert = sosEvents.find(s => !dismissedVolunteerSOS.has(String(s.id)));
    if (!availableAlert) return;

    activeRescueTarget = availableAlert;
    const { data: victimProfile } = await supabase.from("profiles").select("name, phone").eq("id", activeRescueTarget.user_id).maybeSingle();
    const victimName = victimProfile?.name || "A nearby person";

    const promptText = document.getElementById("hudPromptText");
    if (promptText) promptText.innerText = `[${myZone}] ${victimName} is in distress and needs assistance! Can you respond?`;

    if (hudWidget && hudWidget.style.display !== "block" && !compassInterval) {
      document.getElementById("hudDispatchPrompt").style.display = "block";
      document.getElementById("hudCompassView").style.display = "none";
      hudWidget.style.display = "block";
    }
  } catch (err) {
    console.error("Distress signal check error:", err);
  }
}

window.acceptRescueMission = async function() {
  const userId = localStorage.getItem("touristSafetyUserId");
  if (!userId || !activeRescueTarget) return;

  const { data: profile } = await supabase.from("profiles").select("zone_code").eq("id", userId).maybeSingle();
  const myZone = profile?.zone_code;

  const { error } = await supabase.from("rescue_missions").insert({
    sos_id: String(activeRescueTarget.id),
    zone_code: myZone,
    volunteer_id: String(userId),
    responder_type: 'VOLUNTEER',
    target_user_id: String(activeRescueTarget.user_id),
    status: "EN_ROUTE"
  });

  if (error) console.error("Volunteer dispatch save error:", error);

  document.getElementById("hudDispatchPrompt").style.display = "none";
  document.getElementById("hudCompassView").style.display = "block";

  updateVolunteerLocationConvergence(myZone);
  if (compassInterval) clearInterval(compassInterval);
  compassInterval = setInterval(() => updateVolunteerLocationConvergence(myZone), 2000);
};

window.declineRescueMission = function() {
  if (activeRescueTarget) dismissedVolunteerSOS.add(String(activeRescueTarget.id));
  document.getElementById("volunteerHudWidget").style.display = "none";
};

window.closeCompassView = function() {
  if (compassInterval) {
    clearInterval(compassInterval);
    compassInterval = null;
  }
  const hudWidget = document.getElementById("volunteerHudWidget");
  if (hudWidget) hudWidget.style.display = "none";
};

async function updateVolunteerLocationConvergence(zoneCode) {
  if (!activeRescueTarget) return;

  const { data: checkActive } = await supabase
    .from("sos_events")
    .select("status")
    .eq("id", activeRescueTarget.id)
    .maybeSingle();

  if (!checkActive || checkActive.status !== "ACTIVE") {
    window.closeCompassView();
    return;
  }

  const [targetMissionsRes, cmdHQ, myCoords, victimProfileRes] = await Promise.all([
    supabase.from("rescue_missions").select("responder_type").eq("target_user_id", String(activeRescueTarget.user_id)).eq("status", "EN_ROUTE"),
    getLiveCommandHQData(zoneCode),
    getLiveGpsCoordinates(),
    supabase.from("profiles").select("*").eq("id", activeRescueTarget.user_id).maybeSingle()
  ]);

  const hasCommandAssistance = targetMissionsRes.data && targetMissionsRes.data.some(m => m.responder_type === 'COMMAND_CENTER');
  const victimProfile = victimProfileRes.data || { name: "Victim", phone: "N/A" };

  const targetLat = Number(activeRescueTarget.latitude);
  const targetLon = Number(activeRescueTarget.longitude);

  const distKm = calculateDistanceKm(myCoords.latitude, myCoords.longitude, targetLat, targetLon);
  const bearing = calculateBearing(myCoords.latitude, myCoords.longitude, targetLat, targetLon);
  const routeInfo = calculateRouteAndETA(distKm);
  const googleMapsUrl = getGoogleMapsRouteUrl(myCoords.latitude, myCoords.longitude, targetLat, targetLon);
  const profileJsonEncoded = encodeURIComponent(JSON.stringify(victimProfile));

  const mapContainer = document.getElementById("volunteerLiveMap");
  if (mapContainer) {
    if (!volunteerMapInstance) {
      volunteerMapInstance = L.map('volunteerLiveMap', { zoomControl: true, scrollWheelZoom: true, dragging: true }).setView([targetLat, targetLon], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(volunteerMapInstance);
    }

    if (!volunteerMarkers.victim) {
      volunteerMarkers.victim = L.marker([targetLat, targetLon], {
        icon: createLeafletCustomPin('victim', `Victim: ${victimProfile.name}`)
      }).addTo(volunteerMapInstance).bindPopup(`🎯 <b>${victimProfile.name} (In Distress)</b>`);
    } else {
      volunteerMarkers.victim.setLatLng([targetLat, targetLon]);
    }

    if (!volunteerMarkers.volunteer) {
      volunteerMarkers.volunteer = L.marker([myCoords.latitude, myCoords.longitude], {
        icon: createLeafletCustomPin('volunteer', 'You (Volunteer)')
      }).addTo(volunteerMapInstance).bindPopup("🟡 <b>You (Volunteer)</b>");
    } else {
      volunteerMarkers.volunteer.setLatLng([myCoords.latitude, myCoords.longitude]);
    }

    if (hasCommandAssistance) {
      const cmdPos = [cmdHQ.latitude, cmdHQ.longitude];
      if (!volunteerMarkers.command) {
        volunteerMarkers.command = L.marker(cmdPos, {
          icon: createLeafletCustomPin('command', `${zoneCode} Command Unit`)
        }).addTo(volunteerMapInstance).bindPopup(`🔵 <b>${zoneCode} Command</b>`);
      } else {
        volunteerMarkers.command.setLatLng(cmdPos);
      }
    } else if (volunteerMarkers.command) {
      volunteerMapInstance.removeLayer(volunteerMarkers.command);
      delete volunteerMarkers.command;
    }

    volunteerMapInstance.invalidateSize();
  }

  const actionsContainer = document.getElementById("volunteerActionControls");
  if (actionsContainer) {
    actionsContainer.innerHTML = `
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button class="table-action-edit-btn" style="flex:1; background:#ffd000; color:#000; font-weight:700; font-size:11px;" onclick="inspectUserProfileQR('${profileJsonEncoded}')">🔍 Victim Digital ID</button>
        <a href="tel:${victimProfile.phone}" style="flex:1; text-align:center; background:#ef4444; color:#fff; padding:6px 8px; border-radius:6px; font-weight:700; text-decoration:none; font-size:11px;">📞 Call ${victimProfile.name}</a>
        <a href="${googleMapsUrl}" target="_blank" style="flex:1; text-align:center; background:#22c55e; color:#022c0e; padding:6px 8px; border-radius:6px; font-weight:700; text-decoration:none; font-size:11px;">🗺️ Route</a>
      </div>
      ${cmdHQ.phone !== 'N/A' ? `
        <a href="tel:${cmdHQ.phone}" style="text-align:center; background:#0284c7; color:#fff; padding:5px 8px; border-radius:6px; font-weight:600; text-decoration:none; font-size:11px; display:block;">📞 Call HQ Helpline (${cmdHQ.phone})</a>
      ` : ''}
    `;
  }

  const distEl = document.getElementById("compassDistance");
  const brgEl = document.getElementById("compassBearing");

  if (distEl) distEl.innerText = `${formatDistance(distKm)} • ${routeInfo.etaText}`;
  if (brgEl) brgEl.innerText = `${Math.round(bearing)}°`;
}

// ==========================================
// 15. VICTIM VIEW: RESCUE ROUTE & DIRECT CALLING
// ==========================================
async function checkVictimAidStatus() {
  const userId = localStorage.getItem("touristSafetyUserId");
  const wrapper = document.getElementById("victimRadarWrapper");
  const title = document.getElementById("victimAidTitle");
  const details = document.getElementById("victimAidDetails");
  const contactsContainer = document.getElementById("victimResponderContacts");

  if (!userId || !isEmergencyActive || !wrapper) {
    if (wrapper) wrapper.style.display = "none";
    return;
  }

  const { data: profile } = await supabase.from("profiles").select("zone_code").eq("id", userId).maybeSingle();
  const myZone = profile?.zone_code;

  const [missionsRes, cmdHQ, myCurrentGps] = await Promise.all([
    supabase.from("rescue_missions").select("*").eq("target_user_id", String(userId)).eq("status", "EN_ROUTE"),
    getLiveCommandHQData(myZone),
    getLiveGpsCoordinates()
  ]);

  const missions = missionsRes.data || [];
  const vicLat = myCurrentGps.latitude;
  const vicLon = myCurrentGps.longitude;

  if (missions.length > 0) {
    wrapper.style.display = "flex";

    const hasCommand = missions.some(m => m.responder_type === 'COMMAND_CENTER');
    const volunteerMissions = missions.filter(m => m.responder_type === 'VOLUNTEER');

    let responderContactsHTML = "";

    if (!victimMapInstance) {
      victimMapInstance = L.map('victimLiveMap', { zoomControl: true, scrollWheelZoom: true, dragging: true }).setView([vicLat, vicLon], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(victimMapInstance);
    }

    if (!victimMarkers.victim) {
      victimMarkers.victim = L.marker([vicLat, vicLon], {
        icon: createLeafletCustomPin('victim', 'You (Distress Signal)')
      }).addTo(victimMapInstance).bindPopup("🔴 <b>Your Location (Distress)</b>");
    } else {
      victimMarkers.victim.setLatLng([vicLat, vicLon]);
    }

    if (hasCommand) {
      const cmdPos = [cmdHQ.latitude, cmdHQ.longitude];
      if (!victimMarkers.command) {
        victimMarkers.command = L.marker(cmdPos, {
          icon: createLeafletCustomPin('command', `${myZone} Command Unit`)
        }).addTo(victimMapInstance).bindPopup(`🔵 <b>${myZone} Command Unit</b>`);
      } else {
        victimMarkers.command.setLatLng(cmdPos);
      }

      const distKm = calculateDistanceKm(vicLat, vicLon, cmdPos[0], cmdPos[1]);
      const cmdRoute = calculateRouteAndETA(distKm);
      const cmdMapsUrl = getGoogleMapsRouteUrl(cmdPos[0], cmdPos[1], vicLat, vicLon);

      responderContactsHTML += `
        <div class="victim-contact-pill">
          <div>
            🔵 <strong>${myZone} Command HQ:</strong> Dispatched<br>
            <small style="color: #00d4ff; font-weight: 600;">Distance: ${formatDistance(distKm)} • ETA: ${cmdRoute.etaText}</small>
          </div>
          <div style="display:flex; gap:6px;">
            ${cmdHQ.phone !== 'N/A' ? `<a href="tel:${cmdHQ.phone}" style="background:#0284c7; color:#fff;">📞 Call HQ</a>` : ''}
            <a href="${cmdMapsUrl}" target="_blank" style="background:#22c55e; color:#fff;">🗺️ View Route</a>
          </div>
        </div>
      `;
    } else if (victimMarkers.command) {
      victimMapInstance.removeLayer(victimMarkers.command);
      delete victimMarkers.command;
    }

    if (volunteerMissions.length > 0) {
      const volIds = volunteerMissions.map(m => m.volunteer_id);
      const { data: volProfiles } = await supabase.from("profiles").select("*").in("id", volIds);

      (volProfiles || []).forEach(vp => {
        const vLat = vp.latitude || vicLat;
        const vLon = vp.longitude || vicLon;
        const volPos = [vLat, vLon];
        const profileJsonEncoded = encodeURIComponent(JSON.stringify(vp));

        if (!victimMarkers[vp.id]) {
          victimMarkers[vp.id] = L.marker(volPos, {
            icon: createLeafletCustomPin('volunteer', `Volunteer: ${vp.name}`)
          }).addTo(victimMapInstance).bindPopup(`🟡 <b>${vp.name}</b> (Volunteer)`);
        } else {
          victimMarkers[vp.id].setLatLng(volPos);
        }

        const distKm = calculateDistanceKm(vicLat, vicLon, vLat, vLon);
        const volRoute = calculateRouteAndETA(distKm);
        const googleMapsNavUrl = getGoogleMapsRouteUrl(vLat, vLon, vicLat, vicLon);

        responderContactsHTML += `
          <div class="victim-contact-pill">
            <div>
              🟡 <strong>${vp.name}</strong> (Volunteer En Route)<br>
              <small style="color: #ffd000; font-weight: 600;">Distance: ${formatDistance(distKm)} • ETA: ${volRoute.etaText}</small>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="table-action-edit-btn" style="background:#ffd000; color:#000; font-weight:700; font-size:11px;" onclick="inspectUserProfileQR('${profileJsonEncoded}')">🔍 ID</button>
              <a href="tel:${vp.phone}">📞 Call</a>
              <a href="${googleMapsNavUrl}" target="_blank" style="background:#22c55e; color:#fff;">🗺️ Route</a>
            </div>
          </div>
        `;
      });
    }

    victimMapInstance.invalidateSize();

    if (contactsContainer) contactsContainer.innerHTML = responderContactsHTML;

    if (hasCommand && volunteerMissions.length > 0) {
      title.innerText = `🚨 ${myZone} Aid Dispatched (Command + Volunteer)`;
      details.innerText = "Command response units and volunteer responders are actively converging on your position.";
    } else if (hasCommand) {
      title.innerText = `🚨 ${myZone} Command Unit Dispatched`;
      details.innerText = "Official command response units are navigating to your GPS coordinates.";
    } else {
      title.innerText = "⚡ Volunteer Responder En Route";
      details.innerText = "A registered volunteer responder has accepted your SOS and is on their way.";
    }
  } else {
    wrapper.style.display = "none";
  }
}

// ==========================================
// 16. SOS BROADCAST & STATE TRANSITION
// ==========================================
window.handleSOSToggle = async function() {
  const userId = localStorage.getItem("touristSafetyUserId");

  if (!userId) {
    alert("Please register or sign in before broadcasting an SOS signal.");
    window.openRegistration("tourist");
    return;
  }

  const { data: profile } = await supabase.from("profiles").select("zone_code").eq("id", userId).maybeSingle();
  const myZone = profile?.zone_code;

  isEmergencyActive = !isEmergencyActive;
  const label = document.getElementById("sosLabel");
  const t = TRANSLATIONS[currentSelectedLanguage] || TRANSLATIONS.en;

  if (isEmergencyActive) {
    if (label) label.innerText = t.cancel_sos;
    triggerVisualAlarm(true);
    siren.start();

    await supabase
      .from("rescue_missions")
      .update({ status: "CANCELLED" })
      .eq("volunteer_id", String(userId))
      .eq("status", "EN_ROUTE");

    window.closeCompassView();

    await Promise.all([
      supabase.from("sos_events").update({ status: "RESOLVED" }).eq("user_id", userId),
      supabase.from("rescue_missions").update({ status: "RESOLVED" }).eq("target_user_id", String(userId))
    ]);

    const coords = await getLiveGpsCoordinates();

    await supabase.from("sos_events").insert({
      user_id: userId,
      zone_code: myZone,
      latitude: coords.latitude,
      longitude: coords.longitude,
      status: "ACTIVE"
    });

  } else {
    if (label) label.innerText = t.send_sos;
    triggerVisualAlarm(false);
    siren.stop();

    await Promise.all([
      supabase.from("sos_events").update({ status: "RESOLVED" }).eq("user_id", userId),
      supabase.from("rescue_missions").update({ status: "RESOLVED" }).eq("target_user_id", String(userId))
    ]);

    window.closeCompassView();
    checkVictimAidStatus();
  }
};

function triggerVisualAlarm(activate) {
  if (activate) {
    emergencyInterval = setInterval(() => {
      document.body.classList.toggle("emergency-flash");
    }, 450);
  } else {
    clearInterval(emergencyInterval);
    document.body.classList.remove("emergency-flash");
  }
}

// ==========================================
// 17. INDIVIDUAL USER ZONE EXIT & PURGE
// ==========================================
window.handleSelfOptOut = async function() {
  const userId = localStorage.getItem("touristSafetyUserId");
  if (!userId) {
    alert("No active profile registered on this device.");
    return;
  }

  const confirmed = confirm("Are you sure you want to leave this event zone? This will permanently delete your registration, selfie, and real-time location telemetry.");
  if (!confirmed) return;

  try {
    await Promise.all([
      supabase.from("locations").delete().eq("user_id", userId),
      supabase.from("sos_events").delete().eq("user_id", userId),
      supabase.from("rescue_missions").delete().eq("volunteer_id", String(userId)),
      supabase.from("rescue_missions").delete().eq("target_user_id", String(userId))
    ]);

    await supabase.from("profiles").delete().eq("id", userId);
    localStorage.removeItem("touristSafetyUserId");

    if (isEmergencyActive) {
      window.handleSOSToggle();
    }

    alert("You have left the event zone. Your telemetry and selfie have been completely purged.");
    window.switchPortal("portalGateway");
  } catch (err) {
    alert(`Failed to leave zone: ${err.message}`);
  }
};

// ==========================================
// 18. BACKGROUND ENGINE & FORM LISTENERS
// ==========================================
window.addEventListener("DOMContentLoaded", () => {

  const scenes = [
    {
      image: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=2000&q=85",
      accent: "rgba(52, 211, 153, 0.45)",
      glow: "rgba(16, 185, 129, 0.15)",
      modalBg: "rgba(8, 26, 16, 0.94)",
      cardBg: "rgba(255, 255, 255, 0.14)"
    },
    {
      image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85",
      accent: "rgba(56, 189, 248, 0.55)",
      glow: "rgba(14, 165, 233, 0.18)",
      modalBg: "rgba(10, 24, 40, 0.94)",
      cardBg: "rgba(200, 230, 255, 0.14)"
    },
    {
      image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2000&q=85",
      accent: "rgba(134, 239, 172, 0.55)",
      glow: "rgba(74, 222, 128, 0.16)",
      modalBg: "rgba(14, 34, 20, 0.94)",
      cardBg: "rgba(220, 255, 230, 0.15)"
    }
  ];

  scenes.forEach(s => {
    const img = new Image();
    img.src = s.image;
  });

  const planeA = document.getElementById("bgPlaneA");
  const planeB = document.getElementById("bgPlaneB");
  let currentPlane = planeA;
  let nextPlane = planeB;
  let sceneIndex = 0;

  function applySceneTheme(scene) {
    document.documentElement.style.setProperty('--theme-accent', scene.accent);
    document.documentElement.style.setProperty('--theme-glow', scene.glow);
    document.documentElement.style.setProperty('--theme-modal-bg', scene.modalBg);
    document.documentElement.style.setProperty('--theme-card-bg', scene.cardBg);
  }

  if (planeA) {
    planeA.style.backgroundImage = `url('${scenes[0].image}')`;
    applySceneTheme(scenes[0]);
  }

  setInterval(() => {
    sceneIndex = (sceneIndex + 1) % scenes.length;
    const targetScene = scenes[sceneIndex];

    nextPlane.style.backgroundImage = `url('${targetScene.image}')`;
    applySceneTheme(targetScene);
    
    nextPlane.classList.add("active");
    currentPlane.classList.remove("active");

    const temp = currentPlane;
    currentPlane = nextPlane;
    nextPlane = temp;
  }, 13000);

  // 1. Staff Authentication
  const staffAuthForm = document.getElementById("staffAuthForm");
  if (staffAuthForm) {
    staffAuthForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const enteredZone = document.getElementById("staffZoneInput").value.trim().toUpperCase();
      const enteredCode = document.getElementById("staffPasscodeInput").value.trim();

      const { data: zoneRecord } = await supabase
        .from("destination_zones")
        .select("*")
        .eq("zone_code", enteredZone)
        .maybeSingle();

      if (!zoneRecord) {
        alert(`Destination Zone '${enteredZone}' does not exist. Please create it first.`);
        return;
      }

      if (zoneRecord.passcode === enteredCode) {
        sessionStorage.setItem("staffAuthenticated", "true");
        sessionStorage.setItem("staffZoneCode", enteredZone);

        const currentGps = await getLiveGpsCoordinates();
        await supabase.from("command_center_location").upsert({
          id: `HQ_${enteredZone}`,
          zone_code: enteredZone,
          contact_phone: zoneRecord.contact_phone || "",
          latitude: currentGps.latitude,
          longitude: currentGps.longitude,
          updated_at: new Date().toISOString()
        });

        window.switchPortal("staffPortal");
        window.initStaffGeofenceEditor();
        window.loadStaffMonitoringData();
        setInterval(window.loadStaffMonitoringData, 3000);
      } else {
        alert("Incorrect Zone Passcode. Access Denied.");
      }
    });
  }

  // 2. Master Head Authentication
  const superAdminAuthForm = document.getElementById("superAdminAuthForm");
  if (superAdminAuthForm) {
    superAdminAuthForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const enteredPasscode = document.getElementById("superAdminPasscodeInput").value.trim();

      if (enteredPasscode === SUPERADMIN_PASSCODE) {
        sessionStorage.setItem("superAdminAuthenticated", "true");
        window.switchPortal("superAdminPortal");
        window.loadSuperAdminMatrix();
        setInterval(window.loadSuperAdminMatrix, 4000);
      } else {
        alert("Incorrect Master Passcode. Access Denied.");
      }
    });
  }

  // 3. Create Custom Destination Zone
  const createZoneForm = document.getElementById("createZoneForm");
  if (createZoneForm) {
    createZoneForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const zoneCode = document.getElementById("newZoneCode").value.trim().toUpperCase();
      const zoneName = document.getElementById("newZoneName").value.trim();
      const zonePhone = document.getElementById("newZonePhone").value.trim();
      const passcode = document.getElementById("newZonePasscode").value.trim();

      const currentGps = await getLiveGpsCoordinates();

      const { error } = await supabase.from("destination_zones").insert({
        zone_code: zoneCode,
        zone_name: zoneName,
        contact_phone: zonePhone,
        passcode: passcode,
        geofence_lat: currentGps.latitude,
        geofence_lon: currentGps.longitude,
        geofence_radius_km: 2.5
      });

      if (error) {
        alert(`Failed to create zone: ${error.message}`);
      } else {
        await supabase.from("command_center_location").upsert({
          id: `HQ_${zoneCode}`,
          zone_code: zoneCode,
          contact_phone: zonePhone,
          latitude: currentGps.latitude,
          longitude: currentGps.longitude,
          updated_at: new Date().toISOString()
        });

        alert(`Destination Zone '${zoneCode}' (${zoneName}) created successfully!`);
        window.openStaffModal();
        document.getElementById("staffZoneInput").value = zoneCode;
      }
    });
  }

  // 4. Phone Sign-In
  const userSignInForm = document.getElementById("userSignInForm");
  if (userSignInForm) {
    userSignInForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const phoneInput = document.getElementById("signInPhoneInput").value.trim();

      const { data: matchedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("phone", phoneInput)
        .maybeSingle();

      if (!matchedProfile) {
        alert("No profile found with that phone number. Please register first.");
        return;
      }

      localStorage.setItem("touristSafetyUserId", matchedProfile.id);
      if (matchedProfile.preferred_language) {
        window.changeAppLanguage(matchedProfile.preferred_language);
      }

      alert(`Welcome back, ${matchedProfile.name}! Registered to zone: ${matchedProfile.zone_code || 'UNASSIGNED'}`);
      window.closeModal();
      updateUserStateView();
      checkVolunteerDistressSignals();
      checkVictimAidStatus();
      checkTouristGeofenceBoundary();
    });
  }

  // 5. User Registration (With Real Selfie Check & Language Preference)
  const regForm = document.getElementById("registrationForm");
  if (regForm) {
    regForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const selfiePhoto = document.getElementById("capturedSelfieData")?.value;
      if (!selfiePhoto) {
        alert("Please take a live selfie using '📷 Open Live Camera' or '📱 Tap to Open Camera' before proceeding.");
        return;
      }

      const submitBtn = document.getElementById("regSubmitBtn");
      submitBtn.disabled = true;
      submitBtn.innerText = "Registering...";

      const destinationZone = document.getElementById("regZoneCode").value.trim().toUpperCase();
      const wantsSecondRole = document.getElementById("additionalRole")?.checked || false;
      const isTourist = selectedRole === "tourist" || wantsSecondRole;
      const isVolunteer = selectedRole === "volunteer" || wantsSecondRole;

      const coords = await getLiveGpsCoordinates();

      const payload = {
        zone_code: destinationZone,
        name: document.getElementById("name").value.trim(),
        age: parseInt(document.getElementById("age").value, 10),
        gender: document.getElementById("gender").value,
        blood_group: document.getElementById("bloodGroup").value,
        phone: document.getElementById("phone").value.trim(),
        emergency_contact_1: document.getElementById("emergency1").value.trim(),
        emergency_phone_1: document.getElementById("emergencyPhone1").value.trim(),
        emergency_contact_2: document.getElementById("emergency2")?.value.trim() || null,
        emergency_phone_2: document.getElementById("emergencyPhone2")?.value.trim() || null,
        home_address: document.getElementById("homeAddress").value.trim(),
        preferred_language: currentSelectedLanguage,
        photo_url: selfiePhoto,
        is_tourist: isTourist,
        is_volunteer: isVolunteer,
        latitude: coords.latitude,
        longitude: coords.longitude,
        last_seen: new Date().toISOString()
      };

      try {
        const { data: existingZone } = await supabase
          .from("destination_zones")
          .select("zone_code")
          .eq("zone_code", destinationZone)
          .maybeSingle();

        if (!existingZone) {
          await supabase.from("destination_zones").insert({
            zone_code: destinationZone,
            zone_name: `${destinationZone} Safety Zone`,
            contact_phone: payload.phone,
            passcode: "SAFE2026",
            geofence_lat: coords.latitude,
            geofence_lon: coords.longitude,
            geofence_radius_km: 2.5
          });
        }

        const { data, error } = await supabase
          .from("profiles")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        localStorage.setItem("touristSafetyUserId", data.id);

        await supabase.from("locations").insert({
          user_id: data.id,
          latitude: coords.latitude,
          longitude: coords.longitude
        });

        window.stopLiveCameraStream();
        document.getElementById("registrationPage").style.display = "none";
        document.getElementById("successPage").style.display = "block";

        const roles = [isTourist && "Tourist", isVolunteer && "Volunteer"].filter(Boolean).join(" and ");
        const successMsg = document.getElementById("successMessage");
        if (successMsg) successMsg.innerText = `You have registered as ${roles} under Destination Zone '${destinationZone}'. Your Digital Safety Passport is ready!`;

        regForm.reset();
        updateUserStateView();
        checkTouristGeofenceBoundary();
      } catch (err) {
        alert(`Registration error: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Complete Registration & Issue Digital ID";
      }
    });
  }

  // 6. Profile Edit Form
  const editProfileForm = document.getElementById("editProfileForm");
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById("editSubmitBtn");
      submitBtn.disabled = true;
      submitBtn.innerText = "Updating Profile...";

      const profileId = document.getElementById("editProfileId").value;
      const updatedZone = document.getElementById("editZoneCode").value.trim().toUpperCase();
      const updatedSelfie = document.getElementById("editCapturedSelfieData").value;
      const updatedLang = document.getElementById("editPreferredLanguage")?.value || currentSelectedLanguage;

      const payload = {
        zone_code: updatedZone,
        name: document.getElementById("editName").value.trim(),
        age: parseInt(document.getElementById("editAge").value, 10),
        gender: document.getElementById("editGender").value,
        blood_group: document.getElementById("editBloodGroup").value,
        phone: document.getElementById("editPhone").value.trim(),
        emergency_contact_1: document.getElementById("editEmergency1").value.trim(),
        emergency_phone_1: document.getElementById("editEmergencyPhone1").value.trim(),
        emergency_contact_2: document.getElementById("editEmergency2")?.value.trim() || null,
        emergency_phone_2: document.getElementById("editEmergencyPhone2")?.value.trim() || null,
        home_address: document.getElementById("editHomeAddress").value.trim(),
        preferred_language: updatedLang,
        is_tourist: document.getElementById("editIsTourist").checked,
        is_volunteer: document.getElementById("editIsVolunteer").checked
      };

      if (updatedSelfie) {
        payload.photo_url = updatedSelfie;
      }

      try {
        const { error } = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", profileId);

        if (error) throw error;

        await Promise.all([
          supabase.from("sos_events").update({ zone_code: updatedZone }).eq("user_id", profileId),
          supabase.from("rescue_missions").update({ zone_code: updatedZone }).eq("volunteer_id", profileId),
          supabase.from("rescue_missions").update({ zone_code: updatedZone }).eq("target_user_id", profileId)
        ]);

        window.changeAppLanguage(updatedLang);
        window.stopLiveCameraStream();
        alert("Your profile and Digital Safety ID have been updated successfully!");
        window.closeModal();

        updateUserStateView();
        checkTouristGeofenceBoundary();
      } catch (err) {
        alert(`Update error: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "💾 Update Profile & Digital ID";
      }
    });
  }

  // Initial language setup
  window.changeAppLanguage(currentSelectedLanguage);

  setInterval(checkVolunteerDistressSignals, 2500);
  setInterval(checkVictimAidStatus, 2000);
  setInterval(checkTouristGeofenceBoundary, 10000);
});
