package com.atama.service;

import com.atama.dto.request.FlashcardRequestDTO;
import com.atama.dto.request.NormalFlashcardRequestDTO;
import com.atama.dto.game.QuestionDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public List<FlashcardRequestDTO> generateFlashcardsFromText(String text) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("YOUR_API_KEY_HERE")) {
            throw new IllegalStateException(
                    "Gemini API Key is missing. Please set gemini.api.key in application.properties.");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="
                + apiKey;

        String prompt = "You are a specialized AI that creates flashcards from lecture notes. " +
                "Extract key concepts and their definitions from the provided text. " +
                "Respond ONLY with a raw JSON array of objects, where each object has 'term' and 'definition' string fields. "
                +
                "Do not include markdown formatting or json code blocks like ```json. \n\n" +
                "Text to process: " + text;

        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            return parseGeminiResponse(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Error communicating with Gemini API: " + e.getMessage(), e);
        }
    }

    /**
     * Sends flashcard content to Gemini and asks it to produce a concept map
     * as a JSON object with "nodes" and "edges" arrays.
     *
     * @param flashcardContent formatted string of "term: definition" lines
     * @return raw JSON string like { "nodes": [...], "edges": [...] }
     */
    public String generateConceptMap(String flashcardContent) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("YOUR_API_KEY_HERE")) {
            throw new IllegalStateException(
                    "Gemini API Key is missing. Please set gemini.api.key in application.properties.");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="
                + apiKey;

        String prompt = "You are an expert at building concept maps from study material. " +
                "Given the following flashcard terms and definitions, create a concept map that shows how concepts relate to each other.\n\n" +
                "Return ONLY a raw JSON object (no markdown, no code fences) with exactly this structure:\n" +
                "{\n" +
                "  \"nodes\": [\n" +
                "    { \"id\": \"1\", \"label\": \"Concept Name\", \"type\": \"main\" },\n" +
                "    { \"id\": \"2\", \"label\": \"Sub-concept\", \"type\": \"sub\" }\n" +
                "  ],\n" +
                "  \"edges\": [\n" +
                "    { \"from\": \"1\", \"to\": \"2\", \"label\": \"includes\" }\n" +
                "  ]\n" +
                "}\n\n" +
                "Node types: use 'main' for top-level concepts, 'sub' for secondary, 'detail' for specifics.\n" +
                "Edge labels should be short relationship verbs (e.g., 'includes', 'causes', 'defines', 'is a', 'requires', 'leads to').\n" +
                "Create between 5-20 nodes and 5-30 edges. Connect related concepts meaningfully.\n\n" +
                "Flashcard content:\n" + flashcardContent;

        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            return parseConceptMapResponse(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Error communicating with Gemini API: " + e.getMessage(), e);
        }
    }

    private String parseConceptMapResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");
            if (!candidates.isMissingNode() && candidates.isArray() && candidates.size() > 0) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (!parts.isMissingNode() && parts.isArray() && parts.size() > 0) {
                    String jsonText = parts.get(0).path("text").asText();
                    // Strip optional markdown code fences
                    jsonText = jsonText.replaceAll("(?s)^```(?:json)?\\s*", "").replaceAll("(?s)```\\s*$", "").trim();
                    // Validate it's parseable JSON
                    objectMapper.readTree(jsonText);
                    return jsonText;
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to parse Gemini concept map response: " + e.getMessage());
            System.err.println("Raw response: " + responseBody);
            throw new RuntimeException("Failed to parse concept map from Gemini API response.");
        }
        throw new RuntimeException("No concept map data in Gemini response.");
    }

    private List<FlashcardRequestDTO> parseGeminiResponse(String responseBody) {
        List<FlashcardRequestDTO> flashcards = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");
            if (!candidates.isMissingNode() && candidates.isArray() && candidates.size() > 0) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (!parts.isMissingNode() && parts.isArray() && parts.size() > 0) {
                    String jsonText = parts.get(0).path("text").asText();

                    // Strip optional markdown wrapper just in case
                    jsonText = jsonText.replaceAll("^```(?:json)?|```$", "").trim();

                    JsonNode arrayNode = objectMapper.readTree(jsonText);
                    if (arrayNode.isArray()) {
                        for (JsonNode node : arrayNode) {
                            String term = node.path("term").asText("").trim();
                            String definition = node.path("definition").asText("").trim();
                            if (!term.isEmpty() && !definition.isEmpty()) {
                                NormalFlashcardRequestDTO dto = new NormalFlashcardRequestDTO();
                                dto.setTerm(term);
                                dto.setDefinition(definition);
                                flashcards.add(dto);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to parse Gemini response: " + e.getMessage());
            System.err.println("Raw response: " + responseBody);
            throw new RuntimeException("Failed to parse Gemini API response into flashcards.");
        }

        if (flashcards.isEmpty()) {
            throw new RuntimeException("No flashcards could be generated from the response.");
        }

        return flashcards;
    }

    public List<QuestionDTO> generatePracticeTestFromText(String text, List<String> questionTypes, int numQuestions) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("YOUR_API_KEY_HERE")) {
            throw new IllegalStateException("Gemini API Key is missing. Please set gemini.api.key in application.properties.");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        String prompt = "You are an expert tutor creating a practice test based on the provided material.\n" +
                "Generate exactly " + numQuestions + " questions based on the text. The target question types are: " + String.join(", ", questionTypes) + ".\n" +
                "Distribute the questions roughly evenly among the requested types.\n" +
                "Respond ONLY with a raw JSON array of objects. Do not include markdown formatting or json code blocks.\n" +
                "For 'MCQ' (Multiple Choice), the object must have: \"type\": \"MCQ\", \"prompt\": \"<question>\", \"correctAnswer\": \"<correct>\", \"choices\": [\"<correct>\", \"<wrong1>\", \"<wrong2>\", \"<wrong3>\"].\n" +
                "For 'TRUE_FALSE', the object must have: \"type\": \"TRUE_FALSE\", \"prompt\": \"<statement>\", \"correctAnswer\": \"<True or False>\", \"choices\": [\"True\", \"False\"].\n" +
                "For 'SHORT_ANSWER', the object must have: \"type\": \"SHORT_ANSWER\", \"prompt\": \"<question>\", \"correctAnswers\": [\"<accept1>\", \"<accept2>\"].\n\n" +
                "Text to process:\n" + text;

        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            return parsePracticeTestResponse(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Error communicating with Gemini API: " + e.getMessage(), e);
        }
    }

    private List<QuestionDTO> parsePracticeTestResponse(String responseBody) {
        List<QuestionDTO> questions = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");
            if (!candidates.isMissingNode() && candidates.isArray() && candidates.size() > 0) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (!parts.isMissingNode() && parts.isArray() && parts.size() > 0) {
                    String jsonText = parts.get(0).path("text").asText();
                    jsonText = jsonText.replaceAll("(?s)^```(?:json)?\\s*", "").replaceAll("(?s)```\\s*$", "").trim();

                    JsonNode arrayNode = objectMapper.readTree(jsonText);
                    if (arrayNode.isArray()) {
                        for (JsonNode node : arrayNode) {
                            QuestionDTO dto = new QuestionDTO();
                            dto.setType(node.path("type").asText(""));
                            dto.setPrompt(node.path("prompt").asText(""));
                            if (node.hasNonNull("correctAnswer")) {
                                dto.setCorrectAnswer(node.path("correctAnswer").asText(""));
                            }
                            if (node.hasNonNull("choices") && node.path("choices").isArray()) {
                                List<String> choices = new ArrayList<>();
                                for (JsonNode choiceNode : node.path("choices")) {
                                    choices.add(choiceNode.asText(""));
                                }
                                dto.setChoices(choices);
                            }
                            if (node.hasNonNull("correctAnswers") && node.path("correctAnswers").isArray()) {
                                List<String> correctAnswers = new ArrayList<>();
                                for (JsonNode ans : node.path("correctAnswers")) {
                                    correctAnswers.add(ans.asText(""));
                                }
                                dto.setCorrectAnswers(correctAnswers);
                            }
                            questions.add(dto);
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to parse Gemini response for practice test: " + e.getMessage());
            System.err.println("Raw response: " + responseBody);
            throw new RuntimeException("Failed to parse Gemini API response into practice test.");
        }
        return questions;
    }
}
