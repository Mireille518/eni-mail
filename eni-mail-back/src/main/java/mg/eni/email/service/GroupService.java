package mg.eni.email.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import lombok.RequiredArgsConstructor;
import mg.eni.email.document.Group;
import mg.eni.email.document.User;
import mg.eni.email.dto.request.CreateGroupRequest;
import mg.eni.email.dto.request.UpdateGroupRequest;
import mg.eni.email.enums.Role;
import mg.eni.email.exception.ConflictException;
import mg.eni.email.exception.ForbiddenException;
import mg.eni.email.exception.ResourceNotFoundException;
import mg.eni.email.repository.GroupRepository;
import mg.eni.email.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    public Group getById(String id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("GROUP_NOT_FOUND", "Groupe introuvable"));
    }

    public Page<Group> list(User currentUser, String query, Pageable pageable) {
        // Pour l'instant: admin et enseignants voient tout; etudiants voient seulement les groupes
        // ou ils figurent.
        if (currentUser.getRole() == Role.ROLE_ETUDIANT) {
            return groupRepository.findByMemberIdsContaining(currentUser.getId(), pageable);
        }
        return groupRepository.findAll(pageable);
    }

    public Group create(CreateGroupRequest req, User currentUser) {
        requireTeacherOrAdmin(currentUser);
        if (groupRepository.existsByNameIgnoreCase(req.name())) {
            throw new ConflictException("GROUP_NAME_TAKEN", "Nom de groupe deja utilise");
        }
        List<String> members = sanitizeMembers(req.memberIds());
        Group g = Group.builder()
                .name(req.name().trim())
                .description(req.description())
                .memberIds(new ArrayList<>(members))
                .createdBy(currentUser.getId())
                .build();
        return groupRepository.save(g);
    }

    public Group update(String id, UpdateGroupRequest req, User currentUser) {
        Group g = getById(id);
        requireGroupManager(currentUser, g);
        if (StringUtils.hasText(req.name())) {
            String newName = req.name().trim();
            if (!newName.equalsIgnoreCase(g.getName())
                    && groupRepository.existsByNameIgnoreCase(newName)) {
                throw new ConflictException("GROUP_NAME_TAKEN", "Nom de groupe deja utilise");
            }
            g.setName(newName);
        }
        if (req.description() != null) g.setDescription(req.description());
        return groupRepository.save(g);
    }

    public void delete(String id, User currentUser) {
        Group g = getById(id);
        requireGroupManager(currentUser, g);
        groupRepository.delete(g);
    }

    public Group addMembers(String id, List<String> memberIds, User currentUser) {
        Group g = getById(id);
        requireGroupManager(currentUser, g);
        Set<String> set = new LinkedHashSet<>(g.getMemberIds());
        set.addAll(sanitizeMembers(memberIds));
        g.setMemberIds(new ArrayList<>(set));
        return groupRepository.save(g);
    }

    public Group removeMember(String id, String memberId, User currentUser) {
        Group g = getById(id);
        requireGroupManager(currentUser, g);
        g.getMemberIds().remove(memberId);
        return groupRepository.save(g);
    }

    private List<String> sanitizeMembers(List<String> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        List<String> existing = userRepository.findByIdIn(ids).stream().map(User::getId).toList();
        return new ArrayList<>(new LinkedHashSet<>(existing));
    }

    private void requireTeacherOrAdmin(User user) {
        if (user.getRole() != Role.ROLE_ADMIN && user.getRole() != Role.ROLE_ENSEIGNANT) {
            throw new ForbiddenException("GROUP_WRITE_FORBIDDEN", "Reserve aux enseignants et administrateurs");
        }
    }

    private void requireGroupManager(User user, Group group) {
        if (user.getRole() == Role.ROLE_ADMIN) return;
        if (user.getRole() == Role.ROLE_ENSEIGNANT && user.getId().equals(group.getCreatedBy())) return;
        throw new ForbiddenException("GROUP_MANAGE_FORBIDDEN", "Vous ne pouvez pas modifier ce groupe");
    }
}
