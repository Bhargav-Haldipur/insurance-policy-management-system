package com.insurance.insurance_policy_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class InsurancePolicyApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(InsurancePolicyApiApplication.class, args);
	}

}
