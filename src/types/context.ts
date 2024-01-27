import type { User } from '@grammyjs/types';
import type {  ChatTypeContext, Filter } from 'grammy';
import type { Context } from 'grammy';

export type MyUser = User & {
  full_name: string;
};

export type MyContext = Context &
  {
    get from(): MyUser | undefined;
  };

export type MyGroupContext = ChatTypeContext<MyContext, 'group' | 'supergroup'>;

export type GroupTextContext = Filter<
  MyGroupContext,
  ':text' | 'edited_message:text' | ':caption'
>;