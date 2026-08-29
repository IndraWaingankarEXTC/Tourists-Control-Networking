import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

// ==========================================
// 1. SUPABASE & LOCAL-FIRST DATABASE ENGINE
// ==========================================
const SUPABASE_URL = "https://ccjygeoxaoomhonwenqw.supabase.co";
const SUPABASE_KEY = "sb_publishable_rPFLHItf9TI4P_i14P5bqw_tD5dz6mk";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SUPERADMIN_PASSCODE = "SUPERADMIN2026";

class LocalDatabaseEngine {
  constructor() {
    this.zonesKey = "local_db_zones";
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
// 2. SUBTLE CURSOR-RESPONSIVE WALLPAPER
// ==========================================
function initCursorWallpaper() {
  const plane = document.getElementById("bgPlaneA");
  const ambient = document.getElementById("cursorAmbient");
  if (!plane) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = 0;
  let currentY = 0;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (ambient) {
      ambient.style.setProperty("--mouse-x", `${mouseX}px`);
      ambient.style.setProperty("--mouse-y", `${mouseY}px`);
    }
  });

  function renderWallpaper() {
    // Very subtle parallax displacement: max ~12px shift
    const targetX = (mouseX / window.innerWidth - 0.5) * -18;
    const targetY = (mouseY / window.innerHeight - 0.5) * -18;

    // Linear interpolation for smooth glide
    currentX += (targetX - currentX) * 0.05;
    currentY += (targetY - currentY) * 0.05;

    plane.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(1.03)`;
    requestAnimationFrame(renderWallpaper);
  }
  requestAnimationFrame(renderWallpaper);
}

// ==========================================
// 3. HARDWARE CAMERA & LIVE SELFIE ENGINE
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
    alert("Live camera streaming is not supported on this browser. Use '📱 Tap to Open Camera'.");
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
// 4. QR CODE & VERIFICATION
// ==========================================
function formatProfileDataForQR(profile) {
  const roles = [profile.is_tourist ? "Tourist" : "", profile.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ") || "User";
  const em1 = profile.emergency_contact_1 ? `${profile.emergency_contact_1} (${profile.emergency_phone_1 || 'N/A'})` : "None";
  const em2 = profile.emergency_contact_2 ? `${profile.emergency_contact_2} (${profile.emergency_phone_2 || 'N/A'})` : "None";

  return `TOURIST SAFETY PASSPORT
Name: ${profile.name || 'N/A'}
Role: ${roles}
Zone: ${profile.zone_code || 'UNASSIGNED'}
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
// 5. GPS & LEAFLET ENGINE
// ==========================================
let verifiedGpsCoords = null;
let isEmergencyActive = false;
let emergencyInterval = null;
let touristOverviewMapInstance = null;
let touristOverviewMarker = null;
let touristOverviewGeofenceCircle = null;
let staffGeofenceMapInstance = null;
let staffGeofenceCircle = null;
let staffGeofenceCenterMarker = null;
let activeZoneGeofence = { latitude: 18.9894, longitude: 73.1175, radiusKm: 2.5 };
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
      { enableHighAccuracy: true, timeout: 3000 }
    );
  });
}

// ==========================================
// 6. ACTION DISPATCH & GEOFENCE CONTROLS
// ==========================================
window.acceptRescueMission = function() {
  const prompt = document.getElementById('hudDispatchPrompt');
  const compass = document.getElementById('hudCompassView');
  if (prompt) prompt.style.display = 'none';
  if (compass) compass.style.display = 'block';
};

window.declineRescueMission = function() {
  const hud = document.getElementById('volunteerHudWidget');
  if (hud) hud.style.display = 'none';
};

window.closeCompassView = function() {
  const hud = document.getElementById('volunteerHudWidget');
  if (hud) hud.style.display = 'none';
};

window.dismissSafetyCheckin = function(isSafe) {
  const modal = document.getElementById('safetyCheckinModal');
  if (modal) modal.style.display = 'none';
  if (!isSafe) window.handleSOSToggle();
};

window.updateGeofenceRadiusFromSlider = function(val) {
  const badge = document.getElementById('currentRadiusBadge');
  if (badge) badge.innerText = `Radius: ${val} km`;
  activeZoneGeofence.radiusKm = parseFloat(val);
  if (staffGeofenceCircle) {
    staffGeofenceCircle.setRadius(activeZoneGeofence.radiusKm * 1000);
  }
};

window.saveGeofenceConfiguration = function() {
  const currentZone = sessionStorage.getItem("staffZoneCode") || "MOUNT-PARK";
  localDB.update("zones", "zone_code", currentZone, {
    geofence_radius_km: activeZoneGeofence.radiusKm,
    geofence_lat: activeZoneGeofence.latitude,
    geofence_lon: activeZoneGeofence.longitude
  });
  alert(`Geofence boundary saved: ${activeZoneGeofence.radiusKm} km radius for Zone ${currentZone}`);
};

// ==========================================
// 7. NAVIGATION & PORTALS
// ==========================================
window.switchPortal = function(portalId) {
  window.stopLiveCameraStream();
  ['portalGateway', 'userPortal', 'staffPortal', 'superAdminPortal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === portalId) ? 'block' : 'none';
  });
  window.closeModal();

  setTimeout(() => {
    if (portalId === 'userPortal' && touristOverviewMapInstance) touristOverviewMapInstance.invalidateSize();
    if (portalId === 'staffPortal' && staffGeofenceMapInstance) staffGeofenceMapInstance.invalidateSize();
  }, 200);
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
  if (overlay) overlay.style.display = "flex";
  if (reg) reg.style.display = "block";
  if (title) title.innerText = role === "tourist" ? "Tourist Registration" : "Volunteer Registration";
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
// 8. PROFILE EDITING & SOS DISPATCH
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

window.handleSOSToggle = async function() {
  const userId = localStorage.getItem("touristSafetyUserId");
  if (!userId) {
    alert("Please register or sign in before broadcasting an SOS signal.");
    window.openRegistration("tourist");
    return;
  }

  isEmergencyActive = !isEmergencyActive;
  const label = document.getElementById("sosLabel");
  const dot = document.getElementById("geofenceDot");
  const title = document.getElementById("geofenceStatusTitle");

  const coords = await getLiveGpsCoordinates();
  const myZone = document.getElementById("activeUserZoneCodeBadge")?.innerText || "MOUNT-PARK";

  if (isEmergencyActive) {
    if (label) label.innerText = "CANCEL SOS (ACTIVE)";
    if (dot) { dot.className = "geofence-indicator-dot breach"; }
    if (title) title.innerText = "⚠️ SOS ALERT ACTIVE";
    triggerVisualAlarm(true);

    localDB.insert("sos_events", { user_id: userId, zone_code: myZone, latitude: coords.latitude, longitude: coords.longitude, status: "ACTIVE" });
    try { await supabase.from("sos_events").insert({ user_id: userId, zone_code: myZone, latitude: coords.latitude, longitude: coords.longitude, status: "ACTIVE" }); } catch {}
  } else {
    if (label) label.innerText = "SEND LIVE SOS";
    if (dot) { dot.className = "geofence-indicator-dot safe"; }
    if (title) title.innerText = "Inside Safe Zone";
    triggerVisualAlarm(false);

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
  const coords = await getLiveGpsCoordinates();
  const mapContainer = document.getElementById("touristOverviewMap");
  if (!mapContainer) return;

  if (!touristOverviewMapInstance) {
    touristOverviewMapInstance = L.map('touristOverviewMap').setView([coords.latitude, coords.longitude], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(touristOverviewMapInstance);
  }

  if (!touristOverviewMarker) {
    touristOverviewMarker = L.marker([coords.latitude, coords.longitude]).addTo(touristOverviewMapInstance).bindPopup("<b>You (Current Position)</b>");
  } else {
    touristOverviewMarker.setLatLng([coords.latitude, coords.longitude]);
  }

  if (!touristOverviewGeofenceCircle) {
    touristOverviewGeofenceCircle = L.circle([coords.latitude, coords.longitude], {
      color: '#22c55e',
      fillColor: '#22c55e',
      fillOpacity: 0.15,
      radius: activeZoneGeofence.radiusKm * 1000
    }).addTo(touristOverviewMapInstance);
  }

  setTimeout(() => touristOverviewMapInstance.invalidateSize(), 200);
}

function initStaffGeofenceMap() {
  const mapContainer = document.getElementById("staffGeofenceEditorMap");
  if (!mapContainer) return;

  if (!staffGeofenceMapInstance) {
    staffGeofenceMapInstance = L.map('staffGeofenceEditorMap').setView([activeZoneGeofence.latitude, activeZoneGeofence.longitude], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(staffGeofenceMapInstance);
  }

  if (!staffGeofenceCenterMarker) {
    staffGeofenceCenterMarker = L.marker([activeZoneGeofence.latitude, activeZoneGeofence.longitude], { draggable: true })
      .addTo(staffGeofenceMapInstance)
      .bindPopup("HQ Safe Zone Center (Drag to re-center)");

    staffGeofenceCenterMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      activeZoneGeofence.latitude = pos.lat;
      activeZoneGeofence.longitude = pos.lng;
      if (staffGeofenceCircle) staffGeofenceCircle.setLatLng(pos);
    });
  }

  if (!staffGeofenceCircle) {
    staffGeofenceCircle = L.circle([activeZoneGeofence.latitude, activeZoneGeofence.longitude], {
      color: '#22c55e',
      fillColor: '#22c55e',
      fillOpacity: 0.2,
      radius: activeZoneGeofence.radiusKm * 1000
    }).addTo(staffGeofenceMapInstance);
  }

  setTimeout(() => staffGeofenceMapInstance.invalidateSize(), 200);
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

  sessionStorage.removeItem("staffAuthenticated");
  alert(`Destination Zone '${currentZone}' deleted successfully.`);
  window.switchPortal("portalGateway");
};

window.handleSelfOptOut = async function() {
  const userId = localStorage.getItem("touristSafetyUserId");
  if (!userId) return;

  if (!confirm("Permanently delete your profile, selfie, and location telemetry?")) return;

  localDB.delete("profiles", "id", userId);
  localDB.delete("sos_events", "user_id", userId);
  try { await supabase.from("profiles").delete().eq("id", userId); } catch {}

  localStorage.removeItem("touristSafetyUserId");
  alert("Your identity and telemetry have been completely purged.");
  window.switchPortal("portalGateway");
};

// ==========================================
// 9. MONITORING DATA LOADERS
// ==========================================
window.loadStaffMonitoringData = async function() {
  const tableBody = document.getElementById("staffTableBody");
  if (!tableBody) return;
  const currentZone = sessionStorage.getItem("staffZoneCode") || "MOUNT-PARK";
  const header = document.getElementById("staffZoneDisplayHeader");
  if (header) header.innerText = currentZone;

  initStaffGeofenceMap();

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
        <td>${isCriticalSOS ? '<span class="status-tag tag-red">🚨 SOS ACTIVE</span>' : '<span class="status-tag tag-green">Normal</span>'}</td>
        <td><img src="${p.photo_url || DEFAULT_AVATAR}" class="table-avatar-img" alt="Selfie"></td>
        <td>
          <button class="table-action-edit-btn" style="background:#ffd000; color:#000; font-weight:700;" onclick="inspectUserProfileQR('${profileJsonEncoded}')">
            🔍 View ID
          </button>
        </td>
        <td><strong>${p.name || 'Anonymous'}</strong></td>
        <td>${roleBadge || 'User'}</td>
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
  if (!tableBody) return;

  let profiles = localDB.get("profiles");
  try {
    const { data } = await supabase.from("profiles").select("*");
    if (data && data.length > 0) profiles = data;
  } catch {}

  document.getElementById("saZonesCount").innerText = localDB.get("zones").length;
  document.getElementById("saTouristsCount").innerText = profiles.filter(p => p.is_tourist).length;
  document.getElementById("saSOSCount").innerText = localDB.get("sos_events").filter(s => s.status === "ACTIVE").length;

  if (profiles.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="11" style="text-align:center; opacity:0.7;">No profiles in system.</td></tr>`;
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
// 10. DOM EVENT ATTACHMENTS
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
  initCursorWallpaper();

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

  const createZoneForm = document.getElementById("createZoneForm");
  if (createZoneForm) {
    createZoneForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = document.getElementById("newZoneCode").value.trim().toUpperCase();
      const name = document.getElementById("newZoneName").value.trim();
      const phone = document.getElementById("newZonePhone").value.trim();
      const passcode = document.getElementById("newZonePasscode").value.trim();

      localDB.insert("zones", {
        zone_code: code,
        zone_name: name,
        contact_phone: phone,
        passcode: passcode,
        geofence_lat: 18.9894,
        geofence_lon: 73.1175,
        geofence_radius_km: 2.5
      });

      alert(`Zone '${code}' registered successfully.`);
      window.openStaffModal();
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
      btn.innerText = "Activating Safety ID...";

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
        is_tourist: isTourist,
        is_volunteer: isVolunteer,
        latitude: coords.latitude,
        longitude: coords.longitude
      };

      localDB.insert("profiles", payload);
      try { await supabase.from("profiles").insert(payload); } catch (err) {}

      localStorage.setItem("touristSafetyUserId", payload.id);
      window.stopLiveCameraStream();
      document.getElementById("registrationPage").style.display = "none";
      document.getElementById("successPage").style.display = "block";
      regForm.reset();
      updateUserStateView();
      btn.disabled = false;
      btn.innerText = "Complete Registration & Activate ID";
    });
  }

  const editProfileForm = document.getElementById("editProfileForm");
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const profileId = document.getElementById("editProfileId").value;
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
        home_address: document.getElementById("homeAddress").value.trim(),
        is_tourist: document.getElementById("editIsTourist").checked,
        is_volunteer: document.getElementById("editIsVolunteer").checked
      };

      if (updatedSelfie) updates.photo_url = updatedSelfie;

      localDB.update("profiles", "id", profileId, updates);
      try { await supabase.from("profiles").update(updates).eq("id", profileId); } catch {}

      window.stopLiveCameraStream();
      alert("Profile updated successfully!");
      window.closeModal();
      updateUserStateView();
    });
  }
});
