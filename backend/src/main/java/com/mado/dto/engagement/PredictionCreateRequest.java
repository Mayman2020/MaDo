package com.mado.dto.engagement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PredictionCreateRequest {

    @NotBlank
    @Size(max = 200)
    private String title;

    /** Minutes until betting locks (default 30). */
    private Integer predictionWindow;

    @NotEmpty
    private List<@NotBlank @Size(max = 100) String> optionTitles;
}
