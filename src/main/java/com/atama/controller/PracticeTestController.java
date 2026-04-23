package com.atama.controller;

import com.atama.dto.game.QuestionDTO;
import com.atama.dto.request.PracticeTestRequest;
import com.atama.service.PracticeTestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/practice-test")
public class PracticeTestController {

    private final PracticeTestService practiceTestService;

    public PracticeTestController(PracticeTestService practiceTestService) {
        this.practiceTestService = practiceTestService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generatePracticeTest(@RequestBody PracticeTestRequest request) {
        try {
            List<QuestionDTO> questions = practiceTestService.generatePracticeTest(request);
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
