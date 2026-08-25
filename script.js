import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// 1. SUPABASE INITIALIZATION
const SUPABASE_URL = "https://ccjygeoxaoomhonwenqw.supabase.co";
const SUPABASE_KEY = "sb_publishable_rPFLHItf9TI4P_i14P5bqw_tD5dz6mk";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SUPERADMIN_PASSCODE = "SUPERADMIN2026";
const POLICE_TEST_DESK_NUMBER = "+918591314313";

let currentRole = "tourist";
let isEmergency = false;
let userCoords = { latitude: 18.9894, longitude: 73.1175 };
let currentUserProfile = null;
let touristMap = null;
let touristMarker = null;

// 2. HARDWARE GPS RESOLVER
async function getAccurateGPS() {
  if (!navigator.geolocation) return userCoords;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userCoords = {
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6))
        };
        resolve(userCoords);
      },
      (err) => resolve(userCoords),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
}

if (navigator.geolocation) {
  navigator.geolocation.watchPosition((pos) => {
    userCoords = {
      latitude: parseFloat(pos.coords.latitude.toFixed(6)),
      longitude: parseFloat(pos.coords.longitude.toFixed(6))
    };
    const uid = localStorage.getItem("touristSafetyUserId");
    if (uid) {
      supabase.from("locations").insert({
        user_id: uid,
        latitude: userCoords.latitude,
        longitude: userCoords.longitude
      });
    }
  }, null, { enableHighAccuracy: true, maximumAge: 2000 });
}

// 3. WHATSAPP DISPATCH PAYLOAD GENERATOR
function generateWhatsAppDistressPayload(user, coords, fromStaffDesk = null) {
  const mapsUrl = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
  const deskInfo = fromStaffDesk ? `\n*Dispatched By HQ Desk:* ${fromStaffDesk}` : "";
  const message = `🚨 *EMERGENCY DISTRESS ALERT - TOURIST SAFETY GRID* 🚨\n\n*Name:* ${user.name}\n*Phone:* ${user.phone}\n*Zone:* ${user.zone_code || 'GLOBAL'}\n*Blood Group:* ${user.blood_group}\n*Coordinates:* ${coords.latitude}, ${coords.longitude}${deskInfo}\n\n*Live Radar Location:* ${mapsUrl}\n\n*Status:* Command units have confirmed rescue deployment. Help is en route!`;
  return encodeURIComponent(message);
}

function triggerWhatsAppBroadcast(user, coords, fromStaffDesk = null) {
  const encodedMsg = generateWhatsAppDistressPayload(user, coords, fromStaffDesk);
  const contactPhone = (user.emergency_phone_1 || "").replace(/[^0-9+]/g, '');
  const policeDeskPhone = POLICE_TEST_DESK_NUMBER.replace(/[^0-9+]/g, '');

  const contactUrl = `https://api.whatsapp.com/send?phone=${contactPhone}&text=${encodedMsg}`;
  const policeUrl = `https://api.whatsapp.com/send?phone=${policeDeskPhone}&text=${encodedMsg}`;

  const container = document.getElementById("whatsappLinksContainer");
  const panel = document.getElementById("whatsappDispatchPanel");
  if (container && panel) {
    panel.style.display = "block";
    container.innerHTML = `
      <a href="${contactUrl}" target="_blank" class="whatsapp-btn">📲 Notify Emergency Contact (${user.emergency_contact_1})</a>
      <a href="${policeUrl}" target="_blank" class="whatsapp-btn" style="background:#0284c7;">🚔 Notify Safety Police Desk (+91 8591314313)</a>
    `;
  }
}

// 4. SOS VERIFICATION & MISTAKE HANDLING
window.promptSOSVerification = function () {
  if (isEmergency) {
    window.toggleSOS(false);
  } else {
    document.getElementById("sosVerificationModal").style.display = "flex";
  }
};

window.handleVerificationResult = function (isSafeOrMistake) {
  document.getElementById("sosVerificationModal").style.display = "none";
  if (isSafeOrMistake) {
    alert("Confirmation received: You are safe. Distress broadcast aborted.");
  } else {
    window.toggleSOS(true);
  }
};

window.toggleSOS = async function (forceActiveState) {
  const uid = localStorage.getItem("touristSafetyUserId");
  if (!uid) return alert("Please sign in first.");

  isEmergency = forceActiveState !== undefined ? forceActiveState : !isEmergency;
  const label = document.getElementById("sosLabel");
  label.innerText = isEmergency ? "CANCEL SOS (ACTIVE)" : "SEND LIVE SOS";
  document.body.classList.toggle("emergency-flash", isEmergency);

  const coords = await getAccurateGPS();
  if (isEmergency) {
    await supabase.from("sos_events").insert({
      user_id: uid,
      latitude: coords.latitude,
      longitude: coords.longitude,
      status: "ACTIVE"
    });

    if (currentUserProfile) {
      triggerWhatsAppBroadcast(currentUserProfile, coords);
    }
  } else {
    await supabase.from("sos_events").update({ status: "RESOLVED" }).eq("user_id", uid);
    const panel = document.getElementById("whatsappDispatchPanel");
    if (panel) panel.style.display = "none";
  }
};

// 5. DIGITAL ID CARD GENERATOR
function populateIDBadge(user) {
  document.getElementById("badgeName").innerText = user.name;
  document.getElementById("badgeRole").innerText = user.is_tourist ? "TOURIST" : "VOLUNTEER";
  document.getElementById("badgeZone").innerText = user.zone_code || "GLOBAL";
  document.getElementById("badgePhone").innerText = user.phone;
  document.getElementById("badgeBlood").innerText = user.blood_group || "N/A";
  document.getElementById("badgeEmerg").innerText = `${user.emergency_contact_1} (${user.emergency_phone_1})`;

  const photoImg = document.getElementById("badgePhoto");
  const placeholder = document.getElementById("badgePhotoPlaceholder");
  if (user.photo_url) {
    photoImg.src = user.photo_url;
    photoImg.style.display = "block";
    placeholder.style.display = "none";
  } else {
    photoImg.style.display = "none";
    placeholder.style.display = "flex";
  }

  const qrData = encodeURIComponent(`TS_VERIFY|ID:${user.id}|NAME:${user.name}|ZONE:${user.zone_code}|BLOOD:${user.blood_group}|PHONE:${user.phone}`);
  document.getElementById("badgeQrCode").src = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${qrData}`;
}

// 6. PORTAL VIEW CONTROLLER
window.switchPortal = function (id) {
  ['portalGateway', 'userPortal', 'staffPortal', 'superAdminPortal'].forEach(p => {
    const el = document.getElementById(p);
    if (el) el.style.display = (p === id) ? 'block' : 'none';
  });
  window.closeModal();
};

window.openModal = function (modalId) {
  window.closeModal();
  document.getElementById("modalOverlay").style.display = "flex";
  document.getElementById(modalId).style.display = "block";
};

window.closeModal = function () {
  document.getElementById("modalOverlay").style.display = "none";
  document.getElementById("sosVerificationModal").style.display = "none";
  document.getElementById("idCardModal").style.display = "none";
  document.querySelectorAll(".glass-modal").forEach(m => m.style.display = "none");
};

window.enterUserMode = async function () {
  window.switchPortal("userPortal");
  const uid = localStorage.getItem("touristSafetyUserId");
  document.getElementById("loggedOutSection").style.display = uid ? "none" : "block";
  document.getElementById("loggedInSection").style.display = uid ? "block" : "none";

  if (uid) {
    const { data: user } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (user) {
      currentUserProfile = user;
      document.getElementById("activeUserName").innerText = user.name;
      document.getElementById("activeUserRole").innerText = user.is_tourist ? "Tourist" : "Volunteer";
      document.getElementById("activeUserZoneBadge").innerText = user.zone_code || "GLOBAL";
      populateIDBadge(user);
      renderUserMap();
    }
  }
};

window.openRegistration = function (role) {
  currentRole = role;
  document.getElementById("regTitle").innerText = role === "tourist" ? "Tourist Registration" : "Volunteer Registration";
  window.openModal("registrationPage");
};

async function renderUserMap() {
  const coords = await getAccurateGPS();
  const mapEl = document.getElementById("touristMap");
  if (!mapEl) return;

  if (!touristMap) {
    touristMap = L.map("touristMap").setView([coords.latitude, coords.longitude], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(touristMap);
    touristMarker = L.marker([coords.latitude, coords.longitude]).addTo(touristMap).bindPopup("Your Location");
  } else {
    touristMap.setView([coords.latitude, coords.longitude], 14);
    touristMarker.setLatLng([coords.latitude, coords.longitude]);
  }
}

// 7. FORM SUBMISSIONS
document.getElementById("registrationForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const coords = await getAccurateGPS();
  const fileInput = document.getElementById("regPhoto");
  let photoDataUrl = null;

  if (fileInput.files && fileInput.files[0]) {
    photoDataUrl = await new Promise((res) => {
      const reader = new FileReader();
      reader.onload = (ev) => res(ev.target.result);
      reader.readAsDataURL(fileInput.files[0]);
    });
  }

  const payload = {
    zone_code: document.getElementById("regZone").value.trim().toUpperCase(),
    name: document.getElementById("regName").value.trim(),
    phone: document.getElementById("regPhone").value.trim(),
    blood_group: document.getElementById("regBlood").value,
    emergency_contact_1: document.getElementById("regEmergName").value.trim(),
    emergency_phone_1: document.getElementById("regEmergPhone").value.trim(),
    photo_url: photoDataUrl,
    is_tourist: currentRole === "tourist",
    is_volunteer: currentRole === "volunteer"
  };

  const { data, error } = await supabase.from("profiles").insert(payload).select().single();
  if (error) return alert("Registration error: " + error.message);

  localStorage.setItem("touristSafetyUserId", data.id);
  currentUserProfile = data;
  await supabase.from("locations").insert({ user_id: data.id, latitude: coords.latitude, longitude: coords.longitude });
  
  window.closeModal();
  window.enterUserMode();
  window.openModal("idCardModal");
});

document.getElementById("userSignInForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const phone = document.getElementById("signInPhoneInput").value.trim();
  const { data } = await supabase.from("profiles").select("*").eq("phone", phone).maybeSingle();
  if (!data) return alert("User not found. Please register.");
  
  localStorage.setItem("touristSafetyUserId", data.id);
  currentUserProfile = data;
  window.closeModal();
  window.enterUserMode();
});

// Staff Desk Login & Phone Registration
document.getElementById("staffAuthForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const zone = document.getElementById("staffZoneInput").value.trim().toUpperCase();
  const phone = document.getElementById("staffPhoneInput").value.trim();
  
  sessionStorage.setItem("staffZone", zone);
  sessionStorage.setItem("staffPhone", phone);

  document.getElementById("staffZoneDisplayHeader").innerText = zone;
  document.getElementById("staffPhoneDisplayHeader").innerText = phone;
  
  window.switchPortal("staffPortal");
  loadStaffData();
});

document.getElementById("superAdminAuthForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (document.getElementById("superAdminPasscodeInput").value.trim() === SUPERADMIN_PASSCODE) {
    window.switchPortal("superAdminPortal");
    loadSuperAdminData();
  } else {
    alert("Invalid Passcode.");
  }
});

// 8. STAFF COMMAND DESK DISPATCH & TELEMETRY
window.dispatchStaffWhatsApp = function(victimProfile, coords) {
  const staffPhone = sessionStorage.getItem("staffPhone") || "Staff HQ";
  const encodedMsg = generateWhatsAppDistressPayload(victimProfile, coords, staffPhone);
  const contactPhone = (victimProfile.emergency_phone_1 || "").replace(/[^0-9+]/g, '');
  const policePhone = POLICE_TEST_DESK_NUMBER.replace(/[^0-9+]/g, '');

  window.open(`https://api.whatsapp.com/send?phone=${contactPhone}&text=${encodedMsg}`, '_blank');
  setTimeout(() => {
    window.open(`https://api.whatsapp.com/send?phone=${policePhone}&text=${encodedMsg}`, '_blank');
  }, 1000);
};

window.loadStaffData = async function () {
  const zone = sessionStorage.getItem("staffZone");
  const staffPhone = sessionStorage.getItem("staffPhone") || "--";
  
  document.getElementById("staffPhoneDisplayHeader").innerText = staffPhone;

  const [pRes, sRes, lRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("zone_code", zone),
    supabase.from("sos_events").select("*").eq("status", "ACTIVE"),
    supabase.from("locations").select("*").order("created_at", { ascending: false })
  ]);

  const profiles = pRes.data || [];
  const activeSOSEvents = sRes.data || [];
  const sosIds = new Set(activeSOSEvents.map(s => String(s.user_id)));
  
  const locMap = {};
  (lRes.data || []).forEach(l => { if (!locMap[l.user_id]) locMap[l.user_id] = l; });

  document.getElementById("mTotal").innerText = profiles.length;
  document.getElementById("mTourists").innerText = profiles.filter(p => p.is_tourist).length;
  document.getElementById("mVolunteers").innerText = profiles.filter(p => p.is_volunteer).length;
  document.getElementById("mSOS").innerText = sosIds.size;

  // Render Staff Emergency Broadcast Queue
  const queueContainer = document.getElementById("staffEmergencyQueue");
  const queueList = document.getElementById("staffEmergencyQueueList");
  const distressedTourists = profiles.filter(p => sosIds.has(String(p.id)));

  if (distressedTourists.length > 0 && queueContainer && queueList) {
    queueContainer.style.display = "block";
    queueList.innerHTML = distressedTourists.map(vic => {
      const loc = locMap[vic.id] || { latitude: 18.9894, longitude: 73.1175 };
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.4); padding:10px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.2);">
          <div>
            <strong>🚨 ${vic.name}</strong> (${vic.phone})<br>
            <small style="color:#fca5a5;">Coordinates: ${loc.latitude}, ${loc.longitude}</small>
          </div>
          <button class="whatsapp-btn" style="padding:6px 12px;" onclick='dispatchStaffWhatsApp(${JSON.stringify(vic)}, ${JSON.stringify(loc)})'>
            📲 Broadcast WhatsApp from Desk (${staffPhone})
          </button>
        </div>
      `;
    }).join("");
  } else if (queueContainer) {
    queueContainer.style.display = "none";
  }

  document.getElementById("staffTableBody").innerHTML = profiles.map(p => {
    const loc = locMap[p.id];
    const isSos = sosIds.has(String(p.id));
    return `
      <tr class="${isSos ? 'row-sos-red' : ''}">
        <td>${isSos ? '🚨 ACTIVE SOS' : 'Normal'}</td>
        <td><strong>${p.name}</strong></td>
        <td>${p.is_tourist ? 'Tourist' : 'Volunteer'}</td>
        <td>${p.phone}</td>
        <td>${p.blood_group || 'N/A'}</td>
        <td>${p.emergency_contact_1} (${p.emergency_phone_1})</td>
        <td class="coord-cell">${loc ? `${loc.latitude}, ${loc.longitude}` : 'Syncing...'}</td>
        <td style="display:flex; gap:4px;">
          <button class="switch-user-btn" style="padding: 2px 6px;" onclick='populateIDBadge(${JSON.stringify(p)}); openModal("idCardModal");'>🪪 ID</button>
          ${isSos ? `<button class="whatsapp-btn" style="padding: 2px 6px; font-size:10px;" onclick='dispatchStaffWhatsApp(${JSON.stringify(p)}, ${JSON.stringify(loc || {latitude:18.9894, longitude:73.1175})})'>📲 WhatsApp</button>` : ''}
        </td>
      </tr>
    `;
  }).join("");
};

window.loadSuperAdminData = async function () {
  const { data: profiles } = await supabase.from("profiles").select("*");
  const { data: locs } = await supabase.from("locations").select("*").order("created_at", { ascending: false });
  const locMap = {};
  (locs || []).forEach(l => { if (!locMap[l.user_id]) locMap[l.user_id] = l; });

  document.getElementById("superAdminTableBody").innerHTML = (profiles || []).map(p => {
    const loc = locMap[p.id];
    return `
      <tr>
        <td><strong>${p.zone_code}</strong></td>
        <td>Active</td>
        <td>${p.name}</td>
        <td>${p.is_tourist ? 'Tourist' : 'Volunteer'}</td>
        <td>${p.phone}</td>
        <td class="coord-cell">${loc ? `${loc.latitude}, ${loc.longitude}` : 'Syncing...'}</td>
      </tr>
    `;
  }).join("");
};

window.signOut = () => { localStorage.clear(); window.enterUserMode(); };
window.exitStaff = () => { sessionStorage.clear(); window.switchPortal("portalGateway"); };
window.setLanguage = (code) => localStorage.setItem("lang", code);

if (localStorage.getItem("touristSafetyUserId")) {
  window.enterUserMode();
}
