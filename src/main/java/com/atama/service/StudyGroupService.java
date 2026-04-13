package com.atama.service;

import com.atama.model.GroupMembership;
import com.atama.model.GroupMembership.Role;
import com.atama.model.StudyGroup;
import com.atama.model.StudyGroup.Privacy;
import com.atama.model.User;
import com.atama.repository.GroupMembershipRepository;
import com.atama.repository.StudyGroupRepository;
import com.atama.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class StudyGroupService {

    private final StudyGroupRepository studyGroupRepository;
    private final GroupMembershipRepository membershipRepository;
    private final UserRepository userRepository;

    public StudyGroupService(StudyGroupRepository studyGroupRepository,
                             GroupMembershipRepository membershipRepository,
                             UserRepository userRepository) {
        this.studyGroupRepository = studyGroupRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<StudyGroup> getGroupsByCourseId(UUID courseId) {
        return studyGroupRepository.findByCourseId(courseId);
    }

    @Transactional(readOnly = true)
    public StudyGroup getGroupById(UUID groupId) {
        return studyGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Study group not found"));
    }

    @Transactional
    public StudyGroup createGroup(StudyGroup group, UUID creatorId) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (group.getPrivacy() == Privacy.PRIVATE) {
            group.setInviteToken(generateInviteToken());
        }

        group.setCreatedBy(creator);
        StudyGroup saved = studyGroupRepository.save(group);

        GroupMembership ownerMembership = new GroupMembership();
        ownerMembership.setGroup(saved);
        ownerMembership.setUser(creator);
        ownerMembership.setRole(Role.OWNER);
        membershipRepository.save(ownerMembership);

        return saved;
    }

    @Transactional
    public GroupMembership joinByInviteToken(String token, UUID userId) {
        StudyGroup group = studyGroupRepository.findByInviteToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid invite link"));

        return addMember(group, userId);
    }

    @Transactional
    public GroupMembership joinPublicGroup(UUID groupId, UUID userId) {
        StudyGroup group = getGroupById(groupId);

        if (group.getPrivacy() == Privacy.PRIVATE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This group requires an invite link");
        }

        return addMember(group, userId);
    }

    @Transactional
    public void leaveGroup(UUID groupId, UUID userId) {
        GroupMembership membership = membershipRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Membership not found"));

        if (membership.getRole() == Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner cannot leave — transfer ownership first");
        }

        membershipRepository.delete(membership);
    }

    @Transactional(readOnly = true)
    public List<GroupMembership> getMembers(UUID groupId) {
        return membershipRepository.findByGroupId(groupId);
    }

    @Transactional(readOnly = true)
    public List<GroupMembership> getGroupsForUser(UUID userId) {
        return membershipRepository.findByUserId(userId);
    }

    private GroupMembership addMember(StudyGroup group, UUID userId) {
        if (membershipRepository.existsByGroupIdAndUserId(group.getId(), userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already a member of this group");
        }

        if (group.getMaxMembers() != null) {
            long currentCount = membershipRepository.countByGroupId(group.getId());
            if (currentCount >= group.getMaxMembers()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Group is full");
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        GroupMembership membership = new GroupMembership();
        membership.setGroup(group);
        membership.setUser(user);
        membership.setRole(Role.MEMBER);
        return membershipRepository.save(membership);
    }

    private String generateInviteToken() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
}