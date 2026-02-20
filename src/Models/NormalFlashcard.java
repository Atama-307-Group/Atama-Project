public class NormalFlashcard implements Flashcard {
    private int id;
    private String term;
    private String definition;

    public NormalFlashcard() {}

    public NormalFlashcard(int id, String term, String definition) {
        this.id = id;
        this.term = term;
        this.definition = definition;
    }

    @Override
    public int getId() {
        return id;
    }

    @Override
    public void setId(int id) {
        this.id = id;
    }

    public String getTerm() {
        return term;
    }

    public void setTerm(String term) {
        this.term = term;
    }

    public String getDefinition() {
        return definition;
    }

    public void setDefinition(String definition) {
            this.definition = definition;
    }
}
