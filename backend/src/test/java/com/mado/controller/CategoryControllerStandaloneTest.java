package com.mado.controller;

import com.mado.dto.CategoryResponse;
import com.mado.service.ChannelService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Standalone MockMvc (no full Spring context) — fast and does not require DB/Redis/JWT beans.
 */
@ExtendWith(MockitoExtension.class)
class CategoryControllerStandaloneTest {

    private MockMvc mockMvc;

    @Mock
    private ChannelService channelService;

    @BeforeEach
    void setUp() {
        CategoryController controller = new CategoryController(channelService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    void listReturnsPageJson() throws Exception {
        var row = CategoryResponse.builder()
                .id(UUID.randomUUID())
                .name("Just Chatting")
                .slug("just-chatting")
                .thumbnailUrl(null)
                .viewerCount(42)
                .build();
        when(channelService.allCategories(any())).thenReturn(new PageImpl<>(List.of(row), PageRequest.of(0, 50), 1));

        mockMvc.perform(get("/api/categories").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].slug").value("just-chatting"));
    }
}
