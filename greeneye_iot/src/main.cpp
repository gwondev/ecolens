#include <Arduino.h>
#include <cstring>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ========== 배포 시 모듈 고유번호만 수정 (DB modules.serial_number 와 동일) ==========
static const char *MODULE_SERIAL = "g1";

// ========== MQTT (백엔드 application.yaml greeneye.iot /api/iot/config 와 동일) ==========
static const char *MQTT_HOST = "mqtt.greeneye.gwon.run";
static const uint16_t MQTT_PORT = 1883;

// ========== WiFi (SSID × 비번 순차 시도) ==========
static const char *WIFI_SSIDS[] = {"gwon", "iptime"};
static const char *WIFI_PASSWORDS[] = {"00000000", "Gwondev0323", ""};
static const int WIFI_SSID_COUNT = 2;
static const int WIFI_PASSWORD_COUNT = 3;

// ========== 핀: IR 34 / R·Y·G 각각 (공통 애노드·저항 가정, ACTIVE HIGH) ==========
static const int PIN_IR = 34;
static const int PIN_LED_RED = 25;
static const int PIN_LED_YELLOW = 26;
static const int PIN_LED_GREEN = 27;
static const bool IR_DETECTED_IS_LOW = true;

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

char pendingNickname[48] = "";
enum { MODE_DEFAULT, MODE_READY_WAIT, MODE_CHECK_SHOW } deviceMode = MODE_DEFAULT;
unsigned long readyDeadlineMs = 0;
unsigned long greenUntilMs = 0;

String topicReady() { return String("greeneye/") + MODULE_SERIAL + "/ready"; }
String topicStatus() { return String("greeneye/") + MODULE_SERIAL + "/status"; }

void applyLeds(bool red, bool yellow, bool green) {
  digitalWrite(PIN_LED_RED, red ? HIGH : LOW);
  digitalWrite(PIN_LED_YELLOW, yellow ? HIGH : LOW);
  digitalWrite(PIN_LED_GREEN, green ? HIGH : LOW);
}

void enterDefaultIdle() {
  deviceMode = MODE_DEFAULT;
  applyLeds(true, false, false);
  pendingNickname[0] = '\0';
}

bool irDetected() {
  int v = digitalRead(PIN_IR);
  return IR_DETECTED_IS_LOW ? (v == LOW) : (v == HIGH);
}

bool connectWifiFromLists() {
  WiFi.mode(WIFI_STA);
  for (int s = 0; s < WIFI_SSID_COUNT; s++) {
    for (int p = 0; p < WIFI_PASSWORD_COUNT; p++) {
      Serial.printf("WiFi: SSID=\"%s\" ", WIFI_SSIDS[s]);
      if (strlen(WIFI_PASSWORDS[p]) == 0) {
        Serial.println("(open)");
        WiFi.begin(WIFI_SSIDS[s]);
      } else {
        Serial.println("(psk)");
        WiFi.begin(WIFI_SSIDS[s], WIFI_PASSWORDS[p]);
      }
      unsigned long start = millis();
      while (WiFi.status() != WL_CONNECTED && millis() - start < 12000UL) {
        delay(300);
        Serial.print(".");
      }
      Serial.println();
      if (WiFi.status() == WL_CONNECTED) {
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
        return true;
      }
      WiFi.disconnect(true);
      delay(300);
    }
  }
  return false;
}

template <size_t N>
void publishDoc(const char *topic, StaticJsonDocument<N> &doc) {
  char buf[256];
  size_t n = serializeJson(doc, buf, sizeof(buf));
  if (n == 0 || n >= sizeof(buf)) {
    Serial.println("publishDoc: buffer too small");
    return;
  }
  mqtt.publish(topic, (const uint8_t *)buf, (unsigned int)n, false);
}

void publishStatusCheck() {
  StaticJsonDocument<160> doc;
  doc["status"] = "CHECK";
  doc["userId"] = pendingNickname;
  publishDoc(topicStatus().c_str(), doc);
  Serial.println(">>> status CHECK");
}

void publishStatusReadyTimeout() {
  StaticJsonDocument<160> doc;
  doc["status"] = "READY";
  doc["userId"] = pendingNickname;
  publishDoc(topicStatus().c_str(), doc);
  Serial.println(">>> status READY (timeout, no reward)");
}

void armReady(const char *nick) {
  strncpy(pendingNickname, nick, sizeof(pendingNickname) - 1);
  pendingNickname[sizeof(pendingNickname) - 1] = '\0';
  deviceMode = MODE_READY_WAIT;
  readyDeadlineMs = millis() + 10000UL;
  applyLeds(false, true, false);
  Serial.printf(">>> READY 10s, userId=%s\n", pendingNickname);
}

void onMqttMessage(char *topic, byte *payload, unsigned int len) {
  char buf[384];
  if (len >= sizeof(buf)) len = sizeof(buf) - 1;
  memcpy(buf, payload, len);
  buf[len] = '\0';
  Serial.printf("[MQTT] %s %s\n", topic, buf);

  if (strstr(topic, "/ready") == nullptr) return;

  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, buf)) {
    Serial.println("JSON error");
    return;
  }
  const char *uid = doc["userId"];
  if (!uid || !uid[0]) uid = doc["nickname"];
  if (!uid || !uid[0]) {
    Serial.println("no userId/nickname");
    return;
  }
  armReady(uid);
}

void connectMqtt() {
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setBufferSize(1024);
  mqtt.setCallback(onMqttMessage);
  while (!mqtt.connected()) {
    Serial.println("MQTT connect...");
    if (mqtt.connect(MODULE_SERIAL)) {
      mqtt.subscribe(topicReady().c_str());
      Serial.print("sub ");
      Serial.println(topicReady());
      return;
    }
    Serial.print("MQTT rc=");
    Serial.println(mqtt.state());
    delay(2000);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_IR, INPUT_PULLUP);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  enterDefaultIdle();

  while (!connectWifiFromLists()) {
    Serial.println("WiFi retry 5s");
    delay(5000);
  }
  connectMqtt();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    while (!connectWifiFromLists()) delay(3000);
  }
  if (!mqtt.connected()) connectMqtt();
  mqtt.loop();

  if (deviceMode == MODE_CHECK_SHOW && millis() >= greenUntilMs) {
    enterDefaultIdle();
  }

  if (deviceMode != MODE_READY_WAIT) return;

  if (irDetected()) {
    publishStatusCheck();
    deviceMode = MODE_CHECK_SHOW;
    applyLeds(false, false, true);
    greenUntilMs = millis() + 5000UL;
    pendingNickname[0] = '\0';
    return;
  }

  if (millis() >= readyDeadlineMs) {
    publishStatusReadyTimeout();
    enterDefaultIdle();
  }
}
