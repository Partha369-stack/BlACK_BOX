

interface MachineData {
    machineId: string;
    name: string;
    wifiSsid?: string;
    wifiPassword?: string;
    ip?: string;
}

interface ProductData {
    slot: string;
    name: string;
    machine?: string;
}

export const generateESPSketch = (machine: MachineData, products: ProductData[]): string => {
    // 1. Filter products for this machine (just in case)
    // The calling component should ideally pass pre-filtered products, but we double-check.
    const machineProducts = products.filter(p => p.machine === machine.machineId || p.machine === machine.name || !p.machine || p.machine === 'VM-001');

    // 2. Extract Slots and Map to GPIO
    // We assume 'slot' is a string that might contain the PIN number directly or require parsing.
    // Enhanced generic parsing: remove non-numeric chars to find the pin, fallback if failed.
    const slots = machineProducts.map(p => {
        const rawSlot = p.slot;
        // fast and loose parsing: "D12" -> 12, "12" -> 12, "GPIO 12" -> 12
        const pinMatch = rawSlot.match(/\d+/);
        const pin = pinMatch ? parseInt(pinMatch[0], 10) : -1;
        return {
            raw: rawSlot,
            pin: pin,
            productName: p.name
        };
    }).filter(s => s.pin !== -1);

    // Deduplicate pins (one pin might have multiple items if data is messy, we just take unique pins)
    const uniquePins = Array.from(new Set(slots.map(s => s.pin)));

    const validSlots = uniquePins.map(pin => {
        return slots.find(s => s.pin === pin);
    }).filter(item => item !== undefined);


    // 3. Generate Code Template
    const code = `
/*
 * ESP32 Vending Machine Sketch
 * Generated for Machine: ${machine.machineId} (${machine.name})
 * Generated on: ${new Date().toLocaleString()}
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// --- Configuration ---
const char* ssid = "YOUR_WIFI_SSID";      
const char* password = "YOUR_WIFI_PASSWORD";

// Static IP Configuration
IPAddress local_IP(${machine.ip ? machine.ip.split('.').join(', ') : '192, 168, 1, 100'});
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress primaryDNS(8, 8, 8, 8);   
IPAddress secondaryDNS(8, 8, 4, 4); 

WebServer server(80);

// --- Product Slot Mapping ---
// Slot -> GPIO Pin
${validSlots.map(s => `// ${s?.raw} (${s?.productName}) -> GPIO ${s?.pin}`).join('\n')}

struct SlotMapping {
  int id;
  int pin;
};

const int SLOT_COUNT = ${validSlots.length};
SlotMapping slots[SLOT_COUNT] = {
  ${validSlots.map(s => `{ ${s?.pin}, ${s?.pin} }`).join(',\n  ')}
};

// --- Helper Functions ---

void sendJsonResponse(int code, bool success, String message, StaticJsonDocument<200>* extraDoc = nullptr) {
  StaticJsonDocument<512> doc; // defined buffer size
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

// --- Setup ---

void setup() {
  Serial.begin(115200);
  delay(10); 

  // Initialize Pins
  Serial.println("Initializing Product Slots...");
  for (int i = 0; i < SLOT_COUNT; i++) {
    pinMode(slots[i].pin, OUTPUT);
    digitalWrite(slots[i].pin, HIGH); // Active LOW Relay assumed (HIGH = OFF)
  }

  // Connect to WiFi
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

  // Define Routes
  server.on("/", handleRoot);
  server.on("/status", handleStatus);
  server.on("/dispense", HTTP_POST, handleDispense);
  server.onNotFound(handleNotFound);

  server.begin();
  Serial.println("HTTP server started");
}

// --- Main Loop ---

void loop() {
  server.handleClient();
}

// --- Handlers ---

void handleRoot() {
  sendJsonResponse(200, true, "Black Box Vending Machine: ${machine.machineId} is Online.");
}

void handleStatus() {
  StaticJsonDocument<200> data;
  data["id"] = "${machine.machineId}";
  data["status"] = "online";
  data["ip"] = WiFi.localIP().toString();
  data["uptime"] = millis();
  
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

  // Dispense Logic
  for(int q=0; q<quantity; q++) {
      Serial.println("Activating Motor...");
      digitalWrite(requestedPin, LOW); // ON
      delay(1000); 
      digitalWrite(requestedPin, HIGH); // OFF
      delay(500); 
  }

  sendJsonResponse(200, true, "Dispensed Successfully");
}

void handleNotFound() {
  sendJsonResponse(404, false, "Not Found");
}

`;
    return code;
};
