
export interface MachineTemplateData {
  machineId: string;
  name: string;
  wifiSsid?: string;
  wifiPassword?: string;
  ip?: string;
  backendUrl?: string;
}

export interface ProductTemplateData {
  slot: string;
  name: string;
  machine?: string;
}

export const generateESPSketch = (machine: MachineTemplateData, products: ProductTemplateData[]): string => {
  // Filter products for this machine
  const machineProducts = products.filter(p => p.machine === machine.machineId || p.machine === machine.name || !p.machine);

  // Default WiFi credentials if not provided (User should edit these)
  const ssid = machine.wifiSsid || "YOUR_WIFI_SSID";
  const password = machine.wifiPassword || "YOUR_WIFI_PASSWORD";
  const backendUrl = machine.backendUrl || "192.168.1.100"; // Backend server IP

  // Extract Slots and Map to GPIO
  const slots = machineProducts.map(p => {
    const rawSlot = p.slot;
    // Parse slot to finding pin number (e.g. "D12" -> 12, "GPIO 12" -> 12)
    const pinMatch = rawSlot.match(/\d+/);
    const pin = pinMatch ? parseInt(pinMatch[0], 10) : -1;
    return {
      raw: rawSlot,
      pin: pin,
      productName: p.name
    };
  }).filter(s => s.pin !== -1);

  // Deduplicate pins
  const uniquePins = Array.from(new Set(slots.map(s => s.pin)));
  const validSlots = uniquePins.map(pin => {
    return slots.find(s => s.pin === pin);
  }).filter(item => item !== undefined);

  // Determine if Production (Render) or Local
  const isProduction = machine.backendUrl && (machine.backendUrl.includes('render.com') || machine.backendUrl.includes('herokuapp'));
  const host = machine.backendUrl?.replace('https://', '').replace('http://', '').replace(/\/$/, '') || "192.168.1.100";

  // Production uses Port 443 (SSL), Local uses 3001
  const port = isProduction ? 443 : 3001;
  const beginCommand = isProduction ? 'webSocket.beginSSL(backendHost, backendPort, wsPath);' : 'webSocket.begin(backendHost, backendPort, wsPath);';

  const ipOctets = machine.ip ? machine.ip.split('.').join(', ') : '192, 168, 1, 100';

  return `
/*
 * ESP32 Vending Machine Sketch with WebSocket Health Monitoring
 * Generated for Machine: ${machine.machineId} (${machine.name})
 * Generated on: ${new Date().toLocaleString()}
 * Environment: ${isProduction ? 'Production (SSL)' : 'Local Development'}
 */

#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// --- Configuration ---
const char* ssid = "${ssid}";      
const char* password = "${password}";
const char* machineId = "${machine.machineId}";

// Backend Server Configuration
const char* backendHost = "${host}";  // Auto-detected Host
const int backendPort = ${port};  // ${isProduction ? 'SSL Port' : 'Dev Port'}
const char* wsPath = "/health";

// Static IP Configuration
IPAddress local_IP(${ipOctets});
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress primaryDNS(8, 8, 8, 8);   
IPAddress secondaryDNS(8, 8, 4, 4); 

WebServer server(80);
WebSocketsClient webSocket;

bool wsConnected = false;
unsigned long lastReconnectAttempt = 0;
const unsigned long RECONNECT_INTERVAL = 5000; // Try reconnecting every 5 seconds

// --- Product Slot Mapping ---
// SlotId -> GPIO Pin
${validSlots.map(s => `// ${s?.raw} (${s?.productName}) -> GPIO ${s?.pin}`).join('\n')}

struct SlotMapping {
  int id;   // logical slot id
  int pin;  // gpio pin
};

const int SLOT_COUNT = ${validSlots.length};
SlotMapping slots[SLOT_COUNT] = {
  ${validSlots.map(s => `{ ${s?.pin}, ${s?.pin} }`).join(',\n  ')}
};

// --- Helper Functions ---

void sendJsonResponse(int code, bool success, String message, StaticJsonDocument<200>* extraDoc = nullptr) {
  StaticJsonDocument<512> doc;
  doc["success"] = success;
  doc["message"] = message;
  
  if (extraDoc != nullptr) {
    JsonObject root = doc.as<JsonObject>();
    JsonObject extra = extraDoc->as<JsonObject>();
    for (JsonPair kv : extra) {
      root[kv.key()] = kv.value();
    }
  }

  String response;
  serializeJson(doc, response);
  
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(code, "application/json", response);
}

// --- WebSocket Event Handler ---

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected from backend");
      wsConnected = false;
      break;
      
    case WStype_CONNECTED:
      Serial.println("[WS] Connected to backend");
      wsConnected = true;
      
      // Register this machine with the backend
      {
        StaticJsonDocument<128> doc;
        doc["type"] = "register";
        doc["machineId"] = machineId;
        
        String msg;
        serializeJson(doc, msg);
        webSocket.sendTXT(msg);
        Serial.printf("[WS] Sent registration: %s\\n", msg.c_str());
      }
      break;
      
    case WStype_TEXT:
      Serial.printf("[WS] Received: %s\\n", payload);
      
      // Parse incoming message
      {
        StaticJsonDocument<512> doc;
        DeserializationError error = deserializeJson(doc, payload);
        
        if (!error) {
          const char* type = doc["type"];
          
          if (strcmp(type, "ping") == 0) {
            // Respond to ping with pong
            StaticJsonDocument<128> response;
            response["type"] = "pong";
            response["machineId"] = machineId;
            response["timestamp"] = doc["timestamp"];
            
            String msg;
            serializeJson(response, msg);
            webSocket.sendTXT(msg);
            Serial.println("[WS] Sent pong");
          }
          // Handle Dispense Command
          else if (strcmp(type, "dispense") == 0) {
             int slotId = doc["slot"];
             int qty = doc["quantity"] | 1;
             Serial.printf("🚀 Dispensing Slot %d (Qty: %d)\\n", slotId, qty);
             
             // Find GPIO pin
             int pin = -1;
             for(int i=0; i<SLOT_COUNT; i++) {
               if(slots[i].id == slotId) {
                 pin = slots[i].pin;
                 break;
               }
             }
             
             if(pin != -1) {
               // Activate Motor
               for(int k=0; k<qty; k++) {
                 digitalWrite(pin, HIGH);
                 delay(1000); // 1 Second Runtime
                 digitalWrite(pin, LOW);
                 delay(500);
               }
             } else {
               Serial.println("❌ Invalid Slot ID");
             }
          }
          else if (strcmp(type, "registered") == 0) {
            Serial.println("[WS] Registration confirmed");
          }
        }
      }
      break;
      
    case WStype_ERROR:
      Serial.println("[WS] Error occurred");
      break;
  }
}

// --- Handlers declarations ---
void handleRoot();
void handleStatus();
void handleDispense();
void handleNotFound();

// --- Setup ---

void setup() {
  Serial.begin(115200);
  delay(10); 

  // Initialize Pins
  Serial.println("Initializing Product Slots...");
  for (int i = 0; i < SLOT_COUNT; i++) {
    pinMode(slots[i].pin, OUTPUT);
    digitalWrite(slots[i].pin, LOW); // Active HIGH (LOW = OFF)
  }

  // Connect to WiFi with static IP
  if (!WiFi.config(local_IP, gateway, subnet, primaryDNS, secondaryDNS)) {
    Serial.println("STA Failed to configure");
  }

  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected.");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  // Setup WebSocket connection
  ${beginCommand}
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(RECONNECT_INTERVAL);
  
  // Keep connection alive
  if(${isProduction}) {
      webSocket.enableHeartbeat(15000, 3000, 2);      
  }
  
  Serial.printf("WebSocket client initialized (%s://%s:%d%s)\\n", "${isProduction ? 'wss' : 'ws'}", backendHost, backendPort, wsPath);

  // Define HTTP Routes
  server.on("/", handleRoot);
  server.on("/status", handleStatus);
  server.on("/dispense", HTTP_POST, handleDispense);
  server.onNotFound(handleNotFound);

  server.begin();
  Serial.println("HTTP server started");
  Serial.printf("Machine ID: %s\\n", machineId);
  Serial.println("Ready for commands!");
}

// --- Main Loop ---

void loop() {
  // Handle HTTP server
  server.handleClient();
  
  // Handle WebSocket connection
  webSocket.loop();
  
  // Auto-reconnect WebSocket if disconnected
  if (!wsConnected && (millis() - lastReconnectAttempt > RECONNECT_INTERVAL)) {
    Serial.println("[WS] Attempting to reconnect...");
    lastReconnectAttempt = millis();
  }
}

// --- Handlers ---

void handleRoot() {
  sendJsonResponse(200, true, String("Black Box Vending Machine: ") + "${machine.machineId}" + " is Online.");
}

void handleStatus() {
  StaticJsonDocument<200> data;
  data["id"] = "${machine.machineId}";
  data["status"] = "online";
  data["ip"] = WiFi.localIP().toString();
  data["uptime"] = millis();
  data["wsConnected"] = wsConnected;
  
  sendJsonResponse(200, true, "System Operational", &data);
}

void handleDispense() {
  if (server.hasArg("plain") == false) {
    sendJsonResponse(400, false, "Body not received");
    return;
  }

  String body = server.arg("plain");
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, body);

  if (error) {
    Serial.print(F("deserializeJson() failed: "));
    Serial.println(error.f_str());
    sendJsonResponse(400, false, "Invalid JSON");
    return;
  }

  int requestedPin = doc["slot"];
  int quantity = doc["quantity"] | 1;

  Serial.print("Dispensing requested on PIN: ");
  Serial.println(requestedPin);
  Serial.print("Quantity: ");
  Serial.println(quantity);

  // Validate Pin
  bool valid = false;
  for (int i = 0; i < SLOT_COUNT; i++) {
    if (slots[i].pin == requestedPin) {
      valid = true;
      break;
    }
  }

  if (!valid) {
    sendJsonResponse(400, false, "Invalid Slot/Pin");
    return;
  }

  // Send response immediately to prevent timeout
  sendJsonResponse(200, true, "Dispense initiated");

  // Dispense Logic (runs after response is sent)
  for(int q = 0; q < quantity; q++) {
      Serial.println("Activating Motor...");
      digitalWrite(requestedPin, HIGH); // ON
      delay(1000); 
      digitalWrite(requestedPin, LOW); // OFF
      delay(500); 
  }

  Serial.println("Dispensing complete");
}

void handleNotFound() {
  sendJsonResponse(404, false, "Not Found");
}
    `;
};
