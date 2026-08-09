ALTER TABLE `user` ADD `username` varchar(30);--> statement-breakpoint
ALTER TABLE `user` ADD `display_username` varchar(30);--> statement-breakpoint
ALTER TABLE `user` ADD CONSTRAINT `user_username_unique` UNIQUE(`username`);