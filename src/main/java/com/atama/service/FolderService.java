package com.atama.service;

import com.atama.model.Folder;
import org.springframework.stereotype.Service;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class FolderService {

    public Folder createNewFolder(String folderName) {
        // Generate a unique ID and create the object
        int randomId = ThreadLocalRandom.current().nextInt(1, 1000000);
        Folder newFolder = new Folder(randomId, folderName);

        // In the future, you would do: folderRepository.save(newFolder);
        System.out.println("Saved folder: " + folderName + " with ID: " + randomId);

        return newFolder;
    }
}