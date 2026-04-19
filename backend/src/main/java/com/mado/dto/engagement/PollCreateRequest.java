package com.mado.dto.engagement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PollCreateRequest {

    @NotBlank
    @Size(max = 200)
    private String title;

    private Integer durationSeconds;

    @NotEmpty
    private List<@NotBlank @Size(max = 100) String> optionTitles;
}
