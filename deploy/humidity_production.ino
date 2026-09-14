#include <ArduinoJson.h>
#include <DHT.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <time.h>

// -----------------------
// WiFi Configuration
// GANTI SESUAI WIFI JARINGAN PERUSAHAAN
// -----------------------
const char *ssid = "NAMA_WIFI_PERUSAHAAN";
const char *password = "PASSWORD_WIFI";

// -----------------------
// Production Server API
// Server: 192.168.40.193
// -----------------------
const char *serverURL = "192.168.40.193";
const int portLocal = 80;  // Via NGINX HTTP (auto forward ke backend)
const char *endpointLocal = "/api/data";

// -----------------------
// Device Configuration
// GANTI SESUAI ID DEVICE
// -----------------------
const char *DEVICE_ID = "PXMO01";  // Ubah tiap device

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
  // SEND POST JSON
  // -----------------------
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    WiFiClient client;

    // Build full URL (via NGINX port 80)
    String fullURL = "http://" + String(serverURL) + ":" + String(portLocal) +
                     String(endpointLocal);

    Serial.print("Connecting to: ");
    Serial.println(fullURL);

    http.begin(client, fullURL);
    http.addHeader("Content-Type", "application/json");

    // Create JSON payload
    StaticJsonDocument<250> doc;
    doc["id_device"] = DEVICE_ID;
    doc["temp"] = temp;
    doc["hum"] = hum;
    doc["datetime"] = timeNow;

    String jsonString;
    serializeJson(doc, jsonString);

    Serial.println("Sending JSON:");
    Serial.println(jsonString);

    int httpCode = http.POST(jsonString);

    if (httpCode > 0) {
      Serial.printf("Server Response [%d]: ", httpCode);
      Serial.println(http.getString());
    } else {
      Serial.printf("POST failed: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
  }

  delay(60000);  // Kirim setiap 1 menit
}
