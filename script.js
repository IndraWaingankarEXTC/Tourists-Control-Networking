import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ==========================================
// 1. SUPABASE INITIALIZATION
// ==========================================
const SUPABASE_URL = "https://ccjygeoxaoomhonwenqw.supabase.co";
const SUPABASE_KEY = "sb_publishable_rPFLHItf9TI4P_i14P5bqw_tD5dz6mk";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STAFF_PASSCODE = "SAFE2026";

let selectedRole = null;
let isEmergencyActive = false;
let emergencyInterval = null;
let activeRescueTarget = null;
let compassInterval = null;

let dismissedVolunteerSOS = new Set();
let dismissedCommandSOS = new Set();
let lastKnownCoords = { latitude: 18.9894, longitude: 73.1175 };

// ==========================================
// 2. CONTINUOUS HARDWARE GPS TRACKER
// ==========================================
function startContinuousLocationSync() {
  if (!navigator.geolocation) {
    console.warn("Geolocation not supported by device.");
    return;
  }

  navigator.geolocation.watchPosition(
    async (position) => {
      lastKnownCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      const userId = localStorage.getItem("touristSafetyUserId");
      if (userId) {
        // Upsert latest location to database
        await supabase.from("locations").insert({
          user_id: userId,
          latitude: lastKnownCoords.latitude,
          longitude: lastKnownCoords.longitude
        });
      }
    },
    (err) => {
      console.warn("Continuous GPS Error:", err.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000
    }
  );
}

// Start GPS polling immediately
startContinuousLocationSync();

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
// 4. ROUTE OPTIMIZATION, DISTANCE & ETA
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
    Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos(dLon);
  let brng = Math.atan2(y, x) * (180 / Math.PI);
  return (brng + 360) % 360;
}

/**
 * Calculates optimal safe road distance and travel ETA:
 * Applies 1.30x road curvature factor for real-world safe navigation.
 * Uses average vehicle response speed: 40 km/h (urban/rural mixed).
 */
function calculateRouteAndETA(straightDistanceKm) {
  const safeRoadDistance = straightDistanceKm * 1.30;
  const avgSpeedKmh = 40.0;
  const timeInHours = safeRoadDistance / avgSpeedKmh;
  const timeInMinutes = Math.ceil(timeInHours * 60);

  let etaText = "";
  if (straightDistanceKm < 0.05) {
    etaText = "Under 1 min (Arrived / Immediate Proximity)";
  } else if (timeInMinutes < 60) {
    etaText = `~${timeInMinutes} min (ETA)`;
  } else {
    const hrs = Math.floor(timeInMinutes / 60);
    const mins = timeInMinutes % 60;
    etaText = `~${hrs} hr ${mins} min (ETA)`;
  }

  return {
    roadDistanceKm: safeRoadDistance,
    etaText: etaText
  };
}

function formatDistance(distKm) {
  if (distKm < 0.02) return "0 meters (Same Location)";
  if (distKm < 1.0) return `${Math.round(distKm * 1000)} meters`;
  return `${distKm.toFixed(2)} km`;
}

/**
 * Auto-scaling Polar Projection:
 * Automatically scales the radar view up to 60+ km so far-away responders 
 * stay on the radar circles instead of breaking the bounds.
 */
function projectGpsToRadar(vicLat, vicLon, targetLat, targetLon) {
  const distKm = calculateDistanceKm(vicLat, vicLon, targetLat, targetLon);
  
  if (distKm <= 0.015) {
    return { top: "50%", left: "50%", distKm: 0 };
  }

  const dynamicScaleKm = Math.max(distKm * 1.25, 5.0); // Dynamic scale boundary
  const bearing = calculateBearing(vicLat, vicLon, targetLat, targetLon);
  const bearingRad = bearing * (Math.PI / 180);
  
  const normalizedDist = Math.min(distKm / dynamicScaleKm, 1.0);
  const radiusPercent = normalizedDist * 40;

  const deltaX = radiusPercent * Math.sin(bearingRad);
  const deltaY = -radiusPercent * Math.cos(bearingRad);

  return {
    top: `${(50 + deltaY).toFixed(1)}%`,
    left: `${(50 + deltaX).toFixed(1)}%`,
    distKm: distKm
  };
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
  ['modalOverlay', 'registrationPage', 'successPage', 'staffPasscodeModal', 'userSignInModal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
};

// ==========================================
// 6. STAFF COMMAND ROSTER, RADARS & DISPATCH
// ==========================================
window.loadStaffMonitoringData = async function() {
  const tableBody = document.getElementById("staffTableBody");
  if (!tableBody) return;

  try {
    const [profilesRes, sosRes, locsRes, missionsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("sos_events").select("*").eq("status", "ACTIVE"),
      supabase.from("locations").select("*").order("created_at", { ascending: false }),
      supabase.from("rescue_missions").select("*").eq("status", "EN_ROUTE")
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
      if (!userLocationMap[String(loc.user_id)]) userLocationMap[String(loc.user_id)] = loc;
    });

    document.getElementById("mTotal").innerText = profiles.length;
    document.getElementById("mTourists").innerText = profiles.filter(p => p.is_tourist).length;
    document.getElementById("mVolunteers").innerText = profiles.filter(p => p.is_volunteer).length;
    document.getElementById("mSOS").innerText = activeSOSUserIds.size;

    // 1. DYNAMIC DISPATCH PROMPT FOR EVERY ACTIVE SOS
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
              <strong>CRITICAL DISTRESS ALERT: ${victimName}</strong>
            </div>
            <p>Deploy Central Command emergency team to assist ${victimName}?</p>
            <div class="dispatch-actions">
              <button class="command-btn btn-yes" onclick="dispatchSpecificFromCommandCenter('${sos.id}', '${sos.user_id}')">✓ YES, DEPLOY COMMAND UNIT</button>
              <button class="command-btn btn-no" onclick="dismissSpecificCommandPrompt('${sos.id}')">✕ STAND BY</button>
            </div>
          </div>
        `;
      }).join("");
    } else if (dispatchQueueEl) {
      dispatchQueueEl.style.display = "none";
    }

    // 2. FULL-WIDTH TABLE
    tableBody.innerHTML = profiles.map(p => {
      const isCriticalSOS = activeSOSUserIds.has(String(p.id));
      let isNearbyResponder = false;
      const myLoc = userLocationMap[String(p.id)];

      if (p.is_volunteer && !isCriticalSOS && activeSOSEvents.length > 0) {
        if (myLoc) {
          activeSOSEvents.forEach(sos => {
            const dist = calculateDistanceKm(myLoc.latitude, myLoc.longitude, sos.latitude, sos.longitude);
            if (dist <= 15.0) isNearbyResponder = true;
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
      const coordsDisplay = myLoc && myLoc.latitude 
        ? `${Number(myLoc.latitude).toFixed(4)}, ${Number(myLoc.longitude).toFixed(4)}` 
        : "GPS Syncing...";

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

    // 3. MULTI-CASE LIVE LOCATION PROJECTION & ETA
    const respondersPanel = document.getElementById("respondersList");
    const responderBadge = document.getElementById("responderCountBadge");
    const multiRadarGrid = document.getElementById("staffMultiRadarGrid");

    if (activeMissions.length > 0) {
      const commandUnits = activeMissions.filter(m => m.responder_type === 'COMMAND_CENTER');
      const volunteerUnits = activeMissions.filter(m => m.responder_type === 'VOLUNTEER');

      const countLabelParts = [];
      if (commandUnits.length > 0) countLabelParts.push(`${commandUnits.length} Command Unit(s)`);
      if (volunteerUnits.length > 0) countLabelParts.push(`${volunteerUnits.length} Volunteer(s)`);

      responderBadge.innerText = countLabelParts.join(" • ") + " Active";
      if (multiRadarGrid) multiRadarGrid.style.display = "grid";

      const victimMissionsMap = {};
      activeMissions.forEach(m => {
        const vicId = String(m.target_user_id);
        if (!victimMissionsMap[vicId]) victimMissionsMap[vicId] = [];
        victimMissionsMap[vicId].push(m);
      });

      multiRadarGrid.innerHTML = Object.keys(victimMissionsMap).map((vicId, index) => {
        const vic = profileMap[vicId] || { name: 'Person in Distress' };
        const missions = victimMissionsMap[vicId];

        const hasCommand = missions.some(m => m.responder_type === 'COMMAND_CENTER');
        const volunteerMissions = missions.filter(m => m.responder_type === 'VOLUNTEER');

        const vicLoc = userLocationMap[vicId] || lastKnownCoords;

        // Volunteer Projection & ETA
        let volBlipHTML = "";
        let volDistanceText = "";
        if (volunteerMissions.length > 0) {
          const firstVol = volunteerMissions[0];
          const volLoc = userLocationMap[String(firstVol.volunteer_id)] || vicLoc;
          const volProj = projectGpsToRadar(vicLoc.latitude, vicLoc.longitude, volLoc.latitude, volLoc.longitude);
          const routeInfo = calculateRouteAndETA(volProj.distKm);
          const volProfile = profileMap[String(firstVol.volunteer_id)] || { name: "Volunteer" };

          volBlipHTML = `<div class="radar-blip blip-volunteer" style="top: ${volProj.top}; left: ${volProj.left};" title="Volunteer: ${volProfile.name}"></div>`;
          volDistanceText = `Volunteer (${volProfile.name}): ${formatDistance(volProj.distKm)} • ${routeInfo.etaText}`;
        }

        // Command Center Projection & ETA
        let cmdBlipHTML = "";
        let cmdDistanceText = "";
        if (hasCommand) {
          const cmdProj = projectGpsToRadar(vicLoc.latitude, vicLoc.longitude, 18.9894, 73.1175);
          const cmdRoute = calculateRouteAndETA(cmdProj.distKm);
          cmdBlipHTML = `<div class="radar-blip blip-command" style="top: ${cmdProj.top}; left: ${cmdProj.left};" title="Command Center Unit"></div>`;
          cmdDistanceText = `Command Unit: ${formatDistance(cmdProj.distKm)} • ${cmdRoute.etaText}`;
        }

        // Google Maps Directions link to victim's coordinates
        const mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${vicLoc.latitude},${vicLoc.longitude}`;

        return `
          <div class="radar-card-unit">
            <div class="radar-target-title">🎯 Case #${index + 1}: ${vic.name}</div>
            <div class="radar-hud-screen">
              <div class="radar-crosshair-x"></div>
              <div class="radar-crosshair-y"></div>
              <div class="radar-circle-1"></div>
              <div class="radar-circle-2"></div>
              <!-- Red Center: Victim -->
              <div class="radar-blip blip-victim" style="top: 50%; left: 50%;" title="Victim: ${vic.name}"></div>
              ${cmdBlipHTML}
              ${volBlipHTML}
            </div>
            <div class="radar-telemetry-text" style="line-height: 1.4; font-size: 11px;">
              ${cmdDistanceText ? `<div style="color:#00d4ff;">🔵 ${cmdDistanceText}</div>` : ''}
              ${volDistanceText ? `<div style="color:#ffd000;">🟡 ${volDistanceText}</div>` : ''}
              <a href="${mapsLink}" target="_blank" style="display:inline-block; margin-top:6px; color:#fff; background:rgba(255,255,255,0.2); padding:3px 8px; border-radius:6px; text-decoration:none; font-size:10px;">🗺️ Open in Google Maps</a>
            </div>
          </div>
        `;
      }).join("");

      respondersPanel.innerHTML = activeMissions.map(m => {
        const vic = profileMap[String(m.target_user_id)] || { name: 'Tourist' };
        if (m.responder_type === 'COMMAND_CENTER') {
          return `
            <div class="responder-item" style="border-color: #00d4ff;">
              <strong style="color: #00d4ff;">🔵 Central Command Unit</strong> ➔ <span style="color:#ffffff;">ASSISTING: <strong>${vic.name}</strong></span>
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
      respondersPanel.innerHTML = `<em>No active rescue missions underway. Standing by for SOS alerts.</em>`;
    }

  } catch (err) {
    console.error("Staff Data Load Error:", err);
  }
};

window.dispatchSpecificFromCommandCenter = async function(sosId, targetUserId) {
  dismissedCommandSOS.add(String(sosId));

  const { error } = await supabase.from("rescue_missions").insert({
    sos_id: String(sosId),
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
// 7. VOLUNTEER PROMPT & NAVIGATION RADAR
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
          updateVolunteerLocationConvergence();
          compassInterval = setInterval(updateVolunteerLocationConvergence, 2000);
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
    if (promptText) promptText.innerText = `${victimName} is in distress and needs assistance! Can you respond?`;

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

  const { error } = await supabase.from("rescue_missions").insert({
    sos_id: String(activeRescueTarget.id),
    volunteer_id: String(userId),
    responder_type: 'VOLUNTEER',
    target_user_id: String(activeRescueTarget.user_id),
    status: "EN_ROUTE"
  });

  if (error) console.error("Volunteer dispatch save error:", error);

  document.getElementById("hudDispatchPrompt").style.display = "none";
  document.getElementById("hudCompassView").style.display = "block";

  updateVolunteerLocationConvergence();
  if (compassInterval) clearInterval(compassInterval);
  compassInterval = setInterval(updateVolunteerLocationConvergence, 2000);
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

async function updateVolunteerLocationConvergence() {
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

  const { data: targetMissions } = await supabase
    .from("rescue_missions")
    .select("responder_type")
    .eq("target_user_id", String(activeRescueTarget.user_id))
    .eq("status", "EN_ROUTE");

  const hasCommandAssistance = targetMissions && targetMissions.some(m => m.responder_type === 'COMMAND_CENTER');

  const targetLat = Number(activeRescueTarget.latitude);
  const targetLon = Number(activeRescueTarget.longitude);

  const volProj = projectGpsToRadar(targetLat, targetLon, lastKnownCoords.latitude, lastKnownCoords.longitude);
  const bearing = calculateBearing(lastKnownCoords.latitude, lastKnownCoords.longitude, targetLat, targetLon);
  const routeInfo = calculateRouteAndETA(volProj.distKm);

  const myBlip = document.getElementById("volHudMyBlip");
  const vicBlip = document.getElementById("volHudVictimBlip");
  const cmdBlip = document.getElementById("volHudCommandBlip");

  if (vicBlip) { vicBlip.style.top = "50%"; vicBlip.style.left = "50%"; }
  if (myBlip) { myBlip.style.top = volProj.top; myBlip.style.left = volProj.left; }

  if (cmdBlip) {
    if (hasCommandAssistance) {
      const cmdProj = projectGpsToRadar(targetLat, targetLon, 18.9894, 73.1175);
      cmdBlip.style.display = "block";
      cmdBlip.style.top = cmdProj.top;
      cmdBlip.style.left = cmdProj.left;
    } else {
      cmdBlip.style.display = "none";
    }
  }

  const distEl = document.getElementById("compassDistance");
  const brgEl = document.getElementById("compassBearing");

  if (distEl) distEl.innerText = `${formatDistance(volProj.distKm)} • ${routeInfo.etaText}`;
  if (brgEl) brgEl.innerText = `${Math.round(bearing)}°`;
}

// ==========================================
// 8. VICTIM SCREEN: DUAL ETA & DIRECT CONTACTS
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

  const { data: myLoc } = await supabase
    .from("locations")
    .select("latitude, longitude")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  const vicLat = myLoc ? Number(myLoc.latitude) : lastKnownCoords.latitude;
  const vicLon = myLoc ? Number(myLoc.longitude) : lastKnownCoords.longitude;

  const { data: missions } = await supabase
    .from("rescue_missions")
    .select("*")
    .eq("target_user_id", String(userId))
    .eq("status", "EN_ROUTE");

  if (missions && missions.length > 0) {
    wrapper.style.display = "flex";

    const hasCommand = missions.some(m => m.responder_type === 'COMMAND_CENTER');
    const volunteerMissions = missions.filter(m => m.responder_type === 'VOLUNTEER');

    let responderContactsHTML = "";

    // 1. Calculate Command Center Live Telemetry & ETA
    const cmdBlip = document.getElementById("vicScreenCommandBlip");
    if (hasCommand) {
      const cmdProj = projectGpsToRadar(vicLat, vicLon, 18.9894, 73.1175);
      const cmdRoute = calculateRouteAndETA(cmdProj.distKm);

      if (cmdBlip) {
        cmdBlip.style.display = "block";
        cmdBlip.style.top = cmdProj.top;
        cmdBlip.style.left = cmdProj.left;
      }

      responderContactsHTML += `
        <div class="victim-contact-pill">
          <div>
            🔵 <strong>Central Command Unit:</strong> Dispatched<br>
            <small style="color: #00d4ff; font-weight: 600;">Distance: ${formatDistance(cmdProj.distKm)} • ETA: ${cmdRoute.etaText}</small>
          </div>
          <span style="color: #00d4ff; font-weight: 600; font-size: 11px;">Radio Grid Active</span>
        </div>
      `;
    } else if (cmdBlip) {
      cmdBlip.style.display = "none";
    }

    // 2. Calculate Volunteer Live Telemetry & ETA
    const volBlip = document.getElementById("vicScreenVolunteerBlip");
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

        const volProj = projectGpsToRadar(vicLat, vicLon, vLat, vLon);
        const volRoute = calculateRouteAndETA(volProj.distKm);

        if (volBlip) {
          volBlip.style.display = "block";
          volBlip.style.top = volProj.top;
          volBlip.style.left = volProj.left;
        }

        const navToVolunteer = `https://www.google.com/maps/dir/?api=1&destination=${vLat},${vLon}`;

        responderContactsHTML += `
          <div class="victim-contact-pill">
            <div>
              🟡 <strong>${vp.name}</strong> (Volunteer En Route)<br>
              <small style="color: #ffd000; font-weight: 600;">Distance: ${formatDistance(volProj.distKm)} • ETA: ${volRoute.etaText}</small>
            </div>
            <div style="display:flex; gap:6px;">
              <a href="tel:${vp.phone}">📞 Call</a>
              <a href="${navToVolunteer}" target="_blank" style="background:#22c55e; color:#fff;">🗺️ Maps</a>
            </div>
          </div>
        `;
      });
    } else if (volBlip) {
      volBlip.style.display = "none";
    }

    if (contactsContainer) contactsContainer.innerHTML = responderContactsHTML;

    // Red Dot centered permanently
    const vicBlip = document.getElementById("vicScreenVictimBlip");
    if (vicBlip) { vicBlip.style.top = "50%"; vicBlip.style.left = "50%"; }

    if (hasCommand && volunteerMissions.length > 0) {
      title.innerText = "🚨 Aid Dispatched (Command Center + Volunteer)";
      details.innerText = "Both Central Command and nearby volunteer responders are actively converging on your position.";
    } else if (hasCommand) {
      title.innerText = "🚨 Central Command Unit Dispatched";
      details.innerText = "Official command response units are navigating to your GPS location.";
    } else {
      title.innerText = "⚡ Volunteer Responder En Route";
      details.innerText = "A registered volunteer responder has accepted your SOS and is on their way.";
    }
  } else {
    wrapper.style.display = "none";
  }
}

// ==========================================
// 9. SOS BROADCAST & STATE TRANSITION
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

  if (isEmergencyActive) {
    if (label) label.innerText = "CANCEL SOS (ACTIVE)";
    triggerVisualAlarm(true);
    siren.start();

    // Cancel any active outgoing missions if this user was volunteering
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

    await supabase.from("sos_events").insert({
      user_id: userId,
      latitude: lastKnownCoords.latitude,
      longitude: lastKnownCoords.longitude,
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
// 10. SELF-SERVICE OPT-OUT
// ==========================================
window.handleSelfOptOut = async function() {
  const userId = localStorage.getItem("touristSafetyUserId");
  if (!userId) {
    alert("No active profile registered on this device.");
    return;
  }

  const confirmed = confirm("Are you sure you want to end your trip and opt out of tracking?");
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

    alert("Your profile has been purged from the safety network.");
    window.switchPortal("portalGateway");
  } catch (err) {
    alert(`Failed to opt out: ${err.message}`);
  }
};

// ==========================================
// 11. BACKGROUND THEME ENGINE & FORM LISTENERS
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

  // Staff Authentication
  const staffAuthForm = document.getElementById("staffAuthForm");
  if (staffAuthForm) {
    staffAuthForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const enteredCode = document.getElementById("staffPasscodeInput").value.trim();

      if (enteredCode === STAFF_PASSCODE) {
        window.switchPortal("staffPortal");
        window.loadStaffMonitoringData();
        setInterval(window.loadStaffMonitoringData, 3000);
      } else {
        alert("Incorrect Staff Passcode. Access Denied.");
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
      alert(`Welcome back, ${profile.name}! Your session is restored.`);
      window.closeModal();
      updateUserStateView();
      checkVolunteerDistressSignals();
      checkVictimAidStatus();
    });
  }

  // Profile Registration Form
  const regForm = document.getElementById("registrationForm");
  if (regForm) {
    regForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = regForm.querySelector(".submit-btn");
      submitBtn.disabled = true;
      submitBtn.innerText = "Syncing Profile...";

      const wantsSecondRole = document.getElementById("additionalRole")?.checked || false;
      const isTourist = selectedRole === "tourist" || wantsSecondRole;
      const isVolunteer = selectedRole === "volunteer" || wantsSecondRole;

      const payload = {
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
        const { data, error } = await supabase
          .from("profiles")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        localStorage.setItem("touristSafetyUserId", data.id);

        await supabase.from("locations").insert({
          user_id: data.id,
          latitude: lastKnownCoords.latitude,
          longitude: lastKnownCoords.longitude
        });

        document.getElementById("registrationPage").style.display = "none";
        document.getElementById("successPage").style.display = "block";

        const roles = [isTourist && "Tourist", isVolunteer && "Volunteer"].filter(Boolean).join(" and ");
        const successMsg = document.getElementById("successMessage");
        if (successMsg) successMsg.innerText = `You have successfully registered as ${roles}.`;

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
