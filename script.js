// ==========================================================
// OFFLINE STORE-AND-FORWARD NETWORK ENGINE (PLUG & PLAY)
// ==========================================================

const OFFLINE_DB_NAME = "TouristSafetyOfflineDB";
const OFFLINE_DB_VERSION = 1;
let offlineDBInstance = null;

// 1. Initialize local offline storage (IndexedDB)
function initOfflineDatabase() {
  return new Promise((resolve) => {
    if (offlineDBInstance) return resolve(offlineDBInstance);

    const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("pending_telemetry")) {
        db.createObjectStore("pending_telemetry", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("pending_sos")) {
        db.createObjectStore("pending_sos", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      offlineDBInstance = event.target.result;
      console.log("[Offline Engine] Local database ready.");
      resolve(offlineDBInstance);
    };

    request.onerror = (event) => {
      console.warn("[Offline Engine] Local database error:", event.target.error);
      resolve(null);
    };
  });
}

// 2. Queue data locally when internet or cell connection is gone
async function queueOfflineData(storeName, data) {
  const db = await initOfflineDatabase();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.add({ ...data, queued_at: new Date().toISOString() });
      tx.oncomplete = () => {
        updateOfflineUIStatus(true);
        resolve(true);
      };
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}

// 3. Automatically sync stored data to Supabase when connection restores
async function syncOfflineDataToServer() {
  if (!navigator.onLine) return;
  const db = await initOfflineDatabase();
  if (!db) return;

  // Flush pending SOS distress signals
  try {
    const txSos = db.transaction("pending_sos", "readwrite");
    const storeSos = txSos.objectStore("pending_sos");
    const reqSos = storeSos.getAll();

    reqSos.onsuccess = async () => {
      const items = reqSos.result || [];
      for (const item of items) {
        const { id, queued_at, ...cleanPayload } = item;
        const { error } = await supabase.from("sos_events").insert(cleanPayload);
        if (!error) {
          const deleteTx = db.transaction("pending_sos", "readwrite");
          deleteTx.objectStore("pending_sos").delete(id);
        }
      }
    };
  } catch (err) {}

  // Flush pending GPS coordinates
  try {
    const txLoc = db.transaction("pending_telemetry", "readwrite");
    const storeLoc = txLoc.objectStore("pending_telemetry");
    const reqLoc = storeLoc.getAll();

    reqLoc.onsuccess = async () => {
      const items = reqLoc.result || [];
      for (const item of items) {
        const { id, queued_at, ...cleanPayload } = item;
        const { error } = await supabase.from("locations").insert(cleanPayload);
        if (!error) {
          const deleteTx = db.transaction("pending_telemetry", "readwrite");
          deleteTx.objectStore("pending_telemetry").delete(id);
        }
      }
      updateOfflineUIStatus(false);
    };
  } catch (err) {}
}

// 4. Non-intrusive floating status badge in the top right corner
function updateOfflineUIStatus(hasPendingOffline) {
  let badge = document.getElementById("offlineSyncIndicator");
  if (!badge) {
    badge = document.createElement("div");
    badge.id = "offlineSyncIndicator";
    badge.style.cssText = "position:fixed;top:12px;right:12px;z-index:9999;font-size:11px;font-weight:700;padding:5px 12px;border-radius:20px;display:none;backdrop-filter:blur(10px);transition:all 0.3s ease;box-shadow:0 4px 15px rgba(0,0,0,0.4);";
    document.body.appendChild(badge);
  }

  if (!navigator.onLine || hasPendingOffline) {
    badge.style.display = "block";
    badge.style.background = "rgba(245, 158, 11, 0.4)";
    badge.style.border = "1px solid #f59e0b";
    badge.style.color = "#fef08a";
    badge.innerText = "📡 Offline Mode (Local Queue Active)";
  } else {
    badge.style.display = "block";
    badge.style.background = "rgba(34, 197, 94, 0.3)";
    badge.style.border = "1px solid #22c55e";
    badge.style.color = "#86efac";
    badge.innerText = "✓ Online & Synced";
    setTimeout(() => { if (badge && navigator.onLine) badge.style.display = "none"; }, 3000);
  }
}

// 5. Automatic background listeners for network transitions
window.addEventListener("online", () => syncOfflineDataToServer());
window.addEventListener("offline", () => updateOfflineUIStatus(true));

// 6. Seamless Interceptors (Auto-catches GPS & SOS without modifying existing functions)
const originalBroadcast = window.broadcastLocationTelemetry;
if (typeof broadcastLocationTelemetry === "function") {
  const nativeBroadcast = broadcastLocationTelemetry;
  window.broadcastLocationTelemetry = async function(lat, lon, accuracy) {
    try {
      if (!navigator.onLine) {
        const userId = localStorage.getItem("touristSafetyUserId");
        if (userId) {
          queueOfflineData("pending_telemetry", { user_id: userId, latitude: lat, longitude: lon });
        }
      }
    } catch (e) {}
    return nativeBroadcast(lat, lon, accuracy);
  };
}

const originalSOSToggle = window.handleSOSToggle;
if (typeof originalSOSToggle === "function") {
  window.handleSOSToggle = async function() {
    try {
      if (!navigator.onLine) {
        const userId = localStorage.getItem("touristSafetyUserId");
        if (userId && !isEmergencyActive) {
          const coords = verifiedGpsCoords || { latitude: 18.9894, longitude: 73.1175 };
          queueOfflineData("pending_sos", { user_id: userId, latitude: coords.latitude, longitude: coords.longitude, status: "ACTIVE" });
        }
      }
    } catch (e) {}
    return originalSOSToggle.apply(this, arguments);
  };
}

// Periodic check every 8 seconds to flush queue
setInterval(() => {
  if (navigator.onLine) syncOfflineDataToServer();
}, 8000);

initOfflineDatabase();
