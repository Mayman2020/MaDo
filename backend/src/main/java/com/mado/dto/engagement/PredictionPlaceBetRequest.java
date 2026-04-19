package com.mado.dto.engagement;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class PredictionPlaceBetRequest {

    @NotNull
    private UUID optionId;

    @NotNull
    @Min(1)
    private Integer pointsWagered;
}
