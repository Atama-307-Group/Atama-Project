package com.atama.dto.request;
import java.util.UUID;
public record CreateFolderRequest(String name, UUID libraryId) {}