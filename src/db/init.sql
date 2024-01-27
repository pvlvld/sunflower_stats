CREATE TABLE stats_day_statistics (
  id int NOT NULL AUTO_INCREMENT,
  chat_id bigint DEFAULT NULL,
  user_id bigint DEFAULT NULL,
  name varchar(45) DEFAULT NULL,
  username varchar(45) DEFAULT NULL,
  count int DEFAULT NULL,
  date date DEFAULT NULL,
  PRIMARY KEY (id),
  KEY chat_user_id_index (chat_id,user_id,date) /*!80000 INVISIBLE */
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE DATABASE soniashnyk_bot /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;