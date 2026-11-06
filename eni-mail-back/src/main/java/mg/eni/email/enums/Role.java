package mg.eni.email.enums;

public enum Role {
    ROLE_ETUDIANT,
    ROLE_ENSEIGNANT,
    ROLE_ADMIN;

    public String authority() {
        return name();
    }
}
