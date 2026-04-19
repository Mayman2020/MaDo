package com.mado.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserPatchRequest {

    @Size(max = 50)
    private String displayName;

    @Size(max = 2000)
    private String bio;
}
