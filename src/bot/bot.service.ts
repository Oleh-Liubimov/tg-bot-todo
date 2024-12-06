import { Injectable } from '@nestjs/common';
import { Ctx, Hears, InjectBot, On, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import LocalSession = require('telegraf-session-local');
import { actionButtons, ActionsType } from './bot.buttons';
import { PrismaService } from 'prisma.service';
import { Message } from 'telegraf/typings/core/types/typegram';

interface SessionData {
  step?: SessionData;
}

interface MyContext extends Context {
  session: SessionData;
}

@Injectable()
@Update()
export class BotService {
  private readonly localSession = new LocalSession({
    database: 'session_db.json',
  });
  private stickers: string[] = [
    'CAACAgQAAxkBAANMZ1L36rBpkGfwOJQw5DqlNXg5zEsAAoMPAAJquGBQPcCCiCkDDGI2BA',
  ];

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private prisma: PrismaService,
  ) {
    this.localSession.middleware();
  }

  @Start()
  async startCommand(ctx: MyContext) {
    ctx.reply(
      'Привіт, я телеграм бот, я допоможу тобі відстежувати твої завдання.',
    );

    ctx.reply(
      'Відправ мені текст задачі та я додам її в список або обери дію зі списку.',
      actionButtons(),
    );
  }

  @Hears(ActionsType.list)
  async getTasksList(ctx: MyContext) {
    try {
      const todos = await this.prisma.todo.findMany();

      if (todos.length === 0) {
        ctx.reply(
          'Список завдань пустий.\n Надішли мені текст задачі, і я додам її в список справ.',
        );
        return;
      }

      const formattedTodos = todos
        .map(
          (todo, index) =>
            `${index + 1}: ${todo.text} ${todo.completed ? '✅' : '❌'}\n\n `,
        )
        .join('');

      ctx.reply(formattedTodos);
    } catch (error) {
      ctx.reply(error);
    }
  }

  @Hears(ActionsType.delete)
  async deleteTodo(@Ctx() ctx: MyContext) {
    const todos = await this.prisma.todo.findMany();
    if (todos.length === 0) {
      ctx.reply(
        `Список завданнь пустий, створи якісь задачі перед тим як видаляти їх ☹️`,
      );
      // ctx.replyWithSticker(this.stickers[0]);
    }
  }

  @On('sticker')
  addSticker(ctx: MyContext) {
    const message = ctx.message as Message.StickerMessage;
    const stikerId = message.sticker.file_id;
    this.stickers.push(stikerId);
    console.log(this.stickers);
  }

  @On('text')
  async addTask(@Ctx() ctx: MyContext) {
    const message = ctx.message as Message.TextMessage;
    const userId = ctx.from.id.toString();

    try {
      if (message.text) {
        const newTodo = await this.prisma.todo.create({
          data: {
            userId: userId,
            text: message.text,
          },
        });
        if (newTodo) {
          ctx.reply('Успішно додав до списку.');
        }
      }
    } catch (error) {
      ctx.reply(error);
    }
  }
}
