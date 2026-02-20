import java.util.List;

public class DragDropFlashcard implements Flashcard {
    private int id;
    private String prompt;
    private List<String> draggableItems;
    private List<String> dropTargets;

    public DragDropFlashcard() {}

    public DragDropFlashcard(int id, String prompt, List<String> draggableItems, List<String> dropTargets) {
        this.id = id;
        this.prompt = prompt;
        this.draggableItems = draggableItems;
        this.dropTargets = dropTargets;
    }

    @Override
    public int getId() {
        return id;
    }

    @Override
    public void setId(int id) {
        this.id = id;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public List<String> getDraggableItems() {
        return draggableItems;
    }

    public void setDraggableItems(List<String> draggableItems) {
        this.draggableItems = draggableItems;
    }

    public List<String> getDropTargets() {
        return dropTargets;
    }

    public void setDropTargets(List<String> dropTargets) {
        this.dropTargets = dropTargets;
    }
}
