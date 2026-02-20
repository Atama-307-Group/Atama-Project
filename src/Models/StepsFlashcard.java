import java.util.List;

public class StepsFlashcard implements Flashcard {
    private int id;
    private String title;
    private List<String> steps;

    public StepsFlashcard() {}

    public StepsFlashcard(int id, String title, List<String> steps) {
        this.id = id;
        this.title = title;
        this.steps = steps;
    }

    @Override
    public int getId() {
        return id;
    }

    @Override
    public void setId(int id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<String> getSteps() {
        return steps;
    }

    public void setSteps(List<String> steps) {
        this.steps = steps;
    }
}
