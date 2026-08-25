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

// High-Precision Hardware GPS State
let verifiedGpsCoords = null;
let verifiedGpsAccuracy = null;
let gpsWatchId = null;
let wakeLockSentinel = null;

// Persistent Leaflet Maps & Markers
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

// Active Geofence State
let activeZoneGeofence = {
  latitude: null,
  longitude: null,
  radiusKm: 2.5
};

let lastGeofenceCheckinTime = 0;
let checkinCountdownInterval = null;

// ==========================================
// 2. DIGITAL ID QR GENERATOR (LOCATION EXCLUDED)
// ==========================================
function formatProfileDataForQR(profile) {
  return [
    `=== TOURIST SAFETY DIGITAL ID ===`,
    `Name: ${profile.name || 'N/A'}`,
    `Age: ${profile.age || 'N/A'} | Gender: ${profile.gender || 'N/A'}`,
    `Blood Group: ${profile.blood_group || 'N/A'}`,
    `Phone: ${profile.phone || 'N/A'}`,
    `Destination Zone: ${profile.zone_code || 'UNASSIGNED'}`,
    `Role: ${[profile.is_tourist ? "Tourist" : "", profile.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ")}`,
    `Emergency Contact 1: ${profile.emergency_contact_1 || 'N/A'} (${profile.emergency_phone_1 || 'N/A'})`,
    `Emergency Contact 2: ${profile.emergency_contact_2 || 'None'} (${profile.emergency_phone_2 || 'N/A'})`,
    `Stay / Address: ${profile.home_address || 'N/A'}`
  ].join("\n");
}

function renderQRCodeInElement(elementId, text, size = 160) {
  const container = document.getElementById(elementId);
  if (!container) return;
  container.innerHTML = "";
  if (typeof QRCode !== "undefined") {
    new QRCode(container, {
      text: text,
      width: size,
      height: size,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  }
}

window.inspectUserProfileQR = function(encodedProfileJson) {
  try {
    const profile = JSON.parse(decodeURIComponent(encodedProfileJson));
    const modal = document.getElementById("qrInspectionModal");
    const overlay = document.getElementById("modalOverlay");
    const titleEl = document.getElementById("inspectModalName");
    const detailsEl = document.getElementById("inspectQRTextDetails");

    if (titleEl) titleEl.innerText = `${profile.name}'s Digital ID`;

    const qrText = formatProfileDataForQR(profile);
    renderQRCodeInElement("inspectQRCodeContainer", qrText, 180);

    if (detailsEl) {
      detailsEl.innerHTML = `
        <div><strong>Zone:</strong> <span style="color:#ffd000;">${profile.zone_code || 'UNASSIGNED'}</span></div>
        <div><strong>Role:</strong> ${[profile.is_tourist ? "Tourist" : "", profile.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ")}</div>
        <div><strong>Phone:</strong> <a href="tel:${profile.phone}" style="color:#38bdf8;">${profile.phone || 'N/A'}</a></div>
        <div><strong>Blood Group:</strong> <span style="color:#ef4444; font-weight:700;">${profile.blood_group || 'N/A'}</span></div>
        <div><strong>Primary Contact:</strong> ${profile.emergency_contact_1 || 'N/A'} (${profile.emergency_phone_1 || 'N/A'})</div>
        <div><strong>Address:</strong> ${profile.home_address || 'N/A'}</div>
      `;
    }

    if (overlay) overlay.style.display = "flex";
    if (modal) modal.style.display = "block";
  } catch (err) {
    console.error("QR Inspection Error:", err);
  }
};

// ==========================================
// 3. ULTRA-FAST HIGH-PRECISION GPS ENGINE
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
// 4. SYNTHESIZED EMERGENCY SIREN & CHIME
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
// 5. DISTANCE, BEARING & MAP UTILITIES
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
// 6. GEOFENCE BOUNDARY & 20-MIN CHECK-IN
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

  if (isOutside) {
    if (banner) banner.classList.add("breach");
    if (dot) { dot.className = "geofence-indicator-dot breach"; }
    if (title) title.innerText = "⚠️ Outside Certified Safe Zone";
    if (desc) desc.innerText = `You are ${distFromCenter.toFixed(2)} km away from ${currentZone} safe boundary (Max: ${radiusKm} km).`;

    const now = Date.now();
    const TWENTY_MINUTES_MS = 20 * 60 * 1000;
    if (now - lastGeofenceCheckinTime > TWENTY_MINUTES_MS) {
      triggerGeofenceSafetyCheckin(myCoords.latitude, myCoords.longitude, currentZone);
    }
  } else {
    if (banner) banner.classList.remove("breach");
    if (dot) { dot.className = "geofence-indicator-dot safe"; }
    if (title) title.innerText = "✓ Inside Certified Safe Zone";
    if (desc) desc.innerText = `Within ${currentZone} safe perimeter (${distFromCenter.toFixed(2)} km / ${radiusKm} km radius).`;
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
// 7. STAFF GEOFENCE EDITOR
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
// 8. PORTAL VIEW CONTROLLER
// ==========================================
window.switchPortal = function(portalId) {
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

  if (loggedOutSec) loggedOutSec.style.display = "none";
  if (loggedInSec) loggedInSec.style.display = "block";

  const userRoles = [profile.is_tourist ? "Tourist" : "", profile.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ");

  if (nameEl) nameEl.innerText = profile.name;
  if (roleEl) roleEl.innerText = userRoles || "User";
  if (zoneBadge) zoneBadge.innerText = profile.zone_code || "UNASSIGNED";

  // Update Digital Safety ID Elements
  const idNameEl = document.getElementById("digitalIdName");
  const idRoleEl = document.getElementById("digitalIdRole");
  const idPhoneEl = document.getElementById("idPhone");
  const idBloodEl = document.getElementById("idBlood");
  const idEmergencyEl = document.getElementById("idEmergency");
  const idAddressEl = document.getElementById("idAddress");

  if (idNameEl) idNameEl.innerText = profile.name;
  if (idRoleEl) idRoleEl.innerText = `${userRoles} • Blood: ${profile.blood_group || 'N/A'}`;
  if (idPhoneEl) idPhoneEl.innerText = profile.phone || 'N/A';
  if (idBloodEl) idBloodEl.innerText = profile.blood_group || 'N/A';
  if (idEmergencyEl) idEmergencyEl.innerText = `${profile.emergency_contact_1 || 'N/A'} (${profile.emergency_phone_1 || 'N/A'})`;
  if (idAddressEl) idAddressEl.innerText = profile.home_address || 'N/A';

  // Render Personal Dynamic QR Code
  const qrString = formatProfileDataForQR(profile);
  renderQRCodeInElement("userPersonalQRCode", qrString, 140);

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
// 9. INDIVIDUAL-OWNED PROFILE EDIT
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

  const overlay = document.getElementById("modalOverlay");
  const editModal = document.getElementById("editProfileModal");
  if (overlay) overlay.style.display = "flex";
  if (editModal) editModal.style.display = "block";
};

// ==========================================
// 10. WEBSITE HEAD MASTER OVERVIEW MATRIX
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
      tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; opacity:0.7;">No profiles registered across any destination yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = profiles.map(p => {
      const isCriticalSOS = activeSOSUserIds.has(String(p.id));
      const loc = userLocationMap[String(p.id)] || { latitude: p.latitude, longitude: p.longitude };
      const coordsDisplay = (loc.latitude && loc.longitude) ? `${Number(loc.latitude).toFixed(4)}, ${Number(loc.longitude).toFixed(4)}` : "Live GPS Active";

      let rowClass = isCriticalSOS ? "row-sos-red" : "row-normal";
      let statusTag = isCriticalSOS ? `<span class="status-tag tag-red">🚨 SOS ACTIVE</span>` : `<span class="status-tag tag-green">Normal</span>`;
      const roleBadge = [p.is_tourist ? "Tourist" : "", p.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ");
      const profileJsonEncoded = encodeURIComponent(JSON.stringify(p));

      return `
        <tr class="${rowClass}">
          <td><strong style="color: #ffd000;">${p.zone_code || 'UNASSIGNED'}</strong></td>
          <td>${statusTag}</td>
          <td>
            <button class="table-action-edit-btn" style="background:#ffd000; color:#000; font-weight:700;" onclick="inspectUserProfileQR('${profileJsonEncoded}')">
              🔍 View QR
            </button>
          </td>
          <td><strong>${p.name || 'Anonymous'}</strong></td>
          <td>${roleBadge || 'User'}</td>
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
// 11. STAFF COMMAND MATRIX & DIRECT CALLING
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
              <button class="command-btn btn-yes" onclick="dispatchSpecificFromCommandCenter('${sos.id}', '${sos.user_id}', '${currentZone}')">✓ DEPLOY HQ UNIT</button>
              
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

              <a href="tel:${victimPhone}" class="command-btn" style="background:#0284c7; color:#fff; text-decoration:none; display:inline-flex; align-items:center;">📞 CALL VICTIM</a>
              <button class="command-btn btn-no" onclick="dismissSpecificCommandPrompt('${sos.id}')">✕ STAND BY</button>
            </div>
          </div>
        `;
      }).join("");
    } else if (dispatchQueueEl) {
      dispatchQueueEl.style.display = "none";
    }

    // 2. Zone Roster Table (Features QR Digital ID Column)
    if (profiles.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; opacity:0.7;">No active profiles registered under ${currentZone} yet.</td></tr>`;
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
        let statusTag = `<span class="status-tag tag-green">Normal</span>`;

        if (isCriticalSOS) {
          rowClass = "row-sos-red";
          statusTag = `<span class="status-tag tag-red">🚨 SOS ACTIVE</span>`;
        } else if (isNearbyResponder) {
          rowClass = "row-responder-yellow";
          statusTag = `<span class="status-tag tag-yellow">⚡ RESPONDER IN RANGE</span>`;
        }

        const roleBadge = [p.is_tourist ? "Tourist" : "", p.is_volunteer ? "Volunteer" : ""].filter(Boolean).join(" & ");
        const coordsDisplay = (loc.latitude && loc.longitude) ? `${Number(loc.latitude).toFixed(4)}, ${Number(loc.longitude).toFixed(4)}` : `Live GPS Active`;
        const profileJsonEncoded = encodeURIComponent(JSON.stringify(p));

        return `
          <tr class="${rowClass}">
            <td>${statusTag}</td>
            <td>
              <button class="table-action-edit-btn" style="background:#ffd000; color:#000; font-weight:700;" onclick="inspectUserProfileQR('${profileJsonEncoded}')">
                🔍 View ID
              </button>
            </td>
            <td><strong>${p.name || 'Anonymous'}</strong></td>
            <td>${roleBadge || 'User'}</td>
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
              ${hasCommand ? `<a href="${cmdMapsUrl}" target="_blank" style="color:#fff; background:#0284c7; padding:4px 8px; border-radius:6px; text-decoration:none; font-size:10px;">🗺️ Command Route</a>` : ''}
              ${volCallBtnHTML}
              ${volunteerMissions.length > 0 ? `<a href="${volMapsUrl}" target="_blank" style="color:#000; background:#ffd000; padding:4px 8px; border-radius:6px; text-decoration:none; font-size:10px; font-weight:700;">🗺️ Volunteer Route</a>` : ''}
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
// 12. PURGE & DELETE ZONE COMMAND CENTER
// ==========================================
window.handleDeleteCommandCenter = async function() {
  const currentZone = sessionStorage.getItem("staffZoneCode");
  if (!currentZone) return;

  const confirmCode = prompt(`DANGER: This will permanently delete destination zone '${currentZone}' and purge all associated tourists, volunteers, and SOS alerts.\n\nEnter Admin Passcode for '${currentZone}' to confirm:`);
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
// 13. VOLUNTEER DISPATCH & ROUTING
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
// 14. VICTIM VIEW: RESCUE ROUTE & DIRECT CALLING
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
// 15. SOS BROADCAST & STATE TRANSITION
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

    const coords = await getLiveGpsCoordinates();

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
// 16. INDIVIDUAL USER ZONE EXIT & PURGE
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
// 17. BACKGROUND ENGINE & FORM LISTENERS
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
      alert(`Welcome back, ${matchedProfile.name}! Registered to zone: ${matchedProfile.zone_code || 'UNASSIGNED'}`);
      window.closeModal();
      updateUserStateView();
      checkVolunteerDistressSignals();
      checkVictimAidStatus();
      checkTouristGeofenceBoundary();
    });
  }

  // 5. User Registration
  const regForm = document.getElementById("registrationForm");
  if (regForm) {
    regForm.addEventListener("submit", async (e) => {
      e.preventDefault();

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

        document.getElementById("registrationPage").style.display = "none";
        document.getElementById("successPage").style.display = "block";

        const roles = [isTourist && "Tourist", isVolunteer && "Volunteer"].filter(Boolean).join(" and ");
        const successMsg = document.getElementById("successMessage");
        if (successMsg) successMsg.innerText = `You have registered as ${roles} under Destination Zone '${destinationZone}'. Your Digital Safety ID is ready!`;

        regForm.reset();
        updateUserStateView();
        checkTouristGeofenceBoundary();
      } catch (err) {
        alert(`Registration error: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Complete Registration";
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
        is_tourist: document.getElementById("editIsTourist").checked,
        is_volunteer: document.getElementById("editIsVolunteer").checked
      };

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

        alert("Your profile and Digital Safety ID have been updated successfully!");
        window.closeModal();

        updateUserStateView();
        checkTouristGeofenceBoundary();
      } catch (err) {
        alert(`Update error: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "💾 Update My Profile";
      }
    });
  }

  // Continuous polling
  setInterval(checkVolunteerDistressSignals, 2500);
  setInterval(checkVictimAidStatus, 2000);
  setInterval(checkTouristGeofenceBoundary, 10000);
});
