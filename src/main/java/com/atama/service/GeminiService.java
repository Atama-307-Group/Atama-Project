package com.atama.service;

import com.atama.dto.request.FlashcardRequestDTO;
import com.atama.dto.request.NormalFlashcardRequestDTO;
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
}
