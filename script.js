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
  status_header: "Status", selfie_header: "Selfie", digital_id_header: "Digital ID", role_label: "Role", coords_header: "Coordinates",
  back_to_login: "← Back to Login", create_zone_title: "Create Destination Zone",
  create_zone_desc: "Set up a customized command center, helpline phone, and safety grid.",
  zone_code_label: "Destination / Zone Code:", zone_name_label: "Destination Name / Region:",
  helpline_phone_label: "Command Center Helpline Phone:", admin_passcode_label: "Admin Master Passcode:",
  create_command_btn: "Create Command Center", logout_hq: "Log Out HQ", delete_zone_btn: "🗑️ Delete Zone",
  adjust_radius: "Adjust Perimeter Radius:", no_active_rescues: "No active rescue missions underway in this zone. Standing by for alerts.",
  blockchain_blocks_label: "Blockchain Blocks", blockchain_ledger_title: "🔗 Immutable Cryptographic Blockchain Ledger",
  cancel_btn: "✕ Cancel", close_btn: "✕ Close", login_command_btn: "Login to Command Center",
  reg_new_zone_btn: "+ Register New Destination Zone", master_passcode_label: "Master Passcode (Default: SUPERADMIN2026):",
  auth_master_btn: "Authorize Master Access", restore_session_btn: "Restore Session",
  op_complete: "Operation Complete", passport_ready_msg: "Your Digital Safety ID is active and cryptographically signed.",
  return_dashboard: "Return to Dashboard", active_zone_badge_label: "ACTIVE DESTINATION ZONE:",
  assistance_en_route: "Assistance En Route", assistance_dispatched_desc: "Help has been dispatched to your location.",
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
    status_header: "स्थिति", selfie_header: "सेल्फी", digital_id_header: "डिजिटल आईडी", role_label: "भूमिका", coords_header: "निर्देशांक",
    back_to_login: "← लॉगिन पर वापस जाएं", create_zone_title: "गंतव्य क्षेत्र बनाएं",
    create_zone_desc: "कमांड सेंटर, हेल्पलाइन फोन और सुरक्षा ग्रिड सेट करें।",
    zone_code_label: "अद्वितीय गंतव्य कोड:", zone_name_label: "गंतव्य का नाम / क्षेत्र:",
    helpline_phone_label: "कमांड सेंटर हेल्पलाइन फोन:", admin_passcode_label: "एडमिन मास्टर पासकोड:",
    create_command_btn: "कमांड सेंटर बनाएं", logout_hq: "लॉग आउट मुख्यालय", delete_zone_btn: "🗑️ जोन हटाएं",
    adjust_radius: "परिधि त्रिज्या समायोजित करें:", no_active_rescues: "इस क्षेत्र में कोई बचाव अभियान सक्रिय नहीं है।",
    blockchain_blocks_label: "ब्लॉकचेन ब्लॉक", blockchain_ledger_title: "🔗 अपरिवर्तनीय ब्लॉकचेन लेजर",
    cancel_btn: "✕ रद्द करें", close_btn: "✕ बंद करें", login_command_btn: "कमांड सेंटर में लॉगिन करें",
    reg_new_zone_btn: "+ नया गंतव्य क्षेत्र पंजीकृत करें", master_passcode_label: "मास्टर पासकोड:",
    auth_master_btn: "मास्टर एक्सेस प्रमाणित करें", restore_session_btn: "सत्र पुनर्स्थापित करें",
    op_complete: "कार्य पूर्ण हुआ", passport_ready_msg: "आपका डिजिटल पासपोर्ट सक्रिय और ब्लॉकचेन पर दर्ज है।",
    return_dashboard: "डैशबोर्ड पर लौटें", active_zone_badge_label: "सक्रिय गंतव्य क्षेत्र:",
    assistance_en_route: "सहायता रास्ते में है", assistance_dispatched_desc: "आपके स्थान पर सहायता भेजी गई है।"
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
    status_header: "स्थिती", selfie_header: "सेल्फी", digital_id_header: "डिजिटल आयडी", role_label: "भूमिका", coords_header: "स्थान निर्देशक",
    back_to_login: "← लॉगिनवर परत जा", create_zone_title: "नवीन पर्यटन क्षेत्र तयार करा",
    create_zone_desc: "कमांड सेंटर, हेल्पलाईन फोन आणि सुरक्षा यंत्रणा सेट करा.",
    zone_code_label: "पर्यटन क्षेत्र कोड:", zone_name_label: "क्षेत्राचे नाव / विभाग:",
    helpline_phone_label: "कमांड सेंटर हेल्पलाईन फोन:", admin_passcode_label: "प्रशासक मास्टर पासकोड:",
    create_command_btn: "कमांड सेंटर तयार करा", logout_hq: "मुख्यालय लॉग आउट", delete_zone_btn: "🗑️ झोन हटवा",
    adjust_radius: "त्रिज्या समायोजित करा:", no_active_rescues: "या क्षेत्रात कोणतीही बचाव मोहीम सुरू नाही.",
    blockchain_blocks_label: "ब्लॉकचेन ब्लॉक्स", blockchain_ledger_title: "🔗 ब्लॉकचेन लेजर",
    cancel_btn: "✕ रद्द करा", close_btn: "✕ बंद करा", login_command_btn: "कमांड सेंटरमध्ये लॉगिन करा",
    reg_new_zone_btn: "+ नवीन पर्यटन क्षेत्र नोंदणी", master_passcode_label: "मास्टर पासकोड:",
    auth_master_btn: "प्रवेश अधिकृत करा", restore_session_btn: "सत्र पुनर्प्राप्त करा",
    op_complete: "काम पूर्ण झाले", passport_ready_msg: "आपला डिजिटल पासपोर्ट सक्रिय आणि ब्लॉकचेनवर नोंदवला गेला आहे.",
    return_dashboard: "डॅशबोर्डवर परत जा", active_zone_badge_label: "सक्रिय पर्यटन क्षेत्र:",
    assistance_en_route: "मदत मार्गावर आहे", assistance_dispatched_desc: "आपल्या स्थानावर मदत पाठवण्यात आली आहे."
  },
  bn: {
    ...BASE_EN,
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
    ...BASE_EN,
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
    ...BASE_EN,
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
    ...BASE_EN,
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
    ...BASE_EN,
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
  },
  kn: {
    ...BASE_EN,
    brand_title: "ಪ್ರವಾಸಿಗರ ಸುರಕ್ಷತೆ", dynamic_grid: "ಡೈನಾಮಿಕ್ ಗ್ರಿಡ್", switch_portal: "ಪೋರ್ಟಲ್ ಬದಲಿಸಿ",
    hero_heritage: "ಜಿಯೋಫೆನ್ಸ್ ಮತ್ತು ಪಾರುಗಾಣಿಕಾ ಗ್ರಿಡ್", access_control: "ಪ್ರವೇಶ ನಿಯಂತ್ರಣ", system: "ವ್ಯವಸ್ಥೆ",
    select_auth: "ಸುರಕ್ಷತಾ ಗ್ರಿಡ್ ಪ್ರವೇಶಿಸಲು ಹಂತವನ್ನು ಆಯ್ಕೆಮಾಡಿ.", public_entry: "ಸಾರ್ವಜನಿಕ ಪ್ರವೇಶ",
    user_portal: "ಬಳಕೆದಾರರ ಪೋರ್ಟಲ್", user_portal_desc: "ಸೆಲ್ಫಿ ಪರಿಶೀಲನೆಯೊಂದಿಗೆ ಡಿಜಿಟಲ್ ಪಾಸ್‌ಪೋರ್ಟ್ ಪಡೆಯಿರಿ.",
    zone_authority: "ವಲಯ ಪ್ರಾಧಿಕಾರ", staff_command: "ಸಿಬ್ಬಂದಿ ಕಮಾಂಡ್",
    staff_command_desc: "ಡಿಜಿಟಲ್ ಐಡಿಯನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಮತ್ತು ತಂಡಗಳನ್ನು ಕಳುಹಿಸಿ.", head_of_platform: "ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಮುಖ್ಯಸ್ಥರು",
    master_control: "ಮಾಸ್ಟರ್ ಕಂಟ್ರೋಲ್", master_control_desc: "ಎಲ್ಲಾ ಸಕ್ರಿಯ ವಲಯಗಳ ನೈಜ ಸಮಯದ ಮೇಲ್ವಿಚಾರಣೆ.",
    tourist_dashboard: "ಪ್ರವಾಸಿಗರ ಸುರಕ್ಷತೆ", dashboard_subtitle: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    dashboard_desc: "ಪರಿಶೀಲಿಸಿದ ಡಿಜಿಟಲ್ ಸುರಕ್ಷತಾ ಐಡಿಯೊಂದಿಗೆ ಸುರಕ್ಷಿತವಾಗಿ ಪ್ರಯಾಣಿಸಿ.",
    register_tourist: "ಪ್ರವಾಸಿಯಾಗಿ ನೋಂದಾಯಿಸಿ", register_tourist_desc: "ಸುರಕ್ಷತಾ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ.",
    register_volunteer: "ಸ್ವಯಂಸೇವಕರಾಗಿ ನೋಂದಾಯಿಸಿ", register_volunteer_desc: "ನೆಟ್‌ವರ್ಕ್‌ಗೆ ಸೇರಿ.",
    signin_phone: "ಫೋನ್ ಮೂಲಕ ಸೈನ್ ಇನ್", signin_desc: "ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಐಡಿಯನ್ನು ಮರುಪಡೆಯಿರಿ.",
    official_passport: "ಅಧಿಕೃತ ಡಿಜಿಟಲ್ ಸುರಕ್ಷತಾ ಪಾಸ್‌ಪೋರ್ಟ್", verified: "ದೃಢೀಕರಿಸಲಾಗಿದೆ",
    phone_label: "ಫೋನ್:", blood_group_label: "ರಕ್ತದ ಗುಂಪು:", emergency_contact_label: "ತುರ್ತು ಸಂಪರ್ಕ:",
    stay_address_label: "ವಿಳಾಸ:", qr_hint: "💡 ನೈಜ ತುರ್ತು ಮಾಹಿತಿಯನ್ನು ಒಳಗೊಂಡಿದೆ.",
    inside_safe_zone: "ಸುರಕ್ಷಿತ ವಲಯದೊಳಗೆ", safe_perimeter_desc: "ಕಮಾಂಡ್ ಸೆಂಟರ್‌ನಿಂದ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಲಾಗುತ್ತಿದೆ.",
    outside_safe_zone: "⚠️ ಸುರಕ್ಷಿತ ವಲಯದಿಂದ ಹೊರಗೆ", send_sos: "ತುರ್ತು ಸಹಾಯ (SOS)", cancel_sos: "ರದ್ದುಮಾಡಿ",
    emergency_assistance: "ತುರ್ತು ನೆರವು", leave_zone: "✕ ವಲಯದಿಂದ ನಿರ್ಗಮಿಸಿ", leave_zone_desc: "ಡೇಟಾ ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲ್ಪಡುತ್ತದೆ.",
    edit_profile: "✏️ ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ", log_out: "ಲಾಗ್ ಔಟ್", refresh: "↻ ರಿಫ್ರೆಶ್", zone_command: "ವಲಯ ಕಮಾಂಡ್:",
    total_in_zone: "ಒಟ್ಟು", active_tourists: "ಪ್ರವಾಸಿಗರು", volunteers_ready: "ಸ್ವಯಂಸೇವಕರು", active_zone_alerts: "ಎಚ್ಚರಿಕೆಗಳು",
    safe_zone_editor: "🗺️ ಸುರಕ್ಷಿತ ವಲಯ ಸಂಪಾದಕ", save_geofence: "💾 ಗಡಿ ಉಳಿಸಿ", field_deployment: "⚡ ಲೈವ್ ಟ್ರ್ಯಾಕರ್",
    status_normal: "ಸಾಮಾನ್ಯ", status_sos: "🚨 ತುರ್ತು ಸಕ್ರಿಯ", status_responder: "⚡ ಸಹಾಯಕ ಹತ್ತಿರದಲ್ಲಿದ್ದಾರೆ",
    view_qr: "🔍 QR ನೋಡಿ", view_id: "🔍 ಐಡಿ ನೋಡಿ", call_victim: "📞 ಕರೆ ಮಾಡಿ", command_route: "🗺️ ಕಮಾಂಡ್ ಮಾರ್ಗ",
    volunteer_route: "🗺️ ಸ್ವಯಂಸೇವಕ ಮಾರ್ಗ", deploy_hq: "✓ ತಂಡ ಕಳುಹಿಸಿ", stand_by: "✕ ಕಾಯಿರಿ",
    yes_assist: "✓ ಸಹಾಯ ಮಾಡಿ", no_decline: "✕ ಇಲ್ಲ", safe_chilling: "✓ ನಾನು ಸುರಕ್ಷಿತ", need_help: "🚨 ಸಹಾಯ ಬೇಕು",
    selfie_req_title: "📸 ಅಗತ್ಯ: ಲೈವ್ ಸೆಲ್ಫಿ ಪರಿಶೀಲನೆ", selfie_placeholder: "ಇನ್ನೂ ಸೆಲ್ಫಿ ತೆಗೆದುಕೊಂಡಿಲ್ಲ",
    open_live_cam: "📷 ಲೈವ್ ಕ್ಯಾಮೆರಾ ತೆರೆಯಿರಿ", take_snapshot: "⚡ ಫೋಟೋ ತೆಗೆಯಿರಿ", retake_btn: "🔄 ಮರುಪ್ರಯತ್ನಿಸಿ",
    tap_open_cam: "📱 ಕ್ಯಾಮೆರಾ ತೆರೆಯಲು ಟ್ಯಾಪ್ ಮಾಡಿ", name_label: "ಪೂರ್ಣ ಹೆಸರು:", age_label: "ವಯಸ್ಸು:",
    gender_label: "ಲಿಂಗ:", select_option: "ಆಯ್ಕೆಮಾಡಿ", gender_male: "ಪುರುಷ", gender_female: "ಮಹಿಳೆ", gender_other: "ಇತರ",
    dual_reg: "ದ್ವಿಪಾತ್ರ ನೋಂದಣಿ ಆಯ್ಕೆ (ಪ್ರವಾಸಿ ಮತ್ತು ಸ್ವಯಂಸೇವಕ)", complete_reg_btn: "ನೋಂದಣಿ ಪೂರ್ಣಗೊಳಿಸಿ ಮತ್ತು ಬ್ಲಾಕ್‌ಚೈನ್‌ಗೆ ಸೇರಿಸಿ",
    update_save_btn: "💾 ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಿ ಮತ್ತು ಬ್ಲಾಕ್‌ಚೈನ್ ಸೇರಿಸಿ", lang_select_label: "🌐 ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:",
    status_header: "ಸ್ಥಿತಿ", selfie_header: "ಸೆಲ್ಫಿ", digital_id_header: "ಡಿಜಿಟಲ್ ಐಡಿ", role_label: "ಪಾತ್ರ", coords_header: "ನಿರ್ದೇಶಾಂಕಗಳು"
  },
  or: {
    ...BASE_EN,
    brand_title: "ପର୍ଯ୍ୟଟକ ସୁରକ୍ଷା", dynamic_grid: "ଡାଇନାମିକ ଗ୍ରୀଡ୍", switch_portal: "ପୋର୍ଟାଲ୍ ବଦଳାନ୍ତୁ",
    hero_heritage: "ଜିଓଫେନ୍ସ ଏବଂ ଉଦ୍ଧାର ନେଟୱାର୍କ", access_control: "ଆକ୍ସେସ୍ କଣ୍ଟ୍ରୋଲ୍", system: "ସିଷ୍ଟମ୍",
    select_auth: "ସୁରକ୍ଷା ଗ୍ରୀଡରେ ପ୍ରବେଶ କରିବାକୁ ବାଛନ୍ତୁ।", public_entry: "ସାଧାରଣ ପ୍ରବେଶ",
    user_portal: "ୟୁଜର ପୋର୍ଟାଲ୍", user_portal_desc: "ସେଲଫି ସହିତ ପାସପୋର୍ଟ ପାଆନ୍ତୁ।", zone_authority: "ଜୋନ୍ ପ୍ରାଧିକରଣ",
    staff_command: "ଷ୍ଟାଫ୍ କମାଣ୍ଡ", staff_command_desc: "ଆଇଡି ସ୍କାନ୍ କରନ୍ତୁ ଏବଂ ଦଳ ପଠାନ୍ତୁ।",
    head_of_platform: "ପ୍ଲାଟଫର୍ମ ମୁଖ୍ୟ", master_control: "ମାଷ୍ଟର କଣ୍ଟ୍ରୋଲ୍", master_control_desc: "ସମସ୍ତ ଜୋନ୍ ଉପରେ ନଜର।",
    tourist_dashboard: "ପର୍ଯ୍ୟଟକ ସୁରକ୍ଷା", dashboard_subtitle: "ଡ୍ୟାସବୋର୍ଡ", dashboard_desc: "ସୁରକ୍ଷିତ ଭାବରେ ଭ୍ରମଣ କରନ୍ତୁ।",
    register_tourist: "ପର୍ଯ୍ୟଟକ ପଞ୍ଜିକରଣ", register_tourist_desc: "ପ୍ରୋଫାଇଲ୍ ସୃଷ୍ଟି କରନ୍ତୁ।",
    register_volunteer: "ସ୍ୱେଚ୍ଛାସେବୀ ପଞ୍ଜିକରଣ", register_volunteer_desc: "ନେଟୱାର୍କରେ ଯୋଗ ଦିଅନ୍ତୁ।",
    signin_phone: "ଫୋନ୍ ସାଇନ୍ ଇନ୍", signin_desc: "ଆଇଡି ପୁନରୁଦ୍ଧାର କରନ୍ତୁ।", official_passport: "ଅଫିସିଆଲ୍ ସୁରକ୍ଷା ପାସପୋର୍ଟ",
    verified: "ପ୍ରମାଣିତ", phone_label: "ଫୋନ୍:", blood_group_label: "ରକ୍ତ ବର୍ଗ:", emergency_contact_label: "ଜରୁରୀ ସମ୍ପର୍କ:",
    stay_address_label: "ଠିକଣା:", qr_hint: "💡 ପ୍ରକୃତ ସୂଚନା ରହିଛି।", inside_safe_zone: "ସୁରକ୍ଷିତ ଅଞ୍ଚଳ ଭିତରେ",
    safe_perimeter_desc: "ନିରୀକ୍ଷଣ କରାଯାଉଥିବା ଅଞ୍ଚଳ।", outside_safe_zone: "⚠️ ସୁରକ୍ଷିତ ଅଞ୍ଚଳ ବାହାରେ",
    send_sos: "ଜରୁରୀକାଳୀନ ସହାୟତା (SOS)", cancel_sos: "ବାତିଲ କରନ୍ତୁ", emergency_assistance: "ଜରୁରୀ ସହାୟତା",
    leave_zone: "✕ ଜୋନ୍ ଛାଡନ୍ତୁ", leave_zone_desc: "ଡାଟା ଲିଭାଯିବ।", edit_profile: "✏️ ସଂଶୋଧନ", log_out: "ଲଗ୍ ଆଉଟ୍",
    refresh: "↻ ରିଫ୍ରେଶ୍", zone_command: "ଜୋନ୍ କମାଣ୍ଡ:", total_in_zone: "ସମୁଦାୟ", active_tourists: "ପର୍ଯ୍ୟଟକ",
    volunteers_ready: "ସ୍ୱେଚ୍ଛାସେବୀ", active_zone_alerts: "ଚେତାବନୀ", safe_zone_editor: "🗺️ ସମ୍ପାଦକ",
    save_geofence: "💾 ସଂରକ୍ଷଣ କରନ୍ତୁ", field_deployment: "⚡ ଲାଇଭ୍ ଟ୍ରାକର୍", status_normal: "ସାଧାରଣ",
    status_sos: "🚨 ଆପତକାଳ", status_responder: "⚡ ସାହାଯ୍ୟକାରୀ ନିକଟରେ", view_qr: "🔍 QR ଦେଖନ୍ତୁ",
    view_id: "🔍 ଆଇଡି", call_victim: "📞 କଲ୍ କରନ୍ତୁ", command_route: "🗺️ କମାଣ୍ଡ ରୁଟ୍",
    volunteer_route: "🗺️ ସ୍ୱେଚ୍ଛାସେବୀ ରୁଟ୍", deploy_hq: "✓ ଟିମ୍ ପଠାନ୍ତୁ", stand_by: "✕ ଅପେକ୍ଷା",
    yes_assist: "✓ ସାହାଯ୍ୟ କରନ୍ତୁ", no_decline: "✕ ନା", safe_chilling: "✓ ସୁରକ୍ଷିତ", need_help: "🚨 ସାହାଯ୍ୟ ଦରକାର",
    selfie_req_title: "📸 ଆବଶ୍ୟକ: ଲାଇଭ୍ ସେଲଫି ଯାଞ୍ଚ", selfie_placeholder: "ସେଲଫି ଏପର୍ଯ୍ୟନ୍ତ ନିଆଯାଇ ନାହିଁ",
    open_live_cam: "📷 କ୍ୟାମେରା ଖୋଲନ୍ତୁ", take_snapshot: "⚡ ଫଟୋ ନିଅନ୍ତୁ", retake_btn: "🔄 ପୁଣି ନିଅନ୍ତୁ",
    tap_open_cam: "📱 କ୍ୟାମେରା ଖୋଲିବାକୁ ଟ୍ୟାପ୍ କରନ୍ତୁ", name_label: "ପୂରା ନାମ:", age_label: "ବୟସ:",
    gender_label: "ଲିଙ୍ଗ:", select_option: "ବାଛନ୍ତୁ", gender_male: "ପୁରୁଷ", gender_female: "ମହିଳା", gender_other: "ଅନ୍ୟାନ୍ୟ",
    dual_reg: "ଦ୍ୱୈତ ପଞ୍ଜିକରଣ ବିକଳ୍ପ (ପର୍ଯ୍ୟଟକ ଏବଂ ସ୍ୱେଚ୍ଛାସେବୀ)", complete_reg_btn: "ପଞ୍ଜିକରଣ ସମ୍ପୂର୍ଣ୍ଣ କରନ୍ତୁ ଏବଂ ବ୍ଲକଚେନରେ ଯୋଡନ୍ତୁ",
    update_save_btn: "💾 ପ୍ରୋଫାଇଲ୍ ଅଦ୍ୟତନ କରନ୍ତୁ ଏବଂ ବ୍ଲକଚେନ ଯୋଡନ୍ତୁ", lang_select_label: "🌐 ଭାଷା ବାଛନ୍ତୁ:",
    status_header: "ସ୍ଥିତି", selfie_header: "ସେଲଫି", digital_id_header: "ଡିଜିଟାଲ୍ ଆଇଡି", role_label: "ଭୂମିକା", coords_header: "ସ୍ଥାନାଙ୍କ"
  },
  ml: {
    ...BASE_EN,
    brand_title: "ടൂറിസ്റ്റ് സുരക്ഷ", dynamic_grid: "ഡൈനാമിക് ഗ്രിഡ്", switch_portal: "പോർട്ടൽ മാറ്റുക",
    hero_heritage: "ജിയോഫെൻസ് & റെസ്ക്യൂ നെറ്റ്‌വർക്ക്", access_control: "ആക്സസ് കൺട്രോൾ", system: "സിസ്റ്റം",
    select_auth: "ലെവൽ തിരഞ്ഞെടുക്കുക.", public_entry: "പബ്ലിക് എൻട്രി", user_portal: "യൂസർ പോർട്ടൽ",
    user_portal_desc: "സെൽഫി വഴി ഡിജിറ്റൽ പാസ്‌പോർട്ട് നേടുക.", zone_authority: "സോൺ അതോറിറ്റി",
    staff_command: "സ്റ്റാഫ് കമാൻഡ്", staff_command_desc: "ഐഡി സ്കാൻ ചെയ്യുക, സംഘത്തെ അയക്കുക.",
    head_of_platform: "പ്ലാറ്റ്‌ഫോം മേധാവി", master_control: "മാസ്റ്റർ കൺട്രോൾ",
    master_control_desc: "തത്സമയ നിരീക്ഷണം.", tourist_dashboard: "ടൂറിസ്റ്റ് സുരക്ഷ", dashboard_subtitle: "ഡാഷ്‌ബോർഡ്",
    dashboard_desc: "സുരക്ഷിതമായി യാത്ര ചെയ്യുക.", register_tourist: "ടൂറിസ്റ്റ് രജിസ്ട്രേഷൻ",
    register_tourist_desc: "സുരക്ഷാ പ്രൊഫൈൽ ഉണ്ടാക്കുക.", register_volunteer: "വോളണ്ടിയർ രജിസ്ട്രേഷൻ",
    register_volunteer_desc: "നെറ്റ്‌വർക്കിൽ ചേരുക.", signin_phone: "ഫോൺ സൈൻ ഇൻ", signin_desc: "ഐഡി വീണ്ടെടുക്കുക.",
    official_passport: "ഔദ്യോഗിക ഡിജിറ്റൽ പാസ്‌പോർട്ട്", verified: "സ്ഥിരീകരിച്ചു", phone_label: "ഫോൺ:",
    blood_group_label: "രക്തഗ്രൂപ്പ്:", emergency_contact_label: "അടിയന്തര സമ്പർക്കം:", stay_address_label: "വിലാസം:",
    qr_hint: "💡 യഥാർത്ഥ വിവരങ്ങൾ അടങ്ങിയിരിക്കുന്നു.", inside_safe_zone: "സുരക്ഷിത മേഖലയിൽ",
    safe_perimeter_desc: "നിരീക്ഷിക്കുന്ന പ്രദേശം.", outside_safe_zone: "⚠️ മേഖലയ്ക്ക് പുറത്ത്",
    send_sos: "അടിയന്തര സഹായം (SOS)", cancel_sos: "റദ്ദാക്കുക", emergency_assistance: "അടിയന്തര സഹായം",
    leave_zone: "✕ സോൺ വിടുക", leave_zone_desc: "ഡാറ്റ ഇല്ലാതാക്കും.", edit_profile: "✏️ എഡിറ്റ് ചെയ്യുക",
    log_out: "ലോഗ് ഔട്ട്", refresh: "↻ പുതുക്കുക", zone_command: "സോൺ കമാൻഡ്:", total_in_zone: "ആകെ",
    active_tourists: "ടൂറിസ്റ്റുകൾ", volunteers_ready: "സന്നദ്ധപ്രവർത്തകർ", active_zone_alerts: "അലേർട്ടുകൾ",
    safe_zone_editor: "🗺️ സോൺ എഡിറ്റർ", save_geofence: "💾 സേവ് ചെയ്യുക", field_deployment: "⚡ തത്സമയ ട്രാക്കർ",
    status_normal: "സാധാരണം", status_sos: "🚨 അടിയന്തരാവസ്ഥ", status_responder: "⚡ സഹായി സമീപത്തുണ്ട്",
    view_qr: "🔍 QR കാണുക", view_id: "🔍 ഐഡി", call_victim: "📞 വിളിക്കുക", command_route: "🗺️ കമാൻഡ് റൂട്ട്",
    volunteer_route: "🗺️ വോളണ്ടിയർ റൂട്ട്", deploy_hq: "✓ ടീമിനെ അയക്കുക", stand_by: "✕ കാത്തിരിക്കുക",
    yes_assist: "✓ സഹായിക്കാം", no_decline: "✕ ഇല്ല", safe_chilling: "✓ സുരക്ഷിതനാണ്", need_help: "🚨 സഹായം വേണം",
    selfie_req_title: "📸 നിർബന്ധം: തത്സമയ സെൽഫി പരിശോധന", selfie_placeholder: "സെൽഫി ഇതുവരെ എടുത്തിട്ടില്ല",
    open_live_cam: "📷 ലൈവ് ക്യാമറ തുറക്കുക", take_snapshot: "⚡ ഫോട്ടോ എടുക്കുക", retake_btn: "🔄 വീണ്ടും എടുക്കുക",
    tap_open_cam: "📱 ക്യാമറ തുറക്കാൻ ടാപ്പ് ചെയ്യുക", name_label: "പൂർണ്ണമായ പേര്:", age_label: "പ്രായം:",
    gender_label: "ലിംഗം:", select_option: "തിരഞ്ഞെടുക്കുക", gender_male: "പുരുഷൻ", gender_female: "സ്ത്രീ", gender_other: "മറ്റുള്ളവ",
    dual_reg: "ഇരട്ട രജിസ്ട്രേഷൻ ഓപ്ഷൻ (ടൂറിസ്റ്റ് & വോളണ്ടിയർ)", complete_reg_btn: "രജിസ്ട്രേഷൻ പൂർത്തിയാക്കി ബ്ലോക്ക്ചെയിനിൽ ചേർക്കുക",
    update_save_btn: "💾 പ്രൊഫൈൽ അപ്‌ഡേറ്റ് ചെയ്‌ത് ബ്ലോക്ക്‌ചെയിൻ ചേർക്കുക", lang_select_label: "🌐 ഭാഷ തിരഞ്ഞെടുക്കുക:",
    status_header: "നില", selfie_header: "സെൽഫി", digital_id_header: "ഡിജിറ്റൽ ഐഡി", role_label: "റോൾ", coords_header: "സ്ഥാനം"
  },
  pa: {
    ...BASE_EN,
    brand_title: "ਯਾਤਰੀ ਸੁਰੱਖਿਆ", dynamic_grid: "ਡਾਇਨਾਮਿਕ ਗਰਿੱਡ", switch_portal: "ਪੋਰਟਲ ਬਦਲੋ",
    hero_heritage: "ਜੀਓਫੈਂਸ ਅਤੇ ਬਚਾਅ ਨੈੱਟਵਰਕ", access_control: "ਪਹੁੰਚ ਕੰਟਰੋਲ", system: "ਸਿਸਟਮ",
    select_auth: "ਪੱਧਰ ਚੁਣੋ।", public_entry: "ਜਨਤਕ ਦਾਖਲਾ", user_portal: "ਯੂਜ਼ਰ ਪੋਰਟਲ",
    user_portal_desc: "ਸੈਲਫੀ ਨਾਲ ਡਿਜੀਟਲ ਪਾਸਪੋਰਟ ਪ੍ਰਾਪਤ ਕਰੋ।", zone_authority: "ਜ਼ੋਨ ਅਥਾਰਟੀ",
    staff_command: "ਸਟਾਫ ਕਮਾਂਡ", staff_command_desc: "ਆਈਡੀ ਸਕੈਨ ਕਰੋ ਅਤੇ ਟੀਮਾਂ ਭੇਜੋ।", head_of_platform: "ਮੁੱਖ ਨਿਯੰਤਰਕ",
    master_control: "ਮਾਸਟਰ ਕੰਟਰੋਲ", master_control_desc: "ਸਾਰੇ ਜ਼ੋਨਾਂ ਦੀ ਨਿਗਰਾਨੀ।", tourist_dashboard: "ਯਾਤਰੀ ਸੁਰੱਖਿਆ",
    dashboard_subtitle: "ਡੈਸ਼ਬੋਰਡ", dashboard_desc: "ਸੁਰੱਖਿਅਤ ਯਾਤਰਾ ਕਰੋ।", register_tourist: "ਯਾਤਰੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ",
    register_tourist_desc: "ਪ੍ਰੋਫਾਈਲ ਬਣਾਓ।", register_volunteer: "ਵਲੰਟੀਅਰ ਰਜਿਸਟ੍ਰੇਸ਼ਨ",
    register_volunteer_desc: "ਨੈੱਟਵਰਕ ਨਾਲ ਜੁੜੋ।", signin_phone: "ਫੋਨ ਨਾਲ ਸਾਈਨ ਇਨ", signin_desc: "ਆਈਡੀ ਬਹਾਲ ਕਰੋ।",
    official_passport: "ਅਧਿਕਾਰਤ ਡਿਜੀਟਲ ਪਾਸਪੋਰਟ", verified: "ਪ੍ਰਮਾਣਿਤ", phone_label: "ਫੋਨ:",
    blood_group_label: "ਖੂਨ ਦਾ ਗਰੁੱਪ:", emergency_contact_label: "ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ:", stay_address_label: "ਪਤਾ:",
    qr_hint: "💡 ਅਸਲ ਜਾਣਕਾਰੀ ਹੈ।", inside_safe_zone: "ਸੁਰੱਖਿਅਤ ਖੇਤਰ ਦੇ ਅੰਦਰ", safe_perimeter_desc: "ਨਿਗਰਾਨੀ ਅਧੀਨ ਖੇਤਰ।",
    outside_safe_zone: "⚠️ ਖੇਤਰ ਤੋਂ ਬਾਹਰ", send_sos: "ਮਦਦ ਮੰਗੋ (SOS)", cancel_sos: "ਰੱਦ ਕਰੋ",
    emergency_assistance: "ਐਮਰਜੈਂਸੀ ਸਹਾਇਤਾ", leave_zone: "✕ ਜ਼ੋਨ ਛੱਡੋ", leave_zone_desc: "ਡਾਟਾ ਮਿਟਾ ਦਿੱਤਾ ਜਾਵੇਗਾ।",
    edit_profile: "✏️ ਬਦਲੋ", log_out: "ਲੌਗ ਆਉਟ", refresh: "↻ ਤਾਜ਼ਾ ਕਰੋ", zone_command: "ਜ਼ੋਨ ਕਮਾਂਡ:",
    total_in_zone: "ਕੁੱਲ", active_tourists: "ਯਾਤਰੀ", volunteers_ready: "ਵਲੰਟੀਅਰ", active_zone_alerts: "ਅਲਰਟ",
    safe_zone_editor: "🗺️ ਸੰਪਾਦਕ", save_geofence: "💾 ਸੀਮਾ ਸੁਰੱਖਿਅਤ ਕਰੋ", field_deployment: "⚡ ਲਾਈਵ ਟਰੈਕਰ",
    status_normal: "ਆਮ", status_sos: "🚨 ਐਮਰਜੈਂਸੀ", status_responder: "⚡ ਮਦਦਗਾਰ ਨੇੜੇ", view_qr: "🔍 QR ਦੇਖੋ",
    view_id: "🔍 ਆਈਡੀ", call_victim: "📞 ਕਾਲ ਕਰੋ", command_route: "🗺️ ਕਮਾਂਡ ਰੂਟ", volunteer_route: "🗺️ ਵਲੰਟੀਅਰ ਰੂਟ",
    deploy_hq: "✓ ਟੀਮ ਭੇਜੋ", stand_by: "✕ ਉਡੀਕ ਕਰੋ", yes_assist: "✓ ਮਦਦ ਕਰੋ", no_decline: "✕ ਨਹੀਂ",
    safe_chilling: "✓ ਸੁਰੱਖਿਅਤ ਹਾਂ", need_help: "🚨 ਮਦਦ ਚਾਹੀਦੀ ਹੈ",
    selfie_req_title: "📸 ਲਾਜ਼ਮੀ: ਲਾਈਵ ਸੈਲਫੀ ਤਸਦੀਕ", selfie_placeholder: "ਸੈਲਫੀ ਅਜੇ ਨਹੀਂ ਲਈ ਗਈ",
    open_live_cam: "📷 ਲਾਈਵ ਕੈਮਰਾ ਖੋਲ੍ਹੋ", take_snapshot: "⚡ ਫੋਟੋ ਲਵੋ", retake_btn: "🔄 ਦੁਬਾਰਾ ਲਵੋ",
    tap_open_cam: "📱 ਕੈਮਰਾ ਖੋਲ੍ਹਣ ਲਈ ਟੈਪ ਕਰੋ", name_label: "ਪੂਰਾ ਨਾਮ:", age_label: "ਉਮਰ:",
    gender_label: "ਲਿੰਗ:", select_option: "ਚੁਣੋ", gender_male: "ਪੁਰਸ਼", gender_female: "ਔਰਤ", gender_other: "ਹੋਰ",
    dual_reg: "ਦੋਹਰੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਵਿਕਲਪ (ਯਾਤਰੀ ਅਤੇ ਵਲੰਟੀਅਰ)", complete_reg_btn: "ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਪੂਰੀ ਕਰੋ ਅਤੇ ਬਲਾਕਚੈਨ ਵਿੱਚ ਸ਼ਾਮਲ ਕਰੋ",
    update_save_btn: "💾 ਪ੍ਰੋਫਾਈਲ ਅਪਡੇਟ ਕਰੋ ਅਤੇ ਬਲਾਕਚੈਨ ਸ਼ਾਮਲ ਕਰੋ", lang_select_label: "🌐 ਭਾਸ਼ਾ ਚੁਣੋ:",
    status_header: "ਸਥਿਤੀ", selfie_header: "ਸੈਲਫੀ", digital_id_header: "ਡਿਜੀਟਲ ਆਈਡੀ", role_label: "ਭੂਮਿਕਾ", coords_header: "ਨਿਰਦੇਸ਼ਾਂਕ"
  },
  as: {
    ...BASE_EN,
    brand_title: "পৰ্যটক সুৰক্ষা", dynamic_grid: "গতিশীল গ্ৰিড", switch_portal: "পৰ্টেল সলনি কৰক",
    hero_heritage: "জিঅ'ফেন্স আৰু উদ্ধাৰ নেটৱৰ্ক", access_control: "প্ৰৱেশ নিয়ন্ত্ৰণ", system: "ব্যৱস্থা",
    select_auth: "সুৰক্ষা স্তৰ বাছক।", public_entry: "ৰাজহুৱা প্ৰৱেশ", user_portal: "ব্যৱহাৰকাৰী পৰ্টেল",
    user_portal_desc: "ছেলফিৰ সৈতে ডিজিটেল সুৰক্ষা পাছপ'ৰ্ট লাভ কৰক।", zone_authority: "ক্ষেত্ৰ কৰ্তৃপক্ষ",
    staff_command: "কৰ্মচাৰী কমাণ্ড", staff_command_desc: "ডিজিটেল আইডি স্কেন কৰক আৰু দল পঠিয়াওক।",
    head_of_platform: "প্লেটফৰ্ম প্ৰধান", master_control: "মাষ্টাৰ কণ্ট্ৰোল", master_control_desc: "সকলো ক্ষেত্ৰৰ নিৰীক্ষণ।",
    tourist_dashboard: "পৰ্যটক সুৰক্ষা", dashboard_subtitle: "ডেশ্বব'ৰ্ড", dashboard_desc: "সুৰক্ষিতভাৱে ভ্ৰমণ কৰক।",
    register_tourist: "পৰ্যটক পঞ্জীয়ন", register_tourist_desc: "সুৰক্ষা প্ৰ'ফাইল তৈয়াৰ কৰক।",
    register_volunteer: "স্বেচ্ছাসেৱক পঞ্জীয়ন", register_volunteer_desc: "নেটৱৰ্কত যোগদান কৰক।",
    signin_phone: "ফোনৰ দ্বাৰা ছাইন ইন", signin_desc: "আইডি উদ্ধাৰ কৰক।", official_passport: "চৰকাৰী ডিজিটেল পাছপ'ৰ্ট",
    verified: "প্ৰমাণিত", phone_label: "ফোন:", blood_group_label: "তেজৰ গ্ৰুপ:", emergency_contact_label: "জৰুৰী যোগাযোগ:",
    stay_address_label: "ঠিকনা:", qr_hint: "💡 প্ৰকৃত জৰুৰীকালীন তথ্য আছে।", inside_safe_zone: "সুৰক্ষিত এলেকাৰ ভিতৰত",
    safe_perimeter_desc: "নিৰীক্ষণ কৰা এলেকা।", outside_safe_zone: "⚠️ এলেকাৰ বাহিৰত", send_sos: "জৰুৰীকালীন সংকেত (SOS)",
    cancel_sos: "বাতিল কৰক", emergency_assistance: "জৰুৰীকালীন সাহায্য", leave_zone: "✕ প্ৰস্থান কৰক",
    leave_zone_desc: "তথ্য মচি পেলোৱা হ'ব।", edit_profile: "✏️ সম্পাদনা", log_out: "লগ আউট", refresh: "↻ সতেজ কৰক",
    zone_command: "কমাণ্ড:", total_in_zone: "মুঠ", active_tourists: "পৰ্যটক", volunteers_ready: "স্বেচ্ছাসেৱক",
    active_zone_alerts: "সতৰ্কবাৰ্তা", safe_zone_editor: "🗺️ সম্পাদক", save_geofence: "💾 সংৰক্ষণ কৰক",
    field_deployment: "⚡ লাইভ ট্ৰেকাৰ", status_normal: "স্বাভাৱিক", status_sos: "🚨 জৰুৰীকালীন",
    status_responder: "⚡ সহায়ক ওচৰত", view_qr: "🔍 QR চাওক", view_id: "🔍 আইডি", call_victim: "📞 কল কৰক",
    command_route: "🗺️ কমাণ্ড পথ", volunteer_route: "🗺️ স্বেচ্ছাসেৱক পথ", deploy_hq: "✓ দল পঠিয়াওক",
    stand_by: "✕ অপেক্ষা কৰক", yes_assist: "✓ সহায় কৰক", no_decline: "✕ নহয়", safe_chilling: "✓ সুৰক্ষিত আছো",
    need_help: "🚨 সহায় লাগে", selfie_req_title: "📸 প্ৰয়োজনীয়: লাইভ ছেলফি সত্যাपन", selfie_placeholder: "ছেলফি এতিয়াও লোৱা হোৱা নাই",
    open_live_cam: "📷 লাইভ কেমেৰা খোলক", take_snapshot: "⚡ ফটো তোলক", retake_btn: "🔄 পুনৰ লওক",
    tap_open_cam: "📱 কেমেৰা খুলিবলৈ টেপ কৰক", name_label: "সম্পূৰ্ণ নাম:", age_label: "বয়স:",
    gender_label: "লিংগ:", select_option: "বাছনি কৰক", gender_male: "পুৰুষ", gender_female: "মহিলা", gender_other: "অন্যান্য",
    dual_reg: "দ্বৈত পঞ্জীয়ন বিকল্প (পৰ্যটক আৰু স্বেচ্ছাসেৱক)", complete_reg_btn: "পঞ্জীয়ন সম্পূৰ্ণ কৰক আৰু ব্লকচেইনত যোগ কৰক",
    update_save_btn: "💾 প্ৰ'ফাইল আপডেট কৰক আৰু ব্লকচেইন যোগ কৰক", lang_select_label: "🌐 ভাষা বাছক:",
    status_header: "স্থিতি", selfie_header: "ছেলফি", digital_id_header: "ডিজিটেল আইডি", role_label: "ভূমিকা", coords_header: "স্থানাংক"
  },
  ma: {
    ...BASE_EN,
    brand_title: "पर्यटक सुरक्षा", dynamic_grid: "डायनामिक ग्रिड", switch_portal: "पोर्टल बदलू",
    hero_heritage: "जियोफेंस आ बचाव नेटवर्क", access_control: "पहुंच नियंत्रण", system: "प्रणाली",
    select_auth: "अधिकार स्तर चुनू।", public_entry: "सार्वजनिक प्रवेश", user_portal: "उपयोगकर्ता पोर्टल",
    user_portal_desc: "सेल्फी सत्यापन संग डिजिटल पासपोर्ट प्राप्त करू।", zone_authority: "जोन प्राधिकार",
    staff_command: "स्टाफ कमान", staff_command_desc: "आईडी स्कैन करू आ टीम भेजूं।", head_of_platform: "प्रमुख नियंत्रक",
    master_control: "मास्टर कंट्रोल", master_control_desc: "सभ जोनक लाइव निगरानी।", tourist_dashboard: "पर्यटक सुरक्षा",
    dashboard_subtitle: "डैशबोर्ड", dashboard_desc: "सुरक्षित यात्रा करू।", register_tourist: "पर्यटक पंजीकरण",
    register_tourist_desc: "सुरक्षा प्रोफाइल बनाउ।", register_volunteer: "स्वयंसेवक पंजीकरण",
    register_volunteer_desc: "नेटवर्क सं जुड़ू।", signin_phone: "फोन सं साइन इन", signin_desc: "आईडी पुनर्प्राप्त करू।",
    official_passport: "आधिकारिक डिजिटल पासपोर्ट", verified: "प्रमाणित", phone_label: "फोन:", blood_group_label: "रक्त समूह:",
    emergency_contact_label: "आपातकालीन संपर्क:", stay_address_label: "पता:", qr_hint: "💡 वास्तविक जानकारी उपलब्ध अछि।",
    inside_safe_zone: "सुरक्षित क्षेत्रक भीतर", safe_perimeter_desc: "निगरानी कएल जा रहल क्षेत्र।",
    outside_safe_zone: "⚠️ क्षेत्र सं बाहर", send_sos: "आपातकालीन सहायता (SOS)", cancel_sos: "रद्द करू",
    emergency_assistance: "आपातकालीन सहायता", leave_zone: "✕ जोन छोड़ू", leave_zone_desc: "डेटा हटाओल जाएत।",
    edit_profile: "✏️ प्रोफाइल बदलू", log_out: "लॉग आउट", refresh: "↻ रीफ्रेश", zone_command: "जोन कमान:",
    total_in_zone: "कुल", active_tourists: "पर्यटक", volunteers_ready: "स्वयंसेवक", active_zone_alerts: "अलर्ट",
    safe_zone_editor: "🗺️ क्षेत्र संपादक", save_geofence: "💾 सीमा सहेजूं", field_deployment: "⚡ लाइव ट्रैकर",
    status_normal: "सामान्य", status_sos: "🚨 आपातकाल", status_responder: "⚡ सहायक निकट अछि", view_qr: "🔍 QR देखू",
    view_id: "🔍 आईडी", call_victim: "📞 कॉल करू", command_route: "🗺️ कमान मार्ग", volunteer_route: "🗺️ स्वयंसेवक मार्ग",
    deploy_hq: "✓ टीम भेजूं", stand_by: "✕ रुकू", yes_assist: "✓ सहायता करू", no_decline: "✕ नहि",
    safe_chilling: "✓ हम सुरक्षित छी", need_help: "🚨 सहायता चाही", selfie_req_title: "📸 आवश्यक: लाइव सेल्फी सत्यापन",
    selfie_placeholder: "सेल्फी एखन धरि नहि लेल गेल", open_live_cam: "📷 लाइव कैमरा खोलू", take_snapshot: "⚡ फोटो लिअ'",
    retake_btn: "🔄 पुनः लिअ'", tap_open_cam: "📱 कैमरा खोलय लेल टैप करू", name_label: "पूरा नाम:", age_label: "उम्र:",
    gender_label: "लिंग:", select_option: "चुनू", gender_male: "पुरुष", gender_female: "महिला", gender_other: "अन्य",
    dual_reg: "दोहरी पंजीकरण विकल्प (पर्यटक आ स्वयंसेवक)", complete_reg_btn: "पंजीकरण पूरा करू आ ब्लॉकचेन मे जोड़ू",
    update_save_btn: "💾 प्रोफाइल अपडेट करू आ ब्लॉकचेन जोड़ू", lang_select_label: "🌐 भाषा चुनू:",
    status_header: "स्थिति", selfie_header: "सेल्फी", digital_id_header: "डिजिटल आईडी", role_label: "भूमिका", coords_header: "निर्देशांक"
  },
  sa: {
    ...BASE_EN,
    brand_title: "पर्यटकसुरक्षा", dynamic_grid: "गतिशीलजालकम्", switch_portal: "द्वारं परिवर्तयतु",
    hero_heritage: "रक्षामण्डलं तथा त्राणजालम्", access_control: "प्रवेशनियन्त्रणम्", system: "तन्त्रम्",
    select_auth: "प्रवेशस्तरं चिनोतु।", public_entry: "सार्वजनिकप्रवेशः", user_portal: "उपयोक्तृद्वारम्",
    user_portal_desc: "स्वचित्रेण सह पञ्जीकरणं कृत्वा डिजिटलपत्रं प्राप्नोतु।", zone_authority: "मण्डलप्राधिकारः",
    staff_command: "कर्मचारिनियन्त्रणम्", staff_command_desc: "अभिज्ञानपत्रं परीक्ष्य रक्षकदलं प्रेषयतु।",
    head_of_platform: "तन्त्रप्रमुखः", master_control: "मुख्यनियन्त्रणम्", master_control_desc: "सर्वमण्डलानां प्रत्यक्षनिरीक्षणम्।",
    tourist_dashboard: "पर्यटकसुरक्षा", dashboard_subtitle: "फलकम्", dashboard_desc: "सुरक्षितरूपेण सञ्चरतु।",
    register_tourist: "पर्यटकपञ्जीकरणम्", register_tourist_desc: "सुरक्षाविवरणं रचयतु।",
    register_volunteer: "स्वयंसेवकपञ्जीकरणम्", register_volunteer_desc: "सुरक्षाजाले सम्मिलितो भवतु।",
    signin_phone: "दूरभाषेण प्रवेशः", signin_desc: "स्वकीयं पत्रं पुनः प्राप्नोतु।", official_passport: "आधिकारिकसुरक्षापत्रम्",
    verified: "प्रमाणितम्", phone_label: "दूरभाषः:", blood_group_label: "रक्तवर्गः:", emergency_contact_label: "आपत्कालीनसम्पर्कः:",
    stay_address_label: "निवासस्थानम्:", qr_hint: "💡 अत्र वास्तविकी आपत्कालीनसूचना वर्तते।", inside_safe_zone: "सुरक्षितमण्डले वर्तते",
    safe_perimeter_desc: "केन्द्रेण रक्षितं क्षेत्रम्।", outside_safe_zone: "⚠️ मण्डलाद्बहिः गतः", send_sos: "आपत्कालीनसन्देशं प्रेषयतु (SOS)",
    cancel_sos: "निरस्तं करोतु", emergency_assistance: "आपत्कालीनसाहाय्यम्", leave_zone: "✕ निष्क्रम्यताम्",
    leave_zone_desc: "विवरणं सर्वथा नङ्क्ष्यति।", edit_profile: "✏️ विवरणं संस्करोतु", log_out: "निर्गमनम्",
    refresh: "↻ नवीकरोतु", zone_command: "मण्डलनियन्त्रणम्:", total_in_zone: "कुलम्", active_tourists: "पर्यटकाः",
    volunteers_ready: "स्वयंsevकाः", active_zone_alerts: "आपत्संकेताः", safe_zone_editor: "🗺️ मण्डलसम्पादकः",
    save_geofence: "💾 सीमां रक्षतु", field_deployment: "⚡ प्रत्यक्षस्थानदर्शकम्", status_normal: "सामान्यम्",
    status_sos: "🚨 आपत्कालः", status_responder: "⚡ सहायको निकटे वर्तते", view_qr: "🔍 QR दृश्यताम्",
    view_id: "🔍 पत्रं पश्यतु", call_victim: "📞 सम्भाषताम्", command_route: "🗺️ नियन्त्रणमार्गः",
    volunteer_route: "🗺️ स्वयंsevकमार्गः", deploy_hq: "✓ दलं प्रेषयतु", stand_by: "✕ प्रतीक्षताम्",
    yes_assist: "✓ साहाय्यं करोमि", no_decline: "✕ न", safe_chilling: "✓ अहमत्र कुशल्यस्मि", need_help: "🚨 साहाय्यमपेक्षते",
    selfie_req_title: "📸 अनिवार्यम्: प्रत्यक्षचित्रप्रमाणीकरणम्", selfie_placeholder: "चित्रं न स्वीकृतम्",
    open_live_cam: "📷 प्रत्यक्षचित्रग्राहकं उद्घाटयतु", take_snapshot: "⚡ चित्रं स्वीकरोतु", retake_btn: "🔄 पुनः स्वीकरोतु",
    tap_open_cam: "📱 चित्रग्रहणाय अत्र स्पृशतु", name_label: "पूर्णनाम:", age_label: "वयः:",
    gender_label: "लिङ्गम्:", select_option: "चिनोतु", gender_male: "पुमान्", gender_female: "स्त्री", gender_other: "अन्यत्",
    dual_reg: "द्विविधपञ्जीकरणविकल्पः (पर्यटकः तथा स्वयंसेवकः)", complete_reg_btn: "पञ्जीकरणं समाप्य ब्लॉकचेने योजयतु",
    update_save_btn: "💾 विवरणं संशोध्य ब्लॉकचेने योजयतु", lang_select_label: "🌐 भाषां चिनोतु:",
    status_header: "स्थितिः", selfie_header: "स्वचित्रम्", digital_id_header: "अङ्कीयपत्रम्", role_label: "भूमिका", coords_header: "अक्षांशरेखांशाः"
  },
  ne: {
    ...BASE_EN,
    brand_title: "पर्यटक सुरक्षा", dynamic_grid: "डायनामिक ग्रिड", switch_portal: "पोर्टल बदल्नुहोस्",
    hero_heritage: "जियोफेंस र उद्धार सञ्जाल", access_control: "पहुँच नियन्त्रण", system: "प्रणाली",
    select_auth: "सुरक्षा ग्रिडमा प्रवेश गर्न स्तर रोज्नुहोस्।", public_entry: "सार्वजनिक प्रवेश",
    user_portal: "प्रयोगकर्ता पोर्टल", user_portal_desc: "सेल्फी प्रमाणीकरणका साथ डिजिटल पासपोर्ट पाउनुहोस्।",
    zone_authority: "क्षेत्र प्राधिकरण", staff_command: "कर्मचारी कमान्ड",
    staff_command_desc: "डिजिटल आईडी स्क्यान गर्नुहोस् र उद्धार टोली पठाउनुहोस्।", head_of_platform: "प्लेटफर्म प्रमुख",
    master_control: "मास्टर कन्ट्रोल", master_control_desc: "सबै क्षेत्रहरूको प्रत्यक्ष निगरानी।",
    tourist_dashboard: "पर्यटक सुरक्षा", dashboard_subtitle: "ड्यासबोर्ड", dashboard_desc: "सुरक्षित रूपमा यात्रा गर्नुहोस्।",
    register_tourist: "पर्यटक दर्ता", register_tourist_desc: "सुरक्षा प्रोफाइल बनाउनुहोस्।",
    register_volunteer: "स्वयंसेवक दर्ता", register_volunteer_desc: "सञ्जालमा जोडिनुहोस्।",
    signin_phone: "फोनबाट साइन इन", signin_desc: "आईडी पुन: प्राप्त गर्नुहोस्।", official_passport: "आधिकारिक डिजिटल पासपोर्ट",
    verified: "प्रमाणित", phone_label: "फोन:", blood_group_label: "रक्त समूह:", emergency_contact_label: "आपतकालीन सम्पर्क:",
    stay_address_label: "बस्ने ठेगाना:", qr_hint: "💡 वास्तविक आपतकालीन जानकारी छ।", inside_safe_zone: "सुरक्षित क्षेत्र भित्र",
    safe_perimeter_desc: "कमान्ड सेन्टरद्वारा निगरानी गरिएको क्षेत्र।", outside_safe_zone: "⚠️ सुरक्षित क्षेत्र बाहिर",
    send_sos: "आपतकालीन सहायता (SOS)", cancel_sos: "रद्द गर्नुहोस्", emergency_assistance: "आपतकालीन सहायता",
    leave_zone: "✕ क्षेत्र छोड्नुहोस्", leave_zone_desc: "डाटा मेटाइनेछ।", edit_profile: "✏️ प्रोफाइल सम्पादन",
    log_out: "लग आउट", refresh: "↻ ताजा गर्नुहोस्", zone_command: "कमान्ड:", total_in_zone: "जम्मा",
    active_tourists: "पर्यटकहरू", volunteers_ready: "स्वयंसेवकहरू", active_zone_alerts: "अलर्टहरू",
    safe_zone_editor: "🗺️ क्षेत्र सम्पादक", save_geofence: "💾 सीमा सुरक्षित गर्नुहोस्", field_deployment: "⚡ प्रत्यक्ष ट्र्याकर",
    status_normal: "सामान्य", status_sos: "🚨 आपतकाल", status_responder: "⚡ सहयोगी नजिक छ", view_qr: "🔍 QR हेर्नुहोस्",
    view_id: "🔍 आईडी", call_victim: "📞 कल गर्नुहोस्", command_route: "🗺️ कमान्ड मार्ग",
    volunteer_route: "🗺️ स्वयंसेवक मार्ग", deploy_hq: "✓ टोली पठाउनुहोस्", stand_by: "✕ पर्खनुहोस्",
    yes_assist: "✓ सहयोग गर्छु", no_decline: "✕ गर्दिन", safe_chilling: "✓ म सुरक्षित छु", need_help: "🚨 मलाई सहयोग चाहियो",
    selfie_req_title: "📸 आवश्यक: प्रत्यक्ष सेल्फी प्रमाणीकरण", selfie_placeholder: "सेल्फी अझै खिचिएको छैन",
    open_live_cam: "📷 प्रत्यक्ष क्यामेरा खोल्नुहोस्", take_snapshot: "⚡ फोटो खिच्नुहोस्", retake_btn: "🔄 पुन: खिच्नुहोस्",
    tap_open_cam: "📱 क्यामेरा खोल्न ट्याप गर्नुहोस्", name_label: "पूरा नाम:", age_label: "उमेर:",
    gender_label: "लिङ्ग:", select_option: "छान्नुहोस्", gender_male: "पुरुष", gender_female: "महिला", gender_other: "अन्य",
    dual_reg: "दोहोरो दर्ता विकल्प (पर्यटक र स्वयंसेवक)", complete_reg_btn: "दर्ता पूरा गर्नुहोस् र ब्लकचेनमा थप्नुहोस्",
    update_save_btn: "💾 प्रोफाइल अपडेट गर्नुहोस् र ब्लकचेन थप्नुहोस्", lang_select_label: "🌐 भाषा छान्नुहोस्:",
    status_header: "स्थिति", selfie_header: "सेल्फी", digital_id_header: "डिजिटल आईडी", role_label: "भूमिका", coords_header: "निर्देशाङ्क"
  },
  ko: {
    ...BASE_EN,
    brand_title: "पर्यटक सुरक्षा", dynamic_grid: "डायनामिक ग्रिड", switch_portal: "पोर्टल बदला",
    hero_heritage: "जिओफेन्स आनी बचाव यंत्रणा", access_control: "प्रवेश नियंत्रण", system: "व्यवस्था",
    select_auth: "प्रवेश पातळी निवडा.", public_entry: "सार्वजनिक प्रवेश", user_portal: "वापरपी पोर्टल",
    user_portal_desc: "सेल्फी पडताळणी करून डिजिटल पासपोर्ट मेळवा.", zone_authority: "झोन प्राधिकरण",
    staff_command: "स्टाफ कमांड", staff_command_desc: "आयडी स्कॅन करात आनी पंगड धाडात.", head_of_platform: "मुख्याधिकारी",
    master_control: "मास्टर कंट्रोल", master_control_desc: "सगळ्या झोनांची थेट देखरेख.", tourist_dashboard: "पर्यटक सुरक्षा",
    dashboard_subtitle: "डॅशबोर्ड", dashboard_desc: "सुरक्षीत भोंवडी करात.", register_tourist: "पर्यटक नोंदणी",
    register_tourist_desc: "सुरक्षा प्रोफाइल तयार करात.", register_volunteer: "स्वयंसेवक नोंदणी",
    register_volunteer_desc: "नेटवर्कांत वांटेकार जायात.", signin_phone: "फोन साइन इन", signin_desc: "आयडी परत मेळवा.",
    official_passport: "अधिकृत डिजिटल पासपोर्ट", verified: "प्रमाणीत", phone_label: "फोन:", blood_group_label: "रक्तगट:",
    emergency_contact_label: "आपत्कालीन संपर्क:", stay_address_label: "पत्ता:", qr_hint: "💡 खरी आपत्कालीन म्हायती आसा.",
    inside_safe_zone: "सुरक्षीत वाठारांत", safe_perimeter_desc: "कमांड सेंटर नियंत्रणातलो वाठार.",
    outside_safe_zone: "⚠️ वाठारा भायर", send_sos: "आपत्कालीन मदत (SOS)", cancel_sos: "रद्द करात",
    emergency_assistance: "आपत्कालीन आदार", leave_zone: "✕ वाठार सोडा", leave_zone_desc: "डेटा नश्ट जातलो.",
    edit_profile: "✏️ प्रोफाइल बदला", log_out: "लॉग आउट", refresh: "↻ रिफ्रेश", zone_command: "झोन कमांड:",
    total_in_zone: "एकूण", active_tourists: "पर्यटक", volunteers_ready: "स्वयंसेवक", active_zone_alerts: "धोके",
    safe_zone_editor: "🗺️ वाठार संपादक", save_geofence: "💾 सीमा सांबाळा", field_deployment: "⚡ थेट ट्रॅकर",
    status_normal: "सादारण", status_sos: "🚨 आपत्काल", status_responder: "⚡ मदतनीस लागीं आसा", view_qr: "🔍 QR पळयात",
    view_id: "🔍 आयडी", call_victim: "📞 कॉल करात", command_route: "🗺️ कमान मार्ग", volunteer_route: "🗺️ स्वयंसेवक मार्ग",
    deploy_hq: "✓ पंगड धाडात", stand_by: "✕ रावात", yes_assist: "✓ आदार करतां", no_decline: "✕ ना",
    safe_chilling: "✓ हांव सुरक्षीत आसां", need_help: "🚨 म्हाका आदार जाय", selfie_req_title: "📸 गरजेचें: थेट सेल्फी पडताळणी",
    selfie_placeholder: "सेल्फी अजून घेवंक ना", open_live_cam: "📷 थेट कॅमेरा उघडात", take_snapshot: "⚡ फोटो काढात",
    retake_btn: "🔄 परतून काढात", tap_open_cam: "📱 कॅमेरा उघडपाक टॅप करात", name_label: "पूर्ण नांव:", age_label: "पीय:",
    gender_label: "लिंग:", select_option: "निवडात", gender_male: "दादलो", gender_female: "बाय 절", gender_other: "हेर",
    dual_reg: "दुहेरी नोंदणी पर्याय (पर्यटक आनी स्वयंसेवक)", complete_reg_btn: "नोंदणी पूर्ण करात आनी ब्लॉकचेनांत जोडून घेयात",
    update_save_btn: "💾 प्रोफाइल अद्ययावत करात आनी ब्लॉकचेन जोडा", lang_select_label: "🌐 भास निवडात:",
    status_header: "स्थिती", selfie_header: "सेल्फी", digital_id_header: "डिजिटल आयडी", role_label: "भूमिका", coords_header: "स्थान निर्देश"
  },
  sd: {
    ...BASE_EN,
    brand_title: "سياحن جي حفاظت", dynamic_grid: "متحرڪ گرڊ", switch_portal: "پورٽل تبديل ڪريو",
    hero_heritage: "جيو فينس ۽ ريسڪيو نيٽ ورڪ", access_control: "پکڙ ضابطو", system: "نظام",
    select_auth: "سطح چونڊيو.", public_entry: "عوامي داخلا", user_portal: "استعمال ڪندڙ پورٽل",
    user_portal_desc: "سيلفي تصديق سان ڊجيٽل پاسپورٽ حاصل ڪريو.", zone_authority: "زون اختيار",
    staff_command: "اسٽاف ڪمانڊ", staff_command_desc: "آئي ڊي اسڪين ڪريو ۽ ٽيمون موڪليو.",
    head_of_platform: "پليٽ فارم چيف", master_control: "ماسٽر ڪنٽرول", master_control_desc: "سڀني زونز جي لائيو نگراني.",
    tourist_dashboard: "سياحن جي حفاظت", dashboard_subtitle: "ڊيش بورڊ", dashboard_desc: "محفوظ سفر ڪريو.",
    register_tourist: "سياح رجسٽريشن", register_tourist_desc: "پروفائل ٺاهيو.", register_volunteer: "رضاڪار رجسٽريشن",
    register_volunteer_desc: "نيٽ ورڪ ۾ شامل ٿيو.", signin_phone: "فون سان سائن ان", signin_desc: "آئي ڊي بحال ڪريو.",
    official_passport: "سرڪاري ڊجيٽل پاسپورٽ", verified: "تصديق ٿيل", phone_label: "فون:", blood_group_label: "رت جو گروپ:",
    emergency_contact_label: "هنگامي رابطو:", stay_address_label: "پتو:", qr_hint: "💡 اصل معلومات موجود آهي.",
    inside_safe_zone: "محفوظ علائقي اندر", safe_perimeter_desc: "نگراني هيٺ علائقو.", outside_safe_zone: "⚠️ علائقي کان ٻاهر",
    send_sos: "هنگامي مدد (SOS)", cancel_sos: "منسوخ ڪريو", emergency_assistance: "هنگامي مدد", leave_zone: "✕ علائقو ڇڏيو",
    leave_zone_desc: "ڊيٽا ختم ڪيو ويندو.", edit_profile: "✏️ پروفائل تبديل ڪريو", log_out: "لاگ آئوٽ", refresh: "↻ تازو ڪريو",
    zone_command: "ڪمانڊ:", total_in_zone: "ڪل", active_tourists: "سياح", volunteers_ready: "رضاڪار",
    active_zone_alerts: "خبرداريون", safe_zone_editor: "🗺️ ايڊيٽر", save_geofence: "💾 حد محفوظ ڪريو",
    field_deployment: "⚡ لائيو ٽريڪر", status_normal: "عام", status_sos: "🚨 هنگامي حالت",
    status_responder: "⚡ مددگار ويجهو آهي", view_qr: "🔍 QR ڏسو", view_id: "🔍 آئي ڊي", call_victim: "📞 ڪال ڪريو",
    command_route: "🗺️ ڪمانڊ رستو", volunteer_route: "🗺️ رضاڪار رستو", deploy_hq: "✓ ٽيم موڪليو",
    stand_by: "✕ انتظار ڪريو", yes_assist: "✓ مدد ڪريو", no_decline: "✕ نه", safe_chilling: "✓ محفوظ آهيان",
    need_help: "🚨 مدد گهرجي", selfie_req_title: "📸 لازمي: لائيو سيلفي تصديق", selfie_placeholder: "سيلفي اڃا نه ورتي وئي",
    open_live_cam: "📷 لائيو ڪيمرا کوليو", take_snapshot: "⚡ تصوير ڪڍو", retake_btn: "🔄 ٻيهر ڪڍو",
    tap_open_cam: "📱 ڪيمرا کولڻ لاءِ ٽيپ ڪريو", name_label: "پورو نالو:", age_label: "عمر:",
    gender_label: "جنس:", select_option: "چونڊيو", gender_male: "مرد", gender_female: "عورت", gender_other: "ٻيو",
    dual_reg: "ٻٽي رجسٽريشن اختيار (سياح ۽ رضاڪار)", complete_reg_btn: "رجسٽريشن مڪمل ڪريو ۽ بلاڪ چين ۾ شامل ڪريو",
    update_save_btn: "💾 پروفائل اپڊيٽ ڪريو ۽ بلاڪ چين جوڙيو", lang_select_label: "🌐 ٻولي چونڊيو:",
    status_header: "حالت", selfie_header: "سيلفي", digital_id_header: "ڊجيٽل آئي ڊي", role_label: "ڪردار", coords_header: "مقام جا تفصيل"
  },
  sat: {
    ...BASE_EN,
    brand_title: "ᱧᱮᱧᱮᱞᱤᱭᱟᱹ ᱨᱩᱠᱷᱤᱭᱟᱹ", dynamic_grid: "ᱰᱟᱭᱱᱟᱢᱤᱠ ᱜᱽᱨᱤᱰ", switch_portal: "ᱯᱳᱨᱴᱟᱞ ᱵᱚᱫᱚᱞ",
    hero_heritage: "ᱡᱤᱭᱳᱯᱷᱮᱱᱥ ᱟᱨ ᱵᱟᱧᱪᱟᱣ ᱡᱟᱞᱟᱢ", access_control: "ᱵᱚᱞᱚᱱ ᱫᱟᱵᱚᱱ", system: "ᱵᱮᱵᱚᱥᱛᱷᱟ",
    select_auth: "ᱛᱷᱟᱨ ᱵᱟᱪᱷᱟᱣ ᱢᱮ᱾", public_entry: "ᱥᱟᱱᱟᱢ ᱦᱚᱲ ᱵᱚᱞᱚᱱ", user_portal: "ᱵᱮᱵᱷᱟᱨᱤᱭᱟᱹ ᱯᱳᱨᱴᱟᱞ",
    user_portal_desc: "ᱥᱮᱞᱯᱷᱤ ᱛᱩᱞᱟᱹᱣ ᱠᱟᱛᱮ ᱰᱤᱡᱤᱴᱟᱞ ᱯᱟᱥᱯᱳᱨᱴ ᱦᱟᱛᱟᱣ ᱢᱮ᱾", zone_authority: "ᱴᱚᱴᱷᱟ ᱪᱟᱪᱞᱟᱣ",
    staff_command: "ᱠᱟᱹᱢᱤᱭᱟᱹ ᱠᱚᱢᱟᱱᱰ", staff_command_desc: "ᱟᱭᱰᱤ ᱧᱮᱞ ᱠᱟᱛᱮ ᱵᱟᱧᱪᱟᱣ ᱫᱚᱞ ᱠᱩᱞ ᱠᱚᱯᱮ᱾",
    head_of_platform: "ᱢᱩᱬᱩᱛ ᱪᱟᱪᱞᱟᱣᱤᱭᱟᱹ", master_control: "ᱢᱟᱥᱴᱟᱨ ᱠᱚᱱᱴᱨᱳᱞ", master_control_desc: "ᱥᱟᱱᱟᱢ ᱴᱚᱴᱷᱟ ᱧᱮᱞ ᱫᱚᱦᱚ᱾",
    tourist_dashboard: "ᱧᱮᱧᱮᱞᱤᱭᱟᱹ ᱨᱩᱠᱷᱤᱭᱟᱹ", dashboard_subtitle: "ᱰᱮᱥᱵᱳᱨᱰ", dashboard_desc: "ᱨᱩᱠᱷᱤᱭᱟᱹ ᱛᱮ ᱫᱟᱬᱟᱱ ᱢᱮ᱾",
    register_tourist: "ᱧᱮᱧᱮᱞᱤᱭᱟᱹ ᱧᱩᱛᱩᱢ ᱚᱞ", register_tourist_desc: "ᱯᱨᱳᱯᱷᱟᱭᱤᱞ ᱵᱮᱱᱟᱣ ᱢᱮ᱾",
    register_volunteer: "ᱜᱚᱜᱽᱲᱚᱭᱤᱡ ᱧᱩᱛᱩᱢ ᱚᱞ", register_volunteer_desc: "ᱡᱟᱞᱟᱢ ᱨᱮ ᱥᱮᱞᱮᱫᱚᱜ ᱢᱮ᱾",
    signin_phone: "ᱯᱷᱳᱱ ᱛᱮ ᱥᱟᱭᱤᱱ ᱤᱱ", signin_desc: "ᱟᱭᱰᱤ ᱨᱩᱣᱟᱹᱲ ᱦᱟᱛᱟᱣ ᱢᱮ᱾", official_passport: "ᱥᱚᱨᱠᱟᱨᱤ ᱰᱤᱡᱤᱴᱟᱞ ᱯᱟᱥᱯᱳᱨᱴ",
    verified: "ᱯᱩᱥᱴᱟᱹᱣ ᱟᱠᱟᱱ", phone_label: "ᱯᱷᱳᱱ:", blood_group_label: "ᱢᱟᱭᱟᱢ ᱜᱟᱫᱮᱞ:",
    emergency_contact_label: "ᱞᱟᱹᱠᱛᱤᱭᱟᱱ ᱥᱟᱹᱜᱟᱹᱭ:", stay_address_label: "ᱛᱟᱦᱮᱸᱱ ᱴᱷᱟᱶ:",
    qr_hint: "💡 ᱥᱟᱹᱨᱤ ᱠᱟᱛᱷᱟ ᱢᱮᱱᱟᱜᱼᱟ᱾", inside_safe_zone: "ᱨᱩᱠᱷᱤᱭᱟᱹ ᱴᱚᱴᱷᱟ ᱵᱷᱤᱛᱨᱤ",
    safe_perimeter_desc: "ᱧᱮᱞ ᱫᱚᱦᱚ ᱴᱚᱴᱷᱟ᱾", outside_safe_zone: "⚠️ ᱴᱚᱴᱷᱟ ᱵᱟᱦᱨᱮ", send_sos: "ᱜᱚᱲᱚ ᱠᱷᱚᱡᱽ ᱢᱮ (SOS)",
    cancel_sos: "ᱵᱟᱹᱜᱤ ᱢᱮ", emergency_assistance: "ᱞᱟᱹᱠᱛᱤᱭᱟᱱ ᱜᱚᱲᱚ", leave_zone: "✕ ᱴᱚᱴᱷᱟ ᱵᱟᱹᱜᱤ ᱢᱮ",
    leave_zone_desc: "ᱰᱮᱴᱟ ᱢᱮᱴᱟᱣᱜᱼᱟ᱾", edit_profile: "✏️ ᱥᱟᱯᱲᱟᱣ ᱢᱮ", log_out: "ᱚᱰᱚᱠᱚᱜ ᱢᱮ",
    refresh: "↻ ᱱᱟᱶᱟ ᱢᱮ", zone_command: "ᱠᱚᱢᱟᱱᱰ:", total_in_zone: "ᱢᱩᱴ", active_tourists: "ᱧᱮᱧᱮᱞᱤᱭᱟᱹ ᱠᱚ",
    volunteers_ready: "ᱜᱚᱜᱽᱲᱚᱭᱤᱡ ᱠᱚ", active_zone_alerts: "ᱦᱩᱥᱤᱭᱟᱹᱨ", safe_zone_editor: "🗺️ ᱴᱚᱴᱷᱟ ᱥᱟᱯᱲᱟᱣ",
    save_geofence: "💾 ᱥᱤᱢᱟᱹ ᱫᱚᱦᱚᱭ ᱢᱮ", field_deployment: "⚡ ᱞᱟᱭᱤᱵᱽ ᱴᱨᱮᱠᱟᱨ", status_normal: "ᱥᱟᱫᱷᱟᱨᱚᱱ",
    status_sos: "🚨 ᱟᱯᱚᱛ ᱚᱠᱛᱚ", status_responder: "⚡ ᱜᱚᱜᱽᱲᱚᱭᱤᱡ ᱥᱩᱨ ᱨᱮ", view_qr: "🔍 QR ᱧᱮᱞ",
    view_id: "🔍 ᱟᱭᱰᱤ ᱧᱮᱞ", call_victim: "📞 ᱯᱷᱳᱱ ᱢᱮ", command_route: "🗺️ ᱠᱚᱢᱟᱱᱰ ᱰᱟᱦᱟᱨ",
    volunteer_route: "🗺️ ᱜᱚᱜᱽᱲᱚ ᱰᱟᱦᱟᱨ", deploy_hq: "✓ ᱫᱚᱞ ᱠᱩᱞ ᱠᱚᱯᱮ", stand_by: "✕ ᱛᱟᱺᱜᱤ ᱢᱮ",
    yes_assist: "✓ ᱜᱚᱲᱚ ᱟᱹᱧ", no_decline: "✕ ᱵᱟᱝ", safe_chilling: "✓ ᱨᱩᱠᱷᱤᱭᱟᱹ ᱢᱮᱱᱟᱹᱧᱟ", need_help: "🚨 ᱜᱚᱲᱚ ᱫᱚᱨᱠᱟᱨ",
    selfie_req_title: "📸 ᱞᱟᱹᱠᱛᱤᱭᱟᱱ: ᱞᱟᱭᱤᱵᱽ ᱥᱮᱞᱯᱷᱤ ᱯᱩᱥᱴᱟᱹᱣ", selfie_placeholder: "ᱥᱮᱞᱯᱷᱤ ᱟᱹᱣᱨᱤ ᱦᱟᱛᱟᱣᱜᱼᱟ",
    open_live_cam: "📷 ᱠᱮᱢᱨᱟ ᱡᱷᱤᱡᱽ ᱢᱮ", take_snapshot: "⚡ ᱪᱤᱛᱟᱹᱨ ᱛᱩᱞᱟᱹᱣ ᱢᱮ", retake_btn: "🔄 ᱫᱚᱦᱲᱟ ᱛᱩᱞᱟᱹᱣ ᱢᱮ",
    tap_open_cam: "📱 ᱠᱮᱢᱨᱟ ᱡᱷᱤᱡᱽ ᱞᱟᱹᱜᱤᱫ ᱚᱛᱟᱭ ᱢᱮ", name_label: "ᱯᱩᱨᱟᱹ ᱧᱩᱛᱩᱢ:", age_label: "ᱩᱢᱮᱨ:",
    gender_label: "ᱡᱟᱱᱟᱝ:", select_option: "ᱵᱟᱪᱷᱟᱣ ᱢᱮ", gender_male: "ᱠᱚᱲᱟ", gender_female: "ᱠᱩᱲᱤ", gender_other: "ᱮᱴᱟᱜ",
    dual_reg: "ᱵᱟᱱᱟᱨ ᱧᱩᱛᱩᱢ ᱚᱞ (ᱧᱮᱧᱮᱞᱤᱭᱟᱹ ᱟᱨ ᱜᱚᱜᱽᱲᱚᱭᱤᱡ)", complete_reg_btn: "ᱧᱩᱛᱩᱢ ᱚᱞ ᱯᱩᱨᱟᱹᱣ ᱠᱟᱛᱮ ᱵᱞᱚᱠᱪᱮᱱ ᱨᱮ ᱥᱮᱞᱮᱫ ᱢᱮ",
    update_save_btn: "💾 ᱯᱨᱳᱯᱷᱟᱭᱤᱞ ᱥᱟᱯᱲᱟᱣ ᱠᱟᱛᱮ ᱵᱞᱚᱠᱪᱮᱱ ᱨᱮ ᱥᱮᱞᱮᱫ ᱢᱮ", lang_select_label: "🌐 ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ ᱢᱮ:",
    status_header: "ᱛᱷᱟᱨ", selfie_header: "ᱥᱮᱞᱯᱷᱤ", digital_id_header: "ᱰᱤᱡᱤᱴᱟᱞ ᱟᱭᱰᱤ", role_label: "ᱛᱷᱟᱨ", coords_header: "ᱴᱷᱟᱶ ᱞᱮᱠᱷᱟ"
  },
  ks: {
    ...BASE_EN,
    brand_title: "سیاحتی تحفظ", dynamic_grid: "متحرک گرڈ", switch_portal: "پورٹل بدلیو",
    hero_heritage: "جیو فینس تہٕ بچاو نیٹ ورک", access_control: "رسائی کنٹرول", system: "نظام",
    select_auth: "سطح ژاریو۔", public_entry: "عوامی داخلہ", user_portal: "صارف پورٹل",
    user_portal_desc: "سیلفی سٟتؠ تصدیق کٔرِتھ ڈیجیٹل پاسپورٹ حٲصل کٔریو۔", zone_authority: "زون اتھارٹی",
    staff_command: "سٹاف کمانڈ", staff_command_desc: "کارڈ سکین کٔریو تہٕ ٹیم سوزیو۔", head_of_platform: "پلیٹ فارم سربراہ",
    master_control: "ماسٹر کنٹرول", master_control_desc: "ساری زونن ہنز لائیو نگرانی۔", tourist_dashboard: "سیاحتی تحفظ",
    dashboard_subtitle: "ڈیش بورڈ", dashboard_desc: "محفوظ سفر کٔریو۔", register_tourist: "سیاح رجسٹریشن",
    register_tourist_desc: "پروفائل بناویو۔", register_volunteer: "رضاکار رجسٹریشن", register_volunteer_desc: "نیٹ ورکس منٛز شٲمل گژھیو۔",
    signin_phone: "فون سٟتؠ سائن ان", signin_desc: "کارڈ واپس حٲصل کٔریو۔", official_passport: "سرکاری ڈیجیٹل پاسپورٹ",
    verified: "تصدیق شدہ", phone_label: "فون:", blood_group_label: "بلڈ گروپ:", emergency_contact_label: "ہنگامی رابطہ:",
    stay_address_label: "پتہ:", qr_hint: "💡 اصل معلومات چھِ موجود۔", inside_safe_zone: "محفوظ زون منٛز",
    safe_perimeter_desc: "نگرانی تحت علاقہٕ۔", outside_safe_zone: "⚠️ زونہٕ نیبر", send_sos: "ہنگامی مدد (SOS)",
    cancel_sos: "منسوخ کٔریو", emergency_assistance: "ہنگامی مدد", leave_zone: "✕ زون ترویو", leave_zone_desc: "ڈیٹا ییہٕ مٹاونہٕ۔",
    edit_profile: "✏️ تبدیل کٔریو", log_out: "لاگ آوٹ", refresh: "↻ تازہ کٔریو", zone_command: "کمانڈ:",
    total_in_zone: "کل", active_tourists: "سیاح", volunteers_ready: "رضاکار", active_zone_alerts: "الرٹس",
    safe_zone_editor: "🗺️ زون ایڈیٹر", save_geofence: "💾 حد محفوظ کٔریو", field_deployment: "⚡ لائیو ٹریکر",
    status_normal: "عام", status_sos: "🚨 ایمرجنسی", status_responder: "⚡ مددگار چھُ نزدیٖک", view_qr: "🔍 QR وچھِو",
    view_id: "🔍 کارڈ وچھِو", call_victim: "📞 کال کٔریو", command_route: "🗺️ کمانڈ وتھ", volunteer_route: "🗺️ رضاکار وتھ",
    deploy_hq: "✓ ٹیم سوزیو", stand_by: "✕ انتظار کٔریو", yes_assist: "✓ مدد کرہٕ", no_decline: "✕ نہٕ",
    safe_chilling: "✓ بہٕ چھس محفوظ", need_help: "🚨 مےٚ چھےٚ مدد پأکار", selfie_req_title: "📸 لازمی: لائیو سیلفی تصدیق",
    selfie_placeholder: "سیلفی چھےٚ نہٕ آنہٕ آمٕژ", open_live_cam: "📷 لائیو کیمرہ کھولیو", take_snapshot: "⚡ تصویر کٔڈیو",
    retake_btn: "🔄 دوبارہ کٔڈیو", tap_open_cam: "📱 کیمرہ کھولنہٕ باپتھ دباویو", name_label: "پورا ناو:", age_label: "عمر:",
    gender_label: "جنس:", select_option: "ژاریو", gender_male: "مرد", gender_female: "زنان", gender_other: "بیترِ",
    dual_reg: "دوہری رجسٹریشن آپشن (سیاح تہٕ رضاکار)", complete_reg_btn: "رجسٹریشن مکمل کٔریو تہٕ بلاک چین منٛز درج کٔریو",
    update_save_btn: "💾 پروفائل اپ ڈیٹ کٔریو تہٕ بلاک چین منٛز جوڑیو", lang_select_label: "🌐 زبان ژاریو:",
    status_header: "حالت", selfie_header: "سیلفی", digital_id_header: "ڈیجیٹل کارڈ", role_label: "کردار", coords_header: "مقام"
  },
  doi: {
    ...BASE_EN,
    brand_title: "सैलानी सुरक्षा", dynamic_grid: "डाइनामिक ग्रिड", switch_portal: "पोर्टल बदलो",
    hero_heritage: "जियोफेंस ते बचाव ग्रिड", access_control: "प्रवेश नियंत्रण", system: "प्रणाली",
    select_auth: "पद्धर चुनो।", public_entry: "जनतक प्रवेश", user_portal: "यूजर पोर्टल",
    user_portal_desc: "सेल्फी सत्यापन कन्नै डिजिटल पासपोर्ट लैओ।", zone_authority: "जोन प्राधिकारी",
    staff_command: "स्टाफ कमान्ड", staff_command_desc: "आईडी स्कैन करो ते टीम भेजो।", head_of_platform: "प्लेटफार्म प्रमुख",
    master_control: "मास्टर कंट्रोल", master_control_desc: "सारे जोने दी निगरानी।", tourist_dashboard: "सैलानी सुरक्षा",
    dashboard_subtitle: "डैशबोर्ड", dashboard_desc: "सुरक्षित यात्रा करो।", register_tourist: "सैलानी पंजीकरण",
    register_tourist_desc: "प्रोफाइल बनाओ।", register_volunteer: "स्वयंसेवक पंजीकरण", register_volunteer_desc: "नेटवर्क च जुड़ो।",
    signin_phone: "फोन कन्नै साइन इन", signin_desc: "आईडी वापस लैओ।", official_passport: "सरकारी डिजिटल पासपोर्ट",
    verified: "प्रमाणित", phone_label: "फोन:", blood_group_label: "ब्लड ग्रुप:", emergency_contact_label: "आपातकालीन संपर्क:",
    stay_address_label: "पता:", qr_hint: "💡 असली जानकारी ऐ।", inside_safe_zone: "सुरक्षित क्षेत्र अंदर",
    safe_perimeter_desc: "निगरानी आह्ला क्षेत्र।", outside_safe_zone: "⚠️ क्षेत्र शा बाहर", send_sos: "आपातकालीन मदद (SOS)",
    cancel_sos: "रद्द करो", emergency_assistance: "आपातकालीन मदद", leave_zone: "✕ क्षेत्र छोड़ो",
    leave_zone_desc: "डेटा मिटाई दित्ता जाग।", edit_profile: "✏️ प्रोफाइल बदलो", log_out: "लॉग आउट",
    refresh: "↻ ताजा करो", zone_command: "कमान्ड:", total_in_zone: "कुल", active_tourists: "सैलानी",
    volunteers_ready: "स्वयंसेवक", active_zone_alerts: "अलर्ट", safe_zone_editor: "🗺️ क्षेत्र संपादक",
    save_geofence: "💾 सीमा बचाओ", field_deployment: "⚡ लाइव ट्रैकर", status_normal: "साधारण",
    status_sos: "🚨 आपातकाल", status_responder: "⚡ मददगार नेड़े ऐ", view_qr: "🔍 QR दिक्खो", view_id: "🔍 आईडी",
    call_victim: "📞 काल करो", command_route: "🗺️ कमान्ड रस्ता", volunteer_route: "🗺️ स्वयंसेवक रस्ता",
    deploy_hq: "✓ टीम भेजो", stand_by: "✕ रुको", yes_assist: "✓ मदद करग", no_decline: "✕ नेईं",
    safe_chilling: "✓ मैं सुरक्षित आँ", need_help: "🚨 मदद चाहिदी ऐ", selfie_req_title: "📸 जरूरी: लाइव सेल्फी सत्यापन",
    selfie_placeholder: "सेल्फी अजेईं नेईं लिती गेई", open_live_cam: "📷 लाइव कैमरा खोल्लो", take_snapshot: "⚡ फोटो खींचो",
    retake_btn: "🔄 परतियै लैओ", tap_open_cam: "📱 कैमरा खोल्लने लेई टैप करो", name_label: "पूरा नांय:", age_label: "उमर:",
    gender_label: "लिंग:", select_option: "चुनो", gender_male: "मर्द", gender_female: "जनानी", gender_other: "बकी",
    dual_reg: "दोहरी पंजीकरण विकल्प (सैलानी ते स्वयंसेवक)", complete_reg_btn: "पंजीकरण पूरा करो ते ब्लॉकचेन च जोड़ो",
    update_save_btn: "💾 प्रोफाइल अपडेट करो ते ब्लॉकचेन जोड़ो", lang_select_label: "🌐 बोली चुनो:",
    status_header: "स्थिति", selfie_header: "सेल्फी", digital_id_header: "डिजिटल आईडी", role_label: "भूमिका", coords_header: "स्थान"
  },
  mni: {
    ...BASE_EN,
    brand_title: "ট্যুরিষ্ট ঙাক-শেন", dynamic_grid: "দাইনামিক গ্রিদ", switch_portal: "পোর্তাল হোংদোকউ",
    hero_heritage: "জিওফেন্স অমসুং কনবা নেতৱার্ক", access_control: "চংবগী কাংলোন", system: "সিস্তেম",
    select_auth: "থা সম্লগ চংউ।", public_entry: "মীয়ামগী চংফম", user_portal: "য়ুজর পোর্তাল",
    user_portal_desc: "সেল্ফি চৎনহন্দুনা দিজিতেল পাসপোর্ত ল Louউ।", zone_authority: "জোন ওথোরিতি",
    staff_command: "স্তাফ কমান্দ", staff_command_desc: "আইদি য়েংশিন্দুনা তিম থারকউ।", head_of_platform: "মকোক থোংবা লুচিংবা",
    master_control: "মাস্তর কন্ত্রোল", master_control_desc: "জোন পুম্নমক্কী লাইভ য়েংশিনবা।", tourist_dashboard: "ট্যুরিষ্ট ঙাক-শেন",
    dashboard_subtitle: "দেশবোর্দ", dashboard_desc: "চেকশিন্না চৎথোক-চৎশিন তৌউ।", register_tourist: "ট্যুরিষ্ট রেজিস্ত্রেসন",
    register_tourist_desc: "প্রোফাইল শেম্মু।", register_volunteer: "ভোলেণ্টিয়র রেজিস্ত্রেসন", register_volunteer_desc: "নেতৱার্কতা য়াওউ।",
    signin_phone: "ফোন সাইন ইন", signin_desc: "আইদি হন্না ল Louউ।", official_passport: "ওফিসিএল দিজিতেল পাসপোর্ত",
    verified: "চেক তৌরবা", phone_label: "ফোন:", blood_group_label: "ইগী গ্রুপ:", emergency_contact_label: "অকক্নবা পাউফম:",
    stay_address_label: "লৈফম লৈরাং:", qr_hint: "💡 অচুম্বা পাউ য়াওরি।", inside_safe_zone: "শেফ জোন মনুংদা",
    safe_perimeter_desc: "য়েংশিল্লিবা মফম।", outside_safe_zone: "⚠️ জোন মপান্দা", send_sos: "তেংবাং পীবীয়ু (SOS)",
    cancel_sos: "তোকউ", emergency_assistance: "অকক্নবা তেংবাং", leave_zone: "✕ জোন থাদোকউ", leave_zone_desc: "দেতা মুত্থৎখিগনি।",
    edit_profile: "✏️ শেমদোকউ", log_out: "থোকপা", refresh: "↻ অনৌবা তৌউ", zone_command: "কমান্দ:",
    total_in_zone: "অপুনবা", active_tourists: "ট্যুরিষ্টশিং", volunteers_ready: "ভোলেণ্টিয়রশিং", active_zone_alerts: "চেকশিনৱা",
    safe_zone_editor: "🗺️ এদিতর", save_geofence: "💾 সেভ তৌউ", field_deployment: "⚡ লাইভ ত্রেকার", status_normal: "নোরমেল",
    status_sos: "🚨 ইমর্জেন্সী", status_responder: "⚡ তেংবাংবা নক্না লৈরে", view_qr: "🔍 QR য়েংউ", view_id: "🔍 আইদি য়েংউ",
    call_victim: "📞 কোল তৌউ", command_route: "🗺️ কমান্দ লম্বী", volunteer_route: "🗺️ ভোলেণ্টিয়র লম্বী", deploy_hq: "✓ তিম থারকউ",
    stand_by: "✕ ঙাইখরো", yes_assist: "✓ তেংবাংগনি", no_decline: "✕ নত্তে", safe_chilling: "✓ ঐ চেকশিন্না লৈরে",
    need_help: "🚨 তেংবাং পাম্মি", selfie_req_title: "📸 তঙাইফদে: লাইভ সেল্ফি য়েংশিনবা", selfie_placeholder: "সেল্ফি হৌজিকফাও লৌদ্রি",
    open_live_cam: "📷 লাইভ কেমেরা হাংদোকউ", take_snapshot: "⚡ ফোতো লৌউ", retake_btn: "🔄 অমুক হন্না লৌউ",
    tap_open_cam: "📱 কেমেরা হাংদোক্নবা নম্বীয়ু", name_label: "মপুং ফাবা মিং:", age_label: "চহী:",
    gender_label: "লৈবা:", select_option: "খনবীয়ু", gender_male: "নুপা", gender_female: "নুপী", gender_other: "অতোপ্পা",
    dual_reg: "রেজিস্ত্রেসন অপসন অনিমক (ট্যুরিষ্ট অমসুং ভোলেণ্টিয়র)", complete_reg_btn: "রেজিস্ত্রেসন লোইশিনবা অমসুং ব্লোকচেন্দা হাপচিনবা",
    update_save_btn: "💾 প্রোফাইল অপদেত তৌবা অমসুং ব্লোকচেন হাপচিনবা", lang_select_label: "🌐 লোন খনবীয়ু:",
    status_header: "ফিভম", selfie_header: "সেল্ফি", digital_id_header: "দিজিতেল আইদি", role_label: "থৌদাং", coords_header: "মফমগী পোল"
  },
  brx: {
    ...BASE_EN,
    brand_title: "दावबायग्रा रैखाथि", dynamic_grid: "डाइनामिक ग्रिड", switch_portal: "पर्टेल सोलाय",
    hero_heritage: "जियोफेन्स आरो उदां जाह्ला", access_control: "हाबनाय नेम", system: "राहा",
    select_auth: "थाखो सायख’।", public_entry: "गासैबो हाबनाय", user_portal: "बाहायग्रा पर्टेल",
    user_portal_desc: "सेल्फीजों दिजितेल् पास्पर्ट ला।", zone_authority: "ओनसोल खुंथाय",
    staff_command: "मावथि कमान्ड", staff_command_desc: "आइदि नायनानै हान्जा दैथाय।", head_of_platform: "गाहाय खुंगिरि",
    master_control: "मास्टार कन्ट्रल", master_control_desc: "गासै ओनसोलफोरखौ नायदिं।", tourist_dashboard: "दावबायग्रा रैखाथि",
    dashboard_subtitle: "डेसबर्ड", dashboard_desc: "रैखाथि गोनां दावबाय।", register_tourist: "दावबायग्रा मुं थिसन",
    register_tourist_desc: "प्रफाइल बानाय।", register_volunteer: "मदतकियारि मुं थिसन", register_volunteer_desc: "जाह्लायाव थाफा।",
    signin_phone: "फनजों साइन इन", signin_desc: "आइदि मोनफिन।", official_passport: "सोरखारि पास्पर्ट",
    verified: "नायबिजिरबाय", phone_label: "फन:", blood_group_label: "थै हान्जा:", emergency_contact_label: "गोनांथार फन:",
    stay_address_label: "थानाय थिकना:", qr_hint: "💡 थार खौरां दं।", inside_safe_zone: "रैखाथि ओनसोलाव",
    safe_perimeter_desc: "नायबिजिरनाय ओनसोल।", outside_safe_zone: "⚠️ ओनसोलनि बायजोआव", send_sos: "मदत हर (SOS)",
    cancel_sos: "नेवसि", emergency_assistance: "गोनांथार मदद", leave_zone: "✕ ओनसोल गार", leave_zone_desc: "डाटा हुगारगोन।",
    edit_profile: "✏️ प्रफाइल सोलाय", log_out: "अंखार", refresh: "↻ गोदान खालाम", zone_command: "कमान्ड:",
    total_in_zone: "गासै", active_tourists: "दावबायग्राफोर", volunteers_ready: "मदतकियारीफोर", active_zone_alerts: "सांग्रांथि",
    safe_zone_editor: "🗺️ ओनसोल सुजुगिरि", save_geofence: "💾 सिमा थिना दोन", field_deployment: "⚡ लाइभ ट्रेकार",
    status_normal: "सरासनस्रा", status_sos: "🚨 आफोद", status_responder: "⚡ मददगिरिया खाथियाव", view_qr: "🔍 QR नाय",
    view_id: "🔍 आइदि नाय", call_victim: "📞 कल खालाम", command_route: "🗺️ कमान्ड लाम", volunteer_route: "🗺️ मदत लाम",
    deploy_hq: "✓ हान्जा दैथाय", stand_by: "✕ नेना था", yes_assist: "✓ मदद खालामगोन", no_decline: "✕ नङा",
    safe_chilling: "✓ आं रैखाथिआव दं", need_help: "🚨 मदद नांगौ", selfie_req_title: "📸 गोनांथार: लाइभ सेल्फी नायबिजिरनाय",
    selfie_placeholder: "सेल्फी दासिमबो लायाखै", open_live_cam: "📷 लाइभ केमेरा खेव", take_snapshot: "⚡ फटो ला",
    retake_btn: "🔄 फिन ला", tap_open_cam: "📱 केमेरा खेवनो थु", name_label: "गासै मुं:", age_label: "बैसो:",
    gender_label: "लिंग:", select_option: "सायख’", gender_male: "हौवा", gender_female: "हिनजाव", gender_other: "गुबुन",
    dual_reg: "मुं थिसननाय विकल्प (दावबायग्रा आरो मददगिरि)", complete_reg_btn: "मुं थिसननाय जोबनाय आरो ब्लकचेनाव सोदेरनाय",
    update_save_btn: "💾 प्रफाइल गोदान खालाम आरो ब्लकचेन सोदेर", lang_select_label: "🌐 राव सायख’:",
    status_header: "थासारि", selfie_header: "सेल्फी", digital_id_header: "दिजितेल् आइदि", role_label: "बिथोन", coords_header: "थावनि"
  }
};

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

  // 1. Text elements with data-i18n
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.innerText = t[key];
  });

  // 2. Input Placeholders with data-i18n-placeholder
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key]) el.placeholder = t[key];
  });

  // 3. Direct ID mappings
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
