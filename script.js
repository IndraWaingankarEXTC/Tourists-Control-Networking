import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ==========================================
// 1. SUPABASE INITIALIZATION
// ==========================================
const SUPABASE_URL = "https://ccjygeoxaoomhonwenqw.supabase.co";
const SUPABASE_KEY = "sb_publishable_rPFLHItf9TI4P_i14P5bqw_tD5dz6mk";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let selectedRole = null;
let isEmergencyActive = false;
let emergencyInterval = null;
let activeRescueTarget = null;
let compassInterval = null;

let dismissedVolunteerSOS = new Set();
let dismissedCommandSOS = new Set();

// Active device sensors
let verifiedGpsCoords = null;
let verifiedGpsAccuracy = null;
let gpsWatchId = null;

// Persistent Leaflet maps & marker storage
let victimMapInstance = null;
let victimMarkers = {};

let volunteerMapInstance = null;
let volunteerMarkers = {};

let staffMapInstances = {};
let staffMarkers = {};

// ==========================================
// 2. HARDWARE GPS ENGINE & AUTO-SYNC
// ==========================================
function startHardwareGpsWatcher() {
  if (!navigator.geolocation) return;

  if (gpsWatchId !== null) {
    navigator.geolocation.clearWatch(gpsWatchId);
  }

  gpsWatchId = navigator.geolocation.watchPosition(
    async (pos) => {
      const lat = Number(pos.coords.latitude);
      const lon = Number(pos.coords.longitude);
      const accuracy = Math.round(pos.coords.accuracy);

      verifiedGpsCoords = { latitude: lat, longitude: lon };
      verifiedGpsAccuracy = accuracy;

      const userId = localStorage.getItem("touristSafetyUserId");
      const isStaffActive = sessionStorage.getItem("staffAuthenticated") === "true";
      const staffZone = sessionStorage.getItem("staffZoneCode") || "GLOBAL";

      // 1. Live update active user position
      if (userId) {
        await supabase.from("locations").insert({
          user_id: userId,
          latitude: lat,
          longitude: lon
        });
      }

      // 2. Live update Command HQ position for this specific zone
      if (isStaffActive) {
        await supabase.from("command_center_location").upsert({
          id: `HQ_${staffZone}`,
          zone_code: staffZone,
          latitude: lat,
          longitude: lon,
          updated_at: new Date().toISOString()
        });
      }
    },
    (err) => {
      console.warn(`Waiting for hardware GPS fix: ${err.message}`);
      setTimeout(startHardwareGpsWatcher, 3000);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

startHardwareGpsWatcher();

async function getAccurateHardwareGps() {
  if (verifiedGpsCoords) return verifiedGpsCoords;

  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (verifiedGpsCoords) {
        clearInterval(checkInterval);
        resolve(verifiedGpsCoords);
      }
    }, 500);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearInterval(checkInterval);
        verifiedGpsCoords = {
          latitude: Number(pos.coords.latitude),
          longitude: Number(pos.coords.longitude)
        };
        resolve(verifiedGpsCoords);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
}

async function getLiveCommandHQCoords(zoneCode = "GLOBAL") {
  const { data } = await supabase
    .from("command_center_location")
    .select("latitude, longitude")
    .eq("id", `HQ_${zoneCode}`)
    .maybeSingle();

  if (data && data.latitude && data.longitude) {
    return { latitude: Number(data.latitude), longitude: Number(data.longitude) };
  }
  return await getAccurateHardwareGps();
}

// ==========================================
// 3. SYNTHESIZED EMERGENCY SIREN
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
// 4. DISTANCE, BEARING & MAP UTILITIES
// ==========================================
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
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

// ==========================================
// 5. PORTAL VIEW CONTROLLER
// ==========================================
window.switchPortal = function(portalId) {
  ['portalGateway', 'userPortal', 'staffPortal'].forEach(id => {
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

  if (loggedOutSec) loggedOutSec.style.display = "none";
  if (loggedInSec) loggedInSec.style.display = "block";

  if (nameEl) nameEl.innerText = profile.name;
  if (roleEl) roleEl.innerText = [profile.is_tourist ? "Tourist" : "", profile.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ");
  if (zoneBadge) zoneBadge.innerText = profile.zone_code || "GLOBAL";

  const { data: activeSOS } = await supabase.from("sos_events").select("*").eq("user_id", userId).eq("status", "ACTIVE");
  const label = document.getElementById("sosLabel");
  if (activeSOS && activeSOS.length > 0) {
    isEmergencyActive = true;
    if (label) label.innerText = "CANCEL SOS (ACTIVE)";
    triggerVisualAlarm(true);
  } else {
    isEmergencyActive = false;
    if (label) label.innerText = "SEND LIVE SOS";
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
  ['modalOverlay', 'registrationPage', 'successPage', 'staffPasscodeModal', 'userSignInModal', 'createZoneModal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
};

window.exitStaffPortal = function() {
  sessionStorage.removeItem("staffAuthenticated");
  sessionStorage.removeItem("staffZoneCode");
  window.switchPortal("portalGateway");
};

// ==========================================
// 6. STAFF COMMAND MATRIX (ZONE FILTERED)
// ==========================================
window.loadStaffMonitoringData = async function() {
  const tableBody = document.getElementById("staffTableBody");
  if (!tableBody) return;

  const currentZone = sessionStorage.getItem("staffZoneCode") || "GLOBAL";
  const zoneHeader = document.getElementById("staffZoneDisplayHeader");
  if (zoneHeader) zoneHeader.innerText = currentZone;

  try {
    const [profilesRes, sosRes, locsRes, missionsRes, cmdHQ] = await Promise.all([
      supabase.from("profiles").select("*").eq("zone_code", currentZone).order("created_at", { ascending: false }),
      supabase.from("sos_events").select("*").eq("zone_code", currentZone).eq("status", "ACTIVE"),
      supabase.from("locations").select("*").order("created_at", { ascending: false }),
      supabase.from("rescue_missions").select("*").eq("zone_code", currentZone).eq("status", "EN_ROUTE"),
      getLiveCommandHQCoords(currentZone)
    ]);

    const profiles = profilesRes.data || [];
    const activeSOSEvents = sosRes.data || [];
    const locations = locsRes.data || [];
    const activeMissions = missionsRes.data || [];

    const activeSOSUserIds = new Set(activeSOSEvents.map(s => String(s.user_id)));

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

    document.getElementById("mTotal").innerText = profiles.length;
    document.getElementById("mTourists").innerText = profiles.filter(p => p.is_tourist).length;
    document.getElementById("mVolunteers").innerText = profiles.filter(p => p.is_volunteer).length;
    document.getElementById("mSOS").innerText = activeSOSUserIds.size;

    // 1. Dynamic SOS Dispatch Queue for this zone
    const dispatchQueueEl = document.getElementById("commandDispatchQueue");
    const unhandledDistressSignals = activeSOSEvents.filter(sos => {
      const alreadyHandled = dismissedCommandSOS.has(String(sos.id));
      const alreadyDeployed = activeMissions.some(m => m.responder_type === 'COMMAND_CENTER' && String(m.target_user_id) === String(sos.user_id));
      return !alreadyHandled && !alreadyDeployed;
    });

    if (unhandledDistressSignals.length > 0 && dispatchQueueEl) {
      dispatchQueueEl.style.display = "flex";
      dispatchQueueEl.innerHTML = unhandledDistressSignals.map(sos => {
        const victim = profileMap[String(sos.user_id)];
        const victimName = victim ? victim.name : "Person in Distress";
        return `
          <div class="command-action-box">
            <div class="dispatch-header">
              <span class="hud-pulse"></span>
              <strong>CRITICAL ALERT (${currentZone}): ${victimName}</strong>
            </div>
            <p>Deploy ${currentZone} Central Command emergency team to assist ${victimName}?</p>
            <div class="dispatch-actions">
              <button class="command-btn btn-yes" onclick="dispatchSpecificFromCommandCenter('${sos.id}', '${sos.user_id}', '${currentZone}')">✓ YES, DEPLOY COMMAND UNIT</button>
              <button class="command-btn btn-no" onclick="dismissSpecificCommandPrompt('${sos.id}')">✕ STAND BY</button>
            </div>
          </div>
        `;
      }).join("");
    } else if (dispatchQueueEl) {
      dispatchQueueEl.style.display = "none";
    }

    // 2. Zone Roster Table
    if (profiles.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; opacity:0.7;">No active profiles registered under ${currentZone} yet.</td></tr>`;
    } else {
      tableBody.innerHTML = profiles.map(p => {
        const isCriticalSOS = activeSOSUserIds.has(String(p.id));
        let isNearbyResponder = false;
        const myLoc = userLocationMap[String(p.id)];

        if (p.is_volunteer && !isCriticalSOS && activeSOSEvents.length > 0) {
          if (myLoc) {
            activeSOSEvents.forEach(sos => {
              const dist = calculateDistanceKm(myLoc.latitude, myLoc.longitude, Number(sos.latitude), Number(sos.longitude));
              if (dist <= 25.0) isNearbyResponder = true;
            });
          }
        }

        let rowClass = "row-normal";
        let statusTag = `<span class="status-tag tag-green">Normal</span>`;

        if (isCriticalSOS) {
          rowClass = "row-sos-red";
          statusTag = `<span class="status-tag tag-red">🚨 SOS ACTIVE</span>`;
        } else if (isNearbyResponder) {
          rowClass = "row-responder-yellow";
          statusTag = `<span class="status-tag tag-yellow">⚡ RESPONDER IN RANGE</span>`;
        }

        const roleBadge = [p.is_tourist ? "Tourist" : "", p.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ");
        const coordsDisplay = myLoc 
          ? `${Number(myLoc.latitude).toFixed(4)}, ${Number(myLoc.longitude).toFixed(4)}` 
          : `🛰️ Acquiring GPS...`;

        return `
          <tr class="${rowClass}">
            <td>${statusTag}</td>
            <td><strong>${p.name || 'Anonymous'}</strong></td>
            <td>${roleBadge || 'User'}</td>
            <td>${p.phone || 'N/A'}</td>
            <td>${p.blood_group || 'N/A'}</td>
            <td>${p.emergency_contact_1 || 'N/A'} (${p.emergency_phone_1 || 'N/A'})</td>
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

    if (activeMissions.length > 0) {
      const commandUnits = activeMissions.filter(m => m.responder_type === 'COMMAND_CENTER');
      const volunteerUnits = activeMissions.filter(m => m.responder_type === 'VOLUNTEER');

      responderBadge.innerText = `${commandUnits.length} Command • ${volunteerUnits.length} Volunteer(s) Active`;
      if (multiRadarGrid) multiRadarGrid.style.display = "grid";

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
        }
      });

      activeCaseIds.forEach((vicId, index) => {
        const mapContainerId = `staffCaseMap_${vicId}`;
        let card = document.getElementById(`cardWrapper_${vicId}`);
        const vic = profileMap[vicId] || { name: 'Person in Distress' };

        if (!card) {
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
        
        const vicLoc = userLocationMap[vicId] || cmdHQ;

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
        if (volunteerMissions.length > 0) {
          const firstVol = volunteerMissions[0];
          const volLoc = userLocationMap[String(firstVol.volunteer_id)] || vicLoc;
          const volPos = [volLoc.latitude, volLoc.longitude];

          const volProfile = profileMap[String(firstVol.volunteer_id)] || { name: "Volunteer" };

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
        } else if (currentMarkers.volunteer) {
          map.removeLayer(currentMarkers.volunteer);
          delete currentMarkers.volunteer;
        }

        const telemEl = document.getElementById(`telemetry_${vicId}`);
        if (telemEl) {
          telemEl.innerHTML = `
            ${cmdDistanceText ? `<div style="color:#00d4ff;">🔵 ${cmdDistanceText}</div>` : ''}
            ${volDistanceText ? `<div style="color:#ffd000;">🟡 ${volDistanceText}</div>` : ''}
            <div style="margin-top:6px; display:flex; gap:6px; justify-content:center;">
              ${hasCommand ? `<a href="${cmdMapsUrl}" target="_blank" style="color:#fff; background:#0284c7; padding:4px 8px; border-radius:6px; text-decoration:none; font-size:10px;">🗺️ Command Route</a>` : ''}
              ${volunteerMissions.length > 0 ? `<a href="${volMapsUrl}" target="_blank" style="color:#000; background:#ffd000; padding:4px 8px; border-radius:6px; text-decoration:none; font-size:10px; font-weight:700;">🗺️ Volunteer Route</a>` : ''}
            </div>
          `;
        }

        map.invalidateSize();
      });

      respondersPanel.innerHTML = activeMissions.map(m => {
        const vic = profileMap[String(m.target_user_id)] || { name: 'Tourist' };
        if (m.responder_type === 'COMMAND_CENTER') {
          return `
            <div class="responder-item" style="border-color: #00d4ff;">
              <strong style="color: #00d4ff;">🔵 ${currentZone} Command Unit</strong> ➔ <span style="color:#ffffff;">ASSISTING: <strong>${vic.name}</strong></span>
            </div>
          `;
        } else {
          const vol = profileMap[String(m.volunteer_id)] || { name: 'Volunteer Unit', phone: 'Field' };
          return `
            <div class="responder-item" style="border-color: #ffd000;">
              <strong style="color: #ffd000;">🟡 Volunteer: ${vol.name}</strong> (${vol.phone}) ➔ <span style="color:#ffffff;">EN ROUTE TO: <strong>${vic.name}</strong></span>
            </div>
          `;
        }
      }).join("");
    } else {
      responderBadge.innerText = `0 Responders En Route`;
      if (multiRadarGrid) multiRadarGrid.style.display = "none";
      respondersPanel.innerHTML = `<em>No active rescue missions underway in this zone. Standing by for alerts.</em>`;
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
// 7. PURGE & DELETE ZONE COMMAND CENTER
// ==========================================
window.handleDeleteCommandCenter = async function() {
  const currentZone = sessionStorage.getItem("staffZoneCode");
  if (!currentZone) {
    alert("No active command center session.");
    return;
  }

  const confirmCode = prompt(`DANGER: This will permanently delete destination zone '${currentZone}' and purge all associated tourists, volunteers, and SOS alerts.\n\nEnter the Admin Passcode for '${currentZone}' to confirm:`);
  if (!confirmCode) return;

  const { data: zoneRecord } = await supabase
    .from("destination_zones")
    .select("passcode")
    .eq("zone_code", currentZone)
    .maybeSingle();

  if (!zoneRecord || zoneRecord.passcode !== confirmCode.trim()) {
    alert("Passcode verification failed. Zone deletion aborted.");
    return;
  }

  try {
    // 1. Purge all records belonging to this zone
    await Promise.all([
      supabase.from("sos_events").delete().eq("zone_code", currentZone),
      supabase.from("rescue_missions").delete().eq("zone_code", currentZone),
      supabase.from("command_center_location").delete().eq("zone_code", currentZone),
      supabase.from("profiles").delete().eq("zone_code", currentZone),
      supabase.from("destination_zones").delete().eq("zone_code", currentZone)
    ]);

    sessionStorage.removeItem("staffAuthenticated");
    sessionStorage.removeItem("staffZoneCode");

    alert(`Destination Zone '${currentZone}' and all associated telemetry have been permanently deleted.`);
    window.switchPortal("portalGateway");
  } catch (err) {
    alert(`Failed to delete zone: ${err.message}`);
  }
};

// ==========================================
// 8. VOLUNTEER DISPATCH (ZONE ISOLATED)
// ==========================================
async function checkVolunteerDistressSignals() {
  const userId = localStorage.getItem("touristSafetyUserId");
  if (!userId) return;

  try {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (!profile || profile.is_volunteer !== true) {
      window.closeCompassView();
      return;
    }

    const myZone = profile.zone_code || "GLOBAL";

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
    const { data: victimProfile } = await supabase.from("profiles").select("name").eq("id", activeRescueTarget.user_id).maybeSingle();
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
  const myZone = profile?.zone_code || "GLOBAL";

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

  const [targetMissionsRes, cmdHQ, myCoords] = await Promise.all([
    supabase.from("rescue_missions").select("responder_type").eq("target_user_id", String(activeRescueTarget.user_id)).eq("status", "EN_ROUTE"),
    getLiveCommandHQCoords(zoneCode),
    getAccurateHardwareGps()
  ]);

  const hasCommandAssistance = targetMissionsRes.data && targetMissionsRes.data.some(m => m.responder_type === 'COMMAND_CENTER');

  const targetLat = Number(activeRescueTarget.latitude);
  const targetLon = Number(activeRescueTarget.longitude);

  const distKm = calculateDistanceKm(myCoords.latitude, myCoords.longitude, targetLat, targetLon);
  const bearing = calculateBearing(myCoords.latitude, myCoords.longitude, targetLat, targetLon);
  const routeInfo = calculateRouteAndETA(distKm);

  const mapContainer = document.getElementById("volunteerLiveMap");
  if (mapContainer) {
    if (!volunteerMapInstance) {
      volunteerMapInstance = L.map('volunteerLiveMap', { zoomControl: true, scrollWheelZoom: true, dragging: true }).setView([targetLat, targetLon], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(volunteerMapInstance);
    }

    if (!volunteerMarkers.victim) {
      volunteerMarkers.victim = L.marker([targetLat, targetLon], {
        icon: createLeafletCustomPin('victim', 'Person in Distress')
      }).addTo(volunteerMapInstance).bindPopup("🎯 <b>Victim Location</b>");
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

  const distEl = document.getElementById("compassDistance");
  const brgEl = document.getElementById("compassBearing");

  if (distEl) distEl.innerText = `${formatDistance(distKm)} • ${routeInfo.etaText}`;
  if (brgEl) brgEl.innerText = `${Math.round(bearing)}°`;
}

// ==========================================
// 9. VICTIM SCREEN: DUAL GOOGLE MAPS NAVIGATION
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
  const myZone = profile?.zone_code || "GLOBAL";

  const [myLocRes, missionsRes, cmdHQ, myCurrentGps] = await Promise.all([
    supabase.from("locations").select("latitude, longitude").eq("user_id", userId).order("created_at", { ascending: false }).maybeSingle(),
    supabase.from("rescue_missions").select("*").eq("target_user_id", String(userId)).eq("status", "EN_ROUTE"),
    getLiveCommandHQCoords(myZone),
    getAccurateHardwareGps()
  ]);

  const myLoc = myLocRes.data;
  const missions = missionsRes.data || [];

  const vicLat = myLoc ? Number(myLoc.latitude) : myCurrentGps.latitude;
  const vicLon = myLoc ? Number(myLoc.longitude) : myCurrentGps.longitude;

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

      responderContactsHTML += `
        <div class="victim-contact-pill">
          <div>
            🔵 <strong>${myZone} Command Unit:</strong> Dispatched<br>
            <small style="color: #00d4ff; font-weight: 600;">Distance: ${formatDistance(distKm)} • ETA: ${cmdRoute.etaText}</small>
          </div>
          <span style="color: #00d4ff; font-weight: 600; font-size: 11px;">Radio Grid Active</span>
        </div>
      `;
    } else if (victimMarkers.command) {
      victimMapInstance.removeLayer(victimMarkers.command);
      delete victimMarkers.command;
    }

    if (volunteerMissions.length > 0) {
      const volIds = volunteerMissions.map(m => m.volunteer_id);
      const [volProfilesRes, volLocsRes] = await Promise.all([
        supabase.from("profiles").select("id, name, phone").in("id", volIds),
        supabase.from("locations").select("user_id, latitude, longitude").in("user_id", volIds).order("created_at", { ascending: false })
      ]);

      const volProfiles = volProfilesRes.data || [];
      const volLocs = volLocsRes.data || [];

      volProfiles.forEach(vp => {
        const foundLoc = volLocs.find(l => String(l.user_id) === String(vp.id));
        const vLat = foundLoc ? Number(foundLoc.latitude) : vicLat;
        const vLon = foundLoc ? Number(foundLoc.longitude) : vicLon;

        const volPos = [vLat, vLon];

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
              <a href="tel:${vp.phone}">📞 Call</a>
              <a href="${googleMapsNavUrl}" target="_blank" style="background:#22c55e; color:#fff;">🗺️ Maps</a>
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
// 10. SOS BROADCAST & STATE TRANSITION
// ==========================================
window.handleSOSToggle = async function() {
  const userId = localStorage.getItem("touristSafetyUserId");

  if (!userId) {
    alert("Please register or sign in before broadcasting an SOS signal.");
    window.openRegistration("tourist");
    return;
  }

  const { data: profile } = await supabase.from("profiles").select("zone_code").eq("id", userId).maybeSingle();
  const myZone = profile?.zone_code || "GLOBAL";

  isEmergencyActive = !isEmergencyActive;
  const label = document.getElementById("sosLabel");

  if (isEmergencyActive) {
    if (label) label.innerText = "CANCEL SOS (ACTIVE)";
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

    const coords = await getAccurateHardwareGps();

    await supabase.from("sos_events").insert({
      user_id: userId,
      zone_code: myZone,
      latitude: coords.latitude,
      longitude: coords.longitude,
      status: "ACTIVE"
    });

  } else {
    if (label) label.innerText = "SEND LIVE SOS";
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
// 11. INDIVIDUAL USER ZONE EXIT & PURGE
// ==========================================
window.handleSelfOptOut = async function() {
  const userId = localStorage.getItem("touristSafetyUserId");
  if (!userId) {
    alert("No active profile registered on this device.");
    return;
  }

  const confirmed = confirm("Are you sure you want to leave this event zone? This will permanently delete your registration and real-time location telemetry.");
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

    alert("You have left the event zone. Your telemetry has been completely purged.");
    window.switchPortal("portalGateway");
  } catch (err) {
    alert(`Failed to leave zone: ${err.message}`);
  }
};

// ==========================================
// 12. BACKGROUND THEME ENGINE & LISTENERS
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

  // Staff Authentication with Dynamic Zone Lookup
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
        alert(`Destination Zone '${enteredZone}' does not exist. Please register it first.`);
        return;
      }

      if (zoneRecord.passcode === enteredCode) {
        sessionStorage.setItem("staffAuthenticated", "true");
        sessionStorage.setItem("staffZoneCode", enteredZone);

        const currentGps = await getAccurateHardwareGps();
        await supabase.from("command_center_location").upsert({
          id: `HQ_${enteredZone}`,
          zone_code: enteredZone,
          latitude: currentGps.latitude,
          longitude: currentGps.longitude,
          updated_at: new Date().toISOString()
        });

        window.switchPortal("staffPortal");
        window.loadStaffMonitoringData();
        setInterval(window.loadStaffMonitoringData, 3000);
      } else {
        alert("Incorrect Zone Passcode. Access Denied.");
      }
    });
  }

  // Create New Destination Zone
  const createZoneForm = document.getElementById("createZoneForm");
  if (createZoneForm) {
    createZoneForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const zoneCode = document.getElementById("newZoneCode").value.trim().toUpperCase();
      const zoneName = document.getElementById("newZoneName").value.trim();
      const passcode = document.getElementById("newZonePasscode").value.trim();

      const { error } = await supabase.from("destination_zones").insert({
        zone_code: zoneCode,
        zone_name: zoneName,
        passcode: passcode
      });

      if (error) {
        alert(`Failed to create zone: ${error.message}`);
      } else {
        alert(`Destination Zone '${zoneCode}' (${zoneName}) registered successfully! You can now login.`);
        window.openStaffModal();
        document.getElementById("staffZoneInput").value = zoneCode;
      }
    });
  }

  // Phone Sign-In
  const userSignInForm = document.getElementById("userSignInForm");
  if (userSignInForm) {
    userSignInForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const phoneInput = document.getElementById("signInPhoneInput").value.trim();

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("phone", phoneInput)
        .maybeSingle();

      if (!profile) {
        alert("No profile found with that phone number. Please register first.");
        return;
      }

      localStorage.setItem("touristSafetyUserId", profile.id);
      alert(`Welcome back, ${profile.name}! Registered to zone: ${profile.zone_code || 'GLOBAL'}`);
      window.closeModal();
      updateUserStateView();
      checkVolunteerDistressSignals();
      checkVictimAidStatus();
    });
  }

  // Profile Registration with Zone Code
  const regForm = document.getElementById("registrationForm");
  if (regForm) {
    regForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = regForm.querySelector(".submit-btn");
      submitBtn.disabled = true;
      submitBtn.innerText = "Locking Hardware GPS & Zone...";

      const destinationZone = document.getElementById("regZoneCode").value.trim().toUpperCase();
      const wantsSecondRole = document.getElementById("additionalRole")?.checked || false;
      const isTourist = selectedRole === "tourist" || wantsSecondRole;
      const isVolunteer = selectedRole === "volunteer" || wantsSecondRole;

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
        is_tourist: isTourist,
        is_volunteer: isVolunteer
      };

      try {
        const coords = await getAccurateHardwareGps();

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

        document.getElementById("registrationPage").style.display = "none";
        document.getElementById("successPage").style.display = "block";

        const roles = [isTourist && "Tourist", isVolunteer && "Volunteer"].filter(Boolean).join(" and ");
        const successMsg = document.getElementById("successMessage");
        if (successMsg) successMsg.innerText = `You have successfully registered as ${roles} under Destination Zone '${destinationZone}'.`;

        regForm.reset();
        updateUserStateView();
      } catch (err) {
        alert(`Registration error: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Complete Registration";
      }
    });
  }

  // Fast intervals for telemetry & aid updates
  setInterval(checkVolunteerDistressSignals, 2500);
  setInterval(checkVictimAidStatus, 2000);
});
