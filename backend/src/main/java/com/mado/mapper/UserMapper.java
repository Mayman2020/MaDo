package com.mado.mapper;

import com.mado.dto.UserResponse;
import com.mado.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponse toResponse(User user);
}
