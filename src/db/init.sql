CREATE DATABASE soniashnyk_bot /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

-------------------------------------

CREATE TABLE
  public.chats (chat_id bigint NOT NULL);
ALTER TABLE
  public.chats
ADD
  CONSTRAINT chats_pkey PRIMARY KEY (chat_id)

-------------------------------------

CREATE TABLE
  public.users (user_id bigint NOT NULL);
ALTER TABLE
  public.users
ADD
  CONSTRAINT users_pkey PRIMARY KEY (user_id)

-------------------------------------

CREATE TABLE
  public.stats_daily (
    chat_id bigint NOT NULL REFERENCES public.chats(chat_id),
    user_id bigint NOT NULL REFERENCES public.users(user_id),
    count integer NOT NULL DEFAULT 1,
    date date NOT NULL DEFAULT (now())::date,
    CONSTRAINT stats_daily_pk PRIMARY KEY (chat_id, user_id, date)
  );

-------------------------------------

CREATE OR REPLACE FUNCTION update_stats_daily(
  IN input_chat_id BIGINT,
  IN input_user_id BIGINT
)
RETURNS VOID AS $$
BEGIN
--   Check for existing chat
  IF NOT EXISTS (SELECT 1 FROM public.chats WHERE public.chats.chat_id = input_chat_id) THEN
    INSERT INTO public.chats (chat_id)
    VALUES (input_chat_id)
    ON CONFLICT (chat_id) DO NOTHING;
  END IF;

--   Check for existing user
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE user_id = input_user_id) THEN
    INSERT INTO public.users (user_id)
    VALUES (input_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

--   Update stats_daily with conflict resolution
  UPDATE public.stats_daily
  SET count = public.stats_daily.count + 1
  WHERE public.stats_daily.chat_id = input_chat_id AND public.stats_daily.user_id = input_user_id AND date = current_date;

--   Insert a new row if no stats exist for the day
  IF NOT FOUND THEN
    INSERT INTO public.stats_daily (chat_id, user_id, count, date)
    VALUES (input_chat_id, input_user_id, 1, current_date);
  END IF;
END;
$$ LANGUAGE plpgsql;

-------------------------------------