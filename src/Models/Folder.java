import java.util.ArrayList;
import java.util.List;

public class Folder {
    private int id;
    private String name;
    private List<LibraryItem> items;

    public Folder(int id, String name) {
        this.id = id;
        this.name = name;
        this.items = new ArrayList<>();
    }

    public void addItem(LibraryItem item) {
        this.items.add(item);
    }

    // Getters and Setters
    public List<LibraryItem> getItems() { return items; }
}