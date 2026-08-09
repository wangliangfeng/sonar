CREATE TABLE `banter` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`content` text NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`user_name` varchar(120) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `banter_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `banter` ADD CONSTRAINT `banter_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `banter_created_idx` ON `banter` (`created_at`);