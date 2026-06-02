package com.mado.controller;

import com.mado.exception.GlobalExceptionHandler;
import com.mado.security.StreamingCallbackGuard;
import com.mado.config.StreamingProperties;
import com.mado.service.StreamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies that privileged endpoints enforce authorization.
 *
 * Stream callback endpoints (on-publish / on-publish-done / on-play) act as
 * the internal "admin" API for the nginx-rtmp server — they must only be
 * callable with the correct shared callback secret header.
 *
 * Full Spring Security filter-chain tests (testing /actuator/** ADMIN role
 * restriction, JWT validation, etc.) belong in an integration test that boots
 * the full application context with TestContainers.
 */
@ExtendWith(MockitoExtension.class)
class AdminAuthorizationTest {

    // ── Stream callback endpoints require the callback secret ────

    @Nested
    class StreamCallbackEndpointsAreProtected {

        private MockMvc mockMvc;
        @Mock StreamService streamService;

        @BeforeEach
        void setUp() {
            StreamingProperties props = new StreamingProperties();
            props.setCallbackSecret("admin-only-secret");
            StreamingCallbackGuard guard = new StreamingCallbackGuard(props);

            mockMvc = MockMvcBuilders
                    .standaloneSetup(new StreamController(streamService, guard))
                    .setControllerAdvice(new GlobalExceptionHandler())
                    .build();
        }

        @Test
        void onPublish_noSecret_returns403() throws Exception {
            mockMvc.perform(post("/api/streams/on-publish")
                            .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isForbidden());
        }

        @Test
        void onPublishDone_noSecret_returns403() throws Exception {
            mockMvc.perform(post("/api/streams/on-publish-done")
                            .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isForbidden());
        }

        @Test
        void onPlay_noSecret_returns403() throws Exception {
            mockMvc.perform(post("/api/streams/on-play")
                            .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isForbidden());
        }

        @Test
        void onPublish_wrongSecret_returns403() throws Exception {
            mockMvc.perform(post("/api/streams/on-publish")
                            .header("X-Mado-Stream-Callback", "not-the-secret")
                            .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isForbidden());
        }

        @Test
        void onPublish_correctSecret_returns200() throws Exception {
            when(streamService.onPublish(any()))
                    .thenReturn(java.util.Map.of("status", "ok"));

            mockMvc.perform(post("/api/streams/on-publish")
                            .header("X-Mado-Stream-Callback", "admin-only-secret")
                            .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isOk());
        }
    }

    // ── Public stream-list endpoint is accessible without auth ───

    @Nested
    class PublicEndpointsRemainOpen {

        private MockMvc mockMvc;
        @Mock StreamService streamService;

        @BeforeEach
        void setUp() {
            StreamingProperties props = new StreamingProperties();
            props.setCallbackSecret(""); // disabled for this group
            StreamingCallbackGuard guard = new StreamingCallbackGuard(props);

            mockMvc = MockMvcBuilders
                    .standaloneSetup(new StreamController(streamService, guard))
                    .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                    .setControllerAdvice(new GlobalExceptionHandler())
                    .build();
        }

        @Test
        void getLiveStreams_noAuth_returns200() throws Exception {
            when(streamService.live(any()))
                    .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 24), 0));

            mockMvc.perform(get("/api/streams/live")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }
    }
}
