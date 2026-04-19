package com.mado.dto;

import com.mado.entity.Role;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
public class UserResponse {
    private UUID id;
    private String username;
    private String email;
    private String displayName;
    private String avatarUrl;
    private Role role;
    private Boolean isVerified;
}
