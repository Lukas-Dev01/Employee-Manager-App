package com.lukasdev01.employeemanager.service;

// Custom exception thrown when a person doesnt exist
public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) {
        super(message);

    }
}