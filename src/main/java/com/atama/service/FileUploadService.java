package com.atama.service;

import com.atama.dto.request.FlashcardRequestDTO;
import com.atama.dto.request.NormalFlashcardRequestDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class FileUploadService {

    /**
     * Parses a CSV or TXT file into a list of NormalFlashcardRequestDTOs.
     *
     * Supported formats:
     * - CSV: term,definition (first row may be a header row with "term" and
     * "definition")
     * - TXT: term\tdefinition (tab-separated, first row may be a header)
     *
     * Lines that are empty or have fewer than 2 columns are skipped.
     */
    public List<FlashcardRequestDTO> parseFile(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("File must have a name");
        }

        String lowerName = originalFilename.toLowerCase();
        if (!lowerName.endsWith(".csv") && !lowerName.endsWith(".txt")) {
            throw new IllegalArgumentException("Only CSV and TXT files are supported");
        }

        String delimiter = lowerName.endsWith(".csv") ? "," : "\t";

        List<FlashcardRequestDTO> flashcards = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            boolean firstLine = true;

            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty())
                    continue;

                String[] parts = splitLine(line, delimiter);
                if (parts.length < 2)
                    continue;

                String col1 = parts[0].trim();
                String col2 = parts[1].trim();

                // Skip header row
                if (firstLine) {
                    firstLine = false;
                    if (isHeaderRow(col1, col2)) {
                        continue;
                    }
                }

                // Skip rows where term or definition is empty
                if (col1.isEmpty() || col2.isEmpty())
                    continue;

                NormalFlashcardRequestDTO dto = new NormalFlashcardRequestDTO();
                dto.setTerm(col1);
                dto.setDefinition(col2);
                flashcards.add(dto);
            }
        }

        if (flashcards.isEmpty()) {
            throw new IllegalArgumentException(
                    "No valid flashcard entries found in the file. " +
                            "Expected format: each row should have a term and definition separated by " +
                            (delimiter.equals(",") ? "a comma (CSV)" : "a tab (TXT)") + ".");
        }

        return flashcards;
    }

    /**
     * Splits a CSV/TXT line respecting quoted fields.
     * For CSV, handles fields enclosed in double quotes that may contain commas.
     */
    private String[] splitLine(String line, String delimiter) {
        if (!delimiter.equals(",")) {
            return line.split(delimiter, -1);
        }

        // CSV: handle quoted fields
        List<String> fields = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);

            if (inQuotes) {
                if (c == '"') {
                    // Check for escaped quote ("")
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') {
                        current.append('"');
                        i++; // skip next quote
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current.append(c);
                }
            } else {
                if (c == '"') {
                    inQuotes = true;
                } else if (c == ',') {
                    fields.add(current.toString());
                    current = new StringBuilder();
                } else {
                    current.append(c);
                }
            }
        }
        fields.add(current.toString());

        return fields.toArray(new String[0]);
    }

    private boolean isHeaderRow(String col1, String col2) {
        String c1 = col1.toLowerCase();
        String c2 = col2.toLowerCase();
        return (c1.equals("term") || c1.equals("front") || c1.equals("question") || c1.equals("word"))
                && (c2.equals("definition") || c2.equals("back") || c2.equals("answer") || c2.equals("meaning"));
    }
}
