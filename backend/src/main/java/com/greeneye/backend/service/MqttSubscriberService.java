package com.greeneye.backend.service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * IoT → 백엔드: {@code greeneye/+/status}, {@code greeneye/+/events} 구독.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MqttSubscriberService implements Runnable {

    private final ModuleIotMqttHandler moduleIotMqttHandler;
    private final MqttTrafficLogService mqttTrafficLogService;

    @Value("${mqtt.broker-url:tcp://localhost:1883}")
    private String brokerUrl;

    @Value("${mqtt.subscriber-client-id:greeneye-backend-sub}")
    private String subscriberClientId;

    private final AtomicBoolean running = new AtomicBoolean(true);
    private Thread thread;
    private volatile MqttClient client;

    @PostConstruct
    public void start() {
        thread = new Thread(this, "mqtt-subscriber");
        thread.setDaemon(true);
        thread.start();
    }

    @PreDestroy
    public void stop() {
        running.set(false);
        if (thread != null) {
            thread.interrupt();
        }
        disconnectQuietly();
    }

    @Override
    public void run() {
        while (running.get() && !Thread.currentThread().isInterrupted()) {
            try {
                connectAndConsume();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.warn("MQTT subscriber loop error, retry in 3s", e);
                try {
                    Thread.sleep(3000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
    }

    private void connectAndConsume() throws MqttException, InterruptedException {
        disconnectQuietly();
        client = new MqttClient(brokerUrl, subscriberClientId);
        MqttConnectOptions options = new MqttConnectOptions();
        options.setAutomaticReconnect(false);
        options.setCleanSession(true);
        options.setConnectionTimeout(10);

        client.setCallback(new MqttCallback() {
            @Override
            public void connectionLost(Throwable cause) {
                log.warn("MQTT subscriber connection lost", cause);
            }

            @Override
            public void messageArrived(String topic, MqttMessage message) {
                String payload = new String(message.getPayload(), StandardCharsets.UTF_8);
                mqttTrafficLogService.add("IN", topic, payload);
                String[] parts = topic.split("/");
                if (parts.length != 3 || !"greeneye".equals(parts[0])) {
                    log.warn("Unexpected MQTT topic {}", topic);
                    return;
                }
                String serial = parts[1];
                String suffix = parts[2];
                if ("status".equals(suffix)) {
                    moduleIotMqttHandler.handleStatusPayload(serial, payload);
                } else if ("events".equals(suffix)) {
                    moduleIotMqttHandler.handleEventsPayload(serial, payload);
                }
            }

            @Override
            public void deliveryComplete(IMqttDeliveryToken token) {
                // not publishing from this client
            }
        });

        log.info("MQTT subscriber connecting to {}", brokerUrl);
        client.connect(options);
        client.subscribe("greeneye/+/status", 1);
        client.subscribe("greeneye/+/events", 1);
        log.info("MQTT subscriber subscribed greeneye/+/status, greeneye/+/events");

        while (running.get() && client.isConnected()) {
            Thread.sleep(500);
        }
        disconnectQuietly();
    }

    private void disconnectQuietly() {
        try {
            if (client != null && client.isConnected()) {
                client.disconnect();
            }
        } catch (Exception ignored) {
        }
        try {
            if (client != null) {
                client.close();
            }
        } catch (Exception ignored) {
        }
        client = null;
    }
}
