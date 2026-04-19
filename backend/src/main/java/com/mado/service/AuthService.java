package com.mado.service;

import com.mado.dto.AuthRequest;
import com.mado.dto.RefreshRequest;
import com.mado.dto.RefreshTokenResponse;
import com.mado.dto.RegisterRequest;
import com.mado.dto.UserResponse;
import com.mado.entity.Role;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.mapper.UserMapper;
import com.mado.repository.RefreshTokenRepository;
import com.mado.repository.UserRepository;
import com.mado.security.CustomUserDetails;
import com.mado.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    @Transactional
    public RefreshTokenResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already in use");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already in use");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName() == null ? request.getUsername() : request.getDisplayName())
                .role(Role.VIEWER)
                .isActive(true)
                .isVerified(false)
                .isBanned(false)
                .build();
        user = userRepository.save(user);

        UserDetails principal = new CustomUserDetails(user);
        String accessToken = jwtService.generateAccessToken(principal);
        String refreshToken = jwtService.generateRefreshToken(principal);

        return RefreshTokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userMapper.toResponse(user))
                .build();
    }

    public RefreshTokenResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new BadRequestException("User not found"));
        UserDetails principal = new CustomUserDetails(user);

        return RefreshTokenResponse.builder()
                .accessToken(jwtService.generateAccessToken(principal))
                .refreshToken(jwtService.generateRefreshToken(principal))
                .user(userMapper.toResponse(user))
                .build();
    }

    public RefreshTokenResponse refresh(RefreshRequest request) {
        var tokenRecord = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));
        if (tokenRecord.getExpiresAt().isBefore(java.time.Instant.now())) {
            refreshTokenRepository.delete(tokenRecord);
            throw new BadRequestException("Refresh token expired");
        }

        User user = tokenRecord.getUser();
        UserDetails principal = new CustomUserDetails(user);

        return RefreshTokenResponse.builder()
                .accessToken(jwtService.generateAccessToken(principal))
                .refreshToken(tokenRecord.getToken())
                .user(userMapper.toResponse(user))
                .build();
    }

    public void logout(RefreshRequest request) {
        refreshTokenRepository.deleteByToken(request.getRefreshToken());
    }

    public UserResponse me(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new BadRequestException("User not found"));
        return userMapper.toResponse(user);
    }
}
