CREATE DATABASE soniashnyk_bot /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

-------------------------------------

CREATE TABLE
  public.chats (
    chat_id bigint NOT NULL,
    is_premium boolean NOT NULL DEFAULT false,
    stats_bot_in boolean NOT NULL DEFAULT true,
    charts boolean NOT NULL DEFAULT true,
    statsadminsonly boolean NOT NULL DEFAULT false,
    usechatbgforall boolean NOT NULL DEFAULT false,
    userStatsLink  boolean NOT NULL DEFAULT true,
    line_color char(6),
    font_color char(6),
    title varchar(768) -- can be up to 768+ chars, bruh
    ),
ALTER TABLE
  public.chats
ADD
  CONSTRAINT chats_pkey PRIMARY KEY (chat_id)

-------------------------------------

CREATE TABLE
  public.users (
    user_id bigint NOT NULL,
    is_premium boolean NOT NULL DEFAULT false,
    line_color char(6),
    font_color char(6)
    );
ALTER TABLE
  public.users
ADD
  CONSTRAINT users_pkey PRIMARY KEY (user_id)

-------------------------------------

CREATE TABLE public.stats_daily (
    chat_id bigint NOT NULL,
    user_id bigint NOT NULL,
    count integer NOT NULL DEFAULT 1,
    date date NOT NULL DEFAULT (now())::date,
    CONSTRAINT stats_daily_pk PRIMARY KEY (chat_id, user_id, date),
    CONSTRAINT stats_daily_chat_id_fkey FOREIGN KEY (chat_id)
        REFERENCES public.chats (chat_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT stats_daily_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE INDEX idx_stats_daily_user_chat_count ON public.stats_daily USING btree (user_id, chat_id, count);

-------------------------------------

CREATE OR REPLACE FUNCTION update_stats_daily(
  IN input_chat_id BIGINT,
  IN input_user_id BIGINT,
  IN INCREMENT_BY INTEGER DEFAULT 1,
  IN input_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
BEGIN
  -- Check for existing chat and user, and insert if not exists
  INSERT INTO public.chats (chat_id)
  VALUES (input_chat_id)
  ON CONFLICT (chat_id) DO NOTHING;
  
  INSERT INTO public.users (user_id)
  VALUES (input_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update or insert stats_daily
  INSERT INTO public.stats_daily (chat_id, user_id, count, date)
  VALUES (input_chat_id, input_user_id, INCREMENT_BY, input_date)
  ON CONFLICT (chat_id, user_id, date)
  DO UPDATE SET count = public.stats_daily.count + INCREMENT_BY;
END;
$$ LANGUAGE plpgsql;

-------------------------------------