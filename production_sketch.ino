#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ==========================================
// 🔧 USER CONFIGURATION (EDIT THIS)
// ==========================================
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
const char* machineId = "VM-001"; // Pre-filled from logs

// 🎰 Product Slot Configuration
// Format: { logical_id, gpio_pin }
struct SlotMapping {
  int id;
  int pin;
};

// EXAMPLE: Mapping Slot 1 to Pin 2 (Built-in LED) for testing
// Change this to your actual motor pins: e.g. { {1, 12}, {2, 14}, ... }
// 🚀 AUTO-GENERATED MAPPING (1-50)
// This assumes Slot 1 = Pin 1, Slot 16 = Pin 16, etc.
// Start small and expand as needed.
// 🚀 VM-001 EXACT MAPPING
// Products: D16, D17, D18, D19, D21, D22, D23, D25, D26, D27
SlotMapping slots[] = {
  { 16, 16 }, { 17, 17 }, { 18, 18 }, { 19, 19 },
  { 21, 21 }, { 22, 22 }, { 23, 23 }, 
  { 25, 25 }, { 26, 26 }, { 27, 27 }
};
const int SLOT_COUNT = sizeof(slots) / sizeof(slots[0]);

// ==========================================
// ☁️ SERVER CONFIGURATION (DO NOT EDIT)
// ==========================================
const char* backendHost = "black-box-4sm3.onrender.com";
const int backendPort = 443; 
const char* wsPath = "/health";

WebSocketsClient webSocket;
bool wsConnected = false;
unsigned long lastReconnectAttempt = 0;
const unsigned long RECONNECT_INTERVAL = 5000;

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
        sendLog("Machine Online & Connected to Backend!");
      }
      break;
      
    case WStype_TEXT:
      Serial.printf("[WS] Received: %s\n", payload);
      
      // Handle Messages
      {
        StaticJsonDocument<512> doc;
        DeserializationError error = deserializeJson(doc, payload);
        
        if (!error) {
          const char* msgType = doc["type"];
          
          if (strcmp(msgType, "ping") == 0) {
            sendLog("Ping Received");
            // Send Pong
            StaticJsonDocument<128> response;
            response["type"] = "pong";
            response["machineId"] = machineId;
            response["timestamp"] = doc["timestamp"];
            String msg;
            serializeJson(response, msg);
            webSocket.sendTXT(msg);
          }
          else if (strcmp(msgType, "dispense") == 0) {
             // 1. GET SLOT ID
             int slotId = 0;
             if (doc["slot"].is<int>()) {
               slotId = doc["slot"];
             } else {
               const char* s = doc["slot"];
               if (s[0] == 'D' || s[0] == 'd') {
                 slotId = atoi(s + 1); // "D22" -> 22
               } else {
                 slotId = atoi(s);
               }
             }

             int qty = doc["quantity"] | 1;
             Serial.printf("🚀 Dispensing Command Recv: Slot %d, Qty %d\n", slotId, qty);
             sendLog("Dispensing Command Recv: Slot " + String(slotId) + ", Qty " + String(qty));

             // 2. DIRECTLY MAP SLOT TO PIN
             int pin = slotId;

             // 3. SAFETY CHECK (Is this a valid ESP32 GPIO?)
             bool safe = false;
             int safePins[] = {2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33};
             for (int x : safePins) {
               if (pin == x) { safe = true; break; }
             }

             if (safe) {
                 Serial.printf("⚡ Activating Pin %d NOW...\n", pin);
                 sendLog("Activating Pin " + String(pin) + " NOW...");
                 
                 pinMode(pin, OUTPUT);
                 for(int k=0; k<qty; k++) {
                   digitalWrite(pin, HIGH);
                   delay(1000); 
                   digitalWrite(pin, LOW);
                   delay(500);
                 }
                 Serial.printf("✅ Finished Dispensing Pin %d\n", pin);
                 sendLog("✅ Finished Dispensing Pin " + String(pin));
             } else {
                 Serial.printf("❌ Error: Pin %d is not in safe list!\n", pin);
                 sendLog("❌ Error: Pin " + String(pin) + " is not in safe list!");
             }
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
// 🏁 Setup & Loop
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(500);

  // Init Pins
  for (int i = 0; i < SLOT_COUNT; i++) {
    pinMode(slots[i].pin, OUTPUT);
    digitalWrite(slots[i].pin, LOW); 
  }

  // Connect WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi Connected");

  // Connect WebSocket (SSL)
  // IMPORTANT: beginSSL is needed for Render (HTTPS)
  webSocket.beginSSL(backendHost, backendPort, wsPath);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(RECONNECT_INTERVAL);
  
  // Keep connection alive
  webSocket.enableHeartbeat(15000, 3000, 2);
}

void loop() {
  webSocket.loop();
}
