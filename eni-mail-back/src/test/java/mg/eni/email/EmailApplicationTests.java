package mg.eni.email;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Integration test loading the full Spring context. Requires a reachable MongoDB
 * instance (see docker-compose.yml). Disabled by default so that `mvn test` can
 * run the pure unit tests without any infrastructure.
 */
@Disabled("Enable manually once MongoDB is running on localhost:27017")
@SpringBootTest
@ActiveProfiles("test")
class EmailApplicationTests {

    @Test
    void contextLoads() {
    }
}
