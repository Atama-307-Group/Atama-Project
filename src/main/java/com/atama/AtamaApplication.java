package com.atama;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AtamaApplication {

    public static void main(String[] args) {
        SpringApplication.run(AtamaApplication.class, args);
    }
}
