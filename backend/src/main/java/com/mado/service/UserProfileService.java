package com.mado.service;

import com.mado.dto.UserPatchRequest;
import com.mado.dto.UserResponse;
import com.mado.entity.Role;
import com.mado.entity.User;
import com.mado.exception.BadRequestException;
import com.mado.exception.NotFoundException;
import com.mado.mapper.UserMapper;
import com.mado.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public UserResponse getByUsername(String username) {
        User u = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return userMapper.toResponse(u);
    }

    @Transactional
    public UserResponse patch(String username, UserPatchRequest req, User actor) {
        User u = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (!u.getId().equals(actor.getId()) && actor.getRole() != Role.ADMIN) {
            throw new BadRequestException("Not allowed");
        }
        if (req.getDisplayName() != null) {
            u.setDisplayName(req.getDisplayName());
        }
        if (req.getBio() != null) {
            u.setBio(req.getBio());
        }
        return userMapper.toResponse(u);
    }
}
