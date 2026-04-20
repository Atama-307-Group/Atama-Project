package com.atama.service;

import com.atama.model.GroupMembership;
import com.atama.model.GroupMembership.Role;
import com.atama.model.StudyGroup;
import com.atama.model.StudyGroup.Privacy;
import com.atama.model.StudySession;
import com.atama.model.User;
import com.atama.repository.GroupMembershipRepository;
import com.atama.repository.StudyGroupRepository;
import com.atama.repository.StudySessionRepository;
import com.atama.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StudyGroupService {

    private final StudyGroupRepository studyGroupRepository;
    private final GroupMembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final StudySessionRepository studySessionRepository;
    private final JavaMailSender mailSender;

    public StudyGroupService(StudyGroupRepository studyGroupRepository,
                             GroupMembershipRepository membershipRepository,
                             UserRepository userRepository,
                             StudySessionRepository studySessionRepository,
                             JavaMailSender mailSender) {
        this.studyGroupRepository = studyGroupRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
        this.studySessionRepository = studySessionRepository;
        this.mailSender = mailSender;
    }

    public record LeaderboardEntry(
            String userId,
            String username,
            String profilePictureUrl,
            long weeklyMinutes,
            int currentStreak
    ) {}


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

    @Transactional(readOnly = true)
    public List<LeaderboardEntry> getLeaderboard(UUID groupId) {
        StudyGroup group = getGroupById(groupId);
        UUID courseId = group.getCourse().getId();

        List<GroupMembership> memberships = membershipRepository.findByGroupId(groupId);
        List<UUID> userIds = memberships.stream()
                .map(m -> m.getUser().getId())
                .collect(Collectors.toList());

        Instant weekStart = ZonedDateTime.now(ZoneOffset.UTC)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .toLocalDate()
                .atStartOfDay(ZoneOffset.UTC)
                .toInstant();

        List<StudySession> sessions = studySessionRepository
                .findWeeklySessionsByUsersAndCourse(userIds, courseId, weekStart);

        Map<UUID, Long> secondsByUser = sessions.stream()
                .collect(Collectors.groupingBy(
                        StudySession::getUserId,
                        Collectors.summingLong(StudySession::getSeconds)
                ));

        List<User> users = userRepository.findAllByIdWithGoal(userIds);
        Map<UUID, User> userMap = users.stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return memberships.stream()
                .map(m -> {
                    User user = userMap.get(m.getUser().getId());
                    long weeklyMinutes = secondsByUser.getOrDefault(user.getId(), 0L) / 60;
                    int streak = user.getGoal() != null ? user.getGoal().getCurrentStreak() : 0;
                    return new LeaderboardEntry(
                            user.getId().toString(),
                            user.getUsername(),
                            user.getProfilePictureUrl(),
                            weeklyMinutes,
                            streak
                    );
                })
                .sorted(Comparator.comparingLong(LeaderboardEntry::weeklyMinutes).reversed())
                .collect(Collectors.toList());
    }

    public void sendNudge(UUID groupId, UUID targetUserId, UUID senderId) {
        StudyGroup group = getGroupById(groupId);

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target user not found"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender not found"));

        if (target.getEmail() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target user has no email address");
        }

        String courseName = group.getCourse() != null
                ? (group.getCourse().getCourseName() != null ? group.getCourse().getCourseName() : group.getCourse().getCourseCode())
                : "your course";

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(target.getEmail());
        message.setSubject("Atama – " + sender.getUsername() + " wants you to study!");
        message.setText(
                "Hi " + target.getUsername() + ",\n\n" +
                sender.getUsername() + " is thinking of you and wants you to join them in the \"" +
                group.getName() + "\" study group for " + courseName + "!\n\n" +
                "Your group is waiting! Study together and keep those streaks going.\n\n" +
                "Head over to Atama to join.\n\n" +
                "— Atama Team"
        );
        mailSender.send(message);
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