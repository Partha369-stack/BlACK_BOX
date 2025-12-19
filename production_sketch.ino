/*
 * ESP32 Vending Machine Sketch - ULTIMATE PROPER VERSION
 * Generated for Machine: VM-001
 * 
 * FEATURES:
 * ✅ WebSocket Health Monitoring & Commands
 * ✅ Local HTTP Server for Manual Debugging (/status, /dispense)
 * ✅ Robust Relay Control (Support for Active-HIGH/LOW)
 * ✅ Auto-reconnect WiFi & WebSocket
 * ✅ Direct Pin Mapping with Safety List
 */

#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ==========================================
// 🔧 USER CONFIGURATION
// ==========================================

// WiFi Credentials
const char* ssid = "";      
const char* password = "";

// Machine ID
const char* machineId = "VM-001";

// Backend Server Configuration
// Toggle between Production (Render) and Local Development
#define USE_PRODUCTION_BACKEND false // Set to true for Render, false for Local

#if USE_PRODUCTION_BACKEND
  const char* backendHost = "black-box-4sm3.onrender.com";
  const int backendPort = 443; 
  const bool useSSL = true;
#else
  const char* backendHost = "10.148.0.197"; // ⚡ Update this with your computer's IP
  const int backendPort = 3001; 
  const bool useSSL = false;
#endif

const char* wsPath = "/ws";

// Relay Type Configuration
// true = Relay ON when GPIO is LOW (most common)
// false = Relay ON when GPIO is HIGH
const bool RELAY_ACTIVE_LOW = false;  // ⚡ FIXED: Your relays are Active-HIGH!

// ==========================================
// 🎰 Product Slot Configuration
// ==========================================
struct SlotMapping {
  int id;
  int pin;
  String name;
};

SlotMapping slots[] = {
  { 16, 16, "KitKat" }, { 17, 17, "Dairy Milk" }, { 18, 18, "Mad Angles" }, { 19, 19, "Gems" },
  { 21, 21, "Kurkure" }, { 22, 22, "Lays" }, { 23, 23, "Bhujia" }, 
  { 25, 25, "Eclairs" }, { 26, 26, "Uncle Chips" }, { 27, 27, "5 Star" }
};
const int SLOT_COUNT = sizeof(slots) / sizeof(slots[0]);

// ==========================================
// 🌐 Global Objects
// ==========================================
WebServer server(80);
WebSocketsClient webSocket;
bool wsConnected = false;
unsigned long lastReconnectAttempt = 0;
const unsigned long RECONNECT_INTERVAL = 5000;

// ==========================================
// 🔧 Helper: Relay Control
// ==========================================
void relayON(int pin) {
  digitalWrite(pin, RELAY_ACTIVE_LOW ? LOW : HIGH);
}

void relayOFF(int pin) {
  digitalWrite(pin, RELAY_ACTIVE_LOW ? HIGH : LOW);
}

// ==========================================
// 📡 Helper: Send Log to Server
// ==========================================
void sendLog(String message) {
  if(wsConnected) {
    StaticJsonDocument<256> doc;
    doc["type"] = "log";
    doc["machineId"] = machineId;
    doc["message"] = message;
    String msg;
    serializeJson(doc, msg);
    webSocket.sendTXT(msg);
  }
  Serial.println("[LOG] " + message);
}

// ==========================================
// ⚙️ Core: Dispense Logic
// ==========================================
bool executeDispense(int slotId, int qty) {
  int pin = -1;
  String prodName = "Unknown";
  
  // 1. Find the pin
  for (int i = 0; i < SLOT_COUNT; i++) {
    if (slots[i].id == slotId) {
      pin = slots[i].pin;
      prodName = slots[i].name;
      break;
    }
  }

  // 2. Safety Check (Is this a valid GPIO?)
  bool safe = false;
  int safePins[] = {2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33};
  for (int x : safePins) {
    if (pin == x) { safe = true; break; }
  }

  if (safe) {
      Serial.printf("🚀 Dispensing: %s (Pin %d) x%d\n", prodName.c_str(), pin, qty);
      sendLog("Dispensing " + prodName + " x" + String(qty));
      
      pinMode(pin, OUTPUT);
      for(int k=0; k<qty; k++) {
        relayON(pin);
        delay(1000); 
        relayOFF(pin);
        delay(500);
      }
      sendLog("✅ Finished Dispensing " + prodName);
      return true;
  } else {
      Serial.printf("❌ Error: Invalid or Unsafe Pin %d\n", pin);
      sendLog("❌ Error: Pin " + String(pin) + " is unsafe!");
      return false;
  }
}

// ==========================================
// 📡 WebSocket Events
// ==========================================
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected!");
      wsConnected = false;
      break;
      
    case WStype_CONNECTED:
      Serial.println("[WS] Connected to Server!");
      wsConnected = true;
      
      // Register Machine
      {
        StaticJsonDocument<128> doc;
        doc["type"] = "register";
        doc["machineId"] = machineId;
        String msg;
        serializeJson(doc, msg);
        webSocket.sendTXT(msg);
        Serial.println("[WS] Sent registration");
        sendLog("Machine Online & Connected!");
      }
      break;
      
    case WStype_TEXT:
      Serial.printf("[WS] Received: %s\n", payload);
      {
        StaticJsonDocument<512> doc;
        DeserializationError error = deserializeJson(doc, payload);
        if (!error) {
          const char* msgType = doc["type"];
          if (strcmp(msgType, "ping") == 0) {
            StaticJsonDocument<128> response;
            response["type"] = "pong";
            response["machineId"] = machineId;
            response["timestamp"] = doc["timestamp"];
            String msg;
            serializeJson(response, msg);
            webSocket.sendTXT(msg);
          }
          else if (strcmp(msgType, "dispense") == 0) {
             int slotId = 0;
             if (doc["slot"].is<int>()) {
               slotId = doc["slot"];
             } else {
               const char* s = doc["slot"];
               if (s[0] == 'D' || s[0] == 'd') slotId = atoi(s + 1);
               else slotId = atoi(s);
             }
             int qty = doc["quantity"] | 1;
             executeDispense(slotId, qty);
          }
        }
      }
      break;
    case WStype_ERROR:
      Serial.println("[WS] Error!");
      break;
  }
}

// ==========================================
// 🌐 HTTP Route Handlers
// ==========================================
void handleStatus() {
  StaticJsonDocument<256> doc;
  doc["status"] = "online";
  doc["id"] = machineId;
  doc["ws"] = wsConnected;
  doc["ip"] = WiFi.localIP().toString();
  doc["uptime"] = millis() / 1000;
  String res;
  serializeJson(doc, res);
  server.send(200, "application/json", res);
}

void handleDispense() {
  if (server.hasArg("plain") == false) {
    server.send(400, "text/plain", "Body missing");
    return;
  }
  StaticJsonDocument<200> doc;
  deserializeJson(doc, server.arg("plain"));
  int slot = doc["slot"] | 0;
  int qty = doc["quantity"] | 1;
  
  if (executeDispense(slot, qty)) {
    server.send(200, "text/plain", "Success");
  } else {
    server.send(400, "text/plain", "Failed");
  }
}

// ==========================================
// 🏁 Setup & Loop
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n--- BLACK BOX VENDING MACHINE STARTING ---");

  // Init Pins
  for (int i = 0; i < SLOT_COUNT; i++) {
    pinMode(slots[i].pin, OUTPUT);
    relayOFF(slots[i].pin); 
  }

  // Connect WiFi
  Serial.printf("📡 Connecting to WiFi: %s\n", ssid);
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("IP: "); Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi Failed. Restarting...");
    ESP.restart();
  }

  // Setup WebSocket
  if (useSSL) {
    webSocket.beginSSL(backendHost, backendPort, wsPath);
  } else {
    webSocket.begin(backendHost, backendPort, wsPath);
  }
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(RECONNECT_INTERVAL);
  webSocket.enableHeartbeat(15000, 3000, 2);

  // Setup HTTP
  server.on("/status", handleStatus);
  server.on("/dispense", HTTP_POST, handleDispense);
  server.begin();
  
  Serial.println("🚀 System Ready!");
}

void loop() {
  webSocket.loop();
  server.handleClient();
  
  // WiFi Maintenance
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi Lost! Reconnecting...");
    WiFi.begin(ssid, password);
    delay(2000);
  }
}
