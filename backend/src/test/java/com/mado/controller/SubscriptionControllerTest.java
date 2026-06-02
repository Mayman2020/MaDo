package com.mado.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mado.dto.SubscribeRequest;
import com.mado.entity.Role;
import com.mado.entity.User;
import com.mado.exception.GlobalExceptionHandler;
import com.mado.security.CustomUserDetails;
import com.mado.service.SubscriptionQueryService;
import com.mado.service.SubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SubscriptionControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper om = new ObjectMapper();

    @Mock SubscriptionQueryService subscriptionQueryService;
    @Mock SubscriptionService      subscriptionService;

    private User       authenticatedUser;
    private CustomUserDetails userDetails;

    @BeforeEach
    void setUp() {
        authenticatedUser = User.builder()
                .id(UUID.randomUUID())
                .username("viewer")
                .email("viewer@example.com")
                .role(Role.VIEWER)
                .isActive(true).isBanned(false)
                .build();
        userDetails = new CustomUserDetails(authenticatedUser);

        mockMvc = MockMvcBuilders
                .standaloneSetup(new SubscriptionController(subscriptionQueryService, subscriptionService))
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private void authenticate() {
        var auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    // ── GET /api/subscriptions/me ────────────────────────────────

    @Test
    void mine_authenticated_returnsSubscriptionList() throws Exception {
        authenticate();
        when(subscriptionQueryService.myActiveSubscriptions(authenticatedUser)).thenReturn(List.of());

        mockMvc.perform(get("/api/subscriptions/me")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // ── POST /api/subscriptions/{channelId} ──────────────────────

    @Test
    void subscribe_authenticated_callsStripeAndReturnsIntent() throws Exception {
        authenticate();
        UUID channelId = UUID.randomUUID();

        SubscribeRequest req = new SubscribeRequest();
        req.setTier("tier1");

        when(subscriptionService.createSubscriptionIntent(eq(channelId), eq("tier1"), any()))
                .thenReturn(Map.of("clientSecret", "pi_secret_xxx"));

        mockMvc.perform(post("/api/subscriptions/" + channelId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientSecret").value("pi_secret_xxx"));
    }

    @Test
    void subscribe_invalidTier_returns400() throws Exception {
        authenticate();
        UUID channelId = UUID.randomUUID();

        // tier is required by @Valid on SubscribeRequest — send missing body
        mockMvc.perform(post("/api/subscriptions/" + channelId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
