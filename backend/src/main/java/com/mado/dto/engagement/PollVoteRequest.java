package com.mado.dto.engagement;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class PollVoteRequest {

    @NotNull
    private UUID optionId;
}
