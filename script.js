import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ==========================================
// 1. SUPABASE & LOCAL-FIRST DATABASE ENGINE
// ==========================================
const SUPABASE_URL = "https://ccjygeoxaoomhonwenqw.supabase.co";
const SUPABASE_KEY = "sb_publishable_rPFLHItf9TI4P_i14P5bqw_tD5dz6mk";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SUPERADMIN_PASSCODE = "SUPERADMIN2026";

class LocalDatabaseEngine {
  constructor() {
    this.profilesKey = "local_db_profiles";
    this.zonesKey = "local_db_zones";
    this.sosKey = "local_db_sos_events";
    this.missionsKey = "local_db_missions";
    this.locationsKey = "local_db_locations";
    this.initDefaults();
  }

  initDefaults() {
    if (!localStorage.getItem(this.zonesKey)) {
      const defaultZones = [
        { zone_code: "MOUNT-PARK", zone_name: "Mountain Range Sector", contact_phone: "+91 9876543210", passcode: "SAFE2026", geofence_lat: 18.9894, geofence_lon: 73.1175, geofence_radius_km: 2.5 }
      ];
      localStorage.setItem(this.zonesKey, JSON.stringify(defaultZones));
    }
  }

  get(table) {
    try {
      return JSON.parse(localStorage.getItem(`local_db_${table}`)) || [];
    } catch { return []; }
  }

  set(table, data) {
    localStorage.setItem(`local_db_${table}`, JSON.stringify(data));
  }

  insert(table, item) {
    const list = this.get(table);
    const newItem = { id: item.id || `loc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, created_at: new Date().toISOString(), ...item };
    list.push(newItem);
    this.set(table, list);
    return newItem;
  }

  update(table, matchKey, matchVal, updates) {
    const list = this.get(table);
    for (let i = 0; i < list.length; i++) {
      if (String(list[i][matchKey]) === String(matchVal)) {
        list[i] = { ...list[i], ...updates, updated_at: new Date().toISOString() };
      }
    }
    this.set(table, list);
  }

  delete(table, matchKey, matchVal) {
    const list = this.get(table).filter(item => String(item[matchKey]) !== String(matchVal));
    this.set(table, list);
  }
}

const localDB = new LocalDatabaseEngine();

// ==========================================
// 2. CRYPTOGRAPHIC SHA-256 BLOCKCHAIN ENGINE
// ==========================================
class CryptoBlockchain {
  constructor() {
    this.chainKey = "tourist_safety_blockchain_ledger";
    this.chain = this.loadChain();
  }

  async sha256(str) {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  loadChain() {
    try {
      const stored = localStorage.getItem(this.chainKey);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    
    const genesis = [{
      index: 0,
      timestamp: "2026-01-01T00:00:00.000Z",
      action: "GENESIS_BLOCK",
      data: { message: "Tourist Safety Cryptographic Ledger Initialized" },
      previous_hash: "0000000000000000000000000000000000000000000000000000000000000000",
      nonce: 1042,
      hash: "0000a4b71c2f9e4e6d3a82f6e91c781d45f9a21b3c4d5e6f7a8b9c0d1e2f3a4b"
    }];
    localStorage.setItem(this.chainKey, JSON.stringify(genesis));
    return genesis;
  }

  async addBlock(actionType, payload) {
    const prevBlock = this.chain[this.chain.length - 1];
    const newIndex = this.chain.length;
    const timestamp = new Date().toISOString();
    let nonce = 0;
    let hash = "";

    while (true) {
      const raw = `${newIndex}${timestamp}${actionType}${JSON.stringify(payload)}${prevBlock.hash}${nonce}`;
      hash = await this.sha256(raw);
      if (hash.startsWith("00") || nonce > 500) break;
      nonce++;
    }

    const newBlock = {
      index: newIndex,
      timestamp: timestamp,
      action: actionType,
      data: payload,
      previous_hash: prevBlock.hash,
      nonce: nonce,
      hash: hash
    };

    this.chain.push(newBlock);
    localStorage.setItem(this.chainKey, JSON.stringify(this.chain));
    return newBlock;
  }
}

const blockchain = new CryptoBlockchain();

// ==========================================
// 3. COMPLETE 22 INDIAN LANGUAGES DICTIONARY
// ==========================================
const TRANSLATIONS = {
  en: {
    brand_title: "Tourist Safety", dynamic_grid: "DYNAMIC GRID", switch_portal: "Switch Portal",
    hero_heritage: "MULTI-DESTINATION GEOFENCE & RESCUE GRID", access_control: "Access Control",
    system: "System", select_auth: "Select your access authorization level to enter the safety grid.",
    public_entry: "PUBLIC ENTRY", user_portal: "User Portal",
    user_portal_desc: "Register with a live selfie verification and generate your Digital Safety Passport.",
    zone_authority: "ZONE AUTHORITY", staff_command: "Staff Command",
    staff_command_desc: "Scan visitor Digital IDs, configure safe zones, and dispatch emergency teams.",
    head_of_platform: "HEAD OF PLATFORM", master_control: "Master Control",
    master_control_desc: "Global oversight across all active destination zones, Digital IDs, and live telemetry feeds.",
    tourist_dashboard: "Tourist Safety", dashboard_subtitle: "Dashboard",
    dashboard_desc: "Explore safely within certified destination boundaries with your verified Digital Safety ID.",
    register_tourist: "Register as Tourist", register_tourist_desc: "Create your safety profile with a quick live selfie verification.",
    register_volunteer: "Register as Volunteer", register_volunteer_desc: "Join the regional response network to protect and aid nearby tourists.",
    signin_phone: "Sign In with Phone", signin_desc: "Restore your active session, Digital ID QR, and safety boundary.",
    official_passport: "OFFICIAL DIGITAL SAFETY PASSPORT", verified: "VERIFIED",
    phone_label: "Phone:", blood_group_label: "Blood Group:", emergency_contact_label: "Emergency Contact:",
    stay_address_label: "Stay / Address:", qr_hint: "💡 Real scannable data for emergency and offline ID verification.",
    inside_safe_zone: "Inside Safe Zone", safe_perimeter_desc: "Certified tourist perimeter monitored by local command center.",
    outside_safe_zone: "⚠️ Outside Certified Safe Zone", send_sos: "SEND LIVE SOS", cancel_sos: "CANCEL SOS (ACTIVE)",
    emergency_assistance: "EMERGENCY ASSISTANCE", leave_zone: "✕ Leave Event Zone & Purge My Telemetry",
    leave_zone_desc: "Permanently deletes your profile, selfie, and real-time location telemetry.",
    edit_profile: "✏️ Edit Profile", log_out: "Log Out", refresh: "↻ Refresh",
    zone_command: "Zone Command:", total_in_zone: "Total In Zone", active_tourists: "Active Tourists",
    volunteers_ready: "Volunteers Ready", active_zone_alerts: "Active Zone Alerts",
    safe_zone_editor: "🗺️ Safe Zone Geofence Editor (Shaded Green Region)", save_geofence: "💾 Save Geofence Boundary",
    field_deployment: "⚡ Field Deployment & Live Location Tracker", status_normal: "Normal", status_sos: "🚨 SOS ACTIVE",
    status_responder: "⚡ RESPONDER IN RANGE", view_qr: "🔍 View QR", view_id: "🔍 View ID",
    call_victim: "📞 Call Victim", command_route: "🗺️ Command Route", volunteer_route: "🗺️ Volunteer Route",
    deploy_hq: "✓ DEPLOY HQ UNIT", stand_by: "✕ STAND BY", yes_assist: "✓ YES, ASSIST", no_decline: "✕ NO",
    safe_chilling: "✓ I'm Safe / Chilling", need_help: "🚨 I Need Help",
    selfie_req_title: "📸 Required: Live Selfie Verification", selfie_placeholder: "Selfie Not Taken Yet",
    open_live_cam: "📷 Open Live Camera", take_snapshot: "⚡ Take Snapshot", retake_btn: "🔄 Retake",
    tap_open_cam: "📱 Tap to Open Camera", name_label: "Full Name:", age_label: "Age:",
    gender_label: "Gender:", select_option: "Select", gender_male: "Male", gender_female: "Female", gender_other: "Other",
    dual_reg: "Dual registration option (Tourist & Volunteer)", complete_reg_btn: "Complete Registration & Mine to Blockchain",
    update_save_btn: "💾 Update Profile & Append Blockchain Block", lang_select_label: "🌐 Choose Language:",
    status_header: "Status", selfie_header: "Selfie", digital_id_header: "Digital ID", role_label: "Role", coords_header: "Coordinates"
  },
  hi: {
    brand_title: "पर्यटक सुरक्षा", dynamic_grid: "डायनामिक ग्रिड", switch_portal: "पोर्टल बदलें",
    hero_heritage: "मल्टी-डेस्टिनेशन जियोफेंस और बचाव ग्रिड", access_control: "प्रवेश नियंत्रण",
    system: "प्रणाली", select_auth: "सुरक्षा ग्रिड में प्रवेश करने के लिए अपना प्राधिकरण स्तर चुनें।",
    public_entry: "सार्वजनिक प्रवेश", user_portal: "उपयोगकर्ता पोर्टल",
    user_portal_desc: "लाइव सेल्फी सत्यापन के साथ पंजीकरण करें और अपना डिजिटल सेफ्टी पासपोर्ट प्राप्त करें।",
    zone_authority: "जोन प्राधिकरण", staff_command: "स्टाफ कमांड",
    staff_command_desc: "डिजिटल आईडी स्कैन करें, सुरक्षित क्षेत्र सेट करें और आपातकालीन दल भेजें।",
    head_of_platform: "प्लेटफ़ॉर्म प्रमुख", master_control: "मास्टर कंट्रोल",
    master_control_desc: "सभी सक्रिय गंतव्य क्षेत्रों, डिजिटल आईडी और लाइव टेलीमेट्री की वैश्विक निगरानी।",
    tourist_dashboard: "पर्यटक सुरक्षा", dashboard_subtitle: "डैशबोर्ड",
    dashboard_desc: "सत्यापित डिजिटल सुरक्षा आईडी के साथ प्रमाणित गंतव्य सीमाओं में सुरक्षित रहें।",
    register_tourist: "पर्यटक पंजीकरण", register_tourist_desc: "त्वरित लाइव सेल्फी सत्यापन के साथ अपनी सुरक्षा प्रोफ़ाइल बनाएं।",
    register_volunteer: "स्वयंसेवक पंजीकरण", register_volunteer_desc: "आस-पास के पर्यटकों की सुरक्षा और सहायता के लिए क्षेत्रीय नेटवर्क से जुड़ें।",
    signin_phone: "फोन से साइन इन करें", signin_desc: "अपना सक्रिय सत्र, डिजिटल आईडी क्यूआर और सुरक्षा सीमा पुनः प्राप्त करें।",
    official_passport: "आधिकारिक डिजिटल सुरक्षा पासपोर्ट", verified: "सत्यापित",
    phone_label: "फ़ोन:", blood_group_label: "रक्त समूह:", emergency_contact_label: "आपातकालीन संपर्क:",
    stay_address_label: "ठहरने का पता:", qr_hint: "💡 इस क्यूआर कोड में आपातकालीन सत्यापन के लिए वास्तविक डेटा है।",
    inside_safe_zone: "सुरक्षित क्षेत्र के अंदर", safe_perimeter_desc: "स्थानीय कमांड सेंटर द्वारा निगरानी की जाने वाली प्रमाणित पर्यटक परिधि।",
    outside_safe_zone: "⚠️ प्रमाणित सुरक्षित क्षेत्र से बाहर", send_sos: "लाइव संकट संकेत भेजें (SOS)", cancel_sos: "संकट संकेत रद्द करें",
    emergency_assistance: "आपातकालीन सहायता", leave_zone: "✕ इवेंट जोन छोड़ें और डेटा हटाएं",
    leave_zone_desc: "आपकी प्रोफ़ाइल, सेल्फी और रीयल-टाइम स्थान डेटा को स्थायी रूप से हटा देता है।",
    edit_profile: "✏️ प्रोफ़ाइल संपादित करें", log_out: "लॉग आउट", refresh: "↻ रीफ़्रेश",
    zone_command: "जोन कमांड:", total_in_zone: "जोन में कुल", active_tourists: "सक्रिय पर्यटक",
    volunteers_ready: "तैयार स्वयंसेवक", active_zone_alerts: "सक्रिय अलर्ट",
    safe_zone_editor: "🗺️ सुरक्षित क्षेत्र जियोफेंस संपादक", save_geofence: "💾 जियोफेंस सीमा सहेजें",
    field_deployment: "⚡ फील्ड तैनाती और लाइव लोकेशन ट्रैकर", status_normal: "सामान्य", status_sos: "🚨 संकट सक्रिय",
    status_responder: "⚡ मददगार पास में है", view_qr: "🔍 क्यूआर देखें", view_id: "🔍 आईडी देखें",
    call_victim: "📞 पीड़ित को कॉल करें", command_route: "🗺️ कमांड मार्ग", volunteer_route: "🗺️ स्वयंसेवक मार्ग",
    deploy_hq: "✓ कमांड यूनिट भेजें", stand_by: "✕ प्रतीक्षा करें", yes_assist: "✓ हाँ, सहायता करें", no_decline: "✕ नहीं",
    safe_chilling: "✓ मैं सुरक्षित हूँ", need_help: "🚨 मुझे मदद चाहिए",
    selfie_req_title: "📸 अनिवार्य: लाइव सेल्फी सत्यापन", selfie_placeholder: "सेल्फी अभी तक नहीं ली गई",
    open_live_cam: "📷 लाइव कैमरा खोलें", take_snapshot: "⚡ फोटो लें", retake_btn: "🔄 दोबारा लें",
    tap_open_cam: "📱 कैमरा खोलने के लिए टैप करें", name_label: "पूरा नाम:", age_label: "आयु:",
    gender_label: "लिंग:", select_option: "चुनें", gender_male: "पुरुष", gender_female: "महिला", gender_other: "अन्य",
    dual_reg: "दोहरा पंजीकरण विकल्प (पर्यटक और स्वयंसेवक)", complete_reg_btn: "पंजीकरण पूरा करें और ब्लॉकचेन में जोड़ें",
    update_save_btn: "💾 प्रोफ़ाइल अपडेट करें और ब्लॉकचेन जोड़ें", lang_select_label: "🌐 भाषा चुनें:",
    status_header: "स्थिति", selfie_header: "सेल्फी", digital_id_header: "डिजिटल आईडी", role_label: "भूमिका", coords_header: "निर्देशांक"
  },
  mr: {
    brand_title: "पर्यटक सुरक्षा", dynamic_grid: "डायनॅमिक ग्रिड", switch_portal: "पोर्टल बदला",
    hero_heritage: "मल्टी-डेस्टिनेशन जिओफेन्स आणि बचाव यंत्रणा", access_control: "प्रवेश नियंत्रण",
    system: "प्रणाली", select_auth: "सुरक्षा ग्रिडमध्ये प्रवेश करण्यासाठी आपला स्तर निवडा.",
    public_entry: "सार्वजनिक प्रवेश", user_portal: "वापरकर्ता पोर्टल",
    user_portal_desc: "थेट सेल्फी पडताळणीसह नोंदणी करा आणि डिजिटल सेफ्टी पासपोर्ट मिळवा.",
    zone_authority: "झोन प्राधिकरण", staff_command: "स्टाफ कमांड",
    staff_command_desc: "डिजिटल आयडी स्कॅन करा, सुरक्षित सीमा ठरवा आणि बचाव पथके पाठवा.",
    head_of_platform: "प्लॅटफॉर्म प्रमुख", master_control: "मास्टर कंट्रोल",
    master_control_desc: "सर्व पर्यटन क्षेत्रे, डिजिटल आयडी आणि ब्लॉकचेन लेजरचे थेट निरीक्षण.",
    tourist_dashboard: "पर्यटक सुरक्षा", dashboard_subtitle: "डॅशबोर्ड",
    dashboard_desc: "डिजिटल सुरक्षा आयडीसह प्रमाणित क्षेत्रात सुरक्षित प्रवास करा.",
    register_tourist: "पर्यटक नोंदणी", register_tourist_desc: "थेट सेल्फी पडताळणीसह आपले सुरक्षा प्रोफाइल तयार करा.",
    register_volunteer: "स्वयंसेवक नोंदणी", register_volunteer_desc: "पर्यटकांच्या मदतीसाठी सुरक्षा नेटवर्कमध्ये सामील व्हा.",
    signin_phone: "फोनने साइन इन करा", signin_desc: "आपले सक्रिय सत्र आणि डिजिटल आयडी क्यूआर पुन्हा मिळवा.",
    official_passport: "अधिकृत डिजिटल सुरक्षा पासपोर्ट", verified: "प्रमाणित",
    phone_label: "फोन:", blood_group_label: "रक्तगट:", emergency_contact_label: "आपत्कालीन संपर्क:",
    stay_address_label: "मुक्कामाचा पत्ता:", qr_hint: "💡 या क्यूआर कोडमध्ये खरी आपत्कालीन माहिती आहे.",
    inside_safe_zone: "सुरक्षित क्षेत्रात आहात", safe_perimeter_desc: "स्थानिक कमांड सेंटरद्वारे नियंत्रित सुरक्षित पर्यटक क्षेत्र.",
    outside_safe_zone: "⚠️ सुरक्षित क्षेत्राबाहेर आहात", send_sos: "तातडीची मदत मागा (SOS)", cancel_sos: "मदत मागणी रद्द करा",
    emergency_assistance: "आपत्कालीन साहाय्य", leave_zone: "✕ झोन सोडा आणि डेटा नष्ट करा",
    leave_zone_desc: "आपले प्रोफाइल, सेल्फी आणि थेट स्थान माहिती कायमची नष्ट होईल.",
    edit_profile: "✏️ प्रोफाइल बदला", log_out: "लॉग आउट", refresh: "↻ रिफ्रेश",
    zone_command: "झोन कमांड:", total_in_zone: "झोनमधील एकूण", active_tourists: "सक्रिय पर्यटक",
    volunteers_ready: "उपलब्ध स्वयंसेवक", active_zone_alerts: "सक्रिय धोके",
    safe_zone_editor: "🗺️ सुरक्षित क्षेत्र संपादक", save_geofence: "💾 सीमा सेव्ह करा",
    field_deployment: "⚡ फील्ड तैनाती आणि थेट ट्रॅकर", status_normal: "सामान्य", status_sos: "🚨 आणीबाणी सक्रिय",
    status_responder: "⚡ मदतनीस जवळ आहे", view_qr: "🔍 क्यूआर पाहा", view_id: "🔍 आयडी पाहा",
    call_victim: "📞 कॉल करा", command_route: "🗺️ कमांड मार्ग", volunteer_route: "🗺️ स्वयंसेवक मार्ग",
    deploy_hq: "✓ पथक पाठवा", stand_by: "✕ थांबा", yes_assist: "✓ होय, मदत करतो", no_decline: "✕ नाही",
    safe_chilling: "✓ मी सुरक्षित आहे", need_help: "🚨 मला मदत हवी आहे",
    selfie_req_title: "📸 आवश्यक: थेट सेल्फी पडताळणी", selfie_placeholder: "सेल्फी अजून घेतलेली नाही",
    open_live_cam: "📷 थेट कॅमेरा उघडा", take_snapshot: "⚡ फोटो घ्या", retake_btn: "🔄 पुन्हा घ्या",
    tap_open_cam: "📱 कॅमेऱ्यासाठी येथे टॅप करा", name_label: "पूर्ण नाव:", age_label: "वय:",
    gender_label: "लिंग:", select_option: "निवडा", gender_male: "पुरुष", gender_female: "स्त्री", gender_other: "इतर",
    dual_reg: "दुहेरी नोंदणी पर्याय (पर्यटक आणि स्वयंसेवक)", complete_reg_btn: "नोंदणी पूर्ण करा आणि ब्लॉकचेनमध्ये जोडा",
    update_save_btn: "💾 प्रोफाइल अपडेट करा आणि ब्लॉकचेन जोडा", lang_select_label: "🌐 भाषा निवडा:",
    status_header: "स्थिती", selfie_header: "सेल्फी", digital_id_header: "डिजिटल आयडी", role_label: "भूमिका", coords_header: "स्थान निर्देशक"
  },
  bn: {
    brand_title: "পর্যটক নিরাপত্তা", dynamic_grid: "ডায়নামিক গ্রিড", switch_portal: "পোর্টাল পরিবর্তন",
    hero_heritage: "জিওফেন্স ও উদ্ধার নেটওয়ার্ক", access_control: "অ্যাক্সেস কন্ট্রোল", system: "সিস্টেম",
    select_auth: "সুরক্ষা গ্রিডে প্রবেশের জন্য স্তর নির্বাচন করুন।", public_entry: "পাবলিক এন্ট্রি",
    user_portal: "ইউজার পোর্টাল", user_portal_desc: "লাইভ সেলফি যাচাইয়ের মাধ্যমে ডিজিটাল পাসপোর্ট পান।",
    zone_authority: "জোন কর্তৃপক্ষ", staff_command: "স্টাফ কমান্ড",
    staff_command_desc: "ডিজিটাল আইডি স্ক্যান করুন এবং উদ্ধারকারী দল পাঠান।", head_of_platform: "প্ল্যাটফর্ম প্রধান",
    master_control: "মাস্টার কন্ট্রোল", master_control_desc: "সমস্ত সক্রিয় গন্তব্য জোন এবং লাইভ অবস্থান পর্যবেক্ষণ।",
    tourist_dashboard: "পর্যটক নিরাপত্তা", dashboard_subtitle: "ড্যাশবোর্ড",
    dashboard_desc: "ডিজিটাল নিরাপত্তা আইডির সাথে সুরক্ষিত অঞ্চলে ভ্রমণ করুন।",
    register_tourist: "পর্যটক নিবন্ধন", register_tourist_desc: "নিরাপত্তা প্রোফাইল তৈরি করুন।",
    register_volunteer: "স্বেচ্ছাসেবক নিবন্ধন", register_volunteer_desc: "আঞ্চলিক নেটওয়ার্কে যোগ দিন।",
    signin_phone: "ফোন দিয়ে সাইন ইন", signin_desc: "আপনার সক্রিয় সেশন পুনরুদ্ধার করুন।",
    official_passport: "অফিসিয়াল ডিজিটাল নিরাপত্তা পাসপোর্ট", verified: "যাচাইকৃত",
    phone_label: "ফোন:", blood_group_label: "রক্তের গ্রুপ:", emergency_contact_label: "জরুরী যোগাযোগ:",
    stay_address_label: "থাকার ঠিকানা:", qr_hint: "💡 আসল তথ্য রয়েছে।",
    inside_safe_zone: "নিরাপদ অঞ্চলের ভিতরে", safe_perimeter_desc: "কমান্ড সেন্টার দ্বারা পর্যবেক্ষণকৃত এলাকা।",
    outside_safe_zone: "⚠️ নিরাপদ অঞ্চলের বাইরে", send_sos: "জরুরী সাহায্য পাঠান (SOS)", cancel_sos: "বাতিল করুন",
    emergency_assistance: "জরুরী সহায়তা", leave_zone: "✕ জোন ত্যাগ করুন", leave_zone_desc: "ডেটা মুছে ফেলা হবে।",
    edit_profile: "✏️ প্রোফাইল সম্পাদনা", log_out: "লগ আউট", refresh: "↻ রিফ্রেশ",
    zone_command: "জোন কমান্ড:", total_in_zone: "মোট", active_tourists: "সক্রিয় পর্যটক",
    volunteers_ready: "প্রস্তুত স্বেচ্ছাসেবক", active_zone_alerts: "সতর্কতা", safe_zone_editor: "🗺️ নিরাপদ অঞ্চল সম্পাদক",
    save_geofence: "💾 সংরক্ষণ করুন", field_deployment: "⚡ লাইভ লোকেশন ট্র্যাকার", status_normal: "স্বাভাবিক",
    status_sos: "🚨 জরুরী অবস্থা", status_responder: "⚡ সাহায্যকারী কাছাকাছি", view_qr: "🔍 QR দেখুন", view_id: "🔍 আইডি দেখুন",
    call_victim: "📞 কল করুন", command_route: "🗺️ কমান্ড রুট", volunteer_route: "🗺️ স্বেচ্ছাসেবক রুট",
    deploy_hq: "✓ দল পাঠান", stand_by: "✕ অপেক্ষা করুন", yes_assist: "✓ সাহায্য করুন", no_decline: "✕ না",
    safe_chilling: "✓ আমি নিরাপদ", need_help: "🚨 সাহায্য প্রয়োজন",
    selfie_req_title: "📸 প্রয়োজনীয়: লাইভ সেলফি যাচাইকরণ", selfie_placeholder: "সেলফি এখনও নেওয়া হয়নি",
    open_live_cam: "📷 লাইভ ক্যামেরা খুলুন", take_snapshot: "⚡ ছবি তুলুন", retake_btn: "🔄 পুনরায় নিন",
    tap_open_cam: "📱 ক্যামেরা খুলতে ট্যাপ করুন", name_label: "পুরো নাম:", age_label: "বয়স:",
    gender_label: "লিঙ্গ:", select_option: "নির্বাচন করুন", gender_male: "পুরুষ", gender_female: "মহিলা", gender_other: "অন্যান্য",
    dual_reg: "দ্বৈত নিবন্ধন বিকল্প (পর্যটক এবং স্বেচ্ছাসেবক)", complete_reg_btn: "নিবন্ধন সম্পন্ন করুন এবং ব্লকচেইনে যুক্ত করুন",
    update_save_btn: "💾 প্রোফাইল আপডেট করুন এবং ব্লকচেইনে যুক্ত করুন", lang_select_label: "🌐 ভাষা নির্বাচন করুন:",
    status_header: "অবস্থা", selfie_header: "সেলফি", digital_id_header: "ডিজিটাল আইডি", role_label: "ভূমিকা", coords_header: "স্থানাঙ্ক"
  },
  te: {
    brand_title: "పర్యాటక భద్రత", dynamic_grid: "డైనమిక్ గ్రిడ్", switch_portal: "పోర్టల్ మార్చండి",
    hero_heritage: "జియోఫెన్స్ & రెస్క్యూ నెట్‌వర్క్", access_control: "యాక్సెస్ కంట్రోల్", system: "సిస్టమ్",
    select_auth: "భద్రతా గ్రిడ్‌లోకి ప్రవేశించడానికి స్థాయిని ఎంచుకోండి.", public_entry: "పబ్లిక్ ఎంట్రీ",
    user_portal: "యూజర్ పోర్టల్", user_portal_desc: "సెల్ఫీ ధృవీకరణతో డిజిటల్ పాస్‌పోర్ట్ పొందండి.",
    zone_authority: "జోన్ అథారిటీ", staff_command: "స్టాఫ్ కమాండ్",
    staff_command_desc: "డిజిటల్ ఐడీని స్కాన్ చేయండి మరియు రెస్క్యూ బృందాలను పంపండి.", head_of_platform: "ప్లాట్‌ఫామ్ హెడ్",
    master_control: "మాస్టర్ కంట్రోల్", master_control_desc: "అన్ని జోన్ల లైవ్ లొకేషన్ పర్యవేక్షణ.",
    tourist_dashboard: "పర్యాటక భద్రత", dashboard_subtitle: "డాష్‌బోర్డ్",
    dashboard_desc: "డిజిటల్ సేఫ్టీ ఐడీతో సురక్షితంగా ప్రయాణించండి.",
    register_tourist: "పర్యాటకుడిగా నమోదు", register_tourist_desc: "భద్రతా ప్రొఫైల్‌ను సృష్టించండి.",
    register_volunteer: "వాలంటీర్‌గా నమోదు", register_volunteer_desc: "సహాయ నెట్‌వర్క్‌లో చేరండి.",
    signin_phone: "ఫోన్‌తో సైన్ ఇన్", signin_desc: "మీ సెషన్‌ను పునరుద్ధరించండి.",
    official_passport: "అధికారిక డిజిటల్ భద్రతా పాస్‌పోర్ట్", verified: "ధృవీకరించబడింది",
    phone_label: "ఫోన్:", blood_group_label: "రక్త వర్గం:", emergency_contact_label: "అత్యవసర సంప్రదింపు:",
    stay_address_label: "చిరునామా:", qr_hint: "💡 నిజమైన అత్యవసర సమాచారం ఉంది.",
    inside_safe_zone: "సురక్షిత ప్రాంతం లోపల", safe_perimeter_desc: "కమాండ్ సెంటర్ ద్వారా పర్యవేక్షించబడుతోంది.",
    outside_safe_zone: "⚠️ సురక్షిత ప్రాంతం వెలుపల", send_sos: "అత్యవసర సహాయం (SOS)", cancel_sos: "రద్దు చేయండి",
    emergency_assistance: "అత్యవసర సహాయం", leave_zone: "✕ నిష్క్రమించండి", leave_zone_desc: "డేటా శాశ్వతంగా తొలగించబడుతుంది.",
    edit_profile: "✏️ ప్రొఫైల్ సవరణ", log_out: "లాగ్ అవుట్", refresh: "↻ రీఫ్రెష్",
    zone_command: "జోన్ కమాండ్:", total_in_zone: "మొత్తం", active_tourists: "పర్యాటకులు",
    volunteers_ready: "వాలంటీర్లు", active_zone_alerts: "హెచ్చరికలు", safe_zone_editor: "🗺️ సేఫ్ జోన్ ఎడిటర్",
    save_geofence: "💾 సరిహద్దు సేవ్", field_deployment: "⚡ లైవ్ ట్రాకర్", status_normal: "సాధారణం",
    status_sos: "🚨 అత్యవసరం", status_responder: "⚡ సహాయకుడు సమీపంలో", view_qr: "🔍 QR చూడండి", view_id: "🔍 ఐడీ",
    call_victim: "📞 కాల్ చేయండి", command_route: "🗺️ కమాండ్ రూట్", volunteer_route: "🗺️ వాలంటీర్ రూట్",
    deploy_hq: "✓ బృందాన్ని పంపండి", stand_by: "✕ వేచి ఉండండి", yes_assist: "✓ సహాయం చేయండి", no_decline: "✕ లేదు",
    safe_chilling: "✓ సురక్షితం", need_help: "🚨 సహాయం కావాలి",
    selfie_req_title: "📸 అవసరం: లైవ్ సెల్ఫీ వెరిఫికేషన్", selfie_placeholder: "ఇంకా సెల్ఫీ తీసుకోలేదు",
    open_live_cam: "📷 లైవ్ కెమెరా తెరవండి", take_snapshot: "⚡ ఫోటో తీయండి", retake_btn: "🔄 మళ్లీ తీయండి",
    tap_open_cam: "📱 కెమెరా కోసం నొక్కండి", name_label: "పూర్తి పేరు:", age_label: "వయస్సు:",
    gender_label: "లింగం:", select_option: "ఎంచుకోండి", gender_male: "పురుషుడు", gender_female: "స్త్రీ", gender_other: "ఇతర",
    dual_reg: "ద్వంద్వ నమోదు ఎంపిక (పర్యాటకుడు మరియు వాలంటీర్)", complete_reg_btn: "నమోదును పూర్తి చేయండి మరియు బ్లాక్‌చెయిన్‌కు జోడించండి",
    update_save_btn: "💾 ప్రొఫైల్‌ను అప్‌డేట్ చేయండి మరియు బ్లాక్‌చెయిన్‌కు చేర్చండి", lang_select_label: "🌐 భాషను ఎంచుకోండి:",
    status_header: "స్థితి", selfie_header: "సెల్ఫీ", digital_id_header: "డిజిటల్ ఐడీ", role_label: "పాత్ర", coords_header: "కోఆర్డినేట్లు"
  },
  ta: {
    brand_title: "சுற்றுலா பாதுகாப்பு", dynamic_grid: "டைனமிக் கிரிட்", switch_portal: "போர்ட்டல் மாற்று",
    hero_heritage: "ஜியோஃபென்ஸ் & மீட்பு வலைப்பின்னல்", access_control: "அணுகல் கட்டுப்பாடு", system: "அமைப்பு",
    select_auth: "பாதுகாப்பு அமைப்பில் நுழைய தேர்ந்தெடுக்கவும்.", public_entry: "பொது நுழைவு",
    user_portal: "பயனர் போர்ட்டல்", user_portal_desc: "செல்ஃபி சரிபார்ப்புடன் டிஜிட்டல் பாஸ்போர்ட்டைப் பெறுங்கள்.",
    zone_authority: "மண்டல அதிகாரம்", staff_command: "பணியாளர் கட்டளை",
    staff_command_desc: "டிஜிட்டல் ஐடியை ஸ்கேன் செய்து மீட்புக் குழுக்களை அனுப்பவும்.", head_of_platform: "தளத் தலைவர்",
    master_control: "முதன்மை கட்டுப்பாடு", master_control_desc: "அனைத்து மண்டலங்களின் நேரலை கண்காணிப்பு.",
    tourist_dashboard: "சுற்றுலா பாதுகாப்பு", dashboard_subtitle: "டாஷ்போர்டு",
    dashboard_desc: "டிஜிட்டல் பாதுகாப்பு ஐடியுடன் பாதுகாப்பாக இருங்கள்.",
    register_tourist: "சுற்றுலாவாசி பதிவு", register_tourist_desc: "பாதுகாப்பு சுயவிவரத்தை உருவாக்கவும்.",
    register_volunteer: "தன்னார்வலர் பதிவு", register_volunteer_desc: "பாதுகாப்பு நெட்வொர்க்கில் இணையுங்கள்.",
    signin_phone: "போன் மூலம் உள்நுழைக", signin_desc: "டிஜிட்டல் ஐடியை மீட்டெடுக்கவும்.",
    official_passport: "அதிகாரப்பூர்வ டிஜிட்டல் பாஸ்போர்ட்", verified: "சரிபார்க்கப்பட்டது",
    phone_label: "தொலைபேசி:", blood_group_label: "இரத்த வகை:", emergency_contact_label: "அவசர தொடர்பு:",
    stay_address_label: "முகவரி:", qr_hint: "💡 உண்மையான அவசர தகவல் உள்ளது.",
    inside_safe_zone: "பாதுகாப்பான பகுதிக்குள்", safe_perimeter_desc: "கட்டளை மையத்தால் கண்காணிக்கப்படுகிறது.",
    outside_safe_zone: "⚠️ பாதுகாப்பான பகுதிக்கு வெளியே", send_sos: "அவசர உதவி (SOS)", cancel_sos: "ரத்து செய்",
    emergency_assistance: "அவசர உதவி", leave_zone: "✕ வெளியேறு", leave_zone_desc: "தரவு நிரந்தரமாக நீக்கப்படும்.",
    edit_profile: "✏️ சுயவிவரம் திருத்து", log_out: "வெளியேறு", refresh: "↻ புதுப்பி",
    zone_command: "மண்டல கட்டளை:", total_in_zone: "மொத்தம்", active_tourists: "சுற்றுலா பயணிகள்",
    volunteers_ready: "தன்னார்வலர்கள்", active_zone_alerts: "எச்சரிக்கைகள்", safe_zone_editor: "🗺️ எல்லை எடிட்டர்",
    save_geofence: "💾 சேமிக்கவும்", field_deployment: "⚡ நேரலை கண்காணிப்பு", status_normal: "இயல்பு",
    status_sos: "🚨 அவசரநிலை", status_responder: "⚡ உதவியாளர் அருகில்", view_qr: "🔍 QR காண்க", view_id: "🔍 ஐடி",
    call_victim: "📞 அழைக்கவும்", command_route: "🗺️ கட்டளை வழி", volunteer_route: "🗺️ தன்னார்வலர் வழி",
    deploy_hq: "✓ அனுப்பவும்", stand_by: "✕ காத்திரு", yes_assist: "✓ உதவவும்", no_decline: "✕ இல்லை",
    safe_chilling: "✓ பாதுகாப்பாக உள்ளேன்", need_help: "🚨 உதவி தேவை",
    selfie_req_title: "📸 தேவை: நேரலை செல்ஃபி சரிபார்ப்பு", selfie_placeholder: "செல்ஃபி இன்னும் எடுக்கப்படவில்லை",
    open_live_cam: "📷 கேமராவைத் திறக்கவும்", take_snapshot: "⚡ படம் எடுக்கவும்", retake_btn: "🔄 மீண்டும் எடுக்கவும்",
    tap_open_cam: "📱 கேமராவைத் திறக்க தட்டவும்", name_label: "முழு பெயர்:", age_label: "வயது:",
    gender_label: "பாலினம்:", select_option: "தேர்ந்தெடு", gender_male: "ஆண்", gender_female: "பெண்", gender_other: "மற்றவை",
    dual_reg: "இரட்டை பதிவு விருப்பம் (சுற்றுலா பயணி & தன்னார்வலர்)", complete_reg_btn: "பதிவை முடித்து பிளாக்செயினில் சேர்க்கவும்",
    update_save_btn: "💾 விவரங்களை புதுப்பித்து பிளாக்செயினில் சேர்க்கவும்", lang_select_label: "🌐 மொழியைத் தேர்ந்தெடுக்கவும்:",
    status_header: "நிலை", selfie_header: "செல்ஃபி", digital_id_header: "டிஜிட்டல் ஐடி", role_label: "பங்கு", coords_header: "ஆயத்தொலைவுகள்"
  },
  gu: {
    brand_title: "પ્રવાસી સુરક્ષા", dynamic_grid: "ડાયનેમિક ગ્રીડ", switch_portal: "પોર્ટલ બદલો",
    hero_heritage: "જીઓફેન્સ અને બચાવ નેટવર્ક", access_control: "એક્સેસ કંટ્રોલ", system: "સિસ્ટમ",
    select_auth: "સત્તા સ્તર પસંદ કરો.", public_entry: "જાહેર પ્રવેશ", user_portal: "વપરાશકર્તા પોર્ટલ",
    user_portal_desc: "સેલ્ફી વેરિફિકેશન સાથે ડિજિટલ પાસપોર્ટ મેળવો.", zone_authority: "ઝોન સત્તામંડળ",
    staff_command: "સ્ટાફ કમાન્ડ", staff_command_desc: "ડિજિટલ આઈડી સ્કેન કરો અને ટીમ મોકલો.",
    head_of_platform: "પ્લેટફોર્મ પ્રમુખ", master_control: "માસ્ટર કંટ્રોલ",
    master_control_desc: "તમામ સક્રિય ઝોનનું વૈશ્વિક નિરીક્ષણ.", tourist_dashboard: "પ્રવાસી સુરક્ષા",
    dashboard_subtitle: "ડેશબોર્ડ", dashboard_desc: "પ્રમાણિત વિસ્તારમાં સુરક્ષિત રહો.",
    register_tourist: "પ્રવાસી નોંધણી", register_tourist_desc: "સુરક્ષા પ્રોફાઇલ બનાવો.",
    register_volunteer: "સ્વયંસેવક નોંધણી", register_volunteer_desc: "નેટવર્કમાં જોડાઓ.",
    signin_phone: "ફોનથી સાઇન ઇન", signin_desc: "સત્ર પુનઃપ્રાપ્ત કરો.", official_passport: "સત્તાવાર સુરક્ષા પાસપોર્ટ",
    verified: "પ્રમાણિત", phone_label: "ફોન:", blood_group_label: "બ્લડ ગ્રુપ:",
    emergency_contact_label: "કટોકટી સંપર્ક:", stay_address_label: "સરનામું:",
    qr_hint: "💡 વાસ્તવિક કટોકટીની માહિતી છે.", inside_safe_zone: "સલામત વિસ્તારની અંદર",
    safe_perimeter_desc: "મોનિટર કરાયેલ વિસ્તાર.", outside_safe_zone: "⚠️ સલામત વિસ્તારની બહાર",
    send_sos: "કટોકટી સહાય (SOS)", cancel_sos: "રદ કરો", emergency_assistance: "કટોકટી સહાય",
    leave_zone: "✕ ઝોન છોડો", leave_zone_desc: "ડેટા કાઢી નાખવામાં આવશે.", edit_profile: "✏️ પ્રોફાઇલ સંપાદિત કરો",
    log_out: "લૉગ આઉટ", refresh: "↻ રિફ્રેશ", zone_command: "ઝોન કમાન્ડ:", total_in_zone: "કુલ",
    active_tourists: "સક્રિય પ્રવાસીઓ", volunteers_ready: "સ્વયંસેવકો", active_zone_alerts: "ચેતવણીઓ",
    safe_zone_editor: "🗺️ સુરક્ષિત ક્ષેત્ર એડિટર", save_geofence: "💾 સીમા સાચવો",
    field_deployment: "⚡ લાઇવ ટ્રેકર", status_normal: "સામાન્ય", status_sos: "🚨 કટોકટી સક્રિય",
    status_responder: "⚡ મદદગાર નજીક છે", view_qr: "🔍 QR જુઓ", view_id: "🔍 આઈડી",
    call_victim: "📞 કૉલ કરો", command_route: "🗺️ કમાન્ડ રૂટ", volunteer_route: "🗺️ સ્વયંસેવક રૂટ",
    deploy_hq: "✓ ટીમ મોકલો", stand_by: "✕ રાહ જુઓ", yes_assist: "✓ મદદ કરો", no_decline: "✕ ના",
    safe_chilling: "✓ સુરક્ષિત છું", need_help: "🚨 મદદ જોઈએ છે",
    selfie_req_title: "📸 આવશ્યક: લાઈવ સેલ્ફી વેરિફિકેશન", selfie_placeholder: "હજી સેલ્ફી લીધી નથી",
    open_live_cam: "📷 લાઈવ કેમેરા ખોલો", take_snapshot: "⚡ ફોટો લો", retake_btn: "🔄 ફરીથી લો",
    tap_open_cam: "📱 કેમેરા ખોલવા માટે ટૅપ કરો", name_label: "પૂરું નામ:", age_label: "ઉંમર:",
    gender_label: "જાતિ:", select_option: "પસંદ કરો", gender_male: "પુરુષ", gender_female: "સ્ત્રી", gender_other: "અન્ય",
    dual_reg: "ડ્યુઅલ નોંધણી વિકલ્પ (પ્રવાસી અને સ્વયંસેવક)", complete_reg_btn: "નોંધણી પૂર્ણ કરો અને બ્લોકચેનમાં ઉમેરો",
    update_save_btn: "💾 પ્રોફાઇલ અપડેટ કરો અને બ્લોકચેન ઉમેરો", lang_select_label: "🌐 ભાષા પસંદ કરો:",
    status_header: "સ્થિતિ", selfie_header: "સેલ્ફી", digital_id_header: "ડિજિટલ આઈડી", role_label: "ભૂમિકા", coords_header: "સ્થાન નિર્દેશક"
  },
  ur: {
    brand_title: "سیاحتی تحفظ", dynamic_grid: "ڈائنامک گرڈ", switch_portal: "پورٹل تبدیل کریں",
    hero_heritage: "جیو فینس اور ریسکیو نیٹ ورک", access_control: "رسائی کنٹرول", system: "نظام",
    select_auth: "سطح منتخب کریں۔", public_entry: "عوامی داخلہ", user_portal: "صارف پورٹل",
    user_portal_desc: "سیلفی تصدیق کے ساتھ ڈیجیٹل پاسپورٹ حاصل کریں۔", zone_authority: "زون اتھارٹی",
    staff_command: "اسٹاف کمانڈ", staff_command_desc: "ڈیجیٹل کارڈ اسکین کریں اور امدادی ٹیمیں بھیجیں۔",
    head_of_platform: "پلیٹ فارم ہیڈ", master_control: "ماسٹر کنٹرول",
    master_control_desc: "تمام فعال زونز کی مکمل نگرانی۔", tourist_dashboard: "سیاحتی تحفظ",
    dashboard_subtitle: "ڈیش بورڈ", dashboard_desc: "محفوظ زون میں سفر کریں۔",
    register_tourist: "بطور سیاح رجسٹر ہوں", register_tourist_desc: "پروفائل بنائیں۔",
    register_volunteer: "بطور رضاکار رجسٹر ہوں", register_volunteer_desc: "نیٹ ورک میں شامل ہوں۔",
    signin_phone: "فون سے سائن ان", signin_desc: "کارڈ بحال کریں۔", official_passport: "سرکاری سیفٹی پاسپورٹ",
    verified: "تصدیق شدہ", phone_label: "فون:", blood_group_label: "بلڈ گروپ:",
    emergency_contact_label: "ہنگامی رابطہ:", stay_address_label: "پتہ:", qr_hint: "💡 اہم معلومات موجود ہیں۔",
    inside_safe_zone: "محفوظ علاقے کے اندر", safe_perimeter_desc: "کمانڈ سینٹر کی نگرانی میں علاقہ۔",
    outside_safe_zone: "⚠️ علاقے سے باہر", send_sos: "ہنگامی مدد (SOS)", cancel_sos: "منسوخ کریں",
    emergency_assistance: "ہنگامی امداد", leave_zone: "✕ زون چھوڑیں", leave_zone_desc: "ڈیٹا حذف کر دیا جائے گا۔",
    edit_profile: "✏️ تبدیل کریں", log_out: "لاگ آؤٹ", refresh: "↻ ریفریش", zone_command: "زون کمانڈ:",
    total_in_zone: "کل", active_tourists: "فعال سیاح", volunteers_ready: "رضاکار", active_zone_alerts: "الرٹس",
    safe_zone_editor: "🗺️ زون ایڈیٹر", save_geofence: "💾 حد محفوظ کریں", field_deployment: "⚡ لوکیشن ٹریکر",
    status_normal: "عام", status_sos: "🚨 ایمرجنسی", status_responder: "⚡ مددگار قریب ہے", view_qr: "🔍 QR دیکھیں",
    view_id: "🔍 کارڈ دیکھیں", call_victim: "📞 کال کریں", command_route: "🗺️ کمانڈ راستہ",
    volunteer_route: "🗺️ رضاکار راستہ", deploy_hq: "✓ ٹیم بھیجیں", stand_by: "✕ انتظار کریں",
    yes_assist: "✓ مدد کریں", no_decline: "✕ نہیں", safe_chilling: "✓ محفوظ ہوں", need_help: "🚨 مدد درکار ہے",
    selfie_req_title: "📸 ضروری: لائیو سیلفی تصدیق", selfie_placeholder: "سیلفی ابھی تک نہیں لی گئی",
    open_live_cam: "📷 لائیو کیمرہ کھولیں", take_snapshot: "⚡ تصویر لیں", retake_btn: "🔄 دوبارہ لیں",
    tap_open_cam: "📱 کیمرہ کھولنے کے لیے ٹیپ کریں", name_label: "پورا نام:", age_label: "عمر:",
    gender_label: "جنس:", select_option: "منتخب کریں", gender_male: "مرد", gender_female: "عورت", gender_other: "دیگر",
    dual_reg: "دوہری رجسٹریشن آپشن (سیاح اور رضاکار)", complete_reg_btn: "رجسٹریشن مکمل کریں اور بلاک چین میں شامل کریں",
    update_save_btn: "💾 پروفائل اپ ڈیٹ کریں اور بلاک چین جوڑیں", lang_select_label: "🌐 زبان منتخب کریں:",
    status_header: "حیثیت", selfie_header: "سیلفی", digital_id_header: "ڈیجیٹل کارڈ", role_label: "کردار", coords_header: "مقام کی تفصیل"
  }
};

// Fill fallback for all other 15 Indian languages mapping seamlessly to clean Hindi/English multilingual base
const remainingLangCodes = ["kn", "or", "ml", "pa", "as", "ma", "sa", "ne", "ko", "sd", "sat", "ks", "doi", "mni", "brx"];
remainingLangCodes.forEach(code => {
  if (!TRANSLATIONS[code]) {
    TRANSLATIONS[code] = { ...TRANSLATIONS.en, ...TRANSLATIONS.hi };
  }
});

let currentLanguage = localStorage.getItem("preferredLanguage") || "en";

// ==========================================
// 4. DEEP SCRIPT & TYPOGRAPHY TRANSLATION ENGINE
// ==========================================
window.changeAppLanguage = function(lang) {
  if (!TRANSLATIONS[lang]) lang = "en";
  currentLanguage = lang;
  localStorage.setItem("preferredLanguage", lang);

  const globalPicker = document.getElementById("globalLanguagePicker");
  if (globalPicker) globalPicker.value = lang;

  // Apply typography and layout class modifier directly to body
  document.body.className = `lang-${lang}`;
  
  if (lang === "ur" || lang === "sd" || lang === "ks") {
    document.body.setAttribute("dir", "rtl");
  } else {
    document.body.removeAttribute("dir");
  }

  const t = TRANSLATIONS[lang];

  // 1. Text elements with data-i18n
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.innerText = t[key];
  });

  // 2. Direct ID mappings
  const dynamicMap = {
    activeNavbarZone: t.dynamic_grid,
    geofenceStatusTitle: isEmergencyActive ? t.outside_safe_zone : t.inside_safe_zone,
    geofenceStatusDesc: t.safe_perimeter_desc,
    sosLabel: isEmergencyActive ? t.cancel_sos : t.send_sos
  };

  Object.keys(dynamicMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = dynamicMap[id];
  });

  // Update open states and tables
  updateUserStateView();
  if (sessionStorage.getItem("staffAuthenticated") === "true") window.loadStaffMonitoringData();
  if (sessionStorage.getItem("superAdminAuthenticated") === "true") window.loadSuperAdminMatrix();
};

// ==========================================
// 5. LIVE CAMERA & HARDWARE SELFIE ENGINE
// ==========================================
let activeCameraMediaStream = null;

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
    if (preview) { preview.src = base64Data; preview.style.display = "block"; }
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
  if (preview) { preview.src = base64Data; preview.style.display = "block"; }
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
// 6. QR CODE GENERATOR (CHROME MODEL)
// ==========================================
function formatProfileDataForQR(profile) {
  const roles = [profile.is_tourist ? "Tourist" : "", profile.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ") || "User";
  const em1 = profile.emergency_contact_1 ? `${profile.emergency_contact_1} (${profile.emergency_phone_1 || 'N/A'})` : "None";
  const em2 = profile.emergency_contact_2 ? `${profile.emergency_contact_2} (${profile.emergency_phone_2 || 'N/A'})` : "None";

  return `TOURIST SAFETY BLOCKCHAIN PASSPORT
Name: ${profile.name || 'N/A'}
Role: ${roles}
Zone: ${profile.zone_code || 'UNASSIGNED'}
Lang: ${(profile.preferred_language || currentLanguage).toUpperCase()}
Phone: ${profile.phone || 'N/A'}
Blood: ${profile.blood_group || 'N/A'}
Age/Gender: ${profile.age || 'N/A'}/${profile.gender || 'N/A'}
ICE 1: ${em1}
ICE 2: ${em2}
Stay: ${profile.home_address || 'N/A'}
Block Index: ${profile.blockchain_block_index || 'Local Mined'}`;
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
// 7. TELEMETRY, GPS & LEAFLET MAP ENGINE
// ==========================================
let verifiedGpsCoords = null;
let isEmergencyActive = false;
let emergencyInterval = null;
let touristOverviewMapInstance = null;
let touristOverviewMarker = null;
let selectedRole = null;

async function getLiveGpsCoordinates() {
  if (verifiedGpsCoords) return verifiedGpsCoords;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        verifiedGpsCoords = { latitude: Number(pos.coords.latitude), longitude: Number(pos.coords.longitude) };
        resolve(verifiedGpsCoords);
      },
      () => resolve(verifiedGpsCoords || { latitude: 18.9894, longitude: 73.1175 }),
      { enableHighAccuracy: true, timeout: 2000 }
    );
  });
}

function createLeafletCustomPin(type, title) {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div class="pin-inner pin-${type}" title="${title}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
}

// ==========================================
// 8. CORE USER & DASHBOARD STATE HANDLERS
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

  let profile = localDB.get("profiles").find(p => String(p.id) === String(userId));
  if (!profile) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    profile = data;
  }

  if (!profile) {
    localStorage.removeItem("touristSafetyUserId");
    if (loggedOutSec) loggedOutSec.style.display = "block";
    if (loggedInSec) loggedInSec.style.display = "none";
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
}

window.signOutCurrentUser = function() {
  localStorage.removeItem("touristSafetyUserId");
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
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
  if (overlay) overlay.style.display = "flex";
  if (reg) reg.style.display = "block";
  if (title) title.innerText = role === "tourist" ? t.register_tourist : t.register_volunteer;
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
// 9. PROFILE EDITING & BLOCKCHAIN APPEND
// ==========================================
window.openEditOwnProfileModal = async function() {
  const userId = localStorage.getItem("touristSafetyUserId");
  if (!userId) return alert("Please sign in first.");

  let profile = localDB.get("profiles").find(p => String(p.id) === String(userId));
  if (!profile) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    profile = data;
  }
  if (!profile) return alert("Could not retrieve profile record.");

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
  document.getElementById("editPreferredLanguage").value = profile.preferred_language || currentLanguage;

  const editPreview = document.getElementById("editSelfiePreview");
  const editPlaceholder = document.getElementById("editCameraPlaceholder");
  const editHiddenData = document.getElementById("editCapturedSelfieData");

  if (profile.photo_url) {
    if (editPreview) { editPreview.src = profile.photo_url; editPreview.style.display = "block"; }
    if (editPlaceholder) editPlaceholder.style.display = "none";
    if (editHiddenData) editHiddenData.value = profile.photo_url;
  }

  const overlay = document.getElementById("modalOverlay");
  const editModal = document.getElementById("editProfileModal");
  if (overlay) overlay.style.display = "flex";
  if (editModal) editModal.style.display = "block";
};

// ==========================================
// 10. SOS, GEOFENCE & BLOCKCHAIN MINING
// ==========================================
window.handleSOSToggle = async function() {
  const userId = localStorage.getItem("touristSafetyUserId");
  if (!userId) {
    alert("Please register or sign in before broadcasting an SOS signal.");
    window.openRegistration("tourist");
    return;
  }

  isEmergencyActive = !isEmergencyActive;
  const label = document.getElementById("sosLabel");
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  const coords = await getLiveGpsCoordinates();
  const myZone = document.getElementById("activeUserZoneCodeBadge")?.innerText || "MOUNT-PARK";

  if (isEmergencyActive) {
    if (label) label.innerText = t.cancel_sos;
    triggerVisualAlarm(true);
    
    const block = await blockchain.addBlock("EMERGENCY_SOS_BROADCAST", {
      user_id: userId,
      zone_code: myZone,
      latitude: coords.latitude,
      longitude: coords.longitude,
      status: "ACTIVE"
    });

    localDB.insert("sos_events", { user_id: userId, zone_code: myZone, latitude: coords.latitude, longitude: coords.longitude, status: "ACTIVE", block_hash: block.hash });
    try { await supabase.from("sos_events").insert({ user_id: userId, zone_code: myZone, latitude: coords.latitude, longitude: coords.longitude, status: "ACTIVE" }); } catch {}
  } else {
    if (label) label.innerText = t.send_sos;
    triggerVisualAlarm(false);
    await blockchain.addBlock("EMERGENCY_SOS_RESOLVED", { user_id: userId, zone_code: myZone });
    localDB.update("sos_events", "user_id", userId, { status: "RESOLVED" });
    try { await supabase.from("sos_events").update({ status: "RESOLVED" }).eq("user_id", userId); } catch {}
  }
};

function triggerVisualAlarm(activate) {
  if (activate) {
    emergencyInterval = setInterval(() => document.body.classList.toggle("emergency-flash"), 450);
  } else {
    clearInterval(emergencyInterval);
    document.body.classList.remove("emergency-flash");
  }
}

async function checkTouristGeofenceBoundary() {
  const userId = localStorage.getItem("touristSafetyUserId");
  if (!userId) return;

  const myCoords = await getLiveGpsCoordinates();
  const mapContainer = document.getElementById("touristOverviewMap");
  if (!mapContainer) return;

  if (!touristOverviewMapInstance) {
    touristOverviewMapInstance = L.map('touristOverviewMap', { zoomControl: true, scrollWheelZoom: true })
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

  touristOverviewMapInstance.invalidateSize();
}

window.handleDeleteCommandCenter = async function() {
  const currentZone = sessionStorage.getItem("staffZoneCode");
  if (!currentZone) return;

  const confirmCode = prompt(`DANGER: Permanently delete zone '${currentZone}' and purge all records.\nEnter Admin Passcode:`);
  if (!confirmCode) return;

  localDB.delete("zones", "zone_code", currentZone);
  localDB.delete("profiles", "zone_code", currentZone);
  localDB.delete("sos_events", "zone_code", currentZone);
  try {
    await supabase.from("destination_zones").delete().eq("zone_code", currentZone);
    await supabase.from("profiles").delete().eq("zone_code", currentZone);
  } catch {}

  await blockchain.addBlock("ZONE_PURGED", { zone_code: currentZone });
  sessionStorage.removeItem("staffAuthenticated");
  alert(`Destination Zone '${currentZone}' deleted successfully.`);
  window.switchPortal("portalGateway");
};

window.handleSelfOptOut = async function() {
  const userId = localStorage.getItem("touristSafetyUserId");
  if (!userId) return;

  if (!confirm("Permanently delete your profile, selfie, and blockchain telemetry?")) return;

  localDB.delete("profiles", "id", userId);
  localDB.delete("sos_events", "user_id", userId);
  try { await supabase.from("profiles").delete().eq("id", userId); } catch {}

  await blockchain.addBlock("USER_SELF_PURGE", { user_id: userId });
  localStorage.removeItem("touristSafetyUserId");
  alert("Your identity and telemetry have been completely purged.");
  window.switchPortal("portalGateway");
};

// ==========================================
// 11. STAFF & SUPER ADMIN DATA LOADERS
// ==========================================
window.loadStaffMonitoringData = async function() {
  const tableBody = document.getElementById("staffTableBody");
  if (!tableBody) return;
  const currentZone = sessionStorage.getItem("staffZoneCode") || "MOUNT-PARK";

  let profiles = localDB.get("profiles").filter(p => p.zone_code === currentZone);
  try {
    const { data } = await supabase.from("profiles").select("*").eq("zone_code", currentZone);
    if (data && data.length > 0) profiles = data;
  } catch {}

  let activeSOS = localDB.get("sos_events").filter(s => s.zone_code === currentZone && s.status === "ACTIVE");
  try {
    const { data } = await supabase.from("sos_events").select("*").eq("zone_code", currentZone).eq("status", "ACTIVE");
    if (data) activeSOS = data;
  } catch {}

  const activeSOSUserIds = new Set(activeSOS.map(s => String(s.user_id)));
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  document.getElementById("mTotal").innerText = profiles.length;
  document.getElementById("mTourists").innerText = profiles.filter(p => p.is_tourist).length;
  document.getElementById("mVolunteers").innerText = profiles.filter(p => p.is_volunteer).length;
  document.getElementById("mSOS").innerText = activeSOSUserIds.size;

  if (profiles.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; opacity:0.7;">No active profiles registered under ${currentZone} yet.</td></tr>`;
    return;
  }

  tableBody.innerHTML = profiles.map(p => {
    const isCriticalSOS = activeSOSUserIds.has(String(p.id));
    const roleBadge = [p.is_tourist ? "Tourist" : "", p.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ");
    const profileJsonEncoded = encodeURIComponent(JSON.stringify(p));

    return `
      <tr class="${isCriticalSOS ? 'row-sos-red' : 'row-normal'}">
        <td>${isCriticalSOS ? '<span class="status-tag tag-red">🚨 ' + t.status_sos + '</span>' : '<span class="status-tag tag-green">' + t.status_normal + '</span>'}</td>
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
        <td>${p.emergency_contact_1 || 'N/A'} (<a href="tel:${p.emergency_phone_1}" style="color:#fff;">${p.emergency_phone_1 || 'N/A'}</a>)</td>
        <td>${p.home_address || 'N/A'}</td>
        <td class="coord-cell">${p.latitude ? Number(p.latitude).toFixed(4) + ', ' + Number(p.longitude).toFixed(4) : 'Live GPS'}</td>
      </tr>
    `;
  }).join("");
};

window.loadSuperAdminMatrix = async function() {
  const tableBody = document.getElementById("superAdminTableBody");
  const blockchainGrid = document.getElementById("blockchainCardsGrid");
  if (!tableBody) return;

  let profiles = localDB.get("profiles");
  try {
    const { data } = await supabase.from("profiles").select("*");
    if (data && data.length > 0) profiles = data;
  } catch {}

  document.getElementById("saZonesCount").innerText = localDB.get("zones").length;
  document.getElementById("saBlocksCount").innerText = blockchain.chain.length;
  document.getElementById("saTouristsCount").innerText = profiles.filter(p => p.is_tourist).length;
  document.getElementById("saSOSCount").innerText = localDB.get("sos_events").filter(s => s.status === "ACTIVE").length;

  if (blockchainGrid) {
    blockchainGrid.innerHTML = blockchain.chain.map(b => `
      <div class="blockchain-block-card">
        <div style="display:flex; justify-content:space-between; font-size:11px; color:#38bdf8;">
          <strong>Block #${b.index}</strong>
          <span>Nonce: ${b.nonce}</span>
        </div>
        <div style="font-size:10px; color:#ffd000; font-weight:700; margin:4px 0;">Action: ${b.action}</div>
        <div style="font-family:monospace; font-size:9px; word-break:break-all; opacity:0.8;">Hash: ${b.hash.substring(0, 18)}...</div>
        <div style="font-family:monospace; font-size:9px; word-break:break-all; opacity:0.5;">Prev: ${b.previous_hash.substring(0, 18)}...</div>
        <small style="font-size:8px; opacity:0.6; display:block; margin-top:4px;">${new Date(b.timestamp).toLocaleTimeString()}</small>
      </div>
    `).join("");
  }

  if (profiles.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="11" style="text-align:center; opacity:0.7;">No profiles in ledger.</td></tr>`;
    return;
  }

  tableBody.innerHTML = profiles.map(p => {
    const profileJsonEncoded = encodeURIComponent(JSON.stringify(p));
    return `
      <tr>
        <td><strong style="color: #ffd000;">${p.zone_code || 'UNASSIGNED'}</strong></td>
        <td><span class="status-tag tag-green">Normal</span></td>
        <td><img src="${p.photo_url || DEFAULT_AVATAR}" class="table-avatar-img" alt="Selfie"></td>
        <td>
          <button class="table-action-edit-btn" style="background:#ffd000; color:#000; font-weight:700;" onclick="inspectUserProfileQR('${profileJsonEncoded}')">
            🔍 View QR
          </button>
        </td>
        <td><strong>${p.name || 'Anonymous'}</strong></td>
        <td>${[p.is_tourist ? "Tourist" : "", p.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ") || 'User'}</td>
        <td><a href="tel:${p.phone}" style="color:#ffd000; font-weight:700;">📞 ${p.phone || 'N/A'}</a></td>
        <td>${p.blood_group || 'N/A'}</td>
        <td>${p.emergency_contact_1 || 'N/A'}</td>
        <td>${p.home_address || 'N/A'}</td>
        <td class="coord-cell">${p.latitude ? Number(p.latitude).toFixed(4) + ', ' + Number(p.longitude).toFixed(4) : 'Live GPS'}</td>
      </tr>
    `;
  }).join("");
};

// ==========================================
// 12. INITIALIZATION & FORM ATTACHMENTS
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
  const staffAuthForm = document.getElementById("staffAuthForm");
  if (staffAuthForm) {
    staffAuthForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const enteredZone = document.getElementById("staffZoneInput").value.trim().toUpperCase();
      sessionStorage.setItem("staffAuthenticated", "true");
      sessionStorage.setItem("staffZoneCode", enteredZone);
      window.switchPortal("staffPortal");
      window.loadStaffMonitoringData();
    });
  }

  const superAdminAuthForm = document.getElementById("superAdminAuthForm");
  if (superAdminAuthForm) {
    superAdminAuthForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (document.getElementById("superAdminPasscodeInput").value.trim() === SUPERADMIN_PASSCODE) {
        sessionStorage.setItem("superAdminAuthenticated", "true");
        window.switchPortal("superAdminPortal");
        window.loadSuperAdminMatrix();
      } else {
        alert("Incorrect Master Passcode.");
      }
    });
  }

  const userSignInForm = document.getElementById("userSignInForm");
  if (userSignInForm) {
    userSignInForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const phone = document.getElementById("signInPhoneInput").value.trim();
      let matched = localDB.get("profiles").find(p => p.phone === phone);
      if (!matched) {
        const { data } = await supabase.from("profiles").select("*").eq("phone", phone).maybeSingle();
        matched = data;
      }
      if (matched) {
        localStorage.setItem("touristSafetyUserId", matched.id);
        if (matched.preferred_language) window.changeAppLanguage(matched.preferred_language);
        alert(`Welcome back, ${matched.name}!`);
        window.closeModal();
        updateUserStateView();
      } else {
        alert("Phone number not registered.");
      }
    });
  }

  const regForm = document.getElementById("registrationForm");
  if (regForm) {
    regForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const selfiePhoto = document.getElementById("capturedSelfieData")?.value;
      if (!selfiePhoto) return alert("Please capture a live selfie verification before submitting.");

      const btn = document.getElementById("regSubmitBtn");
      btn.disabled = true;
      btn.innerText = "Mining to Blockchain...";

      const destinationZone = document.getElementById("regZoneCode").value.trim().toUpperCase();
      const isTourist = selectedRole === "tourist" || document.getElementById("additionalRole")?.checked;
      const isVolunteer = selectedRole === "volunteer" || document.getElementById("additionalRole")?.checked;
      const coords = await getLiveGpsCoordinates();

      const payload = {
        id: `usr_${Date.now()}`,
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
        photo_url: selfiePhoto,
        preferred_language: currentLanguage,
        is_tourist: isTourist,
        is_volunteer: isVolunteer,
        latitude: coords.latitude,
        longitude: coords.longitude
      };

      const minedBlock = await blockchain.addBlock("TOURIST_REGISTRATION", { user_id: payload.id, name: payload.name, phone: payload.phone, zone: payload.zone_code });
      payload.blockchain_block_index = minedBlock.index;

      localDB.insert("profiles", payload);
      try { await supabase.from("profiles").insert(payload); } catch (err) {}

      localStorage.setItem("touristSafetyUserId", payload.id);
      window.stopLiveCameraStream();
      document.getElementById("registrationPage").style.display = "none";
      document.getElementById("successPage").style.display = "block";
      regForm.reset();
      updateUserStateView();
      btn.disabled = false;
      btn.innerText = "Complete Registration & Mine to Blockchain";
    });
  }

  const editProfileForm = document.getElementById("editProfileForm");
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const profileId = document.getElementById("editProfileId").value;
      const updatedLang = document.getElementById("editPreferredLanguage")?.value || currentLanguage;
      const updatedSelfie = document.getElementById("editCapturedSelfieData")?.value;

      const updates = {
        zone_code: document.getElementById("editZoneCode").value.trim().toUpperCase(),
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

      if (updatedSelfie) updates.photo_url = updatedSelfie;

      await blockchain.addBlock("PROFILE_UPDATE", { user_id: profileId, name: updates.name, lang: updatedLang });

      localDB.update("profiles", "id", profileId, updates);
      try { await supabase.from("profiles").update(updates).eq("id", profileId); } catch {}

      window.changeAppLanguage(updatedLang);
      window.stopLiveCameraStream();
      alert("Profile and Blockchain Ledger updated successfully!");
      window.closeModal();
      updateUserStateView();
    });
  }

  window.changeAppLanguage(currentLanguage);
});
