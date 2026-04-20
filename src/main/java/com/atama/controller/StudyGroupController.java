package com.atama.controller;

import com.atama.model.GroupMembership;
import com.atama.model.StudyGroup;
import com.atama.service.StudyGroupService;
import com.atama.service.StudyGroupService.LeaderboardEntry;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class StudyGroupController {

    private final StudyGroupService studyGroupService;

    public StudyGroupController(StudyGroupService studyGroupService) {
        this.studyGroupService = studyGroupService;
    }

    @GetMapping("/courses/{courseId}/groups")
    public ResponseEntity<List<StudyGroup>> getGroupsByCourse(@PathVariable UUID courseId) {
        return ResponseEntity.ok(studyGroupService.getGroupsByCourseId(courseId));
    }

    @GetMapping("/groups/{groupId}")
    public ResponseEntity<StudyGroup> getGroup(@PathVariable UUID groupId) {
        return ResponseEntity.ok(studyGroupService.getGroupById(groupId));
    }

    @PostMapping("/groups")
    public ResponseEntity<StudyGroup> createGroup(
            @RequestBody StudyGroup group,
            @RequestParam UUID creatorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studyGroupService.createGroup(group, creatorId));
    }

    @PostMapping("/groups/{groupId}/join")
    public ResponseEntity<GroupMembership> joinPublicGroup(
            @PathVariable UUID groupId,
            @RequestParam UUID userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studyGroupService.joinPublicGroup(groupId, userId));
    }

    @PostMapping("/groups/join")
    public ResponseEntity<GroupMembership> joinByInviteToken(
            @RequestParam String token,
            @RequestParam UUID userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studyGroupService.joinByInviteToken(token, userId));
    }

    @DeleteMapping("/groups/{groupId}/members/{userId}")
    public ResponseEntity<Void> leaveGroup(
            @PathVariable UUID groupId,
            @PathVariable UUID userId) {
        studyGroupService.leaveGroup(groupId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/groups/{groupId}/members")
    public ResponseEntity<List<GroupMembership>> getMembers(@PathVariable UUID groupId) {
        return ResponseEntity.ok(studyGroupService.getMembers(groupId));
    }

    @GetMapping("/users/{userId}/groups")
    public ResponseEntity<List<GroupMembership>> getGroupsForUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(studyGroupService.getGroupsForUser(userId));
    }

    @GetMapping("/groups/{groupId}/leaderboard")
    public ResponseEntity<List<LeaderboardEntry>> getLeaderboard(@PathVariable UUID groupId) {
        return ResponseEntity.ok(studyGroupService.getLeaderboard(groupId));
    }

    @PostMapping("/groups/{groupId}/nudge/{targetUserId}")
    public ResponseEntity<Void> nudgeMember(
            @PathVariable UUID groupId,
            @PathVariable UUID targetUserId,
            @RequestParam UUID senderId) {
        studyGroupService.sendNudge(groupId, targetUserId, senderId);
        return ResponseEntity.noContent().build();
    }
}