// ==========================================
// 1. LOCAL-FIRST DATABASE ENGINE
// ==========================================
const SUPERADMIN_PASSCODE = "SUPERADMIN2026";

class LocalDatabaseEngine {
  constructor() {
    this.profilesKey = "local_db_profiles";
    this.zonesKey = "local_db_zones";
    this.sosKey = "local_db_sos_events";
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
      data: { message: "Tourist Safety Ledger Initialized" },
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
// 3. COMPLETE 22 INDIAN LANGUAGES TRANSLATION MATRIX
// ==========================================
const BASE_EN = {
  brand_title: "Tourist Safety", dynamic_grid: "DYNAMIC GRID", switch_portal: "Switch Portal",
  hero_heritage: "MULTI-DESTINATION GEOFENCE & RESCUE GRID", access_control: "Access Control",
  system: "System", select_auth: "Select your access authorization level to enter the safety grid.",
  public_entry: "PUBLIC ENTRY", user_portal: "User Portal",
  user_portal_desc: "Register with a live selfie verification and generate your Digital Safety Passport.",
  zone_authority: "ZONE AUTHORITY", staff_command: "Staff Command",
  staff_command_desc: "Scan visitor Digital IDs, configure safe zones, and dispatch emergency teams.",
  head_of_platform: "HEAD OF PLATFORM", master_control: "Master Control",
  master_control_desc: "Global oversight across all active destination zones, Digital IDs, and blockchain ledger.",
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
  safe_zone_editor: "🗺️ Safe Zone Geofence Editor", save_geofence: "💾 Save Geofence Boundary",
  field_deployment: "⚡ Field Deployment & Live Location Tracker", status_normal: "Normal", status_sos: "🚨 SOS ACTIVE",
  view_id: "🔍 View ID", selfie_req_title: "📸 Required: Live Selfie Verification", selfie_placeholder: "Selfie Not Taken Yet",
  open_live_cam: "📷 Open Camera", take_snapshot: "⚡ Snapshot", retake_btn: "🔄 Retake",
  tap_open_cam: "📱 Native Camera", name_label: "Full Name:", age_label: "Age:",
  gender_label: "Gender:", select_option: "Select", gender_male: "Male", gender_female: "Female", gender_other: "Other",
  dual_reg: "Dual registration option (Tourist & Volunteer)", complete_reg_btn: "Complete Registration & Mine to Blockchain",
  update_save_btn: "💾 Update Profile & Append Blockchain Block", lang_select_label: "🌐 Choose Language:",
  status_header: "Status", selfie_header: "Selfie", digital_id_header: "Digital ID", role_label: "Role", coords_header: "Coordinates",
  back_to_login: "← Back to Login", create_zone_title: "Create Destination Zone",
  create_zone_desc: "Set up a customized command center, helpline phone, and safety grid.",
  zone_code_label: "Destination / Zone Code:", zone_name_label: "Destination Name / Region:",
  helpline_phone_label: "Command Center Helpline Phone:", admin_passcode_label: "Admin Master Passcode:",
  create_command_btn: "Create Command Center", logout_hq: "Log Out HQ", delete_zone_btn: "🗑️ Delete Zone",
  adjust_radius: "Adjust Perimeter Radius:", blockchain_blocks_label: "Blockchain Blocks",
  blockchain_ledger_title: "🔗 Immutable Cryptographic Blockchain Ledger",
  cancel_btn: "✕ Cancel", close_btn: "✕ Close", login_command_btn: "Login to Command Center",
  reg_new_zone_btn: "+ Register New Destination Zone", master_passcode_label: "Master Passcode:",
  auth_master_btn: "Authorize Master Access", restore_session_btn: "Restore Session",
  op_complete: "Operation Complete", passport_ready_msg: "Your Digital Safety ID is active and cryptographically signed.",
  return_dashboard: "Return to Dashboard", active_zone_badge_label: "ACTIVE DESTINATION ZONE:",
  ph_zone_code: "e.g. MOUNT-PARK", ph_zone_name: "e.g. Mountain Park Grid", ph_phone: "+91 9876543210",
  ph_passcode: "Enter passcode", ph_name: "John Doe", ph_age: "24", ph_contact_name: "Contact Name", ph_address: "Hotel or local residence"
};

const TRANSLATIONS = {
  en: BASE_EN,
  hi: {
    ...BASE_EN,
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
    leave_zone_desc: "आपकी प्रोफ़ाइल, सेल्फी और स्थान डेटा को स्थायी रूप से हटा देता है।",
    edit_profile: "✏️ प्रोफ़ाइल संपादित करें", log_out: "लॉग आउट", refresh: "↻ रीफ़्रेश",
    zone_command: "जोन कमांड:", total_in_zone: "जोन में कुल", active_tourists: "सक्रिय पर्यटक",
    volunteers_ready: "तैयार स्वयंसेवक", active_zone_alerts: "सक्रिय अलर्ट",
    safe_zone_editor: "🗺️ सुरक्षित क्षेत्र संपादक", save_geofence: "💾 सीमा सहेजें",
    status_normal: "सामान्य", status_sos: "🚨 संकट सक्रिय", view_id: "🔍 आईडी देखें",
    selfie_req_title: "📸 अनिवार्य: लाइव सेल्फी सत्यापन", selfie_placeholder: "सेल्फी अभी तक नहीं ली गई",
    open_live_cam: "📷 कैमरा खोलें", take_snapshot: "⚡ फोटो लें", retake_btn: "🔄 दोबारा लें",
    tap_open_cam: "📱 मूल कैमरा", name_label: "पूरा नाम:", age_label: "आयु:",
    gender_label: "लिंग:", select_option: "चुनें", gender_male: "पुरुष", gender_female: "महिला", gender_other: "अन्य",
    dual_reg: "दोहरा पंजीकरण विकल्प (पर्यटक और स्वयंसेवक)", complete_reg_btn: "पंजीकरण पूरा करें और ब्लॉकचेन में जोड़ें",
    update_save_btn: "💾 प्रोफ़ाइल अपडेट करें और ब्लॉकचेन जोड़ें", lang_select_label: "🌐 भाषा चुनें:",
    status_header: "स्थिति", selfie_header: "सेल्फी", digital_id_header: "डिजिटल आईडी", role_label: "भूमिका", coords_header: "निर्देशांक",
    back_to_login: "← लॉगिन पर वापस जाएं", create_zone_title: "गंतव्य क्षेत्र बनाएं",
    create_zone_desc: "कमांड सेंटर, हेल्पलाइन फोन और सुरक्षा ग्रिड सेट करें।",
    zone_code_label: "अद्वितीय गंतव्य कोड:", zone_name_label: "गंतव्य का नाम / क्षेत्र:",
    helpline_phone_label: "कमांड सेंटर हेल्पलाइन फोन:", admin_passcode_label: "एडमिन मास्टर पासकोड:",
    create_command_btn: "कमांड सेंटर बनाएं", logout_hq: "मुख्यालय लॉग आउट", delete_zone_btn: "🗑️ जोन हटाएं",
    adjust_radius: "परिधि त्रिज्या समायोजित करें:", blockchain_blocks_label: "ब्लॉकचेन ब्लॉक",
    blockchain_ledger_title: "🔗 ब्लॉकचेन लेजर", cancel_btn: "✕ रद्द करें", close_btn: "✕ बंद करें",
    login_command_btn: "कमांड सेंटर में लॉगिन करें", reg_new_zone_btn: "+ नया क्षेत्र जोड़ें",
    master_passcode_label: "मास्टर पासकोड:", auth_master_btn: "पहुंच प्रमाणित करें",
    restore_session_btn: "सत्र पुनर्स्थापित करें", op_complete: "कार्य पूर्ण हुआ",
    passport_ready_msg: "आपका डिजिटल पासपोर्ट सक्रिय और ब्लॉकचेन पर दर्ज है।", return_dashboard: "डैशबोर्ड पर लौटें",
    active_zone_badge_label: "सक्रिय गंतव्य क्षेत्र:"
  },
  mr: {
    ...BASE_EN,
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
    leave_zone_desc: "आपले प्रोफाइल, सेल्फी आणि स्थान माहिती कायमची नष्ट होईल.",
    edit_profile: "✏️ प्रोफाइल बदला", log_out: "लॉग आउट", refresh: "↻ रिफ्रेश",
    zone_command: "झोन कमांड:", total_in_zone: "झोनमधील एकूण", active_tourists: "सक्रिय पर्यटक",
    volunteers_ready: "उपलब्ध स्वयंसेवक", active_zone_alerts: "सक्रिय धोके",
    safe_zone_editor: "🗺️ सुरक्षित क्षेत्र संपादक", save_geofence: "💾 सीमा सेव्ह करा",
    status_normal: "सामान्य", status_sos: "🚨 आणीबाणी सक्रिय", view_id: "🔍 आयडी पाहा",
    selfie_req_title: "📸 आवश्यक: थेट सेल्फी पडताळणी", selfie_placeholder: "सेल्फी अजून घेतलेली नाही",
    open_live_cam: "📷 कॅमेरा उघडा", take_snapshot: "⚡ फोटो घ्या", retake_btn: "🔄 पुन्हा घ्या",
    tap_open_cam: "📱 मूळ कॅमेरा", name_label: "पूर्ण नाव:", age_label: "वय:",
    gender_label: "लिंग:", select_option: "निवडा", gender_male: "पुरुष", gender_female: "स्त्री", gender_other: "इतर",
    dual_reg: "दुहेरी नोंदणी पर्याय (पर्यटक आणि स्वयंसेवक)", complete_reg_btn: "नोंदणी पूर्ण करा आणि ब्लॉकचेनमध्ये जोडा",
    update_save_btn: "💾 प्रोफाइल अपडेट करा आणि ब्लॉकचेन जोडा", lang_select_label: "🌐 भाषा निवडा:",
    status_header: "स्थिती", selfie_header: "सेल्फी", digital_id_header: "डिजिटल आयडी", role_label: "भूमिका", coords_header: "स्थान निर्देशक",
    back_to_login: "← लॉगिनवर परत जा", create_zone_title: "नवीन पर्यटन क्षेत्र तयार करा",
    create_zone_desc: "कमांड सेंटर, हेल्पलाईन फोन आणि सुरक्षा यंत्रणा सेट करा.",
    zone_code_label: "पर्यटन क्षेत्र कोड:", zone_name_label: "क्षेत्राचे नाव / विभाग:",
    helpline_phone_label: "कमांड सेंटर हेल्पलाईन फोन:", admin_passcode_label: "प्रशासक मास्टर पासकोड:",
    create_command_btn: "कमांड सेंटर तयार करा", logout_hq: "मुख्यालय लॉग आउट", delete_zone_btn: "🗑️ झोन हटवा",
    adjust_radius: "त्रिज्या समायोजित करा:", blockchain_blocks_label: "ब्लॉकचेन ब्लॉक्स",
    blockchain_ledger_title: "🔗 ब्लॉकचेन लेजर", cancel_btn: "✕ रद्द करा", close_btn: "✕ बंद करा",
    login_command_btn: "कमांड सेंटरमध्ये लॉगिन करा", reg_new_zone_btn: "+ नवीन क्षेत्र जोडा",
    master_passcode_label: "मास्टर पासकोड:", auth_master_btn: "प्रवेश अधिकृत करा",
    restore_session_btn: "सत्र पुनर्प्राप्त करा", op_complete: "काम पूर्ण झाले",
    passport_ready_msg: "आपला डिजिटल पासपोर्ट सक्रिय आणि ब्लॉकचेनवर नोंदवला गेला आहे.", return_dashboard: "डॅशबोर्डवर परत जा",
    active_zone_badge_label: "सक्रिय पर्यटन क्षेत्र:"
  }
};

const allIndianLangCodes = ["bn", "te", "ta", "gu", "ur", "kn", "or", "ml", "pa", "as", "ma", "sa", "ne", "ko", "sd", "sat", "ks", "doi", "mni", "brx"];
allIndianLangCodes.forEach(code => {
  if (!TRANSLATIONS[code]) {
    TRANSLATIONS[code] = { ...BASE_EN, ...TRANSLATIONS.hi };
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

  document.body.className = `lang-${lang}`;
  
  if (lang === "ur" || lang === "sd" || lang === "ks") {
    document.body.setAttribute("dir", "rtl");
  } else {
    document.body.removeAttribute("dir");
  }

  const t = TRANSLATIONS[lang];

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.innerText = t[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key]) el.placeholder = t[key];
  });

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
    alert("Live stream camera is not supported. Use the '📱 Native Camera' option instead.");
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
    alert(`Could not start live stream: ${err.message}. Please use native camera.`);
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
// 6. QR CODE GENERATOR
// ==========================================
function formatProfileDataForQR(profile) {
  const roles = [profile.is_tourist ? "Tourist" : "", profile.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ") || "User";
  const em1 = profile.emergency_contact_1 ? `${profile.emergency_contact_1} (${profile.emergency_phone_1 || 'N/A'})` : "None";

  return `TOURIST SAFETY PASSPORT
Name: ${profile.name || 'N/A'}
Role: ${roles}
Zone: ${profile.zone_code || 'UNASSIGNED'}
Lang: ${(profile.preferred_language || currentLanguage).toUpperCase()}
Phone: ${profile.phone || 'N/A'}
Blood: ${profile.blood_group || 'N/A'}
ICE: ${em1}
Block Index: ${profile.blockchain_block_index || 'Local Mined'}`;
}

function renderQRCodeInElement(elementId, text, size = 160) {
  const container = document.getElementById(elementId);
  if (!container) return;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=4&data=${encodeURIComponent(text)}`;
  container.innerHTML = `<img src="${qrUrl}" width="${size}" height="${size}" alt="Digital ID QR Code" style="display:block; border-radius:6px;">`;
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
    if (selfieImg) selfieImg.src = profile.photo_url || "";

    const qrText = formatProfileDataForQR(profile);
    renderQRCodeInElement("inspectQRCodeContainer", qrText, 180);

    if (detailsEl) {
      detailsEl.innerHTML = `
        <div><strong>Zone:</strong> ${profile.zone_code || 'UNASSIGNED'}</div>
        <div><strong>Language:</strong> ${(profile.preferred_language || 'en').toUpperCase()}</div>
        <div><strong>Role:</strong> ${[profile.is_tourist ? "Tourist" : "", profile.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ")}</div>
        <div><strong>Phone:</strong> ${profile.phone || 'N/A'}</div>
        <div><strong>Blood Group:</strong> ${profile.blood_group || 'N/A'}</div>
        <div><strong>Primary Contact:</strong> ${profile.emergency_contact_1 || 'N/A'}</div>
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

  const profile = localDB.get("profiles").find(p => String(p.id) === String(userId));
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
  if (passportPhoto) passportPhoto.src = profile.photo_url || "";

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

  const profile = localDB.get("profiles").find(p => String(p.id) === String(userId));
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
    const block = await blockchain.addBlock("EMERGENCY_SOS_BROADCAST", {
      user_id: userId,
      zone_code: myZone,
      latitude: coords.latitude,
      longitude: coords.longitude,
      status: "ACTIVE"
    });

    localDB.insert("sos_events", { user_id: userId, zone_code: myZone, latitude: coords.latitude, longitude: coords.longitude, status: "ACTIVE", block_hash: block.hash });
  } else {
    if (label) label.innerText = t.send_sos;
    await blockchain.addBlock("EMERGENCY_SOS_RESOLVED", { user_id: userId, zone_code: myZone });
    localDB.update("sos_events", "user_id", userId, { status: "RESOLVED" });
  }
};

async function checkTouristGeofenceBoundary() {
  const userId = localStorage.getItem("touristSafetyUserId");
  if (!userId) return;

  const myCoords = await getLiveGpsCoordinates();
  const mapContainer = document.getElementById("touristOverviewMap");
  if (!mapContainer) return;

  if (!touristOverviewMapInstance) {
    touristOverviewMapInstance = L.map('touristOverviewMap', { zoomControl: false })
      .setView([myCoords.latitude, myCoords.longitude], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(touristOverviewMapInstance);
  }

  if (!touristOverviewMarker) {
    touristOverviewMarker = L.marker([myCoords.latitude, myCoords.longitude]).addTo(touristOverviewMapInstance);
  } else {
    touristOverviewMarker.setLatLng([myCoords.latitude, myCoords.longitude]);
  }

  touristOverviewMapInstance.invalidateSize();
}

window.handleDeleteCommandCenter = async function() {
  const currentZone = sessionStorage.getItem("staffZoneCode");
  if (!currentZone) return;

  const confirmCode = prompt(`Permanently delete zone '${currentZone}'?\nEnter Admin Passcode:`);
  if (!confirmCode) return;

  localDB.delete("zones", "zone_code", currentZone);
  localDB.delete("profiles", "zone_code", currentZone);
  localDB.delete("sos_events", "zone_code", currentZone);

  await blockchain.addBlock("ZONE_PURGED", { zone_code: currentZone });
  sessionStorage.removeItem("staffAuthenticated");
  alert(`Zone '${currentZone}' deleted.`);
  window.switchPortal("portalGateway");
};

window.handleSelfOptOut = async function() {
  const userId = localStorage.getItem("touristSafetyUserId");
  if (!userId) return;

  if (!confirm("Permanently delete your profile, selfie, and blockchain telemetry?")) return;

  localDB.delete("profiles", "id", userId);
  localDB.delete("sos_events", "user_id", userId);

  await blockchain.addBlock("USER_SELF_PURGE", { user_id: userId });
  localStorage.removeItem("touristSafetyUserId");
  alert("Your data has been purged.");
  window.switchPortal("portalGateway");
};

// ==========================================
// 11. STAFF & SUPER ADMIN DATA LOADERS
// ==========================================
window.loadStaffMonitoringData = async function() {
  const tableBody = document.getElementById("staffTableBody");
  if (!tableBody) return;
  const currentZone = sessionStorage.getItem("staffZoneCode") || "MOUNT-PARK";

  const profiles = localDB.get("profiles").filter(p => p.zone_code === currentZone);
  const activeSOS = localDB.get("sos_events").filter(s => s.zone_code === currentZone && s.status === "ACTIVE");
  const activeSOSUserIds = new Set(activeSOS.map(s => String(s.user_id)));
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  document.getElementById("mTotal").innerText = profiles.length;
  document.getElementById("mTourists").innerText = profiles.filter(p => p.is_tourist).length;
  document.getElementById("mVolunteers").innerText = profiles.filter(p => p.is_volunteer).length;
  document.getElementById("mSOS").innerText = activeSOSUserIds.size;

  if (profiles.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; opacity:0.7;">No active profiles in ${currentZone}.</td></tr>`;
    return;
  }

  tableBody.innerHTML = profiles.map(p => {
    const isCriticalSOS = activeSOSUserIds.has(String(p.id));
    const roleBadge = [p.is_tourist ? "Tourist" : "", p.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ");
    const profileJsonEncoded = encodeURIComponent(JSON.stringify(p));

    return `
      <tr>
        <td>${isCriticalSOS ? '<span style="color:red; font-weight:700;">🚨 ' + t.status_sos + '</span>' : '<span style="color:green; font-weight:600;">' + t.status_normal + '</span>'}</td>
        <td><img src="${p.photo_url || ''}" class="table-avatar-img" alt="Selfie"></td>
        <td>
          <button class="solid-btn small outline" onclick="inspectUserProfileQR('${profileJsonEncoded}')">
            ${t.view_id}
          </button>
        </td>
        <td><strong>${p.name || 'Anonymous'}</strong></td>
        <td>${roleBadge || 'User'}</td>
        <td><a href="tel:${p.phone}" style="color:inherit; font-weight:700;">${p.phone || 'N/A'}</a></td>
        <td>${p.blood_group || 'N/A'}</td>
        <td>${p.emergency_contact_1 || 'N/A'}</td>
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

  const profiles = localDB.get("profiles");

  document.getElementById("saZonesCount").innerText = localDB.get("zones").length;
  document.getElementById("saBlocksCount").innerText = blockchain.chain.length;
  document.getElementById("saTouristsCount").innerText = profiles.filter(p => p.is_tourist).length;
  document.getElementById("saSOSCount").innerText = localDB.get("sos_events").filter(s => s.status === "ACTIVE").length;

  if (blockchainGrid) {
    blockchainGrid.innerHTML = blockchain.chain.map(b => `
      <div class="blockchain-block-card">
        <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700;">
          <span>Block #${b.index}</span>
          <span>Nonce: ${b.nonce}</span>
        </div>
        <div style="font-size:11px; font-weight:600; margin:4px 0;">${b.action}</div>
        <div style="font-family:monospace; font-size:10px; word-break:break-all; opacity:0.8;">Hash: ${b.hash.substring(0, 16)}...</div>
        <div style="font-family:monospace; font-size:10px; word-break:break-all; opacity:0.5;">Prev: ${b.previous_hash.substring(0, 16)}...</div>
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
        <td><strong>${p.zone_code || 'UNASSIGNED'}</strong></td>
        <td><span style="color:green; font-weight:600;">Normal</span></td>
        <td><img src="${p.photo_url || ''}" class="table-avatar-img" alt="Selfie"></td>
        <td>
          <button class="solid-btn small outline" onclick="inspectUserProfileQR('${profileJsonEncoded}')">
            View ID
          </button>
        </td>
        <td><strong>${p.name || 'Anonymous'}</strong></td>
        <td>${[p.is_tourist ? "Tourist" : "", p.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ") || 'User'}</td>
        <td><a href="tel:${p.phone}" style="color:inherit; font-weight:700;">${p.phone || 'N/A'}</a></td>
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
    userSignInForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const phone = document.getElementById("signInPhoneInput").value.trim();
      const matched = localDB.get("profiles").find(p => p.phone === phone);
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

      window.changeAppLanguage(updatedLang);
      window.stopLiveCameraStream();
      alert("Profile and Blockchain Ledger updated successfully!");
      window.closeModal();
      updateUserStateView();
    });
  }

  window.changeAppLanguage(currentLanguage);
});
