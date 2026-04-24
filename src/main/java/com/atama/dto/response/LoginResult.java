package com.atama.dto.response;

import com.atama.model.User;

public record LoginResult(User user, String token, boolean isAdmin) {}
