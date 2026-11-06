package mg.eni.email.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import mg.eni.email.document.Group;

@Repository
public interface GroupRepository extends MongoRepository<Group, String> {
    boolean existsByNameIgnoreCase(String name);
    Optional<Group> findByNameIgnoreCase(String name);
    Page<Group> findByMemberIdsContaining(String userId, Pageable pageable);
    List<Group> findByIdIn(List<String> ids);
}
