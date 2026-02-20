package com.atama.service;

import com.atama.exception.ResourceNotFoundException;
import com.atama.model.Library;
import com.atama.repository.LibraryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class LibraryService {

    private final LibraryRepository libraryRepository;

    public Library createLibrary(Library library) {
        return libraryRepository.save(library);
    }

    @Transactional(readOnly = true)
    public Library getLibraryById(UUID id) {
        return libraryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Library", "id", id));
    }

    @Transactional(readOnly = true)
    public Library getLibraryByUserId(UUID userId) {
        return libraryRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Library", "userId", userId));
    }
}
