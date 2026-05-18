-- Migration: feat_attendee_invitations_public_events
-- Adds: ATTENDEE role, isPublic + accessCode to events,
--       message to event_requests, and new invitations table.

-- 1. Modify the Role enum to add ATTENDEE
-- MySQL ENUM: we must re-define the column with the new value added
ALTER TABLE `event_users`
  MODIFY COLUMN `role` ENUM('ATTENDEE','AUTHOR','REVIEWER','EDITOR','ADMIN') NOT NULL;

-- 2. Add isPublic and accessCode to events
ALTER TABLE `events`
  ADD COLUMN `isPublic`   BOOLEAN      NOT NULL DEFAULT TRUE,
  ADD COLUMN `accessCode` VARCHAR(50)  NULL UNIQUE;

-- 3. Add message to event_requests
ALTER TABLE `event_requests`
  ADD COLUMN `message` VARCHAR(500) NULL;

-- 4. Create invitations table
CREATE TABLE `invitations` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `eventId`   INT          NOT NULL,
  `email`     VARCHAR(255) NULL,
  `userId`    INT          NULL,
  `role`      ENUM('ATTENDEE','AUTHOR','REVIEWER','EDITOR','ADMIN') NOT NULL,
  `status`    ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `token`     VARCHAR(100) NOT NULL UNIQUE,
  `expiresAt` DATETIME(3)  NOT NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)  NOT NULL,

  PRIMARY KEY (`id`),
  CONSTRAINT `invitations_eventId_fkey`
    FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `invitations_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
