package com.mado.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mado.dto.AuthRequest;
import com.mado.dto.RefreshTokenResponse;
import com.mado.dto.RegisterRequest;
import com.mado.exception.BadRequestException;
import com.mado.exception.GlobalExceptionHandler;
import com.mado.exception.TooManyRequestsException;
import com.mado.security.LoginRateLimiter;
import com.mado.security.RegisterRateLimiter;
import com.mado.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper om = new ObjectMapper();

    @Mock AuthService        authService;
    @Mock LoginRateLimiter   loginRateLimiter;
    @Mock RegisterRateLimiter registerRateLimiter;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AuthController(authService, loginRateLimiter, registerRateLimiter))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    // ── Register ─────────────────────────────────────────────────

    @Test
    void register_validRequest_returns200WithTokens() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("alice");
        req.setEmail("alice@example.com");
        req.setPassword("P@ssword1!");

        when(authService.register(any())).thenReturn(
                RefreshTokenResponse.builder()
                        .accessToken("access-tok").refreshToken("refresh-tok").build());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-tok"))
                .andExpect(jsonPath("$.refreshToken").value("refresh-tok"));
    }

    @Test
    void register_duplicateEmail_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("alice");
        req.setEmail("taken@example.com");
        req.setPassword("P@ssword1!");

        when(authService.register(any()))
                .thenThrow(new BadRequestException("Email is already in use"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email is already in use"));
    }

    @Test
    void register_rateLimited_returns429() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("flood");
        req.setEmail("flood@example.com");
        req.setPassword("P@ssword1!");

        doThrow(new TooManyRequestsException("Too many registrations"))
                .when(registerRateLimiter).assertAllowed(any());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andExpect(status().isTooManyRequests());
    }

    // ── Login ────────────────────────────────────────────────────

    @Test
    void login_validCredentials_returns200() throws Exception {
        AuthRequest req = new AuthRequest();
        req.setEmail("alice@example.com");
        req.setPassword("P@ssword1!");

        when(authService.login(any())).thenReturn(
                RefreshTokenResponse.builder()
                        .accessToken("access-tok").refreshToken("refresh-tok").build());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-tok"));
    }

    @Test
    void login_totpRequired_returns400WithCode() throws Exception {
        AuthRequest req = new AuthRequest();
        req.setEmail("alice@example.com");
        req.setPassword("P@ssword1!");

        when(authService.login(any()))
                .thenThrow(new BadRequestException("TOTP_REQUIRED"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("TOTP_REQUIRED"));
    }

    @Test
    void login_rateLimited_returns429() throws Exception {
        AuthRequest req = new AuthRequest();
        req.setEmail("brute@example.com");
        req.setPassword("wrong");

        doThrow(new TooManyRequestsException("Too many login attempts"))
                .when(loginRateLimiter).assertAllowed(any());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void login_missingEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"secret\"}"))
                .andExpect(status().isBadRequest());
    }
}
