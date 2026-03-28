/**
 * GREENEYE 모듈용 ESP32 펌웨어 스켈레톤
 *
 * - 백엔드가 READY 시 내려주는 토픽: greeneye/modules/{serialNumber}/cmd
 * - 페이로드 예: {"action":"READY","userid":"닉네임"}
 *
 * 개발 시: WiFi + MQTT(TCP 1883) 로 먼저 검증.
 * 현장 LTE: 동일 토픽/페이로드를 SIM7000G 로 수신하려면 WiFi 대신 TinyGSM + GPRS 로
 *   네트워크 스택만 바꾸면 됨 (PubSubClient 는 Client* 만 있으면 동일).
 *
 * 필요 라이브러리(Arduino 라이브러리 매니저):
 *   - PubSubClient by Nick O'Leary
 * 선택: ArduinoJson (파싱 정교화 시)
 */

#include <WiFi.h>
#include <PubSubClient.h>

// ============ 설정 (반드시 수정) ============
static const char *WIFI_SSID = "YOUR_WIFI_SSID";
static const char *WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Mosquitto 브로커 (로컬이면 PC IP, 서버면 도메인 또는 IP)
static const char *MQTT_HOST = "192.168.0.10";
static const uint16_t MQTT_PORT = 1883;

// DB·지도에 등록된 모듈의 serialNumber 와 동일해야 함
static const char *MODULE_SERIAL = "GE-DEMO-CHOSUN";

// MQTT 클라이언트 ID (브로커에서 유일해야 함)
static const char *MQTT_CLIENT_ID = "greeneye-esp32-module";

// LED 등 (보드에 맞게 핀 수정)
static const int LED_PIN = 2;
// ==========================================

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

String topicCmd() {
  String t = "greeneye/modules/";
  t += MODULE_SERIAL;
  t += "/cmd";
  return t;
}

void onMqttMessage(char *topic, byte *payload, unsigned int len) {
  char buf[320];
  if (len >= sizeof(buf)) {
    len = sizeof(buf) - 1;
  }
  memcpy(buf, payload, len);
  buf[len] = '\0';

  Serial.printf("[MQTT] topic=%s payload=%s\n", topic, buf);

  // 간단히 READY 문자열 검사 (JSON 전체 파싱 없이 동작 확인용)
  if (strstr(buf, "READY") != nullptr) {
    Serial.println(">>> READY 명령 수신 — 통 개폐/LED 제어 로직 연결");
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
  }
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("WiFi 연결 중");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void connectMqtt() {
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMqttMessage);
  while (!mqtt.connected()) {
    Serial.println("MQTT 연결 시도...");
    if (mqtt.connect(MQTT_CLIENT_ID)) {
      String sub = topicCmd();
      if (mqtt.subscribe(sub.c_str())) {
        Serial.print("구독 OK: ");
        Serial.println(sub);
      } else {
        Serial.println("구독 실패");
      }
      break;
    }
    Serial.print("실패, rc=");
    Serial.println(mqtt.state());
    delay(2000);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  connectWifi();
  connectMqtt();
}

void loop() {
  if (!mqtt.connected()) {
    connectMqtt();
  }
  mqtt.loop();
}

/*
 * ========== SIM7000G (T-SIM7000G) 사용 시 참고 ==========
 *
 * 1) 보드 관리자 URL에서 ESP32 + SIM7000 보드 패키지 설치.
 * 2) 라이브러리: TinyGSM (v0.11+), PubSubClient 동일.
 *
 * 개략 코드 흐름:
 *   #define TINY_GSM_MODEM_SIM7000
 *   #include <TinyGsmClient.h>
 *   TinyGsm modem(Serial1);  // RX/TX 핀은 보드 메뉴얼대로
 *   TinyGsmClient gsmClient(modem);
 *   PubSubClient mqtt(gsmClient);
 *
 *   setup() 에서:
 *     Serial1.begin(115200, SERIAL_8N1, RX_PIN, TX_PIN);
 *     modem.restart();
 *     modem.gprsConnect(APN, USER, PASS);   // LTE APN은 통신사별
 *   이후 mqtt.setServer / connect / subscribe / loop 는 위와 동일.
 *
 * 전원·안테나·SIM 품질에 따라 attach 시간이 길 수 있음 — 타임아웃·재시도 권장.
 */
