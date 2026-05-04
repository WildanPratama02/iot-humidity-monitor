#include <ArduinoJson.h>
#include <DHT.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <time.h>

// -----------------------
// WiFi Configuration
// -----------------------
const char *ssid = "PWJ Arduino";
const char *password = "2024P@rduin0";

// -----------------------
// Local Server API (Server 1)
// -----------------------
const char *serverURL1 = "192.168.43.175";
const int portServer1 = 8091;
const char *endpointServer1 = "/data";

// -----------------------
// Local Server API (Server 2)
// -----------------------
const char *serverURL2 = "192.168.40.193";
const int portServer2 = 8091;
const char *endpointServer2 = "/data";

// -----------------------
// Device Configuration
// -----------------------
const char *DEVICE_ID = "PXMO01"; // Ubah tiap device

// -----------------------
// DHT22 Configuration
// -----------------------
#define DHTPIN D4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// Calibration offset opsional
float tempOffset = 0.0;
float humOffset = 0.0;

// -----------------------
// Setup
// -----------------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("Booting...");
  dht.begin();

  Serial.print("ESP Board MAC Address:");

  Serial.println(WiFi.macAddress());

  // WiFi connect
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected!");
  Serial.println(WiFi.localIP());

  // Sync NTP Time → WIB (UTC+7)
  configTime(7 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("Syncing time...");
  delay(2000);
}

// -----------------------
// Get current timestamp (PostgreSQL Format)
// -----------------------
String getTimestamp() {
  time_t now = time(nullptr);
  struct tm *p = localtime(&now);

  char buffer[30];
  sprintf(buffer, "%04d-%02d-%02d %02d:%02d:%02d", p->tm_year + 1900,
          p->tm_mon + 1, p->tm_mday, p->tm_hour, p->tm_min, p->tm_sec);

  return String(buffer);
}

// -----------------------
// Send Data to Server (Helper Function)
// -----------------------
void sendToServer(const char *server, int port, const char *endpoint,
                  String jsonData, const char *serverName) {
  HTTPClient http;
  WiFiClient client;

  String fullURL =
      "http://" + String(server) + ":" + String(port) + String(endpoint);

  Serial.print("[");
  Serial.print(serverName);
  Serial.print("] Connecting to: ");
  Serial.println(fullURL);

  http.begin(client, fullURL);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(jsonData);

  if (httpCode > 0) {
    Serial.printf("[%s] Response [%d]: ", serverName, httpCode);
    Serial.println(http.getString());
  } else {
    Serial.printf("[%s] POST failed: %s\n", serverName,
                  http.errorToString(httpCode).c_str());
  }

  http.end();
}

// -----------------------
// Main Loop
// -----------------------
void loop() {
  float hum = dht.readHumidity();
  float temp = dht.readTemperature();

  if (isnan(hum) || isnan(temp)) {
    Serial.println("Sensor read failed!");
    delay(2000);
    return;
  }

  temp += tempOffset;
  hum += humOffset;

  String timeNow = getTimestamp();

  // -----------------------
  // Create JSON payload
  // -----------------------
  StaticJsonDocument<250> doc;
  doc["id_device"] = DEVICE_ID;
  doc["temp"] = temp;
  doc["hum"] = hum;
  doc["datetime"] = timeNow;

  String jsonString;
  serializeJson(doc, jsonString);

  Serial.println("=== Sensor Data ===");
  Serial.println(jsonString);

  // -----------------------
  // SEND TO BOTH SERVERS
  // -----------------------
  if (WiFi.status() == WL_CONNECTED) {
    // Kirim ke Server 1
    sendToServer(serverURL1, portServer1, endpointServer1, jsonString,
                 "Server1");

    // Kirim ke Server 2
    sendToServer(serverURL2, portServer2, endpointServer2, jsonString,
                 "Server2");
  } else {
    Serial.println("WiFi not connected!");
  }

  delay(60000); // Kirim setiap 1 menit
}
