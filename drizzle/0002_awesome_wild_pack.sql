CREATE TABLE `guji_books` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`author` varchar(120) NOT NULL,
	`dynasty` varchar(40) NOT NULL,
	`intro` text,
	`data` longtext NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `guji_books_id` PRIMARY KEY(`id`)
);
