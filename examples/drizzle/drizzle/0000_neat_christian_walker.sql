CREATE TABLE `pubkey` (
	`id` int AUTO_INCREMENT NOT NULL,
	`state` varchar(255) NOT NULL,
	`k1` varchar(255) NOT NULL,
	`pubkey` varchar(255),
	`sig` varchar(255),
	`success` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pubkey_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `pubkey__state__idx` ON `pubkey` (`state`);--> statement-breakpoint
CREATE INDEX `pubkey__k1__idx` ON `pubkey` (`k1`);