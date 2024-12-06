import { Markup } from 'telegraf';

export function actionButtons() {
  return Markup.keyboard(
    [
      Markup.button.callback('🗒️ Список справ', 'list'),
      Markup.button.callback('🖋️ Редагувати', 'edit'),
      Markup.button.callback('❌ Видалити', 'delete'),
    ],
    {
      columns: 3,
    },
  );
}

export enum ActionsType {
  list = '🗒️ Список справ',
  edit = '🖋️ Редагувати',
  delete = '❌ Видалити',
}
