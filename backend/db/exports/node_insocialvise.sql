-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 09, 2025 at 01:49 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.1.17

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `node_insocialvise`
--

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `id` int(11) NOT NULL,
  `user_uuid` varchar(255) DEFAULT NULL,
  `social_user_id` varchar(200) NOT NULL,
  `page_id` varchar(150) NOT NULL,
  `content` text NOT NULL,
  `schedule_time` varchar(250) DEFAULT NULL,
  `post_media` longtext DEFAULT NULL,
  `status` enum('0','1','2','') NOT NULL DEFAULT '0' COMMENT '0="draft",1="post_now",2="for_later"',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`id`, `user_uuid`, `social_user_id`, `page_id`, `content`, `schedule_time`, `post_media`, `status`, `createdAt`, `updatedAt`) VALUES
(6, 'b4206492-1778-4860-8e24-af93296a37d4', '2479778642411729', '447386478456042', 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using \'Content here, content here\', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for \'lorem ipsum\' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).', NULL, '', '0', '2025-01-09 08:26:01', '2025-01-09 10:01:49'),
(7, 'b4206492-1778-4860-8e24-af93296a37d4', '2479778642411729', '447386478456042', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.', '1738926000', '', '2', '2025-01-09 09:23:06', '2025-01-09 10:00:51'),
(14, 'b4206492-1778-4860-8e24-af93296a37d4', '2479778642411729', '447386478456042', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.', '1737545700', '{\"img_path\":\"upload_img-1736422510887.jpg\"}', '2', '2025-01-09 11:35:10', '2025-01-09 11:35:10');

-- --------------------------------------------------------

--
-- Table structure for table `social_page`
--

CREATE TABLE `social_page` (
  `id` int(11) NOT NULL,
  `user_uuid` varchar(255) DEFAULT NULL,
  `social_userid` varchar(250) NOT NULL,
  `pageName` varchar(150) NOT NULL,
  `pageId` varchar(150) NOT NULL,
  `token` longtext NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `modify_to` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `social_page`
--

INSERT INTO `social_page` (`id`, `user_uuid`, `social_userid`, `pageName`, `pageId`, `token`, `category`, `modify_to`, `createdAt`, `updatedAt`) VALUES
(1, 'b4206492-1778-4860-8e24-af93296a37d4', '2479778642411729', 'AronasoftSchedule', '447386478456042', 'EAAQvGECe4RMBOwuodq2z7EQg1iqefPsIHanzfUOoWFY81ZCZC0tp93eHKyftyI5FWDIlBN5zz8HZALvDhWXT2N4ZACdGBX5xMrynHa9iUVV9YQzUKxAh6WoXxa6CgVB2xQ9LZCKlJxkeZBOiB7xeJWJjZAoTdMFZA9gJv1kjfaxUe9gNKYUZCaoBbAOWCJLgg2YbUwd3jZB05hC6mLwGOmZAL4ThGZBNWZCqKiC0U', 'Hospital', '[\"MODERATE\",\"MESSAGING\",\"ANALYZE\",\"ADVERTISE\",\"CREATE_CONTENT\",\"MANAGE\"]', '2025-01-08 10:00:31', '2025-01-09 10:42:22');

-- --------------------------------------------------------

--
-- Table structure for table `social_users`
--

CREATE TABLE `social_users` (
  `id` int(11) NOT NULL,
  `user_id` varchar(250) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(200) DEFAULT NULL,
  `img_url` varchar(250) DEFAULT NULL,
  `social_id` varchar(200) NOT NULL,
  `user_token` longtext NOT NULL,
  `token_access_expiration_time` longtext DEFAULT NULL,
  `status` enum('Connected','notConnected','','') DEFAULT 'notConnected',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `social_users`
--

INSERT INTO `social_users` (`id`, `user_id`, `name`, `email`, `img_url`, `social_id`, `user_token`, `token_access_expiration_time`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'b4206492-1778-4860-8e24-af93296a37d4', 'Aronasoft Singh', NULL, 'https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=2479778642411729&height=50&width=50&ext=1739011342&hash=AbZhdQbMRhepRWLs0IfAs1OR', '2479778642411729', 'EAAQvGECe4RMBO0T7wBi5byo83X7evUgQVt83FclgenN8QeKUTKPpZAQO6QYJGiZBKQBXkxzKAHo7yYnciU7z4wNr9WzrkGCSM1ZAUMVFP4fNR9UR8oVsglgvZC1nwZC9Swdu6WMZB6yFe5q3mvyDiRugw5zXcjBFjWPVCfEewKaihUsEMfnG3KDZBvahKpZBvhKnqmQIhiOnv38c6IHqSs0khg059wZDZD', '1744195341', 'Connected', '2025-01-08 10:00:31', '2025-01-09 10:42:22');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `firstName` varchar(200) NOT NULL,
  `lastName` varchar(200) NOT NULL,
  `email` varchar(250) NOT NULL,
  `password` varchar(250) NOT NULL,
  `role` enum('Superadmin','Admin','User') DEFAULT 'User',
  `otp` varchar(100) DEFAULT NULL,
  `otpGeneratedAt` timestamp NULL DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `uuid`, `firstName`, `lastName`, `email`, `password`, `role`, `otp`, `otpGeneratedAt`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'b4206492-1778-4860-8e24-af93296a37d4', 'Andy', 'Aronasoft', 'andy@aronasoft.com', '$2a$10$vmKSgW81ScnYhmGq9htChOhQ/cX59GoSKVMkU2mH20qEUWFx2Znny', 'User', NULL, NULL, 1, '2024-12-12 06:21:58', '2024-12-12 06:22:16');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `page_id` (`page_id`),
  ADD KEY `social_user_id` (`social_user_id`);

--
-- Indexes for table `social_page`
--
ALTER TABLE `social_page`
  ADD PRIMARY KEY (`id`),
  ADD KEY `social_userid` (`social_userid`),
  ADD KEY `pageId` (`pageId`);

--
-- Indexes for table `social_users`
--
ALTER TABLE `social_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `social_id` (`social_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `uuid` (`uuid`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `social_page`
--
ALTER TABLE `social_page`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `social_users`
--
ALTER TABLE `social_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
