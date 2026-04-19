package com.mado.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatSendRequest {

    @NotBlank
    @Size(max = 500)
    private String content;
}
