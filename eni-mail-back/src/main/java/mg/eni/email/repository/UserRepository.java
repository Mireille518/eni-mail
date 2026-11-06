package mg.eni.email.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import mg.eni.email.document.User;
import mg.eni.email.enums.Role;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    Page<User> findByRole(Role role, Pageable pageable);

    @Query("{ $or: [ "
            + "{ 'firstName': { $regex: ?0, $options: 'i' } }, "
            + "{ 'lastName':  { $regex: ?0, $options: 'i' } }, "
            + "{ 'email':     { $regex: ?0, $options: 'i' } } ] }")
    Page<User> searchByNameOrEmail(String query, Pageable pageable);

    List<User> findByIdIn(List<String> ids);

    long countByRole(Role role);
}
