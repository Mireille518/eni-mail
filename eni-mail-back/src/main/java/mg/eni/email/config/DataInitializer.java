package mg.eni.email.config;

import java.time.Instant;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mg.eni.email.document.User;
import mg.eni.email.enums.AccountStatus;
import mg.eni.email.enums.Role;
import mg.eni.email.repository.UserRepository;

@Slf4j
@Configuration
@Profile("!test")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminSeedProperties adminSeed;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Seed ignore : base deja peuplee ({} utilisateurs)", userRepository.count());
            return;
        }
        log.info("Seed des donnees initiales...");

        List<User> seed = List.of(
                admin(adminSeed.getEmail() != null ? adminSeed.getEmail() : "admin@eni.mg",
                        adminSeed.getPassword() != null ? adminSeed.getPassword() : "Admin@2026!",
                        firstOr(adminSeed.getFirstName(), "Admin"),
                        firstOr(adminSeed.getLastName(), "ENI")),
                teacher("prof.rakoto@eni.mg", "Prof@2026!", "Jean", "Rakoto", "Informatique"),
                teacher("prof.rasolo@eni.mg", "Prof@2026!", "Marie", "Rasolo", "Mathematiques"),
                student("etu.andria@eni.mg", "Etu@2026!", "Hery", "Andriantsoa", "GLBD", "M1"),
                student("etu.ravelo@eni.mg", "Etu@2026!", "Faniry", "Ravelo", "GLBD", "M1"),
                student("etu.ramos@eni.mg", "Etu@2026!", "Noro", "Ramos", "GLBD", "M2"),
                student("etu.rajao@eni.mg", "Etu@2026!", "Zo", "Rajaonarison", "Info", "L1")
        );
        userRepository.saveAll(seed);
        log.info("Seed termine : {} utilisateurs cres", seed.size());
    }

    private User admin(String email, String rawPassword, String first, String last) {
        return User.builder()
                .email(email.toLowerCase())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .firstName(first)
                .lastName(last)
                .role(Role.ROLE_ADMIN)
                .filiere("Administration")
                .promotion("-")
                .status(AccountStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();
    }

    private User teacher(String email, String rawPassword, String first, String last, String filiere) {
        return User.builder()
                .email(email.toLowerCase())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .firstName(first)
                .lastName(last)
                .role(Role.ROLE_ENSEIGNANT)
                .filiere(filiere)
                .promotion("-")
                .status(AccountStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();
    }

    private User student(String email, String rawPassword, String first, String last, String filiere, String promo) {
        return User.builder()
                .email(email.toLowerCase())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .firstName(first)
                .lastName(last)
                .role(Role.ROLE_ETUDIANT)
                .filiere(filiere)
                .promotion(promo)
                .status(AccountStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();
    }

    private static String firstOr(String v, String fb) {
        return v == null || v.isBlank() ? fb : v;
    }
}
