package mg.eni.email.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import mg.eni.email.document.Attachment;
import mg.eni.email.document.Group;
import mg.eni.email.document.Message;
import mg.eni.email.document.MessageRecipient;
import mg.eni.email.document.User;
import mg.eni.email.dto.request.ComposeMessageRequest;
import mg.eni.email.dto.request.ForwardRequest;
import mg.eni.email.dto.request.ReplyRequest;
import mg.eni.email.dto.response.AttachmentDto;
import mg.eni.email.dto.response.FolderCountsDto;
import mg.eni.email.dto.response.MessageDto;
import mg.eni.email.dto.response.MessageSummaryDto;
import mg.eni.email.dto.response.RecipientDto;
import mg.eni.email.enums.AccountStatus;
import mg.eni.email.enums.MessageFolder;
import mg.eni.email.enums.RecipientType;
import mg.eni.email.enums.Role;
import mg.eni.email.exception.BusinessException;
import mg.eni.email.exception.ForbiddenException;
import mg.eni.email.exception.ResourceNotFoundException;
import mg.eni.email.repository.AttachmentRepository;
import mg.eni.email.repository.GroupRepository;
import mg.eni.email.repository.MessageRepository;
import mg.eni.email.repository.UserRepository;
import org.springframework.http.HttpStatus;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final AttachmentRepository attachmentRepository;

    // =========================================================================
    //  Lecture / listing
    // =========================================================================

    public MessageDto getOne(String id, User currentUser) {
        Message m = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MESSAGE_NOT_FOUND", "Message introuvable"));
        assertCanAccess(m, currentUser);
        // Marquer comme lu si destinataire
        findRecipient(m, currentUser.getId())
                .ifPresent(r -> {
                    if (!r.isRead()) {
                        messageRepository.markAsRead(m.getId(), currentUser.getId());
                    }
                });
        return toDto(m, currentUser);
    }

    public Page<MessageSummaryDto> listFolder(MessageFolder folder, User currentUser, Pageable pageable) {
        Page<Message> page = switch (folder) {
            case INBOX -> messageRepository.findForRecipient(currentUser.getId(), MessageFolder.INBOX, pageable);
            case SENT -> messageRepository.findSentForSender(currentUser.getId(), MessageFolder.SENT, pageable);
            case DRAFT -> messageRepository.findDraftsBySender(currentUser.getId(), pageable);
            case TRASH -> {
                Page<Message> recTrash = messageRepository.findTrashForRecipient(currentUser.getId(), pageable);
                Page<Message> senderTrash = messageRepository.findTrashForSender(currentUser.getId(), pageable);
                List<Message> merged = Stream.concat(recTrash.stream(), senderTrash.stream())
                        .distinct()
                        .sorted(Comparator.comparing(
                                (Message m) -> Optional.ofNullable(m.getSentAt()).orElse(m.getCreatedAt())
                        ).reversed())
                        .limit(pageable.getPageSize())
                        .toList();
                yield new PageImpl<>(merged, pageable, recTrash.getTotalElements() + senderTrash.getTotalElements());
            }
        };
        Map<String, User> cache = hydrateUsersFromMessages(page.getContent());
        return page.map(m -> toSummary(m, currentUser, cache));
    }

    public FolderCountsDto counts(User u) {
        long inboxUnread = messageRepository.countUnreadInInbox(u.getId());
        long inboxTotal = messageRepository.countForRecipient(u.getId(), MessageFolder.INBOX);
        long sent = messageRepository.countSentForSender(u.getId(), MessageFolder.SENT);
        long drafts = messageRepository.countDraftsBySender(u.getId());
        long trashRec = messageRepository.countForRecipient(u.getId(), MessageFolder.TRASH);
        long trashSender = messageRepository.countSentForSender(u.getId(), MessageFolder.TRASH);
        return new FolderCountsDto(inboxTotal, inboxUnread, sent, drafts, trashRec + trashSender);
    }

    // =========================================================================
    //  Envoi / brouillon / reponse / transfert
    // =========================================================================

    public MessageDto send(ComposeMessageRequest req, User sender) {
        boolean asDraft = Boolean.TRUE.equals(req.asDraft());
        Message msg = buildMessage(req, sender, asDraft);
        Message saved = messageRepository.save(msg);
        linkAttachmentsToMessage(req.attachmentIds(), saved.getId(), sender.getId());
        return toDto(saved, sender);
    }

    public MessageDto updateDraft(String draftId, ComposeMessageRequest req, User sender) {
        Message existing = messageRepository.findByIdAndSenderId(draftId, sender.getId())
                .orElseThrow(() -> new ResourceNotFoundException("DRAFT_NOT_FOUND", "Brouillon introuvable"));
        if (!existing.isDraft()) {
            throw new BusinessException(HttpStatus.CONFLICT, "NOT_A_DRAFT", "Ce message n'est plus un brouillon");
        }
        boolean asDraft = req.asDraft() == null ? true : req.asDraft();
        Message updated = buildMessage(req, sender, asDraft);
        updated.setId(existing.getId());
        updated.setCreatedAt(existing.getCreatedAt());
        Message saved = messageRepository.save(updated);
        linkAttachmentsToMessage(req.attachmentIds(), saved.getId(), sender.getId());
        return toDto(saved, sender);
    }

    public MessageDto reply(String parentId, ReplyRequest req, User sender) {
        Message parent = messageRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("MESSAGE_NOT_FOUND", "Message introuvable"));
        assertCanAccess(parent, sender);

        Set<String> to = new LinkedHashSet<>();
        to.add(parent.getSenderId());
        if (Boolean.TRUE.equals(req.replyAll())) {
            parent.getRecipients().stream()
                    .filter(r -> r.getType() != RecipientType.BCC)
                    .map(MessageRecipient::getUserId)
                    .forEach(to::add);
        }
        to.remove(sender.getId());

        ComposeMessageRequest cr = new ComposeMessageRequest(
                prefix("Re:", parent.getSubject()),
                req.body(),
                new ArrayList<>(to),
                List.of(),
                List.of(),
                List.of(),
                req.attachmentIds(),
                parent.getId(),
                false
        );
        Message m = buildMessage(cr, sender, false);
        m.setParentMessageId(parent.getId());
        m.setThreadId(parent.getThreadId() == null ? parent.getId() : parent.getThreadId());
        Message saved = messageRepository.save(m);
        linkAttachmentsToMessage(req.attachmentIds(), saved.getId(), sender.getId());
        return toDto(saved, sender);
    }

    public MessageDto forward(String parentId, ForwardRequest req, User sender) {
        Message parent = messageRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("MESSAGE_NOT_FOUND", "Message introuvable"));
        assertCanAccess(parent, sender);

        String quoted = "\n\n-- Message transfere --\nDe : " + parent.getSenderId()
                + "\nObjet : " + parent.getSubject() + "\n\n" + parent.getBody();
        String body = (req.body() == null ? "" : req.body()) + quoted;

        ComposeMessageRequest cr = new ComposeMessageRequest(
                prefix("Tr:", parent.getSubject()),
                body,
                req.toUserIds(),
                List.of(), List.of(),
                req.toGroupIds(),
                List.of(),
                parent.getId(),
                false
        );
        Message m = buildMessage(cr, sender, false);
        m.setParentMessageId(parent.getId());
        m.setThreadId(parent.getThreadId() == null ? parent.getId() : parent.getThreadId());
        Message saved = messageRepository.save(m);
        return toDto(saved, sender);
    }

    // =========================================================================
    //  Operations ponctuelles
    // =========================================================================

    public void markRead(String id, User user, boolean read) {
        Message m = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MESSAGE_NOT_FOUND", "Message introuvable"));
        assertCanAccess(m, user);
        if (findRecipient(m, user.getId()).isEmpty()) {
            throw new ForbiddenException("NOT_RECIPIENT", "Vous n'etes pas destinataire de ce message");
        }
        if (read) messageRepository.markAsRead(id, user.getId());
        else messageRepository.markAsUnread(id, user.getId());
    }

    public void moveToTrash(String id, User user) {
        Message m = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MESSAGE_NOT_FOUND", "Message introuvable"));
        assertCanAccess(m, user);
        if (m.getSenderId().equals(user.getId())) {
            messageRepository.moveSenderToTrash(id);
        }
        if (findRecipient(m, user.getId()).isPresent()) {
            messageRepository.moveRecipientToTrash(id, user.getId());
        }
    }

    public void restore(String id, User user) {
        Message m = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MESSAGE_NOT_FOUND", "Message introuvable"));
        assertCanAccess(m, user);
        if (m.getSenderId().equals(user.getId())) {
            messageRepository.restoreSender(id, MessageFolder.SENT);
        }
        if (findRecipient(m, user.getId()).isPresent()) {
            messageRepository.restoreRecipient(id, user.getId(), MessageFolder.INBOX);
        }
    }

    public void deletePermanent(String id, User user) {
        Message m = messageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MESSAGE_NOT_FOUND", "Message introuvable"));
        assertCanAccess(m, user);
        boolean isSender = m.getSenderId().equals(user.getId());
        Optional<MessageRecipient> rec = findRecipient(m, user.getId());

        // La suppression definitive ne doit effacer le document QUE si plus aucun
        // utilisateur ne le voit encore.
        if (isSender) {
            m.setSenderDeleted(true);
            m.setSenderFolder(MessageFolder.TRASH);
            m.setSenderDeletedAt(Instant.now());
        }
        rec.ifPresent(r -> {
            r.setDeleted(true);
            r.setFolder(MessageFolder.TRASH);
            r.setDeletedAt(Instant.now());
        });

        boolean someoneStillSees = !m.isSenderDeleted() || m.getRecipients().stream().anyMatch(r -> !r.isDeleted());
        if (someoneStillSees) {
            messageRepository.save(m);
        } else {
            messageRepository.deleteById(id);
        }
    }

    // =========================================================================
    //  Helpers / construction
    // =========================================================================

    private Message buildMessage(ComposeMessageRequest req, User sender, boolean asDraft) {
        List<String> toUserIds = nullSafe(req.toUserIds());
        List<String> ccUserIds = nullSafe(req.ccUserIds());
        List<String> bccUserIds = nullSafe(req.bccUserIds());
        List<String> toGroupIds = nullSafe(req.toGroupIds());

        List<Group> groups = toGroupIds.isEmpty() ? List.of() : groupRepository.findByIdIn(toGroupIds);
        if (!asDraft && !toGroupIds.isEmpty() && groups.size() != toGroupIds.size()) {
            throw new ResourceNotFoundException("GROUP_NOT_FOUND", "Un ou plusieurs groupes sont introuvables");
        }
        checkGroupSendPermission(sender, groups);

        Set<String> explicitTo = new LinkedHashSet<>(toUserIds);
        for (Group g : groups) {
            explicitTo.addAll(nullSafe(g.getMemberIds()));
        }
        explicitTo.remove(sender.getId());

        Set<String> cc = new LinkedHashSet<>(ccUserIds);
        cc.removeAll(explicitTo);
        cc.remove(sender.getId());

        Set<String> bcc = new LinkedHashSet<>(bccUserIds);
        bcc.removeAll(explicitTo);
        bcc.removeAll(cc);
        bcc.remove(sender.getId());

        Set<String> allIds = new HashSet<>();
        allIds.addAll(explicitTo); allIds.addAll(cc); allIds.addAll(bcc);

        if (!asDraft && allIds.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "NO_RECIPIENT", "Au moins un destinataire est requis");
        }

        // Verifier que les utilisateurs existent et sont actifs
        List<User> users = allIds.isEmpty() ? List.of() : userRepository.findByIdIn(new ArrayList<>(allIds));
        if (!asDraft && users.size() != allIds.size()) {
            throw new ResourceNotFoundException("RECIPIENT_NOT_FOUND", "Un ou plusieurs destinataires sont introuvables");
        }
        if (!asDraft) {
            for (User u : users) {
                if (u.getStatus() != AccountStatus.ACTIVE) {
                    throw new BusinessException(HttpStatus.CONFLICT, "RECIPIENT_DISABLED",
                            "Destinataire desactive : " + u.getEmail());
                }
            }
        }

        List<MessageRecipient> recipients = new ArrayList<>();
        Instant now = Instant.now();
        for (String uid : explicitTo) recipients.add(recipient(uid, RecipientType.TO, asDraft));
        for (String uid : cc) recipients.add(recipient(uid, RecipientType.CC, asDraft));
        for (String uid : bcc) recipients.add(recipient(uid, RecipientType.BCC, asDraft));

        List<String> attachmentIds = nullSafe(req.attachmentIds());
        if (!attachmentIds.isEmpty()) {
            List<Attachment> att = attachmentRepository.findByIdIn(attachmentIds);
            for (Attachment a : att) {
                if (!a.getOwnerId().equals(sender.getId())) {
                    throw new ForbiddenException("ATTACHMENT_FORBIDDEN", "Piece jointe non autorisee");
                }
            }
            if (att.size() != attachmentIds.size()) {
                throw new ResourceNotFoundException("ATTACHMENT_NOT_FOUND", "Piece jointe introuvable");
            }
        }

        return Message.builder()
                .senderId(sender.getId())
                .subject(req.subject())
                .body(req.body())
                .recipients(recipients)
                .senderFolder(asDraft ? MessageFolder.DRAFT : MessageFolder.SENT)
                .draft(asDraft)
                .senderDeleted(false)
                .parentMessageId(req.parentMessageId())
                .threadId(req.parentMessageId())
                .attachmentIds(attachmentIds)
                .groupIds(toGroupIds)
                .sentAt(asDraft ? null : now)
                .createdAt(now)
                .build();
    }

    private MessageRecipient recipient(String uid, RecipientType t, boolean draft) {
        return MessageRecipient.builder()
                .userId(uid)
                .type(t)
                .read(false)
                .folder(draft ? MessageFolder.DRAFT : MessageFolder.INBOX)
                .deleted(false)
                .build();
    }

    private void checkGroupSendPermission(User sender, List<Group> groups) {
        if (groups.isEmpty()) return;
        if (sender.getRole() == Role.ROLE_ADMIN) return;
        if (sender.getRole() == Role.ROLE_ENSEIGNANT) return; // enseignant OK
        // Etudiant : autorise uniquement si membre du groupe
        for (Group g : groups) {
            if (!g.getMemberIds().contains(sender.getId())) {
                throw new ForbiddenException("GROUP_SEND_FORBIDDEN",
                        "Envoi au groupe " + g.getName() + " non autorise");
            }
        }
    }

    private void linkAttachmentsToMessage(List<String> ids, String messageId, String ownerId) {
        if (ids == null || ids.isEmpty()) return;
        List<Attachment> atts = attachmentRepository.findByIdIn(ids);
        for (Attachment a : atts) {
            if (ownerId.equals(a.getOwnerId())) {
                a.setMessageId(messageId);
            }
        }
        attachmentRepository.saveAll(atts);
    }

    private void assertCanAccess(Message m, User user) {
        if (user.getRole() == Role.ROLE_ADMIN) return;
        if (m.getSenderId().equals(user.getId())) return;
        if (findRecipient(m, user.getId()).isPresent()) return;
        throw new ForbiddenException("MESSAGE_ACCESS_DENIED", "Vous n'avez pas acces a ce message");
    }

    private Optional<MessageRecipient> findRecipient(Message m, String userId) {
        if (m.getRecipients() == null) return Optional.empty();
        return m.getRecipients().stream().filter(r -> r.getUserId().equals(userId)).findFirst();
    }

    private static <T> List<T> nullSafe(List<T> l) {
        return l == null ? List.of() : l;
    }

    private static String prefix(String p, String subject) {
        if (subject == null) return p;
        return subject.startsWith(p) ? subject : p + " " + subject;
    }

    // =========================================================================
    //  Mapping vers DTO
    // =========================================================================

    public MessageDto toDto(Message m, User currentUser) {
        Map<String, User> users = hydrateUsersFromMessages(List.of(m));
        User sender = users.get(m.getSenderId());
        List<RecipientDto> recipients = m.getRecipients().stream()
                .map(r -> {
                    User u = users.get(r.getUserId());
                    String name = u == null ? r.getUserId() : u.fullName();
                    String email = u == null ? null : u.getEmail();
                    return RecipientDto.from(r, name, email);
                })
                .toList();
        List<AttachmentDto> atts = m.getAttachmentIds().isEmpty() ? List.of()
                : attachmentRepository.findByIdIn(m.getAttachmentIds()).stream()
                .map(a -> new AttachmentDto(a.getId(), a.getFilename(), a.getContentType(), a.getSize(),
                        "/api/attachments/" + a.getId()))
                .toList();
        MessageFolder current = m.getSenderId().equals(currentUser.getId())
                ? m.getSenderFolder()
                : findRecipient(m, currentUser.getId()).map(MessageRecipient::getFolder).orElse(MessageFolder.INBOX);
        return new MessageDto(
                m.getId(),
                m.getSubject(),
                m.getBody(),
                m.getSenderId(),
                sender == null ? null : sender.fullName(),
                sender == null ? null : sender.getEmail(),
                recipients,
                atts,
                m.getGroupIds(),
                m.getParentMessageId(),
                m.getThreadId(),
                m.isDraft(),
                current,
                m.getSentAt(),
                m.getCreatedAt()
        );
    }

    public MessageSummaryDto toSummary(Message m, User currentUser, Map<String, User> users) {
        User sender = users.get(m.getSenderId());
        List<String> labels = m.getRecipients().stream()
                .filter(r -> r.getType() != RecipientType.BCC || m.getSenderId().equals(currentUser.getId()))
                .map(r -> {
                    User u = users.get(r.getUserId());
                    return u == null ? r.getUserId() : u.fullName();
                })
                .toList();
        boolean read = m.getSenderId().equals(currentUser.getId())
                || findRecipient(m, currentUser.getId()).map(MessageRecipient::isRead).orElse(true);
        String preview = m.getBody() == null ? "" :
                (m.getBody().length() > 160 ? m.getBody().substring(0, 160) + "..." : m.getBody());
        return new MessageSummaryDto(
                m.getId(),
                m.getSubject(),
                preview,
                m.getSenderId(),
                sender == null ? null : sender.fullName(),
                sender == null ? null : sender.getEmail(),
                labels,
                m.getAttachmentIds() == null ? 0 : m.getAttachmentIds().size(),
                read,
                m.isDraft(),
                m.getSentAt(),
                m.getCreatedAt(),
                m.getThreadId()
        );
    }

    private Map<String, User> hydrateUsersFromMessages(List<Message> messages) {
        Set<String> ids = new HashSet<>();
        for (Message m : messages) {
            if (m.getSenderId() != null) ids.add(m.getSenderId());
            if (m.getRecipients() != null) m.getRecipients().forEach(r -> ids.add(r.getUserId()));
        }
        if (ids.isEmpty()) return Map.of();
        Map<String, User> map = new HashMap<>();
        for (User u : userRepository.findByIdIn(new ArrayList<>(ids))) {
            map.put(u.getId(), u);
        }
        return map;
    }
}
