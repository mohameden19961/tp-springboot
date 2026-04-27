package com.supnum.tp.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleAllExceptions(Exception ex, WebRequest request) {
        System.err.println("❌ ERREUR SERVEUR : " + ex.getClass().getSimpleName() + " - " + ex.getMessage());
        ex.printStackTrace();
        
        String message = ex.getMessage();
        if (ex instanceof org.springframework.web.server.ResponseStatusException) {
            message = ((org.springframework.web.server.ResponseStatusException) ex).getReason();
        }
        
        return ResponseEntity.status(400).body(message != null ? message : "Une erreur imprévue est survenue côté serveur.");
    }
}
