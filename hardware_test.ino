#include <Arduino.h>

// 🔧 PIN CONFIGURATION
// Add all the pins you want to test here
int testPins[] = { 21, 23, 25, 27, 22, 17, 18, 19, 26, 32, 33 };
const int PIN_COUNT = sizeof(testPins) / sizeof(testPins[0]);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n🔍 STARTING HARDWARE DIAGNOSTIC TEST 🔍");
  Serial.println("========================================");

  for (int i = 0; i < PIN_COUNT; i++) {
    int pin = testPins[i];
    Serial.printf("Initializing Pin %d as OUTPUT...", pin);
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW); // Start OFF
    Serial.println(" Done.");
  }
  Serial.println("========================================");
  delay(1000);
}

void loop() {
  for (int i = 0; i < PIN_COUNT; i++) {
    int pin = testPins[i];
    
    Serial.printf("⚡ Testing Pin %d (ON for 2s)... ", pin);
    
    digitalWrite(pin, HIGH);  // Turn ON
    delay(2000);              // Wait 2 seconds
    
    digitalWrite(pin, LOW);   // Turn OFF
    Serial.println("OFF");
    
    delay(500); // Short pause before next pin
  }
  
  Serial.println("\n✅ Cycle Complete. Restarting in 3 seconds...\n");
  delay(3000);
}
