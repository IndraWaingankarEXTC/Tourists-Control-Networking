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
};

const LS_USER_ID_KEY = "touristSafetyUserId";
const LS_LANG_KEY = "touristSafetyLang";
const SS_STAFF_KEY = "touristSafetyStaffSession";
const SS_SUPERADMIN_KEY = "touristSafetySuperAdmin";

const TRANSLATIONS = {
  en: { eyebrow: "MULTI-DESTINATION DISPATCH & ID GRID", heroTitle1: "Access Control", heroTitle2: "System",
    heroSub: "Select your authorization tier to access live telemetry and safety ID cards.",
    publicEntry: "PUBLIC ENTRY", userPortal: "User Portal",
    userPortalDesc: "Register as a tourist or volunteer, generate digital safety ID card.",
    zoneAuthority: "ZONE AUTHORITY", staffCommand: "Staff Command",
    staffCommandDesc: "Monitor real-time alerts, configure desk phone, and broadcast WhatsApp dispatches.",
    headOfPlatform: "HEAD OF PLATFORM", masterControl: "Master Control",
    masterControlDesc: "Global oversight across all active tourist destinations." },
  hi: { eyebrow: "मल्टी-डेस्टिनेशन डिस्पैच और आईडी ग्रिड", heroTitle1: "एक्सेस कंट्रोल", heroTitle2: "सिस्टम",
    heroSub: "लाइव टेलीमेट्री और सुरक्षा आईडी कार्ड तक पहुँचने के लिए अपना अधिकार स्तर चुनें।",
    publicEntry: "सार्वजनिक प्रवेश", userPortal: "यूज़र पोर्टल",
    userPortalDesc: "पर्यटक या स्वयंसेवक के रूप में पंजीकरण करें, डिजिटल सुरक्षा आईडी कार्ड बनाएं।",
    zoneAuthority: "ज़ोन प्राधिकरण", staffCommand: "स्टाफ कमांड",
    staffCommandDesc: "रीयल-टाइम अलर्ट देखें, डेस्क फ़ोन सेट करें, और व्हाट्सएप डिस्पैच भेजें।",
    headOfPlatform: "प्लेटफ़ॉर्म प्रमुख", masterControl: "मास्टर कंट्रोल",
    masterControlDesc: "सभी सक्रिय पर्यटक गंतव्यों पर वैश्विक निगरानी।" },
  ur: { eyebrow: "ملٹی ڈسٹینیشن ڈسپیچ اینڈ آئی ڈی گرڈ", heroTitle1: "ایکسیس کنٹرول", heroTitle2: "سسٹم",
    heroSub: "لائیو ٹیلی میٹری اور سیفٹی آئی ڈی کارڈ تک رسائی کے لیے اپنا درجہ منتخب کریں۔",
    publicEntry: "عوامی رسائی", userPortal: "یوزر پورٹل",
    userPortalDesc: "بطور سیاح یا رضاکار رجسٹر کریں، ڈیجیٹل سیفٹی آئی ڈی کارڈ بنائیں۔",
    zoneAuthority: "زون اتھارٹی", staffCommand: "اسٹاف کمانڈ",
    staffCommandDesc: "ریئل ٹائم الرٹس دیکھیں، ڈیسک فون سیٹ کریں، اور واٹس ایپ ڈسپیچ بھیجیں۔",
    headOfPlatform: "پلیٹ فارم سربراہ", masterControl: "ماسٹر کنٹرول",
    masterControlDesc: "تمام فعال سیاحتی مقامات پر عالمی نگرانی۔" },
};
const RTL_LANGS = new Set(["ur"]);

function applyTranslation(lang){
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
  document.body.dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";
}

function setLanguage(lang){
  localStorage.setItem(LS_LANG_KEY, lang);
  applyTranslation(lang);
}

function showToast(message, type = "info"){
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

function setFormError(errorElId, message){
  const el = document.getElementById(errorElId);
  if (!el) return;
  if (!message){ el.style.display = "none"; el.textContent = ""; return; }
  el.style.display = "block";
  el.textContent = message;
}

function setButtonBusy(btn, busy, busyLabel, idleLabel){
  if (!btn) return;
  btn.disabled = busy;
  btn.textContent = busy ? busyLabel : idleLabel;
}

const ALL_PORTAL_IDS = ["portalGateway", "userPortal", "staffPortal", "superAdminPortal"];
const ZONE_LABELS = {
  portalGateway: "SECURE NETWORK",
  userPortal: "TOURIST SESSION",
  staffPortal: "STAFF COMMAND",
  superAdminPortal: "MASTER CONTROL",
};

function switchPortal(id){
  ALL_PORTAL_IDS.forEach(pid => {
    const el = document.getElementById(pid);
    if (el) el.style.display = pid === id ? "" : "none";
  });
  const navZone = document.getElementById("activeNavbarZone");
  if (navZone) navZone.textContent = ZONE_LABELS[id] || "SECURE NETWORK";
  closeModal();
}

const TOP_LEVEL_MODALS = new Set(["idCardModal", "sosVerificationModal"]);

function openModal(id){
  if (TOP_LEVEL_MODALS.has(id)){
    document.getElementById(id).style.display = "flex";
    return;
  }
  document.querySelectorAll("#modalOverlay .glass-modal, #modalOverlay .auth-modal")
    .forEach(sec => { sec.style.display = "none"; });
  document.getElementById("modalOverlay").style.display = "flex";
  document.getElementById(id).style.display = "block";
}

function closeModal(){
  document.getElementById("modalOverlay").style.display = "none";
  document.getElementById("idCardModal").style.display = "none";
  setFormError("staffAuthError", "");
  setFormError("superAdminAuthError", "");
  setFormError("signInError", "");
  setFormError("regError", "");
}

async function getAccurateGPS(){
  if (!navigator.geolocation) return state.userCoords;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.gpsIsReal = true;
        state.userCoords = {
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        };
        resolve(state.userCoords);
      },
      () => {
        showToast("Location permission denied — using an approximate default position.", "error");
        resolve(state.userCoords);
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  });
}

function haversineKm(lat1, lon1, lat2, lon2){
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function startLiveTracking(){
  if (!navigator.geolocation || state.locationWatchId !== null) return;
  state.locationWatchId = navigator.geolocation.watchPosition((pos) => {
    state.gpsIsReal = true;
    state.userCoords = {
      latitude: parseFloat(pos.coords.latitude.toFixed(6)),
      longitude: parseFloat(pos.coords.longitude.toFixed(6)),
    };
    if (state.touristMarker) state.touristMarker.setLatLng([state.userCoords.latitude, state.userCoords.longitude]);
  }, null, { enableHighAccuracy: true, maximumAge: 2000 });

  state.locationPushTimer = setInterval(async () => {
    const uid = localStorage.getItem(LS_USER_ID_KEY);
    if (!uid) return;
    try { await supabase.rpc("update_location", { p_user_id: uid, p_lat: state.userCoords.latitude, p_lng: state.userCoords.longitude }); }
    catch (e) { /* non-fatal */ }
  }, LOCATION_PUSH_MS);

  state.geofenceTimer = setInterval(checkGeofence, GEOFENCE_POLL_MS);
}

function stopLiveTracking(){
  if (state.locationWatchId !== null){ navigator.geolocation.clearWatch(state.locationWatchId); state.locationWatchId = null; }
  if (state.locationPushTimer){ clearInterval(state.locationPushTimer); state.locationPushTimer = null; }
  if (state.geofenceTimer){ clearInterval(state.geofenceTimer); state.geofenceTimer = null; }
}

function generateWhatsAppDistressPayload(user, coords, fromStaffDesk = null){
  const mapsUrl = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
  const deskInfo = fromStaffDesk ? `\n*Dispatched By HQ Desk:* ${fromStaffDesk}` : "";
  const message = `🚨 *EMERGENCY DISTRESS ALERT - TOURIST SAFETY GRID* 🚨\n\n*Name:* ${user.name}\n*Phone:* ${user.phone}\n*Zone:* ${user.zone_code || 'GLOBAL'}\n*Blood Group:* ${user.blood_group}\n*Coordinates:* ${coords.latitude}, ${coords.longitude}${deskInfo}\n\n*Live Radar Location:* ${mapsUrl}\n\n*Status:* Command units have been notified. Help is being coordinated.`;
  return encodeURIComponent(message);
}

function waLink(phone, encodedMsg){
  const digits = (phone || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodedMsg}`;
}

function renderWhatsAppLinks(containerId, recipients, encodedMsg, autoOpenFirst){
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  recipients.forEach((r, idx) => {
    if (!r.phone) return;
    const a = document.createElement("a");
    a.className = "wa-link-btn";
    a.href = waLink(r.phone, encodedMsg);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.innerHTML = `<span>${r.label}</span><span>📲 Send</span>`;
    container.appendChild(a);
    if (idx === 0 && autoOpenFirst){
      window.open(a.href, "_blank", "noopener,noreferrer");
    }
  });
}

async function triggerWhatsAppBroadcast(user, coords, fromStaffDesk = null){
  const encodedMsg = generateWhatsAppDistressPayload(user, coords, fromStaffDesk);
  const recipients = [
    { label: `Emergency Contact — ${user.emergency_contact_name || "Primary"}`, phone: user.emergency_contact_phone },
    { label: "Police Desk", phone: POLICE_TEST_DESK_NUMBER },
  ];
  if (state.geofenceZone?.desk_phone) {
    recipients.push({ label: `Zone HQ — ${user.zone_code}`, phone: state.geofenceZone.desk_phone });
  }
  const panel = document.getElementById("whatsappDispatchPanel");
  if (panel) panel.style.display = "block";
  renderWhatsAppLinks("whatsappLinksContainer", recipients, encodedMsg, true);
}

function initTouristMap(coords){
  const container = document.getElementById("touristMap");
  if (!container || typeof L === "undefined") return;
  if (state.touristMap){ state.touristMap.remove(); state.touristMap = null; }
  state.touristMap = L.map(container, { zoomControl: false, attributionControl: false })
    .setView([coords.latitude, coords.longitude], 14);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(state.touristMap);
  state.touristMarker = L.marker([coords.latitude, coords.longitude]).addTo(state.touristMap);
}

function drawGeofenceCircle(zone){
  if (!state.touristMap || !zone) return;
  if (state.geofenceCircle) state.touristMap.removeLayer(state.geofenceCircle);
  state.geofenceCircle = L.circle([zone.lat, zone.lng], {
    radius: (zone.radius_km || 5) * 1000,
    color: "#38bdf8", fillColor: "#38bdf8", fillOpacity: 0.08, weight: 1.5,
  }).addTo(state.touristMap);
}

function buildIdQrUrl(profile){
  const payload = JSON.stringify({
    id: profile.id, name: profile.name, phone: profile.phone,
    zone: profile.zone_code, blood: profile.blood_group,
    emergency: profile.emergency_contact_phone,
  });
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=6&data=${encodeURIComponent(payload)}`;
}

function renderIdCard(profile){
  document.getElementById("badgeName").textContent = profile.name || "--";
  document.getElementById("badgeRole").textContent = (profile.role || "--").toUpperCase();
  document.getElementById("badgeZone").textContent = profile.zone_code || "--";
  document.getElementById("badgePhone").textContent = profile.phone || "--";
  document.getElementById("badgeBlood").textContent = profile.blood_group || "--";
  document.getElementById("badgeEmerg").textContent = profile.emergency_contact_name
    ? `${profile.emergency_contact_name} (${profile.emergency_contact_phone})` : "--";
  document.getElementById("badgeQrCode").src = buildIdQrUrl(profile);
  const photoImg = document.getElementById("badgePhoto");
  const placeholder = document.getElementById("badgePhotoPlaceholder");
  if (profile.photo_url){
    photoImg.src = profile.photo_url; photoImg.style.display = "block"; placeholder.style.display = "none";
  } else {
    photoImg.style.display = "none"; placeholder.style.display = "flex";
  }
}

async function enterUserMode(){
  switchPortal("userPortal");
  const uid = localStorage.getItem(LS_USER_ID_KEY);
  if (uid){
    const loaded = await loadLoggedInUser(uid);
    if (!loaded) localStorage.removeItem(LS_USER_ID_KEY);
  } else {
    showLoggedOutUI();
  }
}

function showLoggedOutUI(){
  document.getElementById("loggedOutSection").style.display = "";
  document.getElementById("loggedInSection").style.display = "none";
  stopLiveTracking();
}

async function showLoggedInUI(profile){
  state.currentUserProfile = profile;
  document.getElementById("loggedOutSection").style.display = "none";
  document.getElementById("loggedInSection").style.display = "flex";
  document.getElementById("loggedInSection").style.flexDirection = "column";
  document.getElementById("activeUserZoneBadge").textContent = profile.zone_code || "--";
  document.getElementById("activeUserName").textContent = profile.name || "--";
  document.getElementById("activeUserRole").textContent = (profile.role || "--").toUpperCase();
  renderIdCard(profile);

  await getAccurateGPS();
  initTouristMap(state.userCoords);
  await loadGeofenceZone(profile.zone_code);
  startLiveTracking();
  checkGeofence();
}

async function loadLoggedInUser(userId){
  try {
    const { data, error } = await supabase.rpc("get_profile", { p_user_id: userId });
    if (error || !data) throw error || new Error("Profile not found");
    await showLoggedInUI(data);
    return true;
  } catch (e) {
    showToast("Could not restore your session — please sign in again.", "error");
    return false;
  }
}

function signOut(){
  localStorage.removeItem(LS_USER_ID_KEY);
  stopLiveTracking();
  state.currentUserProfile = null;
  state.activeSosAlertId = null;
  document.getElementById("whatsappDispatchPanel").style.display = "none";
  showLoggedOutUI();
}

async function loadGeofenceZone(zoneCode){
  try {
    const { data, error } = await supabase.rpc("get_zone_geofence", { p_zone: zoneCode });
    if (error || !data) throw error || new Error("No geofence data");
    state.geofenceZone = data;
    drawGeofenceCircle(data);
  } catch (e) {
    state.geofenceZone = null;
  }
}

async function checkGeofence(){
  if (!state.geofenceZone || !state.currentUserProfile) return;
  const dist = haversineKm(
    state.userCoords.latitude, state.userCoords.longitude,
    state.geofenceZone.lat, state.geofenceZone.lng
  );
  const inside = dist <= (state.geofenceZone.radius_km || 5);
  const banner = document.getElementById("geofenceBanner");
  const dot = document.getElementById("geofenceDot");
  const title = document.getElementById("geofenceTitle");
  const desc = document.getElementById("geofenceDesc");

  if (inside){
    banner.classList.remove("breach");
    dot.classList.remove("unsafe"); dot.classList.add("safe");
    title.textContent = "Inside Safe Zone";
    desc.textContent = "Monitored by local destination command center.";
  } else {
    banner.classList.add("breach");
    dot.classList.remove("safe"); dot.classList.add("unsafe");
    title.textContent = "Outside Safe Zone";
    desc.textContent = `${dist.toFixed(1)} km from the monitored boundary.`;
  }

  if (state.lastGeofenceState !== "unsafe" && !inside){
    promptSOSVerification(true);
  }
  state.lastGeofenceState = inside ? "safe" : "unsafe";
}

function promptSOSVerification(fromGeofenceBreach){
  state.sosFromGeofence = !!fromGeofenceBreach;
  openModal("sosVerificationModal");
}

async function handleVerificationResult(isSafe){
  document.getElementById("sosVerificationModal").style.display = "none";
  if (isSafe){
    if (state.sosFromGeofence) showToast("Understood — glad you're safe. Stay alert near the zone boundary.", "success");
    return;
  }
  await sendLiveSOS();
}

async function sendLiveSOS(){
  const uid = localStorage.getItem(LS_USER_ID_KEY);
  const profile = state.currentUserProfile;
  if (!uid || !profile){ showToast("You need to be signed in to send an SOS.", "error"); return; }

  const sosBtn = document.getElementById("sosBtn");
  const sosLabel = document.getElementById("sosLabel");
  sosBtn.classList.add("active");
  sosLabel.textContent = "SENDING SOS…";

  try {
    const { data, error } = await supabase.rpc("trigger_sos", {
      p_user_id: uid, p_lat: state.userCoords.latitude, p_lng: state.userCoords.longitude,
    });
    if (error) throw error;
    state.activeSosAlertId = data.alert_id;
    sosLabel.textContent = "SOS ACTIVE — HELP EN ROUTE";
    await triggerWhatsAppBroadcast(profile, state.userCoords, data.desk_phone || null);
    showToast("SOS sent. Command HQ and your emergency contact have been notified.", "success");
  } catch (e) {
    sosBtn.classList.remove("active");
    sosLabel.textContent = "SEND LIVE SOS";
    showToast("Could not send SOS — check your connection and try again.", "error");
  }
}

async function uploadProfilePhoto(file, phone){
  if (!file) return null;
  try {
    const ext = file.name.split(".").pop();
    const path = `${phone.replace(/[^0-9]/g, "")}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("tourist-photos").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("tourist-photos").getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (e) {
    showToast("Photo upload skipped — continuing registration without it.", "error");
    return null;
  }
}

function openRegistration(role){
  state.currentRole = role;
  document.getElementById("regTitle").textContent = role === "volunteer" ? "Register Volunteer" : "Register Tourist";
  document.getElementById("registrationForm").reset();
  setFormError("regError", "");
  openModal("registrationPage");
}

async function handleRegistrationSubmit(ev){
  ev.preventDefault();
  setFormError("regError", "");
  const btn = document.getElementById("regSubmitBtn");
  setButtonBusy(btn, true, "Registering…", "Complete Registration & Generate ID");

  const zone = document.getElementById("regZone").value.trim().toUpperCase();
  const name = document.getElementById("regName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const blood = document.getElementById("regBlood").value;
  const emergName = document.getElementById("regEmergName").value.trim();
  const emergPhone = document.getElementById("regEmergPhone").value.trim();
  const photoFile = document.getElementById("regPhoto").files[0] || null;

  try {
    await getAccurateGPS();
    const photoUrl = await uploadProfilePhoto(photoFile, phone);

    const { data, error } = await supabase.rpc("register_profile", {
      p_zone: zone, p_name: name, p_phone: phone, p_role: state.currentRole,
      p_blood: blood, p_emerg_name: emergName, p_emerg_phone: emergPhone,
      p_photo_url: photoUrl, p_lat: state.userCoords.latitude, p_lng: state.userCoords.longitude,
    });
    if (error) throw error;

    localStorage.setItem(LS_USER_ID_KEY, data.id);
    closeModal();
    await showLoggedInUI(data);
    openModal("idCardModal");
    showToast("Registration complete — your safety ID card is ready.", "success");
  } catch (e) {
    setFormError("regError", e.message?.includes("duplicate") || e.message?.includes("unique")
      ? "This phone number is already registered — try Sign In instead."
      : "Registration failed. Please check the details and try again.");
  } finally {
    setButtonBusy(btn, false, "Registering…", "Complete Registration & Generate ID");
  }
}

async function handleSignInSubmit(ev){
  ev.preventDefault();
  setFormError("signInError", "");
  const phone = document.getElementById("signInPhoneInput").value.trim();
  try {
    const { data, error } = await supabase.rpc("sign_in_by_phone", { p_phone: phone });
    if (error || !data) throw error || new Error("Not found");
    localStorage.setItem(LS_USER_ID_KEY, data.id);
    closeModal();
    await showLoggedInUI(data);
    showToast(`Welcome back, ${data.name}.`, "success");
  } catch (e) {
    setFormError("signInError", "No profile found for that phone number.");
  }
}

async function handleStaffAuthSubmit(ev){
  ev.preventDefault();
  setFormError("staffAuthError", "");
  const zone = document.getElementById("staffZoneInput").value.trim().toUpperCase();
  const phone = document.getElementById("staffPhoneInput").value.trim();
  const passcode = document.getElementById("staffPasscodeInput").value;

  try {
    await getAccurateGPS();
    const { data, error } = await supabase.rpc("zone_login", {
      p_zone: zone, p_phone: phone, p_passcode: passcode,
      p_lat: state.userCoords.latitude, p_lng: state.userCoords.longitude,
    });
    if (error) throw error;
    if (!data){ setFormError("staffAuthError", "Incorrect passcode for this zone."); return; }

    state.staffSession = { zone, phone, passcode };
    sessionStorage.setItem(SS_STAFF_KEY, JSON.stringify({ zone, phone }));
    document.getElementById("staffZoneDisplayHeader").textContent = zone;
    document.getElementById("staffPhoneDisplayHeader").textContent = phone;
    closeModal();
    switchPortal("staffPortal");
    await loadStaffData();
  } catch (e) {
    setFormError("staffAuthError", "Login failed — please try again.");
  }
}

function statusPillHtml(hasSos){
  return hasSos
    ? `<span class="status-pill sos"><span class="dot"></span>SOS</span>`
    : `<span class="status-pill safe"><span class="dot"></span>Safe</span>`;
}

async function loadStaffData(){
  if (!state.staffSession) return;
  try {
    const { data, error } = await supabase.rpc("staff_dashboard", {
      p_zone: state.staffSession.zone, p_passcode: state.staffSession.passcode,
    });
    if (error) throw error;

    const rows = data.users || [];
    const activeSos = data.active_sos || [];
    document.getElementById("mTotal").textContent = rows.length;
    document.getElementById("mTourists").textContent = rows.filter(r => r.role === "tourist").length;
    document.getElementById("mVolunteers").textContent = rows.filter(r => r.role === "volunteer").length;
    document.getElementById("mSOS").textContent = activeSos.length;

    const queue = document.getElementById("staffEmergencyQueue");
    const queueList = document.getElementById("staffEmergencyQueueList");
    queueList.innerHTML = "";
    if (activeSos.length){
      queue.style.display = "block";
      activeSos.forEach(a => {
        const wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px; background:rgba(0,0,0,0.2); padding:10px; border-radius:9px;";
        wrap.innerHTML = `<strong style="font-size:12.5px;">${a.name} — ${a.phone}</strong>`;
        const linkWrap = document.createElement("div");
        linkWrap.style.cssText = "display:flex; gap:6px; flex-wrap:wrap;";
        const encodedMsg = generateWhatsAppDistressPayload(a, { latitude: a.latitude, longitude: a.longitude }, state.staffSession.phone);
        [{ label: "Victim Contact", phone: a.emergency_contact_phone }, { label: "Police Desk", phone: POLICE_TEST_DESK_NUMBER }]
          .forEach(r => {
            if (!r.phone) return;
            const link = document.createElement("a");
            link.className = "wa-link-btn"; link.href = waLink(r.phone, encodedMsg);
            link.target = "_blank"; link.rel = "noopener noreferrer";
            link.innerHTML = `<span>${r.label}</span><span>📲</span>`;
            linkWrap.appendChild(link);
          });
        const resolveBtn = document.createElement("button");
        resolveBtn.className = "row-action-btn resolve";
        resolveBtn.textContent = "Mark Resolved";
        resolveBtn.onclick = () => resolveSosAlert(a.alert_id);
        wrap.appendChild(linkWrap);
        wrap.appendChild(resolveBtn);
        queueList.appendChild(wrap);
      });
    } else {
      queue.style.display = "none";
    }

    const tbody = document.getElementById("staffTableBody");
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${statusPillHtml(activeSos.some(a => a.user_id === r.id))}</td>
        <td>${r.name}</td>
        <td>${(r.role || "").toUpperCase()}</td>
        <td>${r.phone}</td>
        <td>${r.blood_group || "--"}</td>
        <td>${r.emergency_contact_name || "--"} (${r.emergency_contact_phone || "--"})</td>
        <td>${r.latitude != null ? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}` : "--"}</td>
        <td><a class="row-action-btn" href="tel:${r.phone}">Call</a></td>
      </tr>
    `).join("") || `<tr><td colspan="8" style="text-align:center; color:var(--text-lo);">No registrations yet for this zone.</td></tr>`;
  } catch (e) {
    showToast("Could not load zone data.", "error");
  }
}

async function resolveSosAlert(alertId){
  if (!state.staffSession) return;
  try {
    const { error } = await supabase.rpc("resolve_sos", {
      p_alert_id: alertId, p_zone: state.staffSession.zone, p_passcode: state.staffSession.passcode,
    });
    if (error) throw error;
    showToast("Alert marked resolved.", "success");
    await loadStaffData();
  } catch (e) {
    showToast("Could not resolve alert.", "error");
  }
}

function exitStaff(){
  state.staffSession = null;
  sessionStorage.removeItem(SS_STAFF_KEY);
  switchPortal("portalGateway");
}

async function handleSuperAdminAuthSubmit(ev){
  ev.preventDefault();
  setFormError("superAdminAuthError", "");
  const passcode = document.getElementById("superAdminPasscodeInput").value;
  try {
    const { data, error } = await supabase.rpc("superadmin_login", { p_passcode: passcode });
    if (error) throw error;
    if (!data){ setFormError("superAdminAuthError", "Incorrect master passcode."); return; }
    state.superAdminPasscode = passcode;
    sessionStorage.setItem(SS_SUPERADMIN_KEY, "1");
    closeModal();
    switchPortal("superAdminPortal");
    await loadSuperAdminData();
  } catch (e) {
    setFormError("superAdminAuthError", "Login failed — please try again.");
  }
}

async function loadSuperAdminData(){
  if (!state.superAdminPasscode) return;
  try {
    const { data, error } = await supabase.rpc("superadmin_dashboard", { p_passcode: state.superAdminPasscode });
    if (error) throw error;
    const rows = data.users || [];
    document.getElementById("saZones").textContent = new Set(rows.map(r => r.zone_code)).size;
    document.getElementById("saTotal").textContent = rows.length;
    document.getElementById("saSOS").textContent = (data.active_sos || []).length;

    const tbody = document.getElementById("superAdminTableBody");
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${r.zone_code || "--"}</td>
        <td>${statusPillHtml((data.active_sos || []).some(a => a.user_id === r.id))}</td>
        <td>${r.name}</td>
        <td>${(r.role || "").toUpperCase()}</td>
        <td>${r.phone}</td>
        <td>${r.latitude != null ? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}` : "--"}</td>
      </tr>
    `).join("") || `<tr><td colspan="6" style="text-align:center; color:var(--text-lo);">No registrations yet.</td></tr>`;
  } catch (e) {
    showToast("Could not load master control data.", "error");
  }
}

window.switchPortal = switchPortal;
window.openModal = openModal;
window.closeModal = closeModal;
window.setLanguage = setLanguage;
window.enterUserMode = enterUserMode;
window.openRegistration = openRegistration;
window.signOut = signOut;
window.promptSOSVerification = promptSOSVerification;
window.handleVerificationResult = handleVerificationResult;
window.loadStaffData = loadStaffData;
window.exitStaff = exitStaff;
window.loadSuperAdminData = loadSuperAdminData;

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem(LS_LANG_KEY) || "en";
  document.getElementById("langSelect").value = savedLang;
  applyTranslation(savedLang);

  document.getElementById("registrationForm").addEventListener("submit", handleRegistrationSubmit);
  document.getElementById("userSignInForm").addEventListener("submit", handleSignInSubmit);
  document.getElementById("staffAuthForm").addEventListener("submit", handleStaffAuthSubmit);
  document.getElementById("superAdminAuthForm").addEventListener("submit", handleSuperAdminAuthSubmit);

  const savedStaff = sessionStorage.getItem(SS_STAFF_KEY);
  if (savedStaff){
    try {
      const { zone, phone } = JSON.parse(savedStaff);
      document.getElementById("staffZoneInput").value = zone || "";
      document.getElementById("staffPhoneInput").value = phone || "";
    } catch (e) { /* ignore malformed session cache */ }
  }
});
