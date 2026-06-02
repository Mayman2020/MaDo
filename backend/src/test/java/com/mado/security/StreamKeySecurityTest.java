package com.mado.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mado.config.StreamingProperties;
import com.mado.controller.StreamController;
import com.mado.exception.GlobalExceptionHandler;
import com.mado.service.StreamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies that nginx-rtmp callback endpoints are guarded by a shared secret.
 */
@ExtendWith(MockitoExtension.class)
class StreamKeySecurityTest {

    // ── Unit tests for StreamingCallbackGuard ────────────────────

    @Nested
    class CallbackGuardUnit {

        private StreamingCallbackGuard guard;

        @Test
        void noSecretConfigured_alwaysPasses() {
            StreamingProperties props = new StreamingProperties();
            props.setCallbackSecret(""); // blank = disabled
            guard = new StreamingCallbackGuard(props);

            assertThatNoException().isThrownBy(() -> guard.assertAuthorized(null));
            assertThatNoException().isThrownBy(() -> guard.assertAuthorized("any-value"));
        }

        @Test
        void correctSecret_passes() {
            StreamingProperties props = new StreamingProperties();
            props.setCallbackSecret("super-secret-token");
            guard = new StreamingCallbackGuard(props);

            assertThatNoException().isThrownBy(
                    () -> guard.assertAuthorized("super-secret-token"));
        }

        @Test
        void wrongSecret_throwsForbidden() {
            StreamingProperties props = new StreamingProperties();
            props.setCallbackSecret("super-secret-token");
            guard = new StreamingCallbackGuard(props);

            assertThatThrownBy(() -> guard.assertAuthorized("wrong-token"))
                    .isInstanceOf(ResponseStatusException.class)
                    .satisfies(ex -> {
                        ResponseStatusException rse = (ResponseStatusException) ex;
                        assert rse.getStatusCode() == HttpStatus.FORBIDDEN;
                    });
        }

        @Test
        void nullHeader_throwsForbidden() {
            StreamingProperties props = new StreamingProperties();
            props.setCallbackSecret("super-secret-token");
            guard = new StreamingCallbackGuard(props);

            assertThatThrownBy(() -> guard.assertAuthorized(null))
                    .isInstanceOf(ResponseStatusException.class);
        }

        @Test
        void secretWithLeadingWhitespace_isStripped() {
            StreamingProperties props = new StreamingProperties();
            props.setCallbackSecret("secret");
            guard = new StreamingCallbackGuard(props);

            // Header value may contain surrounding whitespace from HTTP
            assertThatNoException().isThrownBy(
                    () -> guard.assertAuthorized("  secret  "));
        }
    }

    // ── MockMvc integration: StreamController rejects bad secret ─

    @Nested
    @ExtendWith(MockitoExtension.class)
    class StreamControllerCallbackSecurity {

        private MockMvc mockMvc;
        @Mock StreamService streamService;

        @BeforeEach
        void setUp() {
            StreamingProperties props = new StreamingProperties();
            props.setCallbackSecret("prod-callback-secret");
            StreamingCallbackGuard guard = new StreamingCallbackGuard(props);

            mockMvc = MockMvcBuilders
                    .standaloneSetup(new StreamController(streamService, guard))
                    .setControllerAdvice(new GlobalExceptionHandler())
                    .build();
        }

        @Test
        void onPublish_correctSecret_returns200() throws Exception {
            when(streamService.onPublish(any()))
                    .thenReturn(Map.of("status", "ok"));

            mockMvc.perform(post("/api/streams/on-publish")
                            .header("X-Mado-Stream-Callback", "prod-callback-secret")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isOk());
        }

        @Test
        void onPublish_wrongSecret_returns403() throws Exception {
            mockMvc.perform(post("/api/streams/on-publish")
                            .header("X-Mado-Stream-Callback", "hacked")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isForbidden());
        }

        @Test
        void onPublish_noHeader_returns403() throws Exception {
            mockMvc.perform(post("/api/streams/on-publish")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isForbidden());
        }

        @Test
        void onPublishDone_wrongSecret_returns403() throws Exception {
            mockMvc.perform(post("/api/streams/on-publish-done")
                            .header("X-Mado-Stream-Callback", "bad-secret")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isForbidden());
        }
    }
}
