package com.greeneye.backend.mqtt;

/**
 * ESP32 토픽: {@code greeneye/{serialNumber}/…} — serialNumber는 DB modules.serial_number (예: g1, g2).
 */
public final class GreeneyeMqttTopics {

    private GreeneyeMqttTopics() {}

    /** 백엔드 → 모듈: 버리기 시작(닉네임 JSON) */
    public static String cmd(String serialNumber) {
        return "greeneye/" + serialNumber + "/cmd";
    }

    /** 모듈 → 백엔드: READY 타임아웃 또는 CHECK 결과 */
    public static String status(String serialNumber) {
        return "greeneye/" + serialNumber + "/status";
    }

    public static String events(String serialNumber) {
        return "greeneye/" + serialNumber + "/events";
    }
}
