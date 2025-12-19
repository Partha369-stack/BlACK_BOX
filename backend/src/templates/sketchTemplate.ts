
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

  // Default WiFi credentials if not provided
  const ssid = machine.wifiSsid || "P A R T H A";
  const password = machine.wifiPassword || "partha@@@";

  const slots = machineProducts.map(p => {
    const rawSlot = p.slot;
    const pinMatch = rawSlot.match(/\d+/);
    const gpioPin = pinMatch ? parseInt(pinMatch[0], 10) : -1;
    return {
      raw: rawSlot,
      pin: gpioPin,
      productName: p.name
    };
  }).filter(s => s.pin !== -1);

  // Unique pins only
  const uniquePins = Array.from(new Set(slots.map(s => s.pin)));
  const validSlots = uniquePins.map(pin => slots.find(s => s.pin === pin)).filter(Boolean);

  const isProduction = machine.backendUrl && (machine.backendUrl.includes('render.com') || machine.backendUrl.includes('herokuapp'));
  const host = machine.backendUrl?.replace('https://', '').replace('http://', '').replace(/\/$/, '') || "10.148.0.197";
  const port = isProduction ? 443 : 3001;

  return `
/*
 * ESP32 Vending Machine Sketch (Generated Version)
 * Machine: ${machine.machineId}
 * Environment: ${isProduction ? 'Production' : 'Development'}
 */

#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

const char* ssid = "${ssid}";      
const char* password = "${password}";
const char* machineId = "${machine.machineId}";

const char* backendHost = "${host}"; 
const int backendPort = ${port};
const char* wsPath = "/ws";
const bool useSSL = ${isProduction ? 'true' : 'false'};

const bool RELAY_ACTIVE_LOW = false; // Set to false for Active-HIGH relays

struct SlotMapping {
  int id;
  int pin;
  String name;
};

const int SLOT_COUNT = ${validSlots.length};
SlotMapping slots[SLOT_COUNT] = {
  ${validSlots.map(s => `{ ${s?.pin}, ${s?.pin}, "${s?.productName}" }`).join(',\n  ')}
};

WebServer server(80);
WebSocketsClient webSocket;
bool wsConnected = false;

void relayON(int pin) { digitalWrite(pin, RELAY_ACTIVE_LOW ? LOW : HIGH); }
void relayOFF(int pin) { digitalWrite(pin, RELAY_ACTIVE_LOW ? HIGH : LOW); }

void sendLog(String msg) {
  if(wsConnected) {
    StaticJsonDocument<256> doc;
    doc["type"] = "log";
    doc["machineId"] = machineId;
    doc["message"] = msg;
    String out; serializeJson(doc, out);
    webSocket.sendTXT(out);
  }
}

bool executeDispense(int slotId, int qty) {
  int pin = -1;
  for(int i=0; i<SLOT_COUNT; i++) if(slots[i].id == slotId) pin = slots[i].pin;
  if(pin == -1) return false;

  pinMode(pin, OUTPUT);
  for(int k=0; k<qty; k++) {
    relayON(pin); delay(1000); relayOFF(pin); delay(500);
  }
  return true;
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  if(type == WStype_CONNECTED) {
    wsConnected = true;
    StaticJsonDocument<128> doc;
    doc["type"] = "register"; doc["machineId"] = machineId;
    String msg; serializeJson(doc, msg);
    webSocket.sendTXT(msg);
  } else if(type == WStype_DISCONNECTED) {
    wsConnected = false;
  } else if(type == WStype_TEXT) {
    StaticJsonDocument<512> doc;
    if(!deserializeJson(doc, payload)) {
      if(strcmp(doc["type"], "ping") == 0) {
        StaticJsonDocument<128> res;
        res["type"] = "pong"; res["machineId"] = machineId; res["timestamp"] = doc["timestamp"];
        String out; serializeJson(res, out);
        webSocket.sendTXT(out);
      } else if(strcmp(doc["type"], "dispense") == 0) {
        executeDispense(doc["slot"] | 0, doc["quantity"] | 1);
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  for(int i=0; i<SLOT_COUNT; i++) { pinMode(slots[i].pin, OUTPUT); relayOFF(slots[i].pin); }
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED) delay(500);
  
  if(useSSL) webSocket.beginSSL(backendHost, backendPort, wsPath);
  else webSocket.begin(backendHost, backendPort, wsPath);
  webSocket.onEvent(webSocketEvent);
  webSocket.enableHeartbeat(15000, 3000, 2);
  server.begin();
}

void loop() {
  webSocket.loop();
  server.handleClient();
}
  `;
};
