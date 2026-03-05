package com.atama.exception;

public class LinkExpiredException extends RuntimeException {
    public LinkExpiredException(String token) {
        super("Shared link has expired: " + token);
    }
}