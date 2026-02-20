import java.util.ArrayList;
import java.util.List;

public class Library {
    private int id;
    private User user;
    private List<Folder> folders;
    private List<LibraryItem> looseItems;

    public Library(String userId) {
        this.userId = userId;
        this.folders = new ArrayList<>();
        this.looseItems = new ArrayList<>();
    }

    public void addFolder(Folder folder) {
        this.folders.add(folder);
    }

    public void addItemToLibrary(LibraryItem item) {
        this.looseItems.add(item);
    }

    // Getters and Setters
}